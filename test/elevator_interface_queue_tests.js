import { asElevatorInterface } from "../interfaces.js";
import Elevator from "../elevator.js";

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