// @ts-check
import { test, expect } from '@playwright/test';

test.describe('floor rendering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');
    });

    test('renders the correct number of floors for challenge 1', async ({ page }) => {
        const floors = page.locator('.innerworld .floor');
        await expect(floors).toHaveCount(3);
    });

    test('each floor has a floor number and button indicator', async ({ page }) => {
        const floors = page.locator('.innerworld .floor');
        for (let i = 0; i < await floors.count(); i++) {
            const floor = floors.nth(i);
            await expect(floor.locator('.floornumber')).toBeVisible();
            await expect(floor.locator('.buttonindicator')).toBeVisible();
        }
    });

    test('each floor has up and down buttons', async ({ page }) => {
        const floors = page.locator('.innerworld .floor');
        for (let i = 0; i < await floors.count(); i++) {
            const floor = floors.nth(i);
            await expect(floor.locator('.buttonindicator .up')).toBeAttached();
            await expect(floor.locator('.buttonindicator .down')).toBeAttached();
        }
    });

    test('bottom floor has no down button visible', async ({ page }) => {
        const bottomFloor = page.locator('.innerworld .floor').first();
        await expect(bottomFloor.locator('.down')).toHaveClass(/invisible/);
    });

    test('top floor has no up button visible', async ({ page }) => {
        const topFloor = page.locator('.innerworld .floor').last();
        await expect(topFloor.locator('.up')).toHaveClass(/invisible/);
    });
});
