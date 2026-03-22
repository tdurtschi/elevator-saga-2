import { createWorldCreator, createWorldController } from "../src/simulation/world.js";
import { createSyncTicker } from "../src/ticker.js";
import User from "../src/simulation/user.js";
import { getCodeObjFromCode } from "../src/libs/util.js";

describe("World - indicator change reboard", function() {
    it("users reconsider boarding when elevator indicator changes while stopped at their floor", function() {
        const world = createWorldCreator().createWorld({
            floorCount: 2,
            elevatorCount: 1,
            spawnRate: 0
        });

        // Place a user on floor 1 going to floor 0 (needs goingDownIndicator)
        const user = new User(70);
        user.moveTo(105, 0);
        user.spawnTimestamp = 0;
        world.users.push(user);
        user.appearOnFloor(world.floors[1], 0);

        let boarded = false;
        user.on("entered_elevator", function() { boarded = true; });

        // Solution: elevator starts with goingDownIndicator off, arrives at floor 1,
        // user is deemed unsuitable at entrance_available, then on idle (after the
        // 1-second wait) the indicator turns on — users should re-evaluate.
        const codeObj = getCodeObjFromCode(`({
            init: function(elevators, floors) {
                var elevator = elevators[0];
                elevator.goingDownIndicator(false);
                var idleCount = 0;
                elevator.on("idle", function() {
                    idleCount++;
                    if (idleCount === 1) {
                        elevator.goToFloor(1);
                    } else {
                        elevator.goingDownIndicator(true);
                    }
                });
            },
            update: function(dt, elevators, floors) {}
        })`);

        // Run ~10 seconds of simulated time (enough for: travel + 1s wait + boarding)
        const ticker = createSyncTicker(1000 / 60, 600);
        const worldController = createWorldController(1 / 60);
        worldController.start(world, codeObj, ticker, true);
        ticker.run();

        expect(boarded).toBe(true);
    });
});
