import $ from "jquery";
import { createSyncTicker } from "../src/ticker.js";
import { createChallengeController } from "../src/challenges/challenge-controller.js";

const mockEditorService = () => ({
    getCodeObj: async () => ({ init() {}, update() {} }),
    on() {},
});

const noopLogger = { debug() {}, info() {}, warning() {}, error() {} };

const mockPresenters = () => ({
    clearAll() {},
    presentStats() {},
    presentChallenge() {},
    presentFeedback() {},
    presentWorld() {},
});

const domStubs = () => ({
    $world: $("<div>"),
    $stats: $("<div>"),
    $feedback: $("<div>"),
    $challenge: $("<div>"),
});

describe("ChallengeController", () => {
    it("does not advance the simulation when paused", async () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),

            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });

        await controller.startChallenge(0, true);
        controller.setPaused(true);
        ticker.run();

        expect(controller.sim.elapsedTime()).toBe(0);
    });

    it("re-renders the challenge UI when paused state changes", async () => {
        const ticker = createSyncTicker(1000 / 60, 1);
        let renderCount = 0;
        const countingPresenters = {
            ...mockPresenters(),
            presentChallenge() { renderCount++; },
        };
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: countingPresenters,
            logger: noopLogger,
            ...domStubs(),
        });

        await controller.startChallenge(0);
        renderCount = 0;

        controller.setPaused(true);

        expect(renderCount).toBe(1);
    });

    it("calls updateDisplayPositions on each tick", async () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });

        let count = 0;
        await controller.startChallenge(0, true);
        controller.sim.updateDisplayPositions = () => count++;
        ticker.run();

        expect(count).toBeGreaterThan(0);
    });

    it("triggers stats_display_changed on each tick", async () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });

        let count = 0;
        await controller.startChallenge(0, true);
        controller.sim.on("stats_display_changed", () => count++);
        ticker.run();

        expect(count).toBeGreaterThan(0);
    });

    it("re-renders the challenge UI when timescale changes", async () => {
        const ticker = createSyncTicker(1000 / 60, 1);
        let renderCount = 0;
        const countingPresenters = {
            ...mockPresenters(),
            presentChallenge() { renderCount++; },
        };
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: countingPresenters,
            logger: noopLogger,
            ...domStubs(),
        });

        await controller.startChallenge(0);
        renderCount = 0;

        controller.setTimeScale(4);

        expect(renderCount).toBe(1);
    });

    it("advances faster at a higher timescale", async () => {
        const tickerA = createSyncTicker(1000 / 60, 10);
        const controllerA = createChallengeController({
            ticker: tickerA,
            editorService: mockEditorService(),

            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });
        await controllerA.startChallenge(0, true);
        tickerA.run();

        const tickerB = createSyncTicker(1000 / 60, 10);
        const controllerB = createChallengeController({
            ticker: tickerB,
            editorService: mockEditorService(),

            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });
        controllerB.setTimeScale(2.0);
        await controllerB.startChallenge(0, true);
        tickerB.run();

        expect(controllerB.sim.elapsedTime()).toBeGreaterThan(controllerA.sim.elapsedTime());
    });

    it("ends the previous simulation when startChallenge is called again", async () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });

        await controller.startChallenge(0, true);
        const firstSim = controller.sim;
        await controller.startChallenge(0, true);

        expect(firstSim.isEnded()).toBe(true);
    });

    it("advances the simulation when a challenge is started", async () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),

            presenters: mockPresenters(),
            logger: noopLogger,
            ...domStubs(),
        });

        await controller.startChallenge(0, true);
        ticker.run();

        expect(controller.sim.elapsedTime()).toBeGreaterThan(0);
    });
});
