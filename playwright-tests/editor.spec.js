// @ts-check
import { test, expect } from '@playwright/test';

// Wait for Monaco and the app to be fully initialized
const waitForApp = async (page) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.innerworld .floor').first()).toBeVisible();
};

const openEditorPanel = async (page) =>
    page.locator('#editor-toggle').click();

const setEditorCode = (page, code) =>
    page.evaluate((c) => monaco.editor.getModels()[0].setValue(c), code);

const getEditorCode = (page) =>
    page.evaluate(() => monaco.editor.getModels()[0].getValue());

test.describe('editor panel', () => {
    test('editor panel is hidden by default', async ({ page }) => {
        await waitForApp(page);
        await expect(page.locator('#editor-panel')).not.toBeVisible();
    });

    test('clicking the editor toggle shows the editor', async ({ page }) => {
        await waitForApp(page);
        await page.locator('#editor-toggle').click();
        await expect(page.locator('#editor-panel')).toBeVisible();
    });
});

test.describe('editor behavior', () => {
    test('applying invalid JS shows an error in the terminal', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        await setEditorCode(page, 'this is not valid javascript {{{');
        await page.locator('#button_apply').click();

        await expect(page.locator('#terminal-output')).toContainText(/error/i);
    });

    test('code persists across page reload', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        const customCode = 'export const init = function() { /* custom */ };\nexport const update = function() {};\n';
        await setEditorCode(page, customCode);

        // Wait for autosave debounce (1s) then reload
        await page.waitForTimeout(1500);
        await page.reload({ waitUntil: 'domcontentloaded' });
        await expect(page.locator('.innerworld .floor').first()).toBeVisible();

        const savedCode = await getEditorCode(page);
        expect(savedCode).toBe(customCode);
    });

    test('Ctrl+S saves code without opening browser dialog', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        // Clear the save message so we can detect a fresh save
        await page.evaluate(() => document.getElementById('save_message').textContent = '');

        await page.locator('#editor .monaco-editor').click();
        await page.keyboard.press('Control+s');

        // Should save immediately (not via the 1s autosave debounce)
        await expect(page.locator('#save_message')).toContainText('Code saved', { timeout: 300 });
    });

    test('pressing Enter after typing does not apply autocomplete suggestion', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        const initialCode = `({
  init: function(elevators, floors) {
    var elevator = elevators[0];

  },
  update: function(dt, elevators, floors) {}
})`;
        await setEditorCode(page, initialCode);

        // Position cursor on line 5 (empty line inside init) and focus editor
        await page.evaluate(() => {
            const editor = window.monaco.editor.getEditors()[0];
            editor.setPosition({ lineNumber: 5, column: 1 });
            editor.focus();
        });

        await page.keyboard.type('elevator.goToFloor(0);', { delay: 50 });

        // Wait for Monaco autocomplete suggestion to appear
        await expect(page.locator('.monaco-editor .suggest-widget')).toBeVisible({ timeout: 3000 }).catch(() => {});

        // Enter should insert a newline, not apply an autocomplete suggestion
        await page.keyboard.press('Enter');

        const code = await getEditorCode(page);
        expect(code).toContain('elevator.goToFloor(0);');
        expect(code).not.toContain('elevator.checkDestinationQueue');
    });

    test('suggest widget filters as user types', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        await page.evaluate(() => {
            const editor = window.monaco.editor.getEditors()[0];
            editor.setModel(monaco.editor.getModels().find(m => m.getLanguageId() === 'javascript'));
            editor.setValue('');
            editor.setPosition({ lineNumber: 1, column: 1 });
            editor.focus();
        });

        await page.keyboard.type('con', { delay: 50 });
        await expect(page.locator('.monaco-editor .suggest-widget')).toBeVisible({ timeout: 3000 });

        await page.keyboard.type('st', { delay: 50 });

        const rows = page.locator('.monaco-editor .suggest-widget .monaco-list-row');
        await expect(rows.first()).toContainText('const', { timeout: 2000 });
    });

    test('Cmd+Enter applies code and restarts the simulation', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        await page.evaluate(() => document.getElementById('save_message').textContent = '');

        await page.locator('#editor .monaco-editor').click();
        await page.keyboard.press('Control+Enter');

        await expect(page.locator('#save_message')).toContainText('Code saved', { timeout: 300 });
        // Simulation restarts — world re-renders floors
        await expect(page.locator('.innerworld .floor').first()).toBeVisible();
    });

    test('reset button restores the default implementation', async ({ page }) => {
        await waitForApp(page);
        await openEditorPanel(page);

        await setEditorCode(page, '({ init: function() {}, update: function() {} })');

        page.on('dialog', dialog => dialog.accept());
        await page.locator('#button_reset').click();

        const code = await getEditorCode(page);
        expect(code).toContain('elevator.goToFloor(0)');
    });
});
