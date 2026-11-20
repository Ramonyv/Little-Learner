import { expect, test } from '@playwright/test';

test('bottom tool sections expand and keep controls aligned', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1080 });
  await page.goto('/drawing-board');
  await expect(page.getByRole('button', { name: 'Brush Types', exact: true })).toHaveAttribute('aria-expanded', 'false');
  await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
  expect(await page.locator('.bottom-tool-sections:visible').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Marker', exact: true })).toBeVisible();
  for (const brush of ['Chalk', 'Pen', 'Rainbow', 'Monoline', 'Crayon', 'Fountain', 'Water']) {
    await expect(page.getByRole('button', { name: brush, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Rainbow', exact: true }).click();
  await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Rainbow', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const tile = page.getByRole('button', { name: 'Brush Types', exact: true });
  expect(await tile.evaluate(element => Math.round(element.getBoundingClientRect().height))).toBeLessThanOrEqual(50);
  await page.getByRole('button', { name: 'Colors', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Blue colour' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Marker', exact: true })).toBeHidden();
  await page.setViewportSize({ width: 800, height: 900 });
  await expect(page.getByRole('button', { name: 'Colors', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Brush Size', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Undo', exact: true })).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Redo', exact: true })).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Colors', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Brush Size', exact: true }).click();
  for (const width of [390, 800, 1440, 2364]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.locator('.bottom-tool-popup.size:visible').evaluate(panel => {
      const bounds = panel.getBoundingClientRect();
      return [...panel.querySelectorAll('.bottom-size')].every(button => {
        const item = button.getBoundingClientRect();
        return item.left >= bounds.left && item.right <= bounds.right;
      });
    })).toBe(true);
  }
});

test('wide layout shows brush choices above the toolbar', async ({ page }) => {
  await page.setViewportSize({ width: 2364, height: 1356 });
  await page.goto('/drawing-board');
  await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
  await expect(page.locator('.bottom-tool-popup.brush:visible').getByRole('button', { name: 'Water', exact: true })).toBeVisible();
  expect(await page.locator('.bottom-tool-sections:visible').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  await page.getByRole('button', { name: 'More brushes' }).click();
  await expect(page.getByRole('button', { name: 'Ink', exact: true })).toBeVisible();
});
