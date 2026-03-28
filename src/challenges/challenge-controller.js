import { challenges } from "./challenges.js";
import { rafTicker } from "../ticker.js";
import {
    clearAll,
    presentStats,
    presentChallenge,
    presentFeedback,
    presentWorld,
} from "../ui/presenters.js";
import { setTimeScale } from "../ui/persistence.js";
import { log } from "../ui/terminal-logger.js";
import { createParamsUrl, parseParams } from "../ui/router.js";
import Simulation from "../simulation/Simulation.js";

export function createChallengeController({ editorService, worldController, $world, $stats, $feedback, $challenge }) {
    var controller = {};
    controller.currentChallengeIndex = 0;
    controller.sim = undefined;

    controller.startChallenge = function (challengeIndex, autoStart) {
        if (challengeIndex < 0 || challengeIndex >= challenges.length) {
            console.log("Invalid challenge index", challengeIndex, "— defaulting to 0");
            challengeIndex = 0;
        }
        log("Starting challenge", challengeIndex);
        controller.currentChallengeIndex = challengeIndex;

        var challenge = challenges[challengeIndex];
        var opts = challenge.options;
        controller.sim = new Simulation({
            floors: opts.floorCount,
            elevators: opts.elevatorCount,
            spawnRate: opts.spawnRate,
            elevatorCapacities: opts.elevatorCapacities,
            condition: challenge.condition,
        });

        // Reset paused state before rendering so the button shows "Start"
        worldController.isPaused = true;

        clearAll([$world, $feedback]);
        presentStats($stats, controller.sim);
        presentChallenge($challenge, challenge, controller, controller.sim, worldController, challengeIndex + 1);
        presentWorld($world, controller.sim);

        // Remove any previous timescale listener before adding a fresh one
        worldController.off("timescale_changed");
        worldController.on("timescale_changed", function () {
            setTimeScale(worldController.timeScale);
            presentChallenge($challenge, challenge, controller, controller.sim, worldController, challengeIndex + 1);
        });

        controller.sim.on("challenge_ended", function (result) {
            worldController.setPaused(true);
            if (result) {
                presentFeedback($feedback, controller.sim, "Success!", "Challenge completed", createParamsUrl(parseParams(window.location.hash), { challenge: challengeIndex + 2 }));
            } else {
                presentFeedback($feedback, controller.sim, "Challenge failed", "Maybe your program needs an improvement?", "");
            }
        });

        controller.sim.on("usercode_error", function (e) {
            worldController.setPaused(true);
            log("Usercode error:", "error");
            log(e, "error");
        });

        var codeObj = editorService.getCodeObj();
        worldController.start(controller.sim, codeObj, rafTicker, autoStart);
    };

    controller.startStopOrRestart = function () {
        if (controller.sim.isEnded()) {
            controller.startChallenge(controller.currentChallengeIndex);
        } else {
            worldController.setPaused(!worldController.isPaused);
        }
    };

    return controller;
}
