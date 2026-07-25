// @ts-check
import { test, expect } from '@playwright/test';

// The editor (and its Apply button) lives inside a collapsible panel that is
// hidden by default, so the panel must be opened before applying code.
const applyDefaultCode = async (page) => {
    await page.goto('http://localhost:3000/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.innerworld .floor').first()).toBeVisible();

    for (let i = 0; i < 4; i++) {
        await page.locator('.timescale_increase').click();
    }

    await page.locator('#editor-toggle').click();
    await page.locator('#button_apply').click();
};

test.describe('passenger rendering', () => {
    test('passengers appear in the world after simulation starts', async ({ page }) => {
        await applyDefaultCode(page);

        await expect(page.locator('.innerworld .passenger').first()).toBeVisible({ timeout: 10000 });
    });

    test('passenger element has movable and fa classes', async ({ page }) => {
        await applyDefaultCode(page);

        const passenger = page.locator('.innerworld .passenger').first();
        await expect(passenger).toBeVisible({ timeout: 10000 });
        await expect(passenger).toHaveClass(/movable/);
        await expect(passenger).toHaveClass(/fa/);
    });
});
