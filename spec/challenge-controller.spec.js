import $ from "jquery";
import { createSyncTicker } from "../src/ticker.js";
import { createChallengeController } from "../src/challenges/challenge-controller.js";

const mockEditorService = () => ({
    getCodeObj: () => ({ init() {}, update() {} }),
    on() {},
});

const noopLog = () => {};

const mockPresenters = () => ({
    clearAll() {},
    presentStats() {},
    presentChallenge() {},
    presentFeedback() {},
    presentWorld() {},
});

const mockWorldController = () => ({
    isPaused: true,
    timeScale: 1.0,
    start() {},
    setPaused() {},
    setTimeScale() {},
    on() {},
    off() {},
    trigger() {},
});

const domStubs = () => ({
    $world: $("<div>"),
    $stats: $("<div>"),
    $feedback: $("<div>"),
    $challenge: $("<div>"),
});

describe("ChallengeController", () => {
    it("does not advance the simulation when paused", () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            worldController: mockWorldController(),
            presenters: mockPresenters(),
            log: noopLog,
            ...domStubs(),
        });

        controller.startChallenge(0, true);
        controller.setPaused(true);
        ticker.run();

        expect(controller.sim.elapsedTime()).toBe(0);
    });

    it("re-renders the challenge UI when paused state changes", () => {
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
            log: noopLog,
            ...domStubs(),
        });

        controller.startChallenge(0);
        renderCount = 0;

        controller.setPaused(true);

        expect(renderCount).toBe(1);
    });

    it("calls updateDisplayPositions on each tick", () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: mockPresenters(),
            log: noopLog,
            ...domStubs(),
        });

        let count = 0;
        controller.startChallenge(0, true);
        controller.sim.updateDisplayPositions = () => count++;
        ticker.run();

        expect(count).toBeGreaterThan(0);
    });

    it("triggers stats_display_changed on each tick", () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            presenters: mockPresenters(),
            log: noopLog,
            ...domStubs(),
        });

        let count = 0;
        controller.startChallenge(0, true);
        controller.sim.on("stats_display_changed", () => count++);
        ticker.run();

        expect(count).toBeGreaterThan(0);
    });

    it("re-renders the challenge UI when timescale changes", () => {
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
            log: noopLog,
            ...domStubs(),
        });

        controller.startChallenge(0);
        renderCount = 0;

        controller.setTimeScale(4);

        expect(renderCount).toBe(1);
    });

    it("advances faster at a higher timescale", () => {
        const tickerA = createSyncTicker(1000 / 60, 10);
        const controllerA = createChallengeController({
            ticker: tickerA,
            editorService: mockEditorService(),
            worldController: mockWorldController(),
            presenters: mockPresenters(),
            log: noopLog,
            ...domStubs(),
        });
        controllerA.startChallenge(0, true);
        tickerA.run();

        const tickerB = createSyncTicker(1000 / 60, 10);
        const controllerB = createChallengeController({
            ticker: tickerB,
            editorService: mockEditorService(),
            worldController: mockWorldController(),
            presenters: mockPresenters(),
            log: noopLog,
            ...domStubs(),
        });
        controllerB.setTimeScale(2.0);
        controllerB.startChallenge(0, true);
        tickerB.run();

        expect(controllerB.sim.elapsedTime()).toBeGreaterThan(controllerA.sim.elapsedTime());
    });

    it("advances the simulation when a challenge is started", () => {
        const ticker = createSyncTicker(1000 / 60, 10);
        const controller = createChallengeController({
            ticker,
            editorService: mockEditorService(),
            worldController: mockWorldController(),
            presenters: mockPresenters(),
            log: noopLog,
            ...domStubs(),
        });

        controller.startChallenge(0, true);
        ticker.run();

        expect(controller.sim.elapsedTime()).toBeGreaterThan(0);
    });
});
