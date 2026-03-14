// @ts-check
import { test, expect } from '@playwright/test';

const waitForApp = async (page) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#editor .monaco-editor').first()).toBeVisible();
    await expect(page.locator('.innerworld .floor').first()).toBeVisible();
    // startChallenge logs "Starting challenge" on load — wait for it
    await expect(page.locator('#terminal-output')).not.toBeEmpty();
};

test.describe('terminal', () => {
    test('clear button empties the terminal', async ({ page }) => {
        await waitForApp(page);
        await page.locator('.clear-log').click();
        await expect(page.locator('#terminal-output')).toBeEmpty();
    });

    test('copy button writes terminal contents to clipboard', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-read', 'clipboard-write']);
        await waitForApp(page);

        // Terminal already has stable content ("Starting challenge") from initial load
        const terminalText = await page.locator('#terminal-output').innerText();
        await page.locator('.copy-log').click();

        const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
        expect(clipboardText.trim()).toBe(terminalText.trim());
    });
});
