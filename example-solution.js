export const init = function(elevators, _floors) {
    var elevator = elevators[0];
    elevator.on("idle", function() {
        elevator.goToFloor(0);
        elevator.goToFloor(1);
        elevator.goToFloor(2);
    });
};
export const update = function(_dt, _elevators, _floors) {};
