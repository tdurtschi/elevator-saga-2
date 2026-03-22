import { runChallenge } from "../headless-runner.js";

const SOLUTION = `({
    init: function(elevators, floors) {
        var elevator = elevators[0];
        elevator.on("idle", function() {
            elevator.goToFloor(0);
            elevator.goToFloor(1);
            elevator.goToFloor(2);
        });
    },
    update: function(dt, elevators, floors) {}
})`;

describe("headless runner", function () {
    describe("challenge 1 (transport 15 people in 60s)", function () {
        var result;

        beforeEach(function () {
            result = runChallenge(0, SOLUTION);
        });

        it("passes the challenge", function () {
            expect(result.passed).toBe(true);
        });

        it("transports at least 15 people", function () {
            expect(result.transported).toBeGreaterThanOrEqual(15);
        });

        it("finishes within the 60 second time limit", function () {
            expect(result.elapsed).toBeLessThanOrEqual(60);
        });

        it("ends the challenge when the condition is met", function () {
            expect(result.challengeEnded).toBe(true);
        });

        it("records elevator moves", function () {
            expect(result.moveCount).toBeGreaterThan(0);
        });

        it("records a non-zero max wait time", function () {
            expect(result.maxWaitTime).toBeGreaterThan(0);
        });

        it("includes structured condition info", function () {
            expect(result.condition).toEqual({ type: "withinTime", userCount: 15, timeLimit: 60 });
        });
    });

    describe("seeded (frozen) mode", function () {
        it("produces identical results for the same seed", function () {
            const result1 = runChallenge(0, SOLUTION, { seed: 42 });
            const result2 = runChallenge(0, SOLUTION, { seed: 42 });
            expect(result1.transported).toEqual(result2.transported);
            expect(result1.elapsed).toEqual(result2.elapsed);
            expect(result1.maxWaitTime).toEqual(result2.maxWaitTime);
            expect(result1.moveCount).toEqual(result2.moveCount);
        });

        it("marks the result as frozen", function () {
            const result = runChallenge(0, SOLUTION, { seed: 42 });
            expect(result.frozen).toBe(true);
        });

        it("does not mark unseeded results as frozen", function () {
            const result = runChallenge(0, SOLUTION);
            expect(result.frozen).toBeUndefined();
        });
    });
});
