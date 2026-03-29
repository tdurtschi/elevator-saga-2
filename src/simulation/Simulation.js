import { createFloors, createElevators, createRandomUser, spawnUserRandomly } from "./world.js";
import { observable } from "../libs/unobservable.js";
import { asElevatorInterface } from "../interfaces.js";
import _ from "lodash-es";

const DT = 0.02; // seconds per tick
const FLOOR_HEIGHT = 50;

export default class Simulation {
    constructor({ floors, elevators, spawnRate = 0.5, condition = null, elevatorCapacities = undefined }) {
        this._condition = condition;
        this._result = null;
        this._codeObj = null;
        observable(this);

        var handleUserCodeError = (e) => {
            this.trigger("usercode_error", e);
        };

        // Object creation
        this._floorHeight = FLOOR_HEIGHT;
        this._floors = createFloors(floors, this._floorHeight, handleUserCodeError);
        this._elevators = createElevators(elevators, floors, this._floorHeight, elevatorCapacities);
        this._elevatorInterfaces = _.map(this._elevators, (e) => asElevatorInterface({}, e, floors, handleUserCodeError));
        this._users = [];

        // Stats
        this._transportedCounter = 0;
        this._transportedPerSec = 0.0;
        this._moveCount = 0;
        this._elapsedTime = 0.0;
        this._maxWaitTime = 0.0;
        this._avgWaitTime = 0.0;

        // Spawn timing
        this._floorCount = floors;
        this._spawnRate = spawnRate;
        this._elapsedSinceSpawn = 1.001 / spawnRate;

        // Elevator availability — when an elevator arrives or changes indicator
        var handleElevAvailability = (elevator) => {
            // Notify floors first because overflowing users will press buttons again.
            for (let i = 0, len = this._floors.length; i < len; ++i) {
                if (elevator.currentFloor === i) {
                    this._floors[i].elevatorAvailable(elevator);
                }
            }
            for (let i = 0, len = this._users.length; i < len; ++i) {
                var user = this._users[i];
                if (user.currentFloor === elevator.currentFloor) {
                    user.elevatorAvailable(elevator, this._floors[elevator.currentFloor]);
                }
            }
        };

        for (let i = 0; i < this._elevators.length; ++i) {
            const elevator = this._elevators[i];
            elevator.on("entrance_available", handleElevAvailability);
            elevator.on("indicatorstate_change", () => {
                if (elevator.isOnAFloor() && !elevator.isMoving) {
                    handleElevAvailability(elevator);
                }
            });
        }

        // Floor button re-pressing — causes elevators to "re-arrive" if someone presses
        // a button on the floor before the elevator has left.
        var handleButtonRepressing = (eventName, floor) => {
            for (var i = 0, len = this._elevators.length, offset = _.random(len - 1); i < len; ++i) {
                var elevIndex = (i + offset) % len;
                var elevator = this._elevators[elevIndex];
                if (eventName === "up_button_pressed" && elevator.goingUpIndicator ||
                    eventName === "down_button_pressed" && elevator.goingDownIndicator) {
                    if (elevator.currentFloor === floor.level && elevator.isOnAFloor() && !elevator.isMoving && !elevator.isFull()) {
                        this._elevatorInterfaces[elevIndex].goToFloor(floor.level, true);
                    }
                }
            }
        };

        for (let i = 0; i < this._floors.length; ++i) {
            this._floors[i].on("up_button_pressed down_button_pressed", handleButtonRepressing);
        }
    }

    get floors() { return this._floors; }
    get elevators() { return this._elevators; }
    get floorHeight() { return this._floorHeight; }
    get challengeEnded() { return this._result !== null; }

    _recalculateStats() {
        this._transportedPerSec = this._transportedCounter / this._elapsedTime;
        this._moveCount = _.reduce(this._elevators, (sum, elevator) => sum + elevator.moveCount, 0);
        this.trigger("stats_changed");
    }

    _registerUser(user) {
        this._users.push(user);
        user.updateDisplayPosition(true);
        user.spawnTimestamp = this._elapsedTime;
        this.trigger("new_user", user);
        user.on("exited_elevator", () => {
            this._transportedCounter++;
            this._maxWaitTime = Math.max(this._maxWaitTime, this._elapsedTime - user.spawnTimestamp);
            this._avgWaitTime = (this._avgWaitTime * (this._transportedCounter - 1) + (this._elapsedTime - user.spawnTimestamp)) / this._transportedCounter;
            this._recalculateStats();
        });
        user.updateDisplayPosition(true);
    }

    _update(dt) {
        this._elapsedTime += dt;
        this._elapsedSinceSpawn += dt;
        while (this._elapsedSinceSpawn > 1.0 / this._spawnRate) {
            this._elapsedSinceSpawn -= 1.0 / this._spawnRate;
            this._registerUser(spawnUserRandomly(this._floorCount, this._floorHeight, this._floors));
        }

        for (let i = 0, len = this._elevators.length; i < len; ++i) {
            var e = this._elevators[i];
            e.update(dt);
            e.updateElevatorMovement(dt);
        }
        for (let i = 0, len = this._users.length; i < len; ++i) {
            let u = this._users[i];
            u.update(dt);
            this._maxWaitTime = Math.max(this._maxWaitTime, this._elapsedTime - u.spawnTimestamp);
        }

        for (let i = this._users.length - 1; i >= 0; i--) {
            if (this._users[i].removeMe) {
                this._users.splice(i, 1);
            }
        }

        this._recalculateStats();
    }

    updateDisplayPositions() {
        for (let i = 0, len = this._elevators.length; i < len; ++i) {
            this._elevators[i].updateDisplayPosition();
        }
        for (let i = 0, len = this._users.length; i < len; ++i) {
            this._users[i].updateDisplayPosition();
        }
    }

    spawnUser({ fromFloor, toFloor }) {
        const user = createRandomUser();
        user.moveTo(105, 0);
        user.appearOnFloor(this._floors[fromFloor], toFloor);
        this._registerUser(user);
    }

    applyCode(codeObj) {
        try {
            codeObj.init(this._elevatorInterfaces, this._floors);
        } catch (e) {
            this.trigger("usercode_error", e);
            return;
        }
        // Checking the floor queue of the elevators triggers the idle event
        for (var i = 0; i < this._elevatorInterfaces.length; ++i) {
            this._elevatorInterfaces[i].checkDestinationQueue();
        }
        this._codeObj = codeObj;
    }

    tick(dt) {
        if (this._result !== null) return;
        let remaining = dt;
        while (remaining > 0) {
            const step = Math.min(DT, remaining);
            if (this._codeObj) {
                try {
                    this._codeObj.update(step, this._elevatorInterfaces, this._floors);
                } catch (e) {
                    this.trigger("usercode_error", e);
                    return;
                }
            }
            this._update(step);
            remaining -= step;
            if (this._condition && this._result === null) {
                const result = this._condition.evaluate(this);
                if (result !== null) {
                    this._result = result;
                    this.trigger("challenge_ended", result);
                    return;
                }
            }
        }
    }

    runFor(seconds) {
        this.tick(seconds);
    }

    runUntilComplete() {
        if (!this._condition) throw new Error("No condition set");
        while (this._result === null) {
            if (this._codeObj) {
                try {
                    this._codeObj.update(DT, this._elevatorInterfaces, this._floors);
                } catch (e) {
                    this.trigger("usercode_error", e);
                    return;
                }
            }
            this._update(DT);
            this._result = this._condition.evaluate(this);
        }
    }

    passed() {
        return this._result === true;
    }

    isEnded() {
        return this._result !== null;
    }

    elapsedTime() {
        return this._elapsedTime;
    }

    maxWaitTime() {
        return this._maxWaitTime;
    }

    avgWaitTime() {
        return this._avgWaitTime;
    }

    transportedPerSec() {
        return this._transportedPerSec;
    }

    moveCount() {
        return this._moveCount;
    }

    transportedCount() {
        return this._transportedCounter;
    }

    floorButtonActivated(floorNum, direction) {
        return this._floors[floorNum].isButtonActivated(direction);
    }
}
