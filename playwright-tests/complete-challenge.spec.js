// @ts-check
import { test, expect } from '@playwright/test';

const PROGRAM = `
({
    init: function(elevators, floors) {
        var rotator = 0;
        _.each(floors, function(floor) {
            floor.on("up_button_pressed down_button_pressed", function() {
                var elevator = elevators[(rotator++) % elevators.length];
                elevator.goToFloor(floor.level);
            }); 
        });
        _.each(elevators, function(elevator) {
            elevator.on("floor_button_pressed", function(floorNum) {
                elevator.goToFloor(floorNum);
            });
            elevator.on("idle", function() {
                elevator.goToFloor(0);
            });
        });
    },
        update: function(dt, elevators, floors) {
        }
})
`;

const typeProgram = async (page, program) => {
    let monacoEditor = page.locator(".monaco-editor .view-line").nth(0);
    await monacoEditor.click();
    await page.keyboard.press("Home");
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Shift+ArrowDown")
    }
    await page.keyboard.press("Backspace");

    await page.keyboard.type(program);

    // Cleans up auto-added brackets and parens
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press("Shift+ArrowDown")
    }
    await page.keyboard.press("Backspace");
}

test('Completes the challenge', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await expect(page).toHaveTitle(/Elevator Saga/);

    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();

    await typeProgram(page, PROGRAM);

    await page.locator('#button_apply').click();

    await expect(page.locator('.feedback')).toHaveText(/Success!/i);
});

test('Changing the challenge resets the game state', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await typeProgram(page, PROGRAM);

    await page.locator('#button_apply').click();

    await page.waitForTimeout(1000);
    const elapsedTime = await page.locator('.value.elapsedtime').textContent();
    expect(elapsedTime).not.toEqual("0s");

    await page.goto('http://localhost:3000/#challenge=2');
    const newElapsedTime = await page.locator('.value.elapsedtime').textContent();
    expect(newElapsedTime).toEqual("0s");
})