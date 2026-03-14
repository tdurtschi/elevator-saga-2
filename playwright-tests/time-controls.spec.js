// @ts-check
import { test, expect } from '@playwright/test';

const waitForApp = async (page) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#editor .monaco-editor').first()).toBeVisible();
    await expect(page.locator('.innerworld .floor').first()).toBeVisible();
};

const getElapsedTime = (page) =>
    page.locator('.value.elapsedtime').textContent();

test.describe('pause / resume', () => {
    test('button shows "Start" on initial load', async ({ page }) => {
        await waitForApp(page);
        await expect(page.locator('.startstop')).toHaveText('Start');
    });

    test('clicking Start runs the sim and flips button to "Pause"', async ({ page }) => {
        await waitForApp(page);
        await page.locator('.startstop').click();
        await expect(page.locator('.startstop')).toHaveText('Pause');

        await page.waitForTimeout(500);
        expect(await getElapsedTime(page)).not.toBe('0s');
    });

    test('clicking Pause stops the sim and flips button back to "Start"', async ({ page }) => {
        await waitForApp(page);

        await page.locator('.startstop').click();
        await expect(page.locator('.startstop')).toHaveText('Pause');
        await page.waitForTimeout(300);

        await page.locator('.startstop').click();
        await expect(page.locator('.startstop')).toHaveText('Start');

        const frozenTime = await getElapsedTime(page);
        await page.waitForTimeout(500);
        expect(await getElapsedTime(page)).toBe(frozenTime);
    });

    test('clicking Start again after pausing resumes the sim', async ({ page }) => {
        await waitForApp(page);

        // Start → pause
        await page.locator('.startstop').click();
        await page.waitForTimeout(300);
        await page.locator('.startstop').click();
        await expect(page.locator('.startstop')).toHaveText('Start');

        const frozenTime = await getElapsedTime(page);

        // Resume
        await page.locator('.startstop').click();
        await expect(page.locator('.startstop')).toHaveText('Pause');
        await page.waitForTimeout(500);

        const resumedTime = await getElapsedTime(page);
        expect(resumedTime).not.toBe(frozenTime);
    });
});

const getTimescaleDisplay = (page) =>
    page.locator('.challenge h3.right .emphasis-color').textContent();

test.describe('time scale controls', () => {
    test('timescale increase button raises the displayed multiplier', async ({ page }) => {
        await waitForApp(page);

        const before = await getTimescaleDisplay(page);
        await page.locator('.timescale_increase').click();
        const after = await getTimescaleDisplay(page);

        expect(parseInt(after)).toBeGreaterThan(parseInt(before));
    });

    test('timescale decrease button lowers the displayed multiplier', async ({ page }) => {
        await waitForApp(page);

        // Increase first so we have room to decrease
        await page.locator('.timescale_increase').click();
        const before = await getTimescaleDisplay(page);
        await page.locator('.timescale_decrease').click();
        const after = await getTimescaleDisplay(page);

        expect(parseInt(after)).toBeLessThan(parseInt(before));
    });

    test('higher timescale makes elapsed time advance faster', async ({ page }) => {
        await waitForApp(page);

        // Run at 1x for 400ms, record elapsed sim time
        await page.locator('.startstop').click();
        await page.waitForTimeout(400);
        await page.locator('.startstop').click();
        const lowTime = parseInt(await getElapsedTime(page));

        // Restart at max speed
        await page.goto('http://localhost:3000/');
        await expect(page.locator('.innerworld .floor').first()).toBeVisible();
        for (let i = 0; i < 6; i++) await page.locator('.timescale_increase').click();
        await page.locator('.startstop').click();
        await page.waitForTimeout(400);
        await page.locator('.startstop').click();
        const highTime = parseInt(await getElapsedTime(page));

        expect(highTime).toBeGreaterThan(lowTime);
    });
});
