// @ts-check
import { test, expect } from '@playwright/test';

test.describe('user rendering', () => {
    test('users appear in the world after simulation starts', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        for (let i = 0; i < 4; i++) {
            await page.locator('.timescale_increase').click();
        }

        await page.locator('#button_apply').click();

        await expect(page.locator('.innerworld .user').first()).toBeVisible({ timeout: 10000 });
    });

    test('user element has movable and fa classes', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        for (let i = 0; i < 4; i++) {
            await page.locator('.timescale_increase').click();
        }

        await page.locator('#button_apply').click();

        const user = page.locator('.innerworld .user').first();
        await expect(user).toBeVisible({ timeout: 10000 });
        await expect(user).toHaveClass(/movable/);
        await expect(user).toHaveClass(/fa/);
    });
});
