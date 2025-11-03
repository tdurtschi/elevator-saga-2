import $ from "jquery";
import "./libs/riot.js";
import {getCodeObjFromCode} from "./util.js";
import {challenges} from "./challenges.js";
import {
    clearAll,
    presentStats,
    presentChallenge,
    presentFeedback,
    presentWorld,
    presentCodeStatus,
    makeDemoFullscreen
} from "./presenters.js";
import {createWorldCreator, createWorldController} from "./world.js";
import {typeDeclarations} from "./types.js";
import _ from "lodash";
import { defaultPrompt, sendMessage, updateSettings } from "./ai.js";

window._ = _;

let editor = null;
let codeModel, promptModel = null;

const createEditorAsync = () => new Promise((resolve, reject) => {
    var lsKey = "elevatorCrushCode_v5";
    var lspKey = "elevatorCrushPrompt_v1";

    // Load Monaco Editor from CDN
    require.config({paths: {"vs": "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/"}});
    window.MonacoEnvironment = {
        getWorkerUrl: function (workerId, label) {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = { baseUrl: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/" };
                importScripts("https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.29.1/min/vs/base/worker/workerMain.min.js");`
            )}`;
        }
    };

    require(["vs/editor/editor.main"], function () {
        if(!editor){
            codeModel = monaco.editor.createModel("// code goes here\n", "javascript", "inmemory://model/code");
            promptModel = monaco.editor.createModel(defaultPrompt, "text/plain", "inmemory://model/prompt");
            
            editor = monaco.editor.create(document.getElementById("editor"), {
                theme: "vs-dark",
                folding: false,
                minimap: {enabled: false},
                language: "javascript",
                model: codeModel,
            });
        }

        // Add type declarations
        monaco.languages.typescript.javascriptDefaults.addExtraLib(typeDeclarations);

        var reset = function () {
            codeModel.setValue($("#default-elev-implementation").text().trim());
            promptModel.setValue(defaultPrompt);
        };
        var saveCode = function () {
            localStorage.setItem(lsKey, codeModel.getValue());
            localStorage.setItem(lspKey, promptModel.getValue());
            $("#save_message").text("Code saved " + new Date().toTimeString());
            returnObj.trigger("change");
        };

        var existingCode = localStorage.getItem(lsKey);
        var existingPrompt = localStorage.getItem(lspKey);
        if (existingCode || existingPrompt) {
            if (existingPrompt) {
                promptModel.setValue(existingPrompt);
            }
            if (existingCode) {
                codeModel.setValue(existingCode);
            }
        } else {
            reset();
        }

        $("#button_save").click(function () {
            saveCode();
            editor.focus();
        });

        $("#button_reset").click(function () {
            if (confirm("Do you really want to reset to the default implementation?")) {
                localStorage.setItem("develevateBackupCode", editor.getValue());
                reset();
            }
            editor.focus();
        });

        $("#button_resetundo").click(function () {
            if (confirm("Do you want to bring back the code as before the last reset?")) {
                codeModel.setValue(localStorage.getItem("develevateBackupCode") || "");
            }
            editor.focus();
        });

        var returnObj = riot.observable({});
        var autoSaver = _.debounce(saveCode, 1000);
        editor.onDidChangeModelContent = autoSaver;

        returnObj.getCodeObj = function () {
            console.log("Getting code...");
            var code = editor.getValue();
            var obj;
            try {
                obj = getCodeObjFromCode(code);
                returnObj.trigger("code_success");
            } catch (e) {
                returnObj.trigger("usercode_error", e);
                return null;
            }
            return obj;
        };
        returnObj.setCode = function (code) {
            codeModel.setValue(code);
        };
        returnObj.getCode = function () {
            return codeModel.getValue();
        }
        returnObj.setDevTestCode = function () {
            codeModel.setValue($("#devtest-elev-implementation").text().trim());
        }

        $("#button_apply").click(function () {
            returnObj.trigger("apply_code");
        });

        $("#aiprompt-form").submit(function (event) {
            event.preventDefault();

            const promptInput = promptModel.getValue().trim();
            if (promptInput.length === 0) {
                alert("Please enter a description for the elevator behavior.");
                return;
            }

            const oldLabel = $("#aiprompt-form button[type=submit]").text();
            $("#aiprompt-form button[type=submit]")
                .attr("disabled", true)
                .text("Loading...");
            sendMessage(promptInput).then(responseText => {
                codeModel.setValue(`({
init: ${responseText.trim()},
update: function (dt, elevators, floors) {}
})`)
            }).catch((e) => {
                alert("Error from AI service: " + e.message);
            }).then(() => {
                $("#aiprompt-form button[type=submit]")
                    .attr("disabled", false)
                    .text(oldLabel);
            });
        });

        $("#tab-prompt").click(function() {
            editor.setModel(promptModel)
        })

         $("#tab-code").click(function() {
            editor.setModel(codeModel)
        })

        $("#ai-settings-config").click(async function() {
            await updateSettings();
        });

        resolve(returnObj);
    });
});

var createParamsUrl = function (current, overrides) {
    return "#" + _.map(_.merge(current, overrides), function (val, key) {
        return key + "=" + val;
    }).join(",");
};

$(function () {
    var tsKey = "elevatorTimeScale";
    riot.route(function (path) {
        createEditorAsync().then(editor => {
            var params = {};

            var $world = $(".innerworld");
            var $stats = $(".statscontainer");
            var $feedback = $(".feedbackcontainer");
            var $challenge = $(".challenge");
            var $codestatus = $(".codestatus");

            var floorTempl = document.getElementById("floor-template").innerHTML.trim();
            var elevatorTempl = document.getElementById("elevator-template").innerHTML.trim();
            var elevatorButtonTempl = document.getElementById("elevatorbutton-template").innerHTML.trim();
            var userTempl = document.getElementById("user-template").innerHTML.trim();
            var challengeTempl = document.getElementById("challenge-template").innerHTML.trim();
            var feedbackTempl = document.getElementById("feedback-template").innerHTML.trim();
            var codeStatusTempl = document.getElementById("codestatus-template").innerHTML.trim();

            var app = riot.observable({});
            app.worldController = createWorldController(1.0 / 60.0);
            app.worldController.on("usercode_error", function (e) {
                console.log("World raised code error", e);
                editor.trigger("usercode_error", e);
            });

            console.log(app.worldController);
            app.worldCreator = createWorldCreator();
            app.world = undefined;

            app.currentChallengeIndex = 0;

            app.startStopOrRestart = function () {
                if (app.world.challengeEnded) {
                    app.startChallenge(app.currentChallengeIndex);
                } else {
                    app.worldController.setPaused(!app.worldController.isPaused);
                }
            };

            app.startChallenge = function (challengeIndex, autoStart) {
                if (typeof app.world !== "undefined") {
                    app.world.unWind();
                    // TODO: Investigate if memory leaks happen here
                }
                app.currentChallengeIndex = challengeIndex;
                app.world = app.worldCreator.createWorld(challenges[challengeIndex].options);

                clearAll([$world, $feedback]);
                presentStats($stats, app.world);
                presentChallenge($challenge, challenges[challengeIndex], app, app.world, app.worldController, challengeIndex + 1, challengeTempl);
                presentWorld($world, app.world, floorTempl, elevatorTempl, elevatorButtonTempl, userTempl);

                app.worldController.on("timescale_changed", function () {
                    localStorage.setItem(tsKey, app.worldController.timeScale);
                    presentChallenge($challenge, challenges[challengeIndex], app, app.world, app.worldController, challengeIndex + 1, challengeTempl);
                });

                app.world.on("stats_changed", function () {
                    var challengeStatus = challenges[challengeIndex].condition.evaluate(app.world);
                    if (challengeStatus !== null) {
                        app.world.challengeEnded = true;
                        app.worldController.setPaused(true);
                        if (challengeStatus) {
                            presentFeedback($feedback, feedbackTempl, app.world, "Success!", "Challenge completed", createParamsUrl(params, {challenge: (challengeIndex + 2)}));
                        } else {
                            presentFeedback($feedback, feedbackTempl, app.world, "Challenge failed", "Maybe your program needs an improvement?", "");
                        }
                    }
                });

                var codeObj = editor.getCodeObj();
                console.log("Starting...");
                app.worldController.start(app.world, codeObj, window.requestAnimationFrame, autoStart);
            };

            editor.on("apply_code", function () {
                app.startChallenge(app.currentChallengeIndex, true);
            });
            editor.on("code_success", function () {
                presentCodeStatus($codestatus, codeStatusTempl);
            });
            editor.on("usercode_error", function (error) {
                presentCodeStatus($codestatus, codeStatusTempl, error);
            });
            editor.on("change", function () {
                $("#fitness_message").addClass("faded");
            });
            editor.trigger("change");

            params = _.reduce(path.split(","), function (result, p) {
                var match = p.match(/(\w+)=(\w+$)/);
                if (match) {
                    result[match[1]] = match[2];
                }
                return result;
            }, {});
            var requestedChallenge = 0;
            var autoStart = false;
            var timeScale = parseFloat(localStorage.getItem(tsKey)) || 2.0;
            _.each(params, function (val, key) {
                if (key === "challenge") {
                    requestedChallenge = _.parseInt(val) - 1;
                    if (requestedChallenge < 0 || requestedChallenge >= challenges.length) {
                        console.log("Invalid challenge index", requestedChallenge);
                        console.log("Defaulting to first challenge");
                        requestedChallenge = 0;
                    }
                } else if (key === "autostart") {
                    autoStart = val === "false" ? false : true;
                } else if (key === "timescale") {
                    timeScale = parseFloat(val);
                } else if (key === "devtest") {
                    editor.setDevTestCode();
                } else if (key === "fullscreen") {
                    makeDemoFullscreen();
                }
            });
            app.worldController.setTimeScale(timeScale);
            app.startChallenge(requestedChallenge, autoStart);
        });
    });
});
