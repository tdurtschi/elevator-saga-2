({
    init: function(elevators, floors) {
        var elevator = elevators[0];
        elevator.on("idle", function() {
            elevator.goToFloor(0);
            elevator.goToFloor(1);
            elevator.goToFloor(2);
        });
    },
    update: function(dt, elevators, floors) {}
})
