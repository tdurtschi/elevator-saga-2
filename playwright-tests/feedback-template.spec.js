// @ts-check
import { test, expect } from '@playwright/test';

const WINNING_PROGRAM = `({
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

const runWinningProgram = async (page) => {
    for (let i = 0; i < 6; i++) {
        await page.locator('.timescale_increase').click();
    }
    await setEditorCode(page, WINNING_PROGRAM);
    await page.locator('#button_apply').click();
};

test.describe('feedback rendering', () => {
    test('success feedback has a title and message', async ({ page }) => {
        await waitForApp(page);
        await runWinningProgram(page);

        const feedback = page.locator('.feedbackcontainer .feedback');
        await expect(feedback).toBeVisible({ timeout: 30000 });
        await expect(feedback.locator('h2')).toBeVisible();
        await expect(feedback.locator('p')).toBeVisible();
    });

    test('success feedback contains a next challenge link', async ({ page }) => {
        await waitForApp(page);
        await runWinningProgram(page);

        const feedback = page.locator('.feedbackcontainer .feedback');
        await expect(feedback).toBeVisible({ timeout: 30000 });
        await expect(feedback.locator('a')).toBeVisible();
    });
});
