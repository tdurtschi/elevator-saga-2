import {newGuard, coolInterpolate} from "./util.js";
import "./libs/unobservable.js";

var _tmpPosStorage = [0,0];

class Movable extends window.unobservable.Observable {
    constructor() {
        super();
        newGuard(this, Movable);
        
        this.x = 0.0;
        this.y = 0.0;
        this.parent = null;
        this.worldX = 0.0;
        this.worldY = 0.0;
        this.currentTask = null;

        this.trigger('new_state', this);
    }

    updateDisplayPosition(forceTrigger) {
        this.getWorldPosition(_tmpPosStorage);
        var oldX = this.worldX;
        var oldY = this.worldY;
        this.worldX = _tmpPosStorage[0];
        this.worldY = _tmpPosStorage[1];
        if(oldX !== this.worldX || oldY !== this.worldY || forceTrigger === true) {
            this.trigger('new_display_state', this);
        }
    }

    moveTo(newX, newY) {
        if(newX !== null) { this.x = newX; }
        if(newY !== null) { this.y = newY; }
        this.trigger("new_state", this);
    }

    moveToFast(newX, newY) {
        this.x = newX;
        this.y = newY;
        this.trigger("new_state", this);
    }

    isBusy() {
        return this.currentTask !== null;
    }

    makeSureNotBusy() {
        if(this.isBusy()) {
            console.error("Attempt to use movable while it was busy", this);
            throw({message: "Object is busy - you should use callback", obj: this});
        }
    }

    wait(millis, cb) {
        this.makeSureNotBusy();
        var timeSpent = 0.0;
        var self = this;
        self.currentTask = function waitTask(dt) {
            timeSpent += dt;
            if(timeSpent > millis) {
                self.currentTask = null;
                if(cb) { cb(); }
            }
        };
    }

    moveToOverTime(newX, newY, timeToSpend, interpolator, cb) {
        this.makeSureNotBusy();
        this.currentTask = true;
        if(newX === null) { newX = this.x; }
        if(newY === null) { newY = this.y; }
        if(typeof interpolator === "undefined") { interpolator = coolInterpolate; }
        var origX = this.x;
        var origY = this.y;
        var timeSpent = 0.0;
        var self = this;
        self.currentTask = function moveToOverTimeTask(dt) {
            timeSpent = Math.min(timeToSpend, timeSpent + dt);
            if(timeSpent === timeToSpend) { // Epsilon issues possibly?
                self.moveToFast(newX, newY);
                self.currentTask = null;
                if(cb) { cb(); }
            } else {
                var factor = timeSpent / timeToSpend;
                self.moveToFast(interpolator(origX, newX, factor), interpolator(origY, newY, factor));
            }
        };
    }

    update(dt) {
        if(this.currentTask !== null) {
            this.currentTask(dt);
        }
    }

    getWorldPosition(storage) {
        var resultX = this.x;
        var resultY = this.y;
        var currentParent = this.parent;
        while(currentParent !== null) {
            resultX += currentParent.x;
            resultY += currentParent.y;
            currentParent = currentParent.parent;
        }
        storage[0] = resultX;
        storage[1] = resultY;
    }

    setParent(movableParent) {
        var objWorld = [0,0];
        if(movableParent === null) {
            if(this.parent !== null) {
                this.getWorldPosition(objWorld);
                this.parent = null;
                this.moveToFast(objWorld[0], objWorld[1]);
            }
        } else {
            // Parent is being set a non-null movable
            this.getWorldPosition(objWorld);
            var parentWorld = [0,0];
            movableParent.getWorldPosition(parentWorld);
            this.parent = movableParent;
            this.moveToFast(objWorld[0] - parentWorld[0], objWorld[1] - parentWorld[1]);
        }
    }
}

export default Movable;
