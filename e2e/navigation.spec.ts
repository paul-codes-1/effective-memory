import { test, expect } from '@playwright/test';

test.describe('Route navigation and redirects', () => {
  test('/ loads the LFUCG overview page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Total Volume')).toBeVisible();
    await expect(page.getByText('2026 LFUCG Primary Election')).toBeVisible();
  });

  test('/contributors loads the LFUCG contributors page', async ({ page }) => {
    await page.goto('/contributors');
    await expect(page.getByRole('heading', { name: 'Contributors' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Totals' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Records' })).toBeVisible();
  });

  test('/recipients loads the LFUCG recipients page', async ({ page }) => {
    await page.goto('/recipients');
    await expect(page.getByRole('heading', { name: 'Recipients' })).toBeVisible();
  });

  test('/archive loads the historical overview page', async ({ page }) => {
    await page.goto('/archive');
    await expect(page.getByText('ARCHIVED')).toBeVisible();
  });

  test('/archive/contributors loads the historical contributors page', async ({ page }) => {
    await page.goto('/archive/contributors');
    await expect(page.getByText('ARCHIVED')).toBeVisible();
  });

  test('/lfucg redirects to /', async ({ page }) => {
    await page.goto('/lfucg');
    await page.waitForURL('/');
    await expect(page.getByText('Total Volume')).toBeVisible();
  });

  test('/lfucg/contributors redirects to /contributors', async ({ page }) => {
    await page.goto('/lfucg/contributors');
    await page.waitForURL('/contributors');
    await expect(page.getByRole('heading', { name: 'Contributors' })).toBeVisible();
  });

  test('/nonexistent redirects to /', async ({ page }) => {
    await page.goto('/nonexistent');
    await page.waitForURL('/');
  });
});
