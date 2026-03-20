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
    });
});
