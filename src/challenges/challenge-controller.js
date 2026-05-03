import { challenges } from "./challenges.js";
import { rafTicker } from "../ticker.js";
import { setTimeScale } from "../ui/persistence.js";
import {
    clearAll as defaultClearAll,
    presentStats as defaultPresentStats,
    presentChallenge as defaultPresentChallenge,
    presentFeedback as defaultPresentFeedback,
    presentWorld as defaultPresentWorld,
} from "../ui/presenters.js";
import { createParamsUrl, parseParams } from "../ui/router.js";
import Simulation from "../simulation/Simulation.js";

export function createChallengeController({ editorService, $world, $stats, $feedback, $challenge, logger, presenters = {}, ticker = rafTicker }) {
    const {
        clearAll = defaultClearAll,
        presentStats = defaultPresentStats,
        presentChallenge = defaultPresentChallenge,
        presentFeedback = defaultPresentFeedback,
        presentWorld = defaultPresentWorld,
    } = presenters;
    var controller = {};
    controller.currentChallengeIndex = 0;
    controller.sim = undefined;
    controller.isPaused = false;
    controller.timeScale = 1.0;

    controller.setPaused = function (paused) {
        controller.isPaused = paused;
        if (controller._rerenderChallenge) controller._rerenderChallenge();
    };

    controller.setTimeScale = function (timeScale) {
        controller.timeScale = timeScale;
        setTimeScale(timeScale);
        if (controller._rerenderChallenge) controller._rerenderChallenge();
    };

    controller.startChallenge = async function (challengeIndex, autoStart) {
        if (challengeIndex < 0 || challengeIndex >= challenges.length) {
            console.log("Invalid challenge index", challengeIndex, "— defaulting to 0");
            challengeIndex = 0;
        }
        logger.info("Starting challenge " + (challengeIndex + 1));
        controller.currentChallengeIndex = challengeIndex;

        var challenge = challenges[challengeIndex];
        var opts = challenge.options;
        if (controller.sim) controller.sim.end();
        controller.sim = new Simulation({
            floors: opts.floorCount,
            elevators: opts.elevatorCount,
            spawnRate: opts.spawnRate,
            elevatorCapacities: opts.elevatorCapacities,
            condition: challenge.condition,
        });

        controller.setPaused(!autoStart);

        clearAll([$world, $feedback]);
        presentStats($stats, controller.sim);
        controller._rerenderChallenge = () => presentChallenge($challenge, challenge, controller, challengeIndex + 1);
        controller._rerenderChallenge();
        presentWorld($world, controller.sim);

        controller.sim.on("challenge_ended", function (result) {
            controller.setPaused(true);
            if (result) {
                presentFeedback($feedback, controller.sim, "Success!", "Challenge completed", createParamsUrl(parseParams(window.location.hash), { challenge: challengeIndex + 2 }));
            } else {
                presentFeedback($feedback, controller.sim, "Challenge failed", "Maybe your program needs an improvement?", "");
            }
        });

        controller.sim.on("usercode_error", function (e) {
            controller.setPaused(true);
            logger.error("Usercode error: " + e);
        });

        var codeObj = await editorService.getCodeObj();
        controller.sim.applyCode(codeObj);
        var lastT = null;
        const sim = controller.sim;
        var updater = function (t) {
            if (!controller.isPaused && lastT !== null) {
                sim.tick((t - lastT) * 0.001 * controller.timeScale);
                sim.updateDisplayPositions();
                sim.trigger("stats_display_changed");
            }
            lastT = t;
            if (!sim.isEnded()) {
                ticker(updater);
            }
        };
        ticker(updater);
    };

    controller.startStopOrRestart = function () {
        if (controller.sim.isEnded()) {
            controller.startChallenge(controller.currentChallengeIndex);
        } else {
            controller.setPaused(!controller.isPaused);
        }
    };

    return controller;
}
