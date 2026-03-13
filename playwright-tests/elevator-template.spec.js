// @ts-check
import { test, expect } from '@playwright/test';

test.describe('elevator rendering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');
    });

    test('renders the correct number of elevators for challenge 1', async ({ page }) => {
        await expect(page.locator('.innerworld .elevator')).toHaveCount(1);
    });

    test('elevator has up and down direction indicators', async ({ page }) => {
        const elevator = page.locator('.innerworld .elevator').first();
        await expect(elevator.locator('.directionindicatorup')).toBeAttached();
        await expect(elevator.locator('.directionindicatordown')).toBeAttached();
    });

    test('elevator has a floor indicator', async ({ page }) => {
        const elevator = page.locator('.innerworld .elevator').first();
        await expect(elevator.locator('.floorindicator')).toBeAttached();
    });

    test('elevator has a button indicator', async ({ page }) => {
        const elevator = page.locator('.innerworld .elevator').first();
        await expect(elevator.locator('.buttonindicator')).toBeAttached();
    });
});
