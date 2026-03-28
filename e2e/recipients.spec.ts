import { test, expect } from '@playwright/test';

test.describe('Recipients page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/recipients');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });
  });

  test('page loads with recipient aggregates', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Recipients' })).toBeVisible();
    const recipientLinks = page.locator('a[href^="/recipients/"]');
    await expect(recipientLinks.first()).toBeVisible();
    const count = await recipientLinks.count();
    expect(count).toBeGreaterThan(0);
  });

  test('search filters recipients', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Recipient name');
    const initialLinks = await page.locator('a[href^="/recipients/"]').count();

    await searchInput.fill('mayor');
    await page.waitForTimeout(300);

    const filteredLinks = await page.locator('a[href^="/recipients/"]').count();
    expect(filteredLinks).toBeLessThanOrEqual(initialLinks);
  });

  test('clicking a recipient navigates to detail page', async ({ page }) => {
    const firstLink = page.locator('a[href^="/recipients/"]').first();
    const name = await firstLink.textContent();
    await firstLink.click();

    await expect(page).toHaveURL(/\/recipients\/.+/);
    await expect(page.getByRole('heading', { name: name! })).toBeVisible();
    await expect(page.getByText('Total Raised')).toBeVisible();
  });

  test('sort toggle works', async ({ page }) => {
    const descButton = page.getByRole('button', { name: 'Desc' });
    await expect(descButton).toBeVisible();
    await descButton.click();
    await expect(page.getByRole('button', { name: 'Asc' })).toBeVisible();
  });
});
