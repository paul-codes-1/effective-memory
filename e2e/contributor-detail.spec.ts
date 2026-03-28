import { test, expect } from '@playwright/test';

test.describe('Contributor detail page', () => {
  test('navigating from list to detail shows contributor data', async ({ page }) => {
    await page.goto('/contributors');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    // Click the first contributor link
    const firstLink = page.locator('a[href^="/contributors/"]').first();
    const contributorName = await firstLink.textContent();
    await firstLink.click();

    // Should be on a detail page
    await expect(page).toHaveURL(/\/contributors\/.+/);

    // Contributor name should be displayed
    await expect(page.getByRole('heading', { name: contributorName! })).toBeVisible();

    // Stat cards should be present
    await expect(page.getByText('Total Contributed')).toBeVisible();
    await expect(page.getByRole('main').getByText('Recipients', { exact: true })).toBeVisible();
  });

  test('back link navigates to contributors list', async ({ page }) => {
    await page.goto('/contributors');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    const firstLink = page.locator('a[href^="/contributors/"]').first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/contributors\/.+/);

    await page.getByText('Back to contributors').click();
    await expect(page).toHaveURL('/contributors');
  });

  test('contribution history table has entries', async ({ page }) => {
    await page.goto('/contributors');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    const firstLink = page.locator('a[href^="/contributors/"]').first();
    await firstLink.click();

    await expect(page.getByText('Contribution History')).toBeVisible();
    // The entries chip should show a count
    const entriesChip = page.locator('text=/\\d+ entr/');
    await expect(entriesChip).toBeVisible();
  });
});
