import { test, expect } from '@playwright/test';

test.describe('Overview page data integrity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for data to load
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });
  });

  test('stat cards render real numeric values', async ({ page }) => {
    // Total Volume should be a currency value
    const totalVolume = page.locator('text=Total Volume').locator('..').locator('h4');
    await expect(totalVolume).toBeVisible();
    const totalText = await totalVolume.textContent();
    expect(totalText).toMatch(/^\$[\d,]+$/);

    // Contributions count should be a positive number
    const contributions = page.locator('text=Contributions').first().locator('..').locator('h4');
    await expect(contributions).toBeVisible();
    const contribText = await contributions.textContent();
    expect(Number(contribText!.replace(/,/g, ''))).toBeGreaterThan(0);
  });

  test('top recipients table has rows', async ({ page }) => {
    await expect(page.getByText('Top Recipients')).toBeVisible();
    // Should have at least 1 recipient link
    const recipientLinks = page.locator('a[href^="/recipients/"]');
    await expect(recipientLinks.first()).toBeVisible();
    const count = await recipientLinks.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(5);
  });

  test('top employers section has entries', async ({ page }) => {
    await expect(page.getByText('Top Employers')).toBeVisible();
    const employerLinks = page.locator('a[href^="/employers/"]');
    await expect(employerLinks.first()).toBeVisible();
  });

  test('recipient links navigate correctly', async ({ page }) => {
    const firstRecipient = page.locator('a[href^="/recipients/"]').first();
    const name = await firstRecipient.textContent();
    await firstRecipient.click();
    await expect(page).toHaveURL(/\/recipients\/.+/);
    await expect(page.getByRole('heading', { name: name! })).toBeVisible();
  });
});
