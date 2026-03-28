import { createWorldCreator } from "./world.js";
import User from "./user.js";

const DT = 0.02; // seconds per tick

export default class Simulation {
    constructor({ floors, elevators, spawnRate = 0.5 }) {
        this._creator = createWorldCreator();
        this._world = this._creator.createWorld({
            floorCount: floors,
            elevatorCount: elevators,
            spawnRate
        });
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

    transportedCount() {
        return this._world.transportedCounter;
    }
}
