import { asElevatorInterface } from "../interfaces.js";
import Elevator from "../elevator.js";
import _ from "lodash";
import {timeForwarder} from "./helpers/timeForwarder.js";
import $ from "jquery";

describe("Elevator Queue", function() {
    let elevator;
    let elevatorInterface;
    let floorCount = 10;
    let errorHandler;
    let handlers;
    
    beforeEach(function() {
        // Create a mock elevator
        elevator = {
            isBusy: jasmine.createSpy('isBusy').and.returnValue(false),
            goToFloor: jasmine.createSpy('goToFloor'),
            getExactFutureFloorIfStopped: jasmine.createSpy('getExactFutureFloorIfStopped').and.returnValue(0),
            isOnAFloor: jasmine.createSpy('isOnAFloor').and.returnValue(true),
            currentFloor: 0,
            on: jasmine.createSpy('on'),
            wait: jasmine.createSpy('wait').and.callFake(function(time, callback) {
                callback();
            })
        };
        
        // Create the error handler
        errorHandler = jasmine.createSpy('errorHandler');
        
        // Setup event handlers
        handlers = {
            idle: jasmine.createSpy('idle'),
            stopped_at_floor: jasmine.createSpy('stopped_at_floor')
        };
        
        // Create the elevator interface
        elevatorInterface = asElevatorInterface({}, elevator, floorCount, errorHandler);
        
        // Hook up event handlers
        elevatorInterface.on("idle", handlers.idle);
        elevatorInterface.on("stopped_at_floor", handlers.stopped_at_floor);
    });

    describe("Basic Queue Operations", function() {
        it("should add floor to queue when goToFloor is called", function() {
            elevatorInterface.goToFloor(5);
            
            // Verify the floor was added to the queue
            expect(elevatorInterface.destinationQueue).toEqual([5]);
            
            // Verify the elevator was instructed to go to the floor
            expect(elevator.goToFloor).toHaveBeenCalledWith(5);
        });

        it("should add multiple floors to queue in correct order", function() {
            // Make elevator busy after the first call
            elevator.isBusy.and.returnValues(false, true, true);
            
            elevatorInterface.goToFloor(3);
            elevatorInterface.goToFloor(7);
            elevatorInterface.goToFloor(2);
            
            // Verify the floors were added to the queue in the correct order
            expect(elevatorInterface.destinationQueue).toEqual([3, 7, 2]);
            
            // Verify the elevator was only instructed to go to the first floor
            expect(elevator.goToFloor.calls.count()).toEqual(1);
            expect(elevator.goToFloor).toHaveBeenCalledWith(3);
        });
        
        it("should process queue when elevator is not busy", function() {
            // Simulate elevator being busy initially
            elevator.isBusy.and.returnValues(true, false);
            
            // Add floor to queue but elevator is busy
            elevatorInterface.goToFloor(4);
            
            // Verify elevator not instructed to go to floor yet
            expect(elevator.goToFloor).not.toHaveBeenCalled();
            
            // Trigger checkDestinationQueue when elevator becomes available
            elevatorInterface.checkDestinationQueue();
            
            // Verify elevator now instructed to go to floor
            expect(elevator.goToFloor).toHaveBeenCalledWith(4);
        });
        
        it("should trigger 'idle' event when queue is emptied", function() {
            // Ensure queue is empty
            elevatorInterface.destinationQueue = [];
            
            // Check queue when elevator is not busy
            elevatorInterface.checkDestinationQueue();
            
            // Verify idle event was triggered
            expect(handlers.idle).toHaveBeenCalled();
        });
    });
    
    describe("Queue Manipulation Features", function() {        
        it("should allow priority floors with forceNow parameter", function() {
            // Add regular floors to queue
            elevatorInterface.goToFloor(3);
            elevatorInterface.goToFloor(7);
            
            // Add a priority floor
            elevatorInterface.goToFloor(1, true);
            
            // Verify the priority floor is at the front of the queue
            expect(elevatorInterface.destinationQueue).toEqual([1, 3, 7]);
        });
        
        it("should prevent adding duplicate destinations consecutively", function() {
            // Add a floor to queue
            elevatorInterface.goToFloor(4);
            
            // Try to add the same floor again
            elevatorInterface.goToFloor(4);
            
            // Verify the floor was added only once
            expect(elevatorInterface.destinationQueue).toEqual([4]);
            expect(elevator.goToFloor.calls.count()).toEqual(1);
        });
        
        it("should prevent adding duplicate priority destinations", function() {
            // Add a floor to queue
            elevatorInterface.goToFloor(6);
            
            // Try to add the same floor as priority
            elevatorInterface.goToFloor(6, true);
            
            // Verify the floor was added only once
            expect(elevatorInterface.destinationQueue).toEqual([6]);
            expect(elevator.goToFloor.calls.count()).toEqual(1);
        });
        
        it("should allow adding a floor that was already in queue but not consecutively", function() {
            // Add floors to queue
            elevatorInterface.goToFloor(2);
            elevatorInterface.goToFloor(5);
            elevatorInterface.goToFloor(2);  // Add 2 again
            
            // Verify all floors were added
            expect(elevatorInterface.destinationQueue).toEqual([2, 5, 2]);
        });
    });
    
    describe("Floor Number Handling", function() {
        it("should limit floor number to valid range", function() {
            // Try negative floor
            elevatorInterface.goToFloor(-1);
            
            // Verify floor number was limited to 0
            expect(elevatorInterface.destinationQueue).toEqual([0]);
            
            // Reset queue
            elevatorInterface.destinationQueue = [];
            elevator.goToFloor.calls.reset();
            
            // Try floor beyond max
            elevatorInterface.goToFloor(floorCount + 5);
            
            // Verify floor number was limited to max floor
            expect(elevatorInterface.destinationQueue).toEqual([floorCount - 1]);
        });
        
        it("should convert string floor numbers to numeric values", function() {
            // Pass floor number as string
            elevatorInterface.goToFloor("3");
            
            // Verify it was converted to number
            expect(elevatorInterface.destinationQueue).toEqual([3]);
            expect(elevator.goToFloor).toHaveBeenCalledWith(3);
        });
    });
    
    describe("Stop Method Behavior", function() {
        it("should clear the destination queue when stop is called", function() {
            // Add floors to queue
            elevatorInterface.goToFloor(3);
            elevatorInterface.goToFloor(7);
            
            // Call stop
            elevatorInterface.stop();
            
            // Verify queue was cleared
            expect(elevatorInterface.destinationQueue).toEqual([]);
        });
        
        it("should instruct elevator to stay at current position when stopped", function() {
            // Add floors to queue
            elevatorInterface.goToFloor(3);
            
            // Call stop when elevator is not busy
            elevatorInterface.stop();
            
            // Verify elevator was instructed to go to current position
            expect(elevator.getExactFutureFloorIfStopped).toHaveBeenCalled();
            expect(elevator.goToFloor).toHaveBeenCalledWith(0);
        });
    });
    
    describe("Complex Queue Scenarios", function() {
        it("should correctly handle a mix of regular and priority floors", function() {
            // Add regular floors
            elevatorInterface.goToFloor(3);
            elevatorInterface.goToFloor(7);
            
            // Simulate elevator being busy
            elevator.isBusy.and.returnValue(true);
            
            // Add priority floors
            elevatorInterface.goToFloor(2, true);
            elevatorInterface.goToFloor(5, true);
            
            // Verify queue has priority floors at front
            expect(elevatorInterface.destinationQueue).toEqual([5, 2, 3, 7]);
        });
    });
});

describe("Elevator Queue Integration", () => {
    let elevator;
    let elevatorInterface;
    let floorCount = 10;
    let errorHandler;
    
    beforeEach(function() {
        // Create a mock elevator
        elevator = new Elevator(5, 10, 3, 10);
        
        // Create the error handler
        errorHandler = jasmine.createSpy('errorHandler');
        
        // Create the elevator interface
        elevatorInterface = asElevatorInterface({}, elevator, floorCount, errorHandler);
    });

    it("should automatically remove floor from queue when reached", function () {
        // Add floors to queue
        elevatorInterface.goToFloor(2);
        elevatorInterface.goToFloor(5);

        expect(elevatorInterface.destinationQueue).toEqual([2, 5]);

        // Simulate elevator arriving at first destination
        elevator.currentFloor = 2;
        elevator.trigger("stopped", 2);

        // Verify queue updated and elevator instructed to go to next floor
        expect(elevatorInterface.destinationQueue).toEqual([5]);
    });
})

describe("Elevator interface", function() {
    var e = null;
    var elevInterface = null;
    var handlers = null;
    beforeEach(function() {
        e =  new Elevator(1.5, 4, 40);
        e.setFloorPosition(0);
        elevInterface = asElevatorInterface({}, e, 4);

        handlers = {
            someHandler: function() { },
            someOtherHandler: function() { }
        };
        $.each(handlers, function(key, value) {
            spyOn(handlers, key).and.callThrough();
        });
    });

    describe("events", function() {
        it("propagates stopped_at_floor event", function() {
            elevInterface.on("stopped_at_floor", handlers.someHandler);
            e.trigger("stopped_at_floor", 3);
            expect(handlers.someHandler.calls.mostRecent().args.slice(0, 1)).toEqual([3]);
        });

        it("does not propagate stopped event", function() {
            elevInterface.on("stopped", handlers.someHandler);
            e.trigger("stopped", 3.1);
            expect(handlers.someHandler).not.toHaveBeenCalled();
        });

        it("triggers idle event at start", function() {
            elevInterface.on("idle", handlers.someHandler);
            elevInterface.checkDestinationQueue();
            expect(handlers.someHandler).toHaveBeenCalled();
        });

        it("triggers idle event when queue empties", function() {
            elevInterface.on("idle", handlers.someHandler);
            elevInterface.destinationQueue = [11, 21];
            e.y = 11;
            e.trigger("stopped", e.y);
            expect(handlers.someHandler).not.toHaveBeenCalled();
            e.y = 21;
            e.trigger("stopped", e.y);
            expect(handlers.someHandler).toHaveBeenCalled();
        });
    });

    it("stops when told told to stop", function() {
        var originalY = e.y;
        elevInterface.goToFloor(2);
        timeForwarder(10, 0.015, function(dt) {e.update(dt); e.updateElevatorMovement(dt);});
        expect(e.y).not.toBe(originalY);

        elevInterface.goToFloor(0);
        timeForwarder(0.2, 0.015, function(dt) {e.update(dt); e.updateElevatorMovement(dt);});
        var whenMovingY = e.y;

        elevInterface.stop();
        timeForwarder(10, 0.015, function(dt) {e.update(dt); e.updateElevatorMovement(dt);});
        expect(e.y).not.toBe(whenMovingY);
        expect(e.y).not.toBe(originalY);
    });

    describe("destination direction", function() {
        it("reports up when going up", function() {
            e.setFloorPosition(1);
            elevInterface.goToFloor(1);
            expect(elevInterface.destinationDirection()).toBe("stopped");
        });
        it("reports up when going up", function() {
            elevInterface.goToFloor(1);
            expect(elevInterface.destinationDirection()).toBe("up");
        });
        it("reports down when going down", function() {
            e.setFloorPosition(3);
            elevInterface.goToFloor(2);
            expect(elevInterface.destinationDirection()).toBe("down");
        });
    });

    it("stores going up and going down properties", function() {
        expect(e.goingUpIndicator).toBe(true);
        expect(e.goingDownIndicator).toBe(true);
        expect(elevInterface.goingUpIndicator()).toBe(true);
        expect(elevInterface.goingDownIndicator()).toBe(true);

        elevInterface.goingUpIndicator(false);
        expect(elevInterface.goingUpIndicator()).toBe(false);
        expect(elevInterface.goingDownIndicator()).toBe(true);

        elevInterface.goingDownIndicator(false);
        expect(elevInterface.goingDownIndicator()).toBe(false);
        expect(elevInterface.goingUpIndicator()).toBe(false);
    });

    it("can chain calls to going up and down indicator functions", function() {
        elevInterface.goingUpIndicator(false).goingDownIndicator(false);
        expect(elevInterface.goingUpIndicator()).toBe(false);
        expect(elevInterface.goingDownIndicator()).toBe(false);
    });

    it("normalizes load factor", function() {
        var fnNewUser = function(){ return {weight:_.random(55, 100)}; },
            fnEnterElevator = function(user){ e.userEntering(user); };

        _.chain(_.range(20)).map(fnNewUser).forEach(fnEnterElevator);
        var load = elevInterface.loadFactor();
        expect(load >= 0 && load <= 1).toBeTruthy();
    });

    it("doesnt raise unexpected events when told to stop when passing floor", function() {
        e.setFloorPosition(2);
        elevInterface.goToFloor(0);
        var passingFloorEventCount = 0;
        elevInterface.on("passing_floor", function(floorNum, direction) {
            passingFloorEventCount++;
            // We only expect to be passing floor 1, but it is possible and ok that several
            // such events are raised, due to possible overshoot.
            expect(floorNum).toBe(1, "floor being passed");
            elevInterface.stop();
        });
        timeForwarder(3.0, 0.01401, function(dt) {e.update(dt); e.updateElevatorMovement(dt);});
        expect(passingFloorEventCount).toBeGreaterThan(0);
    });
});