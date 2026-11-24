import { expect, test } from '@playwright/test';

test('Trace advances one large letter while Worksheet keeps practice rows', async ({ page }) => {
  await page.goto('/drawing-board');
  const single = page.locator('.single-trace-guide');
  await expect(single).toBeVisible();
  await expect(single.locator('text')).toHaveCount(1);
  await expect(single.locator('text')).toHaveText('A');
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(single.locator('text')).toHaveText('B');
  await expect(page.getByRole('heading', { name: 'Trace B' })).toBeVisible();
  await page.getByRole('button', { name: 'Worksheet', exact: true }).click();
  await expect(page.locator('.single-trace-guide')).toHaveCount(0);
  await expect(page.locator('.worksheet-guide text')).toHaveCount(48);
  await expect(page.getByRole('button', { name: 'Next →' })).toHaveCount(0);
});

test('Letter Size scales the trace and drawing together inside the paper', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/drawing-board');
    const canvas = page.locator('.db2-trace-stage canvas');
    const guide = page.locator('.single-trace-guide');
    const paper = page.locator('.db2-paper');
    const before = await canvas.boundingBox();
    await page.getByRole('slider', { name: 'Letter Size' }).focus();
    await page.keyboard.press('End');
    const after = await canvas.boundingBox();
    const outline = await guide.boundingBox();
    const letter = await guide.locator('text').boundingBox();
    const frame = await paper.boundingBox();
    expect(after!.width).toBeGreaterThan(before!.width);
    expect(after!.height).toBeGreaterThan(before!.height);
    expect(outline!.width).toBeCloseTo(after!.width, 0);
    expect(outline!.height).toBeCloseTo(after!.height, 0);
    expect(after!.x).toBeGreaterThanOrEqual(frame!.x);
    expect(after!.y).toBeGreaterThanOrEqual(frame!.y);
    expect(after!.x + after!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
    expect(after!.y + after!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
    expect(letter!.width).toBeGreaterThan(frame!.width * 0.45);
    expect(letter!.x).toBeGreaterThanOrEqual(frame!.x);
    expect(letter!.x + letter!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
  }
});
