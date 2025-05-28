
class Floor {
    constructor(floorLevel, yPosition, errorHandler) {
        riot.observable(this);
        
        this.level = floorLevel;
        this.yPosition = yPosition;
        this.buttonStates = {up: "", down: ""};
        this.errorHandler = errorHandler;
    }

    // TODO: Ideally the floor should have a facade where tryTrigger is done
    tryTrigger(event, arg1, arg2, arg3, arg4) {
        try {
            this.trigger(event, arg1, arg2, arg3, arg4);
        } catch(e) { 
            this.errorHandler(e); 
        }
    }

    pressUpButton() {
        var prev = this.buttonStates.up;
        this.buttonStates.up = "activated";
        if(prev !== this.buttonStates.up) {
            this.tryTrigger("buttonstate_change", this.buttonStates);
            this.tryTrigger("up_button_pressed", this);
        }
    }

    pressDownButton() {
        var prev = this.buttonStates.down;
        this.buttonStates.down = "activated";
        if(prev !== this.buttonStates.down) {
            this.tryTrigger("buttonstate_change", this.buttonStates);
            this.tryTrigger("down_button_pressed", this);
        }
    }

    elevatorAvailable(elevator) {
        if(elevator.goingUpIndicator && this.buttonStates.up) {
            this.buttonStates.up = "";
            this.tryTrigger("buttonstate_change", this.buttonStates);
        }
        if(elevator.goingDownIndicator && this.buttonStates.down) {
            this.buttonStates.down = "";
            this.tryTrigger("buttonstate_change", this.buttonStates);
        }
    }

    getSpawnPosY() {
        return this.yPosition + 30;
    }

    floorNum() {
        return this.level;
    }
}

export default function asFloor(obj, floorLevel, yPosition, errorHandler) {
    return new Floor(floorLevel, yPosition, errorHandler);
}
