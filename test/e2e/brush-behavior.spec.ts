import { expect, test } from '@playwright/test';

test('all featured brushes can draw strokes without interrupting pointer input', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1000 });
  await page.goto('/drawing-board');
  await page.getByRole('button', { name: 'Free Draw', exact: true }).click();
  await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
  const canvas = page.locator('.board-layout:not([hidden]) canvas[aria-label="Drawing surface"]');
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Drawing canvas is missing');
  for (const [index, brush] of ['Chalk','Pen','Marker','Rainbow','Monoline','Crayon','Fountain','Water'].entries()) {
    if (index > 0) await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
    const option = page.getByRole('button', { name: brush, exact: true });
    await option.click();
    const y = bounds.y + 55 + index * 58;
    await page.mouse.move(bounds.x + bounds.width * .2, y);
    await page.mouse.down();
    for (let step = 1; step <= 14; step++) {
      const x = bounds.x + bounds.width * (.2 + step * .042);
      await page.mouse.move(x, y + Math.sin(step * .45) * 16);
    }
    await page.mouse.up();
  }
});
