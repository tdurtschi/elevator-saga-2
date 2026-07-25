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
    controller.simulation = undefined;
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
        if (controller.simulation) controller.simulation.end();
        controller.simulation = new Simulation({
            floors: opts.floorCount,
            elevators: opts.elevatorCount,
            spawnRate: opts.spawnRate,
            elevatorCapacities: opts.elevatorCapacities,
            condition: challenge.condition,
        });

        controller.setPaused(!autoStart);

        clearAll([$world, $feedback]);
        presentStats($stats, controller.simulation);
        controller._rerenderChallenge = () => presentChallenge($challenge, challenge, controller, challengeIndex + 1);
        controller._rerenderChallenge();
        presentWorld($world, controller.simulation);

        controller.simulation.on("challenge_ended", function (result) {
            controller.setPaused(true);
            if (result) {
                presentFeedback($feedback, controller.simulation, "Success!", "Challenge completed", createParamsUrl(parseParams(window.location.hash), { challenge: challengeIndex + 2 }));
            } else {
                presentFeedback($feedback, controller.simulation, "Challenge failed", "Maybe your program needs an improvement?", "");
            }
        });

        controller.simulation.on("usercode_error", function (e) {
            controller.setPaused(true);
            logger.error("Usercode error: " + e);
        });

        var codeObj = await editorService.getCodeObj();
        controller.simulation.applyCode(codeObj);
        var lastT = null;
        const simulation = controller.simulation;
        var updater = function (t) {
            if (!controller.isPaused && lastT !== null) {
                simulation.tick((t - lastT) * 0.001 * controller.timeScale);
                simulation.updateDisplayPositions();
                simulation.trigger("stats_display_changed");
            }
            lastT = t;
            if (!simulation.isEnded()) {
                ticker(updater);
            }
        };
        ticker(updater);
    };

    controller.startStopOrRestart = function () {
        if (controller.simulation.isEnded()) {
            controller.startChallenge(controller.currentChallengeIndex);
        } else {
            controller.setPaused(!controller.isPaused);
        }
    };

    return controller;
}
