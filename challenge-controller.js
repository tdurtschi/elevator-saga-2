import { challenges } from "./challenges.js";
import {
    clearAll,
    presentStats,
    presentChallenge,
    presentFeedback,
    presentWorld,
} from "./presenters.js";
import { setTimeScale } from "./persistence.js";
import { log } from "./terminal-logger.js";
import { createParamsUrl, parseParams } from "./router.js";

export function createChallengeController({ editorService, worldController, worldCreator, $world, $stats, $feedback, $challenge }) {
    var controller = {};
    controller.currentChallengeIndex = 0;
    controller.world = undefined;

    controller.startChallenge = function (challengeIndex, autoStart) {
        log("Starting challenge", challengeIndex);
        if (typeof controller.world !== "undefined") {
            controller.world.unWind();
            // TODO: Investigate if memory leaks happen here
        }
        controller.currentChallengeIndex = challengeIndex;
        controller.world = worldCreator.createWorld(challenges[challengeIndex].options);

        // Reset paused state before rendering so the button shows "Start"
        worldController.isPaused = true;

        clearAll([$world, $feedback]);
        presentStats($stats, controller.world);
        presentChallenge($challenge, challenges[challengeIndex], controller, controller.world, worldController, challengeIndex + 1);
        presentWorld($world, controller.world);

        // Remove any previous timescale listener before adding a fresh one
        worldController.off("timescale_changed");
        worldController.on("timescale_changed", function () {
            setTimeScale(worldController.timeScale);
            presentChallenge($challenge, challenges[challengeIndex], controller, controller.world, worldController, challengeIndex + 1);
        });

        controller.world.on("stats_changed", function () {
            var challengeStatus = challenges[challengeIndex].condition.evaluate(controller.world);
            if (challengeStatus !== null) {
                controller.world.challengeEnded = true;
                worldController.setPaused(true);
                if (challengeStatus) {
                    presentFeedback($feedback, controller.world, "Success!", "Challenge completed", createParamsUrl(parseParams(window.location.hash), { challenge: challengeIndex + 2 }));
                } else {
                    presentFeedback($feedback, controller.world, "Challenge failed", "Maybe your program needs an improvement?", "");
                }
            }
        });

        var codeObj = editorService.getCodeObj();
        worldController.start(controller.world, codeObj, window.requestAnimationFrame, autoStart);
    };

    controller.startStopOrRestart = function () {
        if (controller.world.challengeEnded) {
            controller.startChallenge(controller.currentChallengeIndex);
        } else {
            worldController.setPaused(!worldController.isPaused);
        }
    };

    return controller;
}
