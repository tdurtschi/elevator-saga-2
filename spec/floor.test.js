import asFloor from "../src/simulation/floor.js";

describe("Floor", function () {
    let floor;
    let errorHandler;

    beforeEach(function () {
        errorHandler = jasmine.createSpy("errorHandler");
        floor = asFloor({}, 1, 100, errorHandler);
    });

    describe("isButtonActivated", function () {
        it("returns false for 'up' when no button has been pressed", function () {
            expect(floor.isButtonActivated("up")).toBe(false);
        });

        it("returns false for 'down' when no button has been pressed", function () {
            expect(floor.isButtonActivated("down")).toBe(false);
        });

        it("returns true for 'up' after pressUpButton is called", function () {
            floor.pressUpButton();
            expect(floor.isButtonActivated("up")).toBe(true);
        });

        it("returns true for 'down' after pressDownButton is called", function () {
            floor.pressDownButton();
            expect(floor.isButtonActivated("down")).toBe(true);
        });

        it("returns false for 'up' after button is cleared by elevator arrival", function () {
            floor.pressUpButton();
            floor.elevatorAvailable({ goingUpIndicator: true, goingDownIndicator: false });
            expect(floor.isButtonActivated("up")).toBe(false);
        });

        it("returns false for 'down' after button is cleared by elevator arrival", function () {
            floor.pressDownButton();
            floor.elevatorAvailable({ goingUpIndicator: false, goingDownIndicator: true });
            expect(floor.isButtonActivated("down")).toBe(false);
        });
    });
});
