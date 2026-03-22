import Elevator from "./elevator.js";
import { observable } from "../libs/unobservable.js";
import asFloor from "./floor.js";
import { asElevatorInterface } from "../interfaces.js";
import User from "./user.js";
import _ from "lodash-es";
import {log} from "../ui/terminal-logger.js";
import { createSeededRandom } from "../libs/seeded-random.js";

export function createWorldCreator() {
    var creator = {};

    creator.createFloors = function(floorCount, floorHeight, errorHandler) {
        var floors = _.map(_.range(floorCount), function(e, i) {
            var yPos = (floorCount - 1 - i) * floorHeight;
            var floor = asFloor({}, i, yPos, errorHandler);
            return floor;
        });
        return floors;
    };
    creator.createElevators = function(elevatorCount, floorCount, floorHeight, elevatorCapacities) {
        elevatorCapacities = elevatorCapacities || [4];
        var currentX = 200.0;
        var elevators = _.map(_.range(elevatorCount), function(e, i) {
            var elevator = new Elevator(2.6, floorCount, floorHeight, elevatorCapacities[i%elevatorCapacities.length]);

            // Move to right x position
            elevator.moveTo(currentX, null);
            elevator.setFloorPosition(0);
            elevator.updateDisplayPosition();
            currentX += (20 + elevator.width);
            return elevator;
        });
        return elevators;
    };

    creator.createRandomUser = function(random) {
        var weight = random(55, 100);
        var user = new User(weight);
        if(random(40) === 0) {
            user.displayType = "child";
        } else if(random(1) === 0) {
            user.displayType = "female";
        } else {
            user.displayType = "male";
        }
        return user;
    };

    creator.spawnUserRandomly = function(floorCount, floorHeight, floors, random) {
        var user = creator.createRandomUser(random);
        user.moveTo(105+random(40), 0);
        var currentFloor = random(1) === 0 ? 0 : random(floorCount - 1);
        var destinationFloor;
        if(currentFloor === 0) {
            // Definitely going up
            destinationFloor = random(1, floorCount - 1);
        } else {
            // Usually going down, but sometimes not
            if(random(10) === 0) {
                destinationFloor = (currentFloor + random(1, floorCount - 1)) % floorCount;
            } else {
                destinationFloor = 0;
            }
        }
        user.appearOnFloor(floors[currentFloor], destinationFloor);
        return user;
    };

    creator.createWorld = function(options) {
var defaultOptions = { floorHeight: 50, floorCount: 4, elevatorCount: 2, spawnRate: 0.5 };
        options = _.defaults(_.clone(options), defaultOptions);
        var random = options.seed !== undefined
            ? createSeededRandom(options.seed)
            : _.random.bind(_);
        var world = {floorHeight: options.floorHeight, transportedCounter: 0};
        observable(world);

        var handleUserCodeError = function(e) {
            world.trigger("usercode_error", e);
        }

        world.floors = creator.createFloors(options.floorCount, world.floorHeight, handleUserCodeError);
        world.elevators = creator.createElevators(options.elevatorCount, options.floorCount, world.floorHeight, options.elevatorCapacities);
        world.elevatorInterfaces = _.map(world.elevators, function(e) { return asElevatorInterface({}, e, options.floorCount, handleUserCodeError); });
        world.users = [];
        world.transportedCounter = 0;
        world.transportedPerSec = 0.0;
        world.moveCount = 0;
        world.elapsedTime = 0.0;
        world.maxWaitTime = 0.0;
        world.avgWaitTime = 0.0;
        world.challengeEnded = false;

        var recalculateStats = function() {
            world.transportedPerSec = world.transportedCounter / world.elapsedTime;
            // TODO: Optimize this loop?
            world.moveCount = _.reduce(world.elevators, function(sum, elevator) { return sum+elevator.moveCount; }, 0);
            world.trigger("stats_changed");
        };

        var registerUser = function(user) {
            world.users.push(user);
            user.updateDisplayPosition(true);
            user.spawnTimestamp = world.elapsedTime;
            world.trigger("new_user", user);
            user.on("exited_elevator", function() {
                world.transportedCounter++;
                world.maxWaitTime = Math.max(world.maxWaitTime, world.elapsedTime - user.spawnTimestamp);
                world.avgWaitTime = (world.avgWaitTime * (world.transportedCounter - 1) + (world.elapsedTime - user.spawnTimestamp)) / world.transportedCounter;
                recalculateStats();
            });
            user.updateDisplayPosition(true);
        };

        var handleElevAvailability = function(elevator) {
            // Use regular loops for memory/performance reasons
            // Notify floors first because overflowing users
            // will press buttons again.
            for(let i=0, len=world.floors.length; i<len; ++i) {
                var floor = world.floors[i];
                if(elevator.currentFloor === i) {
                    floor.elevatorAvailable(elevator);
                }
            }
            for(let users=world.users, i=0, len=users.length; i < len; ++i) {
                var user = users[i];
                if(user.currentFloor === elevator.currentFloor) {
                    user.elevatorAvailable(elevator, world.floors[elevator.currentFloor]);
                }
            }
        };

        // Bind them all together
        for(let i=0; i < world.elevators.length; ++i) {
            const elevator = world.elevators[i];
            elevator.on("entrance_available", handleElevAvailability);
            elevator.on("indicatorstate_change", function() {
                if(elevator.isOnAFloor() && !elevator.isMoving) {
                    handleElevAvailability(elevator);
                }
            });
        }

        var handleButtonRepressing = function(eventName, floor) {
            // Need randomize iteration order or we'll tend to fill upp first elevator
            for(var i=0, len=world.elevators.length, offset=random(len-1); i < len; ++i) {
                var elevIndex = (i + offset) % len;
                var elevator = world.elevators[elevIndex];
                if( eventName === "up_button_pressed" && elevator.goingUpIndicator ||
                    eventName === "down_button_pressed" && elevator.goingDownIndicator) {

                    // Elevator is heading in correct direction, check for suitability
                    if(elevator.currentFloor === floor.level && elevator.isOnAFloor() && !elevator.isMoving && !elevator.isFull()) {
                        // Potentially suitable to get into
                        // Use the interface queue functionality to queue up this action
                        world.elevatorInterfaces[elevIndex].goToFloor(floor.level, true);
                    }
                }
            }
        }

        // This will cause elevators to "re-arrive" at floors if someone presses an
        // appropriate button on the floor before the elevator has left.
        for(let i=0; i<world.floors.length; ++i) {
            world.floors[i].on("up_button_pressed down_button_pressed", handleButtonRepressing);
        };

        var elapsedSinceSpawn = 1.001/options.spawnRate;
        var _elapsedSinceStatsUpdate = 0.0;

        // Main update function
        world.update = function(dt) {
            world.elapsedTime += dt;
            elapsedSinceSpawn += dt;
            _elapsedSinceStatsUpdate += dt;
            while(elapsedSinceSpawn > 1.0/options.spawnRate) {
                elapsedSinceSpawn -= 1.0/options.spawnRate;
                registerUser(creator.spawnUserRandomly(options.floorCount, world.floorHeight, world.floors, random));
            }

            // Use regular for loops for performance and memory friendlyness
            for(let i=0, len=world.elevators.length; i < len; ++i) {
                var e = world.elevators[i];
                e.update(dt);
                e.updateElevatorMovement(dt);
            }
            for(let users=world.users, i=0, len=users.length; i < len; ++i) {
                let u = users[i];
                u.update(dt);
                world.maxWaitTime = Math.max(world.maxWaitTime, world.elapsedTime - u.spawnTimestamp);
            };

            for(let users=world.users, i=world.users.length-1; i>=0; i--) {
                let u = users[i];
                if(u.removeMe) {
                    users.splice(i, 1);
                }
            }

            recalculateStats();
        };

        world.updateDisplayPositions = function() {
            for(let i=0, len=world.elevators.length; i < len; ++i) {
                world.elevators[i].updateDisplayPosition();
            }
            for(let users=world.users, i=0, len=users.length; i < len; ++i) {
                users[i].updateDisplayPosition();
            }
        };


        world.unWind = function() {
            console.log("Unwinding", world);
            _.each(world.elevators.concat(world.elevatorInterfaces).concat(world.users).concat(world.floors).concat([world]), function(obj) {
                obj.off("*");
            });
            world.challengeEnded = true;
            world.elevators = world.elevatorInterfaces = world.users = world.floors = [];
        };

        world.init = function() {
            // Checking the floor queue of the elevators triggers the idle event here
            for(var i=0; i < world.elevatorInterfaces.length; ++i) {
                world.elevatorInterfaces[i].checkDestinationQueue();
            }
        };

        return world;
    };

    return creator;
};


export function createWorldController(dtMax) {
    var controller = observable({});
    controller.timeScale = 1.0;
    controller.isPaused = true;
    controller.start = function(world, codeObj, animationFrameRequester, autoStart) {
        controller.isPaused = true;
        var lastT = null;
        var firstUpdate = true;
        world.on("usercode_error", controller.handleUserCodeError);
        var updater = function(t) {
            if(!controller.isPaused && !world.challengeEnded && lastT !== null) {
                if(firstUpdate) {
                    firstUpdate = false;
                    // This logic prevents infite loops in usercode from breaking the page permanently - don't evaluate user code until game is unpaused.
                    try {
                        codeObj.init(world.elevatorInterfaces, world.floors);
                        world.init();
                    } catch(e) { controller.handleUserCodeError(e); }
                }

                var dt = (t - lastT);
                var scaledDt = dt * 0.001 * controller.timeScale;
                scaledDt = Math.min(scaledDt, dtMax * 3 * controller.timeScale); // Limit to prevent unhealthy substepping
                try {
                    codeObj.update(scaledDt, world.elevatorInterfaces, world.floors);
                } catch(e) { controller.handleUserCodeError(e); }
                while(scaledDt > 0.0 && !world.challengeEnded) {
                    var thisDt = Math.min(dtMax, scaledDt);
                    world.update(thisDt);
                    scaledDt -= dtMax;
                }
                world.updateDisplayPositions();
                world.trigger("stats_display_changed"); // TODO: Trigger less often for performance reasons etc
            }
            lastT = t;
            if(!world.challengeEnded) {
                animationFrameRequester(updater);
            }
        };
        if(autoStart) {
            controller.setPaused(false);
        }
        animationFrameRequester(updater);
    };

    controller.handleUserCodeError = function(e) {
        controller.setPaused(true);
        log("Usercode error on update:", "error");
        log(e, "error");
    };

    controller.setPaused = function(paused) {
        controller.isPaused = paused;
        controller.trigger("timescale_changed");
    };
    controller.setTimeScale = function(timeScale) {
        controller.timeScale = timeScale;
        controller.trigger("timescale_changed");
    };

    return controller;
};
