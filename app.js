import $ from "jquery";
import "./libs/unobservable.js";
import {challenges} from "./challenges.js";
import {
    clearAll,
    presentStats,
    presentChallenge,
    presentFeedback,
    presentWorld,
    makeDemoFullscreen
} from "./presenters.js";
import {createWorldCreator, createWorldController} from "./world.js";
import _ from "lodash-es";
import { getTimeScale, setTimeScale } from "./persistence.js";
import {clearLog, log} from "./terminal-logger.js";
import {createEditorAsync} from "./editor.js";

window._ = _;

var createParamsUrl = function (current, overrides) {
    return "#" + _.map(_.merge(current, overrides), function (val, key) {
        return key + "=" + val;
    }).join(",");
};

$(function () {
    var params = {};

    var $world = $(".innerworld");
    var $stats = $(".statscontainer");
    var $feedback = $(".feedbackcontainer");
    var $challenge = $(".challenge");

    var app = window.unobservable.observable({});
    app.worldController = createWorldController(1.0 / 60.0);
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

    const handleRoute = (fn) => {
        window.addEventListener('hashchange', () => fn(window.location.hash));
        fn(window.location.hash);
    };

    handleRoute(function (path) {
        clearLog();
        createEditorAsync().then(editorService => {
            app.worldController.on("usercode_error", function (e) {
                log("World raised code error", "error");
                editorService.trigger("usercode_error", e);
            });

            app.startChallenge = function (challengeIndex, autoStart) {
                log("Starting challenge", challengeIndex, app.world);
                if (typeof app.world !== "undefined") {
                    app.world.unWind();
                    // TODO: Investigate if memory leaks happen here
                }
                app.currentChallengeIndex = challengeIndex;
                app.world = app.worldCreator.createWorld(challenges[challengeIndex].options);

                clearAll([$world, $feedback]);
                presentStats($stats, app.world);
                presentChallenge($challenge, challenges[challengeIndex], app, app.world, app.worldController, challengeIndex + 1);
                presentWorld($world, app.world);

                app.worldController.on("timescale_changed", function () {
                    setTimeScale(app.worldController.timeScale);
                    presentChallenge($challenge, challenges[challengeIndex], app, app.world, app.worldController, challengeIndex + 1);
                });

                app.world.on("stats_changed", function () {
                    var challengeStatus = challenges[challengeIndex].condition.evaluate(app.world);
                    if (challengeStatus !== null) {
                        app.world.challengeEnded = true;
                        app.worldController.setPaused(true);
                        if (challengeStatus) {
                            presentFeedback($feedback, app.world, "Success!", "Challenge completed", createParamsUrl(params, {challenge: (challengeIndex + 2)}));
                        } else {
                            presentFeedback($feedback, app.world, "Challenge failed", "Maybe your program needs an improvement?", "");
                        }
                    }
                });

                var codeObj = editorService.getCodeObj();
                console.log("Starting...");
                app.worldController.start(app.world, codeObj, window.requestAnimationFrame, autoStart);
            };

            editorService.on("apply_code", function () {
                app.startChallenge(app.currentChallengeIndex, true);
            });
            editorService.on("usercode_error", function (error) {
                console.log(error);
                var errorMessage = error;
                if(error && error.stack) {
                    errorMessage = error.stack;
                    errorMessage = errorMessage.replace(/\n/g, "<br>");
                }
                log(errorMessage, "error");
            });
            editorService.on("change", function () {
                $("#fitness_message").addClass("faded");
            });
            editorService.trigger("change");

            params = _.reduce(path.split(","), function (result, p) {
                var match = p.match(/(\w+)=(\w+$)/);
                if (match) {
                    result[match[1]] = match[2];
                }
                return result;
            }, {});
            var requestedChallenge = 0;
            var autoStart = false;
            var timeScale = parseFloat(getTimeScale()) || 2.0;
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
                    editorService.setDevTestCode();
                } else if (key === "fullscreen") {
                    makeDemoFullscreen();
                }
            });
            app.worldController.setTimeScale(timeScale);
            app.startChallenge(requestedChallenge, autoStart);
        });
    });
});
