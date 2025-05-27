import {requireUserCountWithinTime, requireUserCountWithMaxWaitTime, requireUserCountWithinMoves, requireUserCountWithinTimeWithMaxWaitTime} from "../challenges";
import "../libs/riot.js";
import "../libs/unobservable.js";
const _ = require("lodash");

describe("Challenge requirements", function() {
    var fakeWorld = null;
    beforeEach(function() {
        fakeWorld = { elapsedTime: 0.0, transportedCounter: 0, maxWaitTime: 0.0, moveCount: 0 };
    });

    describe("requireUserCountWithinTime", function (){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithinTime(10, 5.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            fakeWorld.elapsedTime = 5.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.transportedCounter = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.elapsedTime = 4.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requireUserCountWithMaxWaitTime", function (){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithMaxWaitTime(10, 4.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            fakeWorld.maxWaitTime = 4.5;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.transportedCounter = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.maxWaitTime = 3.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requireUserCountWithinMoves", function (){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithinMoves(10, 20);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            fakeWorld.moveCount = 21;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.transportedCounter = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.moveCount = 20;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
        });
    });
    describe("requireUserCountWithinTimeWithMaxWaitTime", function(){
        it("evaluates correctly", function() {
            var challengeReq = requireUserCountWithinTimeWithMaxWaitTime(10, 5.0, 4.0);
            expect(challengeReq.evaluate(fakeWorld)).toBe(null);
            fakeWorld.elapsedTime = 5.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.transportedCounter = 11;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
            fakeWorld.elapsedTime = 4.9;
            expect(challengeReq.evaluate(fakeWorld)).toBe(true);
            fakeWorld.maxWaitTime = 4.1;
            expect(challengeReq.evaluate(fakeWorld)).toBe(false);
        });
    });
});