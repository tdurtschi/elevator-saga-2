// @ts-check
import { test, expect } from '@playwright/test';

test('Page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await expect(page).toHaveTitle(/Elevator Saga/);
});

test('jasmine tests', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.getByRole('link', { name: 'Run tests' }).click();

  await expect(page.getByText(/0 failures/)).toBeVisible({timeout: 1000});
});
