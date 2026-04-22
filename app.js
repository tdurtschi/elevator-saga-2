import $ from "jquery";
import { makeDemoFullscreen } from "./src/ui/presenters.js";
import _ from "lodash-es";
import { getTimeScale } from "./src/ui/persistence.js";
import { clearLog, init as initTerminal } from "./src/ui/terminal.js";
import { createDomLogger } from "./src/ui/dom-logger.js";

import { createEditorAsync } from "./src/ui/editor.js";
import { startRouter } from "./src/ui/router.js";
import { createChallengeController } from "./src/challenges/challenge-controller.js";
import { initThemeToggle } from "./src/ui/theme.js";

window._ = _;

initThemeToggle();

$(function () {
    var $world = $(".innerworld");
    var $stats = $(".statscontainer");
    var $feedback = $(".feedbackcontainer");
    var $challenge = $(".challenge");

    createEditorAsync().then(function (editorService) {
        var logger = createDomLogger(document.getElementById("terminal-output"));
        initTerminal(logger);
        var challengeController = createChallengeController({
            editorService,
            $world,
            $stats,
            $feedback,
            $challenge,
            logger,
        });

        editorService.on("apply_code", async function () {
            await challengeController.startChallenge(challengeController.currentChallengeIndex, true);
        });
        editorService.on("usercode_error", function (error) {
            var errorMessage = error;
            if (error && error.stack) {
                errorMessage = error.stack;
                errorMessage = errorMessage.replace(/\n/g, "<br>");
            }
            logger.error(errorMessage);
        });
        editorService.on("change", function () {
            $("#fitness_message").addClass("faded");
        });
        editorService.trigger("change");

        startRouter(async function (routeParams) {
            clearLog();

            var requestedChallenge = 0;
            var autoStart = false;
            var timeScale = parseFloat(getTimeScale()) || 2.0;

            _.each(routeParams, function (val, key) {
                if (key === "challenge") {
                    requestedChallenge = _.parseInt(val) - 1;
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

            challengeController.setTimeScale(timeScale);
            await challengeController.startChallenge(requestedChallenge, autoStart);
        });
    });
});
