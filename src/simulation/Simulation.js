import { createWorldCreator } from "./world.js";
import { observable } from "../libs/unobservable.js";

const DT = 0.02; // seconds per tick

export default class Simulation {
    constructor({ floors, elevators, spawnRate = 0.5, condition = null }) {
        this._creator = createWorldCreator();
        this._world = this._creator.createWorld({
            floorCount: floors,
            elevatorCount: elevators,
            spawnRate
        });
        this._condition = condition;
        this._result = null;
        observable(this);

        this._world.on("stats_changed", () => this.trigger("stats_changed"));
    }

    spawnUser({ fromFloor, toFloor }) {
        const user = this._creator.createRandomUser();
        user.moveTo(105, 0);
        user.appearOnFloor(this._world.floors[fromFloor], toFloor);
        this._world.registerUser(user);
    }

    applyCode(codeObj) {
        try {
            codeObj.init(this._world.elevatorInterfaces, this._world.floors);
        } catch(e) {
            this.trigger("usercode_error", e);
            return;
        }
        this._world.init();
        this._codeObj = codeObj;
    }

    tick(dt) {
        if (this._result !== null) return;
        let remaining = dt;
        while (remaining > 0) {
            const step = Math.min(DT, remaining);
            if (this._codeObj) {
                try {
                    this._codeObj.update(step, this._world.elevatorInterfaces, this._world.floors);
                } catch(e) {
                    this.trigger("usercode_error", e);
                    return;
                }
            }
            this._world.update(step);
            remaining -= step;
        }
    }

    runFor(seconds) {
        this.tick(seconds);
    }

    runUntilComplete() {
        if (!this._condition) throw new Error("No condition set");
        while (this._result === null) {
            const dt = DT;
            if (this._codeObj) {
                try {
                    this._codeObj.update(dt, this._world.elevatorInterfaces, this._world.floors);
                } catch(e) {
                    this.trigger("usercode_error", e);
                    return;
                }
            }
            this._world.update(dt);
            this._result = this._condition.evaluate(this._world);
        }
    }

    passed() {
        return this._result === true;
    }

    isEnded() {
        return this._result !== null;
    }

    elapsedTime() {
        return this._world.elapsedTime;
    }

    maxWaitTime() {
        return this._world.maxWaitTime;
    }

    avgWaitTime() {
        return this._world.avgWaitTime;
    }

    transportedPerSec() {
        return this._world.transportedPerSec;
    }

    moveCount() {
        return this._world.moveCount;
    }

    transportedCount() {
        return this._world.transportedCounter;
    }

    floorButtonActivated(floorNum, direction) {
        return this._world.floors[floorNum].isButtonActivated(direction);
    }
}
