// @ts-check
import { test, expect } from '@playwright/test';

// Wait for Monaco and the app to be fully initialized
const waitForApp = async (page) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#editor .monaco-editor').first()).toBeVisible();
    await expect(page.locator('.innerworld .floor').first()).toBeVisible();
};

const setEditorCode = (page, code) =>
    page.evaluate((c) => monaco.editor.getModels()[0].setValue(c), code);

const getEditorCode = (page) =>
    page.evaluate(() => monaco.editor.getModels()[0].getValue());

test.describe('editor behavior', () => {
    test('applying invalid JS shows an error in the terminal', async ({ page }) => {
        await waitForApp(page);

        await setEditorCode(page, 'this is not valid javascript {{{');
        await page.locator('#button_apply').click();

        await expect(page.locator('#terminal-output')).toContainText(/error/i);
    });

    test('code persists across page reload', async ({ page }) => {
        await waitForApp(page);

        const customCode = '({ init: function() { /* custom */ }, update: function() {} })';
        await setEditorCode(page, customCode);

        // Wait for autosave debounce (1s) then reload
        await page.waitForTimeout(1500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page.locator('#editor .monaco-editor').first()).toBeVisible();

        const savedCode = await getEditorCode(page);
        expect(savedCode).toBe(customCode);
    });

    test('reset button restores the default implementation', async ({ page }) => {
        await waitForApp(page);

        await setEditorCode(page, '({ init: function() {}, update: function() {} })');

        page.on('dialog', dialog => dialog.accept());
        await page.locator('#button_reset').click();

        const code = await getEditorCode(page);
        expect(code).toContain('elevator.goToFloor(0)');
    });
});
