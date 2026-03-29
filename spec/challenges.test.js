import {requireUserCountWithinTime, requireUserCountWithMaxWaitTime, requireUserCountWithinMoves, requireUserCountWithinTimeWithMaxWaitTime, requireDemo} from "../src/challenges/challenges.js";

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

    describe("requireUserCountWithinTime", function (){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithinTime(10, 5.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.elapsedTime = 5.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.elapsedTime = 4.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requireUserCountWithMaxWaitTime", function (){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithMaxWaitTime(10, 4.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.maxWaitTime = 4.5;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.maxWaitTime = 3.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requireUserCountWithinMoves", function (){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithinMoves(10, 20);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            stats.moveCount = 21;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.transportedCount = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            stats.moveCount = 20;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requireUserCountWithinTimeWithMaxWaitTime", function(){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithinTimeWithMaxWaitTime(10, 5.0, 4.0);
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
    it("requireUserCountWithinTime has type and params", function() {
        var c = requireUserCountWithinTime(15, 60);
        expect(c.type).toBe("withinTime");
        expect(c.userCount).toBe(15);
        expect(c.timeLimit).toBe(60);
    });

    it("requireUserCountWithMaxWaitTime has type and params", function() {
        var c = requireUserCountWithMaxWaitTime(50, 21);
        expect(c.type).toBe("maxWaitTime");
        expect(c.userCount).toBe(50);
        expect(c.maxWaitTime).toBe(21);
    });

    it("requireUserCountWithinMoves has type and params", function() {
        var c = requireUserCountWithinMoves(40, 60);
        expect(c.type).toBe("withinMoves");
        expect(c.userCount).toBe(40);
        expect(c.moveLimit).toBe(60);
    });

    it("requireUserCountWithinTimeWithMaxWaitTime has type and params", function() {
        var c = requireUserCountWithinTimeWithMaxWaitTime(2675, 1800, 45);
        expect(c.type).toBe("withinTimeAndMaxWaitTime");
        expect(c.userCount).toBe(2675);
        expect(c.timeLimit).toBe(1800);
        expect(c.maxWaitTime).toBe(45);
    });

    it("requireDemo has type", function() {
        var c = requireDemo();
        expect(c.type).toBe("demo");
    });
});