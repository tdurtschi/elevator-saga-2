// @ts-check
import { test, expect } from '@playwright/test';

const PROGRAM = `
export const init = function(elevators, floors) {
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
};
export const update = function(dt, elevators, floors) {};
`;

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

test('Next challenge link advances to challenge 2', async ({ page }) => {
    await waitForApp(page);

    for (let i = 0; i < 6; i++) await page.locator('.timescale_increase').click();
    await setEditorCode(page, PROGRAM);
    await page.locator('#button_apply').click();
    await expect(page.locator('.feedback')).toHaveText(/Success!/i, { timeout: 15000 });

    await page.locator('.feedback a').click();

    await expect(page.locator('.challenge h3').first()).toContainText('Challenge #2');
    await expect(page.locator('.feedbackcontainer')).toBeEmpty();
    await expect(page.locator('.startstop')).toHaveText('Start');
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

test.describe('in-page challenge switching (hash change, no reload)', () => {
    const switchToChallenge = (page, n) =>
        page.evaluate((n) => { window.location.hash = `#challenge=${n}`; }, n);

    test('start button resets to "Start" when switching mid-run', async ({ page }) => {
        await waitForApp(page);

        // Start the sim — button should flip to Pause
        await page.locator('.startstop').click();
        await expect(page.locator('.startstop')).toHaveText('Pause');

        // Switch challenge without a full page reload
        await switchToChallenge(page, 2);
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #2');

        // Button must reset to Start — not remain as Pause
        await expect(page.locator('.startstop')).toHaveText('Start');
    });

    test('elapsed time resets to 0s when switching mid-run', async ({ page }) => {
        await waitForApp(page);

        await setEditorCode(page, PROGRAM);
        await page.locator('#button_apply').click();
        await page.waitForTimeout(1000);
        expect(await page.locator('.value.elapsedtime').textContent()).not.toEqual('0s');

        await switchToChallenge(page, 2);
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #2');
        await expect(page.locator('.value.elapsedtime')).toHaveText('0s');
    });

    test('feedback is cleared when switching challenge after success', async ({ page }) => {
        await waitForApp(page);

        for (let i = 0; i < 6; i++) await page.locator('.timescale_increase').click();
        await setEditorCode(page, PROGRAM);
        await page.locator('#button_apply').click();
        await expect(page.locator('.feedback')).toHaveText(/Success!/i, { timeout: 15000 });

        await switchToChallenge(page, 2);
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #2');
        await expect(page.locator('.feedbackcontainer')).toBeEmpty();
        await expect(page.locator('.startstop')).toHaveText('Start');
    });

    test('timescale listener does not accumulate across challenge switches', async ({ page }) => {
        await waitForApp(page);

        // Switch challenges multiple times
        await switchToChallenge(page, 2);
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #2');
        await switchToChallenge(page, 3);
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #3');

        // Changing timescale should re-render the bar exactly once
        // (if listeners accumulate, the challenge bar gets re-rendered multiple times
        // but the last write wins, so the number will still be correct — we detect
        // accumulation by counting how many timescale_changed callbacks fire)
        const callCount = await page.evaluate(() => {
            let _count = 0;
            const _orig = window.__timescaleCallCount = 0;
            // Patch: count renders by observing challenge bar replacements
            const bar = document.querySelector('.challenge');
            const observer = new MutationObserver(() => { window.__timescaleCallCount++; });
            observer.observe(bar, { childList: true });
            return new Promise(resolve => {
                document.querySelector('.timescale_increase').click();
                setTimeout(() => { observer.disconnect(); resolve(window.__timescaleCallCount); }, 100);
            });
        });
        // Should be exactly 1 re-render, not 3 (one per challenge switch)
        expect(callCount).toBe(1);
    });
});
