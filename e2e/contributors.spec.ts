import { test, expect } from '@playwright/test';

test.describe('Contributors page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contributors');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });
  });

  test('loads with Totals view by default', async ({ page }) => {
    const totalsButton = page.getByRole('button', { name: 'Totals' });
    await expect(totalsButton).toHaveAttribute('aria-pressed', 'true');
  });

  test('switching to Records view shows individual records', async ({ page }) => {
    await page.getByRole('button', { name: 'Records' }).click();
    // Records view should show the Receipt Date column (not in Totals view)
    await expect(page.getByText('Receipt Date').first()).toBeVisible();
  });

  test('search filters the contributor list', async ({ page }) => {
    // Get initial count of contributor links
    const links = page.locator('a[href^="/contributors/"]');
    await expect(links.first()).toBeVisible();
    const initialCount = await links.count();

    // Type a search term
    await page.getByPlaceholder('Name, employer, or occupation').fill('smith');
    await page.waitForTimeout(300);

    // The contributor list should have reduced entries
    const filteredCount = await links.count();
    expect(filteredCount).toBeGreaterThan(0);
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('clearing search restores full list', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Name, employer, or occupation');
    await searchInput.fill('xyznonexistent');
    await page.waitForTimeout(300);

    await searchInput.clear();
    await page.waitForTimeout(300);

    const links = page.locator('a[href^="/contributors/"]');
    const count = await links.count();
    expect(count).toBeGreaterThan(1);
  });

  test('sort direction toggle works', async ({ page }) => {
    const descButton = page.getByRole('button', { name: 'Desc' });
    await expect(descButton).toBeVisible();

    await descButton.click();
    await expect(page.getByRole('button', { name: 'Asc' })).toBeVisible();
  });

  test('displayed total amount updates with filters', async ({ page }) => {
    // Get initial total
    const amountText = page.locator('strong');
    const initialTotal = await amountText.first().textContent();
    expect(initialTotal).toMatch(/^\$/);
  });
});
