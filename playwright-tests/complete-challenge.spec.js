// @ts-check
import { test, expect } from '@playwright/test';

let macOS = process.platform === 'darwin' //darwin is macOS
let modifier = macOS ? 'Meta' : 'Control';

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

test('Completes the challenge', async ({ page }) => {
    await page.goto('http://localhost:3000/');

    await expect(page).toHaveTitle(/Elevator Saga/);

    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();
    await page.locator('.timescale_increase').click();

    const monacoEditor = page.locator(".monaco-editor").nth(0);
    await monacoEditor.click();
    await page.keyboard.press("Meta+KeyA")
    await page.keyboard.type(PROGRAM);

    await page.locator('#button_apply').click();

    await expect(page.locator('.feedback')).toHaveText(/Success!/i);
});
