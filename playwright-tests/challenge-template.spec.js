// @ts-check
import { test, expect } from '@playwright/test';

test.describe('challenge rendering', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('http://localhost:3000/');
    });

    test('renders the challenge number and description', async ({ page }) => {
        await expect(page.locator('.challenge h3').first()).toContainText('Challenge #1');
    });

    test('renders a start/pause button', async ({ page }) => {
        await expect(page.locator('.challenge .startstop')).toBeVisible();
    });

    test('renders timescale increase and decrease controls', async ({ page }) => {
        await expect(page.locator('.challenge .timescale_increase')).toBeVisible();
        await expect(page.locator('.challenge .timescale_decrease')).toBeVisible();
    });

    test('renders current timescale value', async ({ page }) => {
        await expect(page.locator('.challenge h3.right .emphasis-color')).toContainText('x');
    });
});
