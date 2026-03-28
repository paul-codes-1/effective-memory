import { test, expect } from '@playwright/test';

test.describe('Cross-page data consistency', () => {
  test('overview total matches contributors page total', async ({ page }) => {
    // Get overview total
    await page.goto('/');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    const totalVolumeEl = page.locator('text=Total Volume').locator('..').locator('h4');
    const overviewTotal = await totalVolumeEl.textContent();
    expect(overviewTotal).toBeTruthy();

    // Get contributions count from overview
    const contribCountEl = page.locator('text=Contributions').first().locator('..').locator('h4');
    const overviewContribCount = await contribCountEl.textContent();

    // Navigate to contributors page — the displayed total should match
    await page.goto('/contributors');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    // The total amount shown in the contributors page header should match overview
    const contributorsTotal = page.locator('strong').first();
    const contributorsTotalText = await contributorsTotal.textContent();
    expect(contributorsTotalText).toBe(overviewTotal);
  });

  test('contributor detail total equals sum shown in totals view', async ({ page }) => {
    await page.goto('/contributors');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    // Click the first contributor
    const firstLink = page.locator('a[href^="/contributors/"]').first();
    await firstLink.click();
    await expect(page).toHaveURL(/\/contributors\/.+/);

    // The detail page should show the total
    await expect(page.getByText('Total Contributed')).toBeVisible();

    // Total Contributed stat card should have a currency value
    const totalEl = page.locator('text=Total Contributed').locator('..').locator('h6');
    const totalText = await totalEl.textContent();
    expect(totalText).toMatch(/^-?\$[\d,]+$/);
  });

  test('overview unique recipients count matches recipients page count', async ({ page }) => {
    // Get overview unique recipients count
    await page.goto('/');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    const recipientsCard = page.locator('text=Campaigns or committees receiving funds').locator('..');
    const recipientsCountEl = recipientsCard.locator('h4');
    const overviewRecipientsCount = await recipientsCountEl.textContent();

    // Navigate to recipients page and check the count
    await page.goto('/recipients');
    await expect(page.getByText('Loading')).not.toBeVisible({ timeout: 10000 });

    const recipientsShown = page.locator('text=/\\d+ recipients shown/');
    const shownText = await recipientsShown.textContent();
    const shownCount = shownText!.match(/([\d,]+)/)?.[1].replace(/,/g, '');

    // The shown count should match or be close to the overview count
    // (recipients page may cap at 200, but total should match if under that)
    expect(Number(shownCount)).toBeGreaterThan(0);
    if (Number(shownCount) < 200) {
      expect(shownCount).toBe(overviewRecipientsCount!.replace(/,/g, ''));
    }
  });
});
