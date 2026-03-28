import $ from "jquery";
import { makeDemoFullscreen } from "./src/ui/presenters.js";
import { createWorldController } from "./src/simulation/world.js";
import _ from "lodash-es";
import { getTimeScale } from "./src/ui/persistence.js";
import { clearLog, log } from "./src/ui/terminal-logger.js";
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

    var worldController = createWorldController(1.0 / 60.0);

    createEditorAsync().then(function (editorService) {
        var challengeController = createChallengeController({
            editorService,
            worldController,
            $world,
            $stats,
            $feedback,
            $challenge,
        });

        editorService.on("apply_code", function () {
            challengeController.startChallenge(challengeController.currentChallengeIndex, true);
        });
        editorService.on("usercode_error", function (error) {
            var errorMessage = error;
            if (error && error.stack) {
                errorMessage = error.stack;
                errorMessage = errorMessage.replace(/\n/g, "<br>");
            }
            log(errorMessage, "error");
        });
        editorService.on("change", function () {
            $("#fitness_message").addClass("faded");
        });
        editorService.trigger("change");

        startRouter(function (routeParams) {
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

            worldController.setTimeScale(timeScale);
            challengeController.startChallenge(requestedChallenge, autoStart);
        });
    });
});
