// @ts-check
import { test, expect } from '@playwright/test';

test.describe('hash-based routing', () => {
    test('loads challenge 1 by default', async ({ page }) => {
        await page.goto('http://localhost:3000/');
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #1');
    });

    test('loads the correct challenge from the URL hash', async ({ page }) => {
        await page.goto('http://localhost:3000/#challenge=2');
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #2');
    });

    test('renders the correct number of floors for the challenge in the URL', async ({ page }) => {
        // Challenge 2 has 5 floors
        await page.goto('http://localhost:3000/#challenge=2');
        await expect(page.locator('.innerworld .floor')).toHaveCount(5);
    });
});
