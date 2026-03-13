// @ts-check
import { test, expect } from '@playwright/test';

const PROGRAM = `({
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
    update: function(dt, elevators, floors) {}
})`;

const waitForApp = async (page) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#editor .monaco-editor').first()).toBeVisible();
    await expect(page.locator('.innerworld .floor').first()).toBeVisible();
};

const setEditorCode = (page, code) =>
    page.evaluate((c) => monaco.editor.getModels()[0].setValue(c), code);

test('Completes the challenge', async ({ page }) => {
    await waitForApp(page);

    await expect(page).toHaveTitle(/Elevator Saga/);

    for (let i = 0; i < 6; i++) {
        await page.locator('.timescale_increase').click();
    }

    await setEditorCode(page, PROGRAM);
    await page.locator('#button_apply').click();

    await expect(page.locator('.feedback')).toHaveText(/Success!/i, { timeout: 15000 });
});

test('Changing the challenge resets the game state', async ({ page }) => {
    await waitForApp(page);

    await setEditorCode(page, PROGRAM);
    await page.locator('#button_apply').click();

    await page.waitForTimeout(1000);
    const elapsedTime = await page.locator('.value.elapsedtime').textContent();
    expect(elapsedTime).not.toEqual("0s");

    await page.goto('http://localhost:3000/#challenge=2');
    const newElapsedTime = await page.locator('.value.elapsedtime').textContent();
    expect(newElapsedTime).toEqual("0s");
});
