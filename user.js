import {newGuard, linearInterpolate} from "./util.js";
import Movable from "./movable.js";

class User extends Movable {
    constructor(weight) {
        super();
        newGuard(this, User);
        this.weight = weight;
        this.currentFloor = 0;
        this.destinationFloor = 0;
        this.done = false;
        this.removeMe = false;
        this.exitAvailableHandler = null;
    }

    appearOnFloor(floor, destinationFloorNum) {
        var floorPosY = floor.getSpawnPosY();
        this.currentFloor = floor.level;
        this.destinationFloor = destinationFloorNum;
        this.moveTo(null, floorPosY);
        this.pressFloorButton(floor);
    }

    pressFloorButton(floor) {
        if(this.destinationFloor < this.currentFloor) {
            floor.pressDownButton();
        } else {
            floor.pressUpButton();
        }
    }

    handleExit(floorNum, elevator) {
        if(elevator.currentFloor === this.destinationFloor) {
            elevator.userExiting(this);
            this.currentFloor = elevator.currentFloor;
            this.setParent(null);
            var destination = this.x + 100;
            this.done = true;
            this.trigger("exited_elevator", elevator);
            this.trigger("new_state");
            this.trigger("new_display_state");
            var self = this;
            this.moveToOverTime(destination, null, 1 + Math.random()*0.5, linearInterpolate, function lastMove() {
                self.removeMe = true;
                self.trigger("removed");
                self.off("*");
            });

            elevator.off("exit_available", this.exitAvailableHandler);
        }
    }

    elevatorAvailable(elevator, floor) {
        if(this.done || this.parent !== null || this.isBusy()) {
            return;
        }

        if(!elevator.isSuitableForTravelBetween(this.currentFloor, this.destinationFloor)) {
            // Not suitable for travel - don't use this elevator
            return;
        }

        var pos = elevator.userEntering(this);
        if(pos) {
            // Success
            this.setParent(elevator);
            this.trigger("entered_elevator", elevator);
            var self = this;
            this.moveToOverTime(pos[0], pos[1], 1, undefined, function() {
                elevator.pressFloorButton(self.destinationFloor);
            });
            this.exitAvailableHandler = function (floorNum, elevator) { self.handleExit(elevator.currentFloor, elevator); };
            elevator.on("exit_available", this.exitAvailableHandler);
        } else {
            this.pressFloorButton(floor);
        }
    }
}

export default User;
