import {requirePassengerCountWithinTime, requirePassengerCountWithMaxWaitTime, requirePassengerCountWithinMoves, requirePassengerCountWithinTimeWithMaxWaitTime, requireDemo} from "../src/challenges/challenges.js";

describe("Challenge requirements", function() {
    var fakeWorld = null;
    var stats = null;
    beforeEach(function() {
        stats = { elapsedTime: 0.0, transportedCount: 0, maxWaitTime: 0.0, moveCount: 0 };
        fakeWorld = {
            elapsedTime: () => stats.elapsedTime,
            transportedCount: () => stats.transportedCount,
            maxWaitTime: () => stats.maxWaitTime,
            moveCount: () => stats.moveCount,
        };
    });

    describe("requirePassengerCountWithinTime", function (){
        it("evaluates correctly", function() {
            var challengeReq = requirePassengerCountWithinTime(10, 5.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.elapsedTime = 5.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.elapsedTime = 4.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requirePassengerCountWithMaxWaitTime", function (){
        it("evaluates correctly", function() {
            var challengeReq = requirePassengerCountWithMaxWaitTime(10, 4.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.maxWaitTime = 4.5;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.maxWaitTime = 3.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requirePassengerCountWithinMoves", function (){
        it("evaluates correctly", function() {
            var challengeReq = requirePassengerCountWithinMoves(10, 20);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.moveCount = 21;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.moveCount = 20;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requirePassengerCountWithinTimeWithMaxWaitTime", function(){
        it("evaluates correctly", function() {
            var challengeReq = requirePassengerCountWithinTimeWithMaxWaitTime(10, 5.0, 4.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.elapsedTime = 5.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.elapsedTime = 4.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
            stats.maxWaitTime = 4.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
        });
    });
});

describe("Challenge condition structure", function() {
    it("requirePassengerCountWithinTime has type and params", function() {
        var c = requirePassengerCountWithinTime(15, 60);
        expect(c.type).toBe("withinTime");
        expect(c.passengerCount).toBe(15);
        expect(c.timeLimit).toBe(60);
    });

    it("requirePassengerCountWithMaxWaitTime has type and params", function() {
        var c = requirePassengerCountWithMaxWaitTime(50, 21);
        expect(c.type).toBe("maxWaitTime");
        expect(c.passengerCount).toBe(50);
        expect(c.maxWaitTime).toBe(21);
    });

    it("requirePassengerCountWithinMoves has type and params", function() {
        var c = requirePassengerCountWithinMoves(40, 60);
        expect(c.type).toBe("withinMoves");
        expect(c.passengerCount).toBe(40);
        expect(c.moveLimit).toBe(60);
    });

    it("requirePassengerCountWithinTimeWithMaxWaitTime has type and params", function() {
        var c = requirePassengerCountWithinTimeWithMaxWaitTime(2675, 1800, 45);
        expect(c.type).toBe("withinTimeAndMaxWaitTime");
        expect(c.passengerCount).toBe(2675);
        expect(c.timeLimit).toBe(1800);
        expect(c.maxWaitTime).toBe(45);
    });

    it("requireDemo has type", function() {
        var c = requireDemo();
        expect(c.type).toBe("demo");
    });
});