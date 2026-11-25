import { expect, test } from '@playwright/test';

test('Trace advances one large letter while Worksheet keeps practice rows', async ({ page }) => {
  await page.goto('/drawing-board');
  const single = page.locator('.single-trace-guide');
  await expect(single).toBeVisible();
  await expect(single.locator('text')).toHaveCount(1);
  await expect(single.locator('text')).toHaveText('A');
  await expect(page.getByRole('button', { name: '← Previous' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(single.locator('text')).toHaveText('B');
  await expect(page.getByRole('heading', { name: 'Trace B' })).toBeVisible();
  await page.getByRole('button', { name: '← Previous' }).click();
  await expect(single.locator('text')).toHaveText('A');
  await expect(page.getByRole('button', { name: '← Previous' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Next →' }).click();
  await expect(single.locator('text')).toHaveText('B');
  await page.getByRole('button', { name: 'Worksheet', exact: true }).click();
  await expect(page.locator('.single-trace-guide')).toHaveCount(0);
  await expect(page.locator('.worksheet-guide text')).toHaveCount(48);
  await expect(page.getByRole('button', { name: 'Next →' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: '← Previous' })).toHaveCount(0);
});

test('Letter Size scales the guide while the whole paper remains drawable', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/drawing-board');
    const canvas = page.locator('.db2-paper > canvas[aria-label="Drawing surface"]');
    const guide = page.locator('.single-trace-guide');
    const paper = page.locator('.db2-paper');
    const before = await canvas.boundingBox();
    await page.getByRole('slider', { name: 'Letter Size' }).focus();
    await page.keyboard.press('End');
    const after = await canvas.boundingBox();
    const outline = await guide.boundingBox();
    const letter = await guide.locator('text').boundingBox();
    const frame = await paper.boundingBox();
    expect(after!.width).toBeCloseTo(before!.width, 0);
    expect(after!.height).toBeCloseTo(before!.height, 0);
    expect(outline!.width).toBeLessThan(after!.width);
    expect(outline!.height).toBeLessThan(after!.height);
    expect(after!.x).toBeGreaterThanOrEqual(frame!.x);
    expect(after!.y).toBeGreaterThanOrEqual(frame!.y);
    expect(after!.x + after!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
    expect(after!.y + after!.height).toBeLessThanOrEqual(frame!.y + frame!.height);
    expect(letter!.width).toBeGreaterThan(frame!.width * 0.45);
    expect(letter!.x).toBeGreaterThanOrEqual(frame!.x);
    expect(letter!.x + letter!.width).toBeLessThanOrEqual(frame!.x + frame!.width);
    const x = after!.x + after!.width * .1;
    const y = after!.y + after!.height * .2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + 30, y + 20);
    await page.mouse.up();
    await expect.poll(() => canvas.evaluate(node => {
      const c = node as HTMLCanvasElement;
      const data = c.getContext('2d')!.getImageData(c.width * .1, c.height * .2, 80, 80).data;
      return Array.from(data).some((value, index) => index % 4 === 3 && value > 0);
    })).toBe(true);
  }
});

test('custom settings scrollbar scrolls with arrows and thumb', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/drawing-board');
  const panel = page.locator('.db2-settings');
  const scrollbar = page.locator('.db2-scrollbar');
  await expect(scrollbar).toBeVisible();
  await scrollbar.getByRole('button', { name: 'Scroll settings down' }).click();
  await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(0);
  const before = await panel.evaluate(element => element.scrollTop);
  const thumb = scrollbar.getByRole('scrollbar', { name: 'Drag to scroll settings' });
  const box = await thumb.boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2 + 80);
  await page.mouse.up();
  await expect.poll(() => panel.evaluate(element => element.scrollTop)).toBeGreaterThan(before);
});
