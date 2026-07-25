// @ts-check
import { test, expect } from '@playwright/test';

test.describe('passenger rendering', () => {
    test('passengers appear in the world after simulation starts', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        for (let i = 0; i < 4; i++) {
            await page.locator('.timescale_increase').click();
        }

        await page.locator('#button_apply').click();

        await expect(page.locator('.innerworld .passenger').first()).toBeVisible({ timeout: 10000 });
    });

    test('passenger element has movable and fa classes', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        for (let i = 0; i < 4; i++) {
            await page.locator('.timescale_increase').click();
        }

        await page.locator('#button_apply').click();

        const passenger = page.locator('.innerworld .passenger').first();
        await expect(passenger).toBeVisible({ timeout: 10000 });
        await expect(passenger).toHaveClass(/movable/);
        await expect(passenger).toHaveClass(/fa/);
    });
});
