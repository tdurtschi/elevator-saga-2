import { createWorldCreator } from "./world.js";

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
    }

    spawnUser({ fromFloor, toFloor }) {
        const user = this._creator.createRandomUser();
        user.moveTo(105, 0);
        user.appearOnFloor(this._world.floors[fromFloor], toFloor);
        this._world.registerUser(user);
    }

    applyCode(codeObj) {
        codeObj.init(this._world.elevatorInterfaces, this._world.floors);
        this._world.init();
        this._codeObj = codeObj;
    }

    runFor(seconds) {
        let remaining = seconds;
        while(remaining > 0) {
            const dt = Math.min(DT, remaining);
            if(this._codeObj) {
                this._codeObj.update(dt, this._world.elevatorInterfaces, this._world.floors);
            }
            this._world.update(dt);
            remaining -= dt;
        }
    }

    runUntilComplete() {
        if(!this._condition) throw new Error("No condition set");
        while(this._result === null) {
            const dt = DT;
            if(this._codeObj) {
                this._codeObj.update(dt, this._world.elevatorInterfaces, this._world.floors);
            }
            this._world.update(dt);
            this._result = this._condition.evaluate(this._world);
        }
    }

    passed() {
        return this._result === true;
    }

    moveCount() {
        return this._world.moveCount;
    }

    transportedCount() {
        return this._world.transportedCounter;
    }
}
