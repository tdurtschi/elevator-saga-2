// @ts-check
import { test, expect } from '@playwright/test';

const WINNING_PROGRAM = `
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
    update: function(dt, elevators, floors) {}
})
`;

test.describe('feedback rendering', () => {
    test('success feedback has a title and message', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        for (let i = 0; i < 6; i++) {
            await page.locator('.timescale_increase').click();
        }

        const editor = page.locator('.monaco-editor .view-line').nth(0);
        await editor.click();
        await page.keyboard.press('Home');
        for (let i = 0; i < 20; i++) await page.keyboard.press('Shift+ArrowDown');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(WINNING_PROGRAM);
        for (let i = 0; i < 20; i++) await page.keyboard.press('Shift+ArrowDown');
        await page.keyboard.press('Backspace');

        await page.locator('#button_apply').click();

        const feedback = page.locator('.feedbackcontainer .feedback');
        await expect(feedback).toBeVisible({ timeout: 30000 });
        await expect(feedback.locator('h2')).toBeVisible();
        await expect(feedback.locator('p')).toBeVisible();
    });

    test('success feedback contains a next challenge link', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        for (let i = 0; i < 6; i++) {
            await page.locator('.timescale_increase').click();
        }

        const editor = page.locator('.monaco-editor .view-line').nth(0);
        await editor.click();
        await page.keyboard.press('Home');
        for (let i = 0; i < 20; i++) await page.keyboard.press('Shift+ArrowDown');
        await page.keyboard.press('Backspace');
        await page.keyboard.type(WINNING_PROGRAM);
        for (let i = 0; i < 20; i++) await page.keyboard.press('Shift+ArrowDown');
        await page.keyboard.press('Backspace');

        await page.locator('#button_apply').click();

        const feedback = page.locator('.feedbackcontainer .feedback');
        await expect(feedback).toBeVisible({ timeout: 30000 });
        await expect(feedback.locator('a')).toBeVisible();
    });
});
