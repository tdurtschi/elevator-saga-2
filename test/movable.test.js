import "../libs/riot.js";
import "../libs/unobservable.js";
import Movable from "../movable";
const _ = require("lodash");

describe("Movable", function() {
    var movable;

    // Mock the required dependencies
    beforeEach(function() {
        // Create a fresh movable instance for each test
        movable = new Movable();
    });

    afterEach(function() {
        movable = null;
    });

    it("disallows incorrect creation", function() {
        var faultyCreation = function () { Movable(); };
        expect(faultyCreation).toThrow();
    });

    it("updates display position when told to", function() {
        movable.moveTo(1.0, 1.0);
        movable.updateDisplayPosition();
        expect(movable.worldX).toBe(1.0);
        expect(movable.worldY).toBe(1.0);
    });

    describe("Event listeners", function() {
        it("should trigger 'new_state' event when moveTo is called", function() {
            var spy = jasmine.createSpy('stateCallback');
            movable.on("new_state", spy);

            // Reset the spy call count since the event is also triggered during initialization
            spy.calls.reset();

            movable.moveTo(5, 10);

            expect(spy).toHaveBeenCalledWith(movable, undefined, undefined, undefined);
            expect(movable.x).toBe(5);
            expect(movable.y).toBe(10);
        });

        it("should trigger 'new_state' event when moveToFast is called", function() {
            var spy = jasmine.createSpy('stateCallback');
            movable.on("new_state", spy);

            // Reset the spy call count since the event is also triggered during initialization
            spy.calls.reset();

            movable.moveToFast(15, 20);

            expect(spy).toHaveBeenCalledWith(movable, undefined, undefined, undefined);
            expect(movable.x).toBe(15);
            expect(movable.y).toBe(20);
        });

        it("should trigger 'new_display_state' when updateDisplayPosition is called with changes", function() {
            var spy = jasmine.createSpy('displayStateCallback');
            movable.on("new_display_state", spy);

            // Setup some initial world coordinates
            movable.worldX = 5;
            movable.worldY = 10;

            // Mock getWorldPosition to return different values
            spyOn(movable, 'getWorldPosition').and.callFake(function(storage) {
                storage[0] = 15;
                storage[1] = 20;
            });

            movable.updateDisplayPosition();

            expect(spy).toHaveBeenCalledWith(movable, undefined, undefined, undefined);
            expect(movable.worldX).toBe(15);
            expect(movable.worldY).toBe(20);
        });

        it("should not trigger 'new_display_state' when updateDisplayPosition is called without changes", function() {
            var spy = jasmine.createSpy('displayStateCallback');
            movable.on("new_display_state", spy);

            // Setup initial world coordinates
            movable.worldX = 15;
            movable.worldY = 20;

            // Mock getWorldPosition to return the same values
            spyOn(movable, 'getWorldPosition').and.callFake(function(storage) {
                storage[0] = 15;
                storage[1] = 20;
            });

            movable.updateDisplayPosition();

            expect(spy).not.toHaveBeenCalled();
            expect(movable.worldX).toBe(15);
            expect(movable.worldY).toBe(20);
        });

        it("should force trigger 'new_display_state' when requested even without changes", function() {
            var spy = jasmine.createSpy('displayStateCallback');
            movable.on("new_display_state", spy);

            // Setup initial world coordinates
            movable.worldX = 15;
            movable.worldY = 20;

            // Mock getWorldPosition to return the same values
            spyOn(movable, 'getWorldPosition').and.callFake(function(storage) {
                storage[0] = 15;
                storage[1] = 20;
            });

            movable.updateDisplayPosition(true);

            expect(spy).toHaveBeenCalledWith(movable, undefined, undefined, undefined);
        });
    });

    describe("Movement", function() {
        it("should update position correctly when moveTo is called", function() {
            movable.moveTo(5, 10);

            expect(movable.x).toBe(5);
            expect(movable.y).toBe(10);
        });

        it("should not update position for null coordinates", function() {
            movable.x = 5;
            movable.y = 10;

            movable.moveTo(null, null);

            expect(movable.x).toBe(5);
            expect(movable.y).toBe(10);
        });

        it("should update only x if y is null", function() {
            movable.x = 5;
            movable.y = 10;

            movable.moveTo(15, null);

            expect(movable.x).toBe(15);
            expect(movable.y).toBe(10);
        });

        it("should update only y if x is null", function() {
            movable.x = 5;
            movable.y = 10;

            movable.moveTo(null, 20);

            expect(movable.x).toBe(5);
            expect(movable.y).toBe(20);
        });
    });

    describe("Task Management", function() {
        it("should return false for isBusy when no task is running", function() {
            expect(movable.isBusy()).toBe(false);
        });

        it("should return true for isBusy when a task is running", function() {
            movable.currentTask = function() {};
            expect(movable.isBusy()).toBe(true);
        });

        it("should throw an exception when makeSureNotBusy is called while busy", function() {
            movable.currentTask = function() {};

            expect(function() {
                movable.makeSureNotBusy();
            }).toThrow();
        });

        it("should not throw when makeSureNotBusy is called while not busy", function() {
            expect(function() {
                movable.makeSureNotBusy();
            }).not.toThrow();
        });

        it("should execute the callback after wait time completes", function() {
            jasmine.clock().install();

            var callback = jasmine.createSpy('waitCallback');
            movable.wait(1000, callback);

            // Task should be set
            expect(movable.isBusy()).toBe(true);

            // Simulate time passing via update
            movable.update(500);
            expect(callback).not.toHaveBeenCalled();
            expect(movable.isBusy()).toBe(true);

            // Complete the wait
            movable.update(600);
            expect(callback).toHaveBeenCalled();
            expect(movable.isBusy()).toBe(false);

            jasmine.clock().uninstall();
        });
    });

    describe("Movement Over Time", function() {
        it("should gradually move from start to end position", function() {
            var callback = jasmine.createSpy('moveCallback');
            movable.x = 0;
            movable.y = 0;

            // Start a move over 1000ms
            movable.moveToOverTime(100, 100, 1000, undefined, callback);

            // After 250ms (25%)
            movable.update(250);
            expect(movable.x).toBeCloseTo(19.3, 0);
            expect(movable.y).toBeCloseTo(19.3, 0);
            expect(callback).not.toHaveBeenCalled();

            // After another 250ms (50% total)
            movable.update(250);
            expect(movable.x).toBeCloseTo(50, 0);
            expect(movable.y).toBeCloseTo(50, 0);
            expect(callback).not.toHaveBeenCalled();

            // After another 500ms (100% total) - should be at final position
            movable.update(500);
            expect(movable.x).toBe(100);
            expect(movable.y).toBe(100);
            expect(callback).toHaveBeenCalled();
            expect(movable.isBusy()).toBe(false);
        });

        it("should use provided interpolator function", function() {
            // Custom interpolator that always returns halfway value
            var customInterpolator = function(a, b, f) {
                return a + ((b - a) / 2);
            };

            movable.x = 0;
            movable.y = 0;

            // Start a move over 1000ms with custom interpolator
            movable.moveToOverTime(100, 100, 1000, customInterpolator);

            // After any update time, should always be at 50% position due to our custom interpolator
            movable.update(250);
            expect(movable.x).toBe(50);
            expect(movable.y).toBe(50);

            // Even after more time, should still be at 50%
            movable.update(250);
            expect(movable.x).toBe(50);
            expect(movable.y).toBe(50);
        });
    });

    describe("Parent/Child Relationships", function() {
        it("should calculate world position correctly with parent relationship", function() {
            var parent = new Movable();
            parent.x = 50;
            parent.y = 30;

            movable.x = 10;
            movable.y = 20;
            movable.parent = parent;

            var pos = [0, 0];
            movable.getWorldPosition(pos);

            expect(pos[0]).toBe(60);  // 50 + 10
            expect(pos[1]).toBe(50);  // 30 + 20
        });

        it("should adjust position to maintain world coordinates when parent changes", function() {
            var parent = new Movable();
            parent.x = 50;
            parent.y = 30;

            movable.x = 10;
            movable.y = 20;

            // Initial world position is just its local coordinates
            var posBeforeParent = [0, 0];
            movable.getWorldPosition(posBeforeParent);
            expect(posBeforeParent[0]).toBe(10);
            expect(posBeforeParent[1]).toBe(20);

            // Set parent
            movable.setParent(parent);

            // Local coordinates adjust to maintain the same position in the world
            expect(movable.x).toBe(-40);
            expect(movable.y).toBe(-10);

            // World position should be the same
            var posAfterParent = [0, 0];
            movable.getWorldPosition(posAfterParent);
            expect(posAfterParent[0]).toBe(10);
            expect(posAfterParent[1]).toBe(20);
        });
    });
});
