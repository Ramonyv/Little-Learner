import { expect, test } from '@playwright/test';

const samplePng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mP8z8BQz0AEwEgEAAvQA/5p0f5eAAAAAElFTkSuQmCC',
  'base64',
);

test('free draw trace image starts at 100% opacity and updates independently of canvas strokes', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
  await page.goto('/drawing-board?mode=Free%20Draw');

  const fileInput = page.locator('.db2-actions input[type="file"]');
  await fileInput.setInputFiles({
    name: 'trace-sample.png',
    mimeType: 'image/png',
    buffer: samplePng,
  });

  const traceImg = page.locator('img.db2-trace-image');
  const drawingCanvas = page.locator('canvas[aria-label="Drawing surface"]');
  const opacitySlider = page.getByRole('slider', { name: /Opacity/i });

  await expect(traceImg).toBeVisible();
  await expect(opacitySlider).toHaveAttribute('min', '1');
  await expect(opacitySlider).toHaveAttribute('max', '100');
  await expect(opacitySlider).toHaveValue('100');
  await expect(page.locator('.db2-trace-controls')).toContainText('100%');
  expect(Number(await traceImg.evaluate(el => getComputedStyle(el).opacity))).toBeCloseTo(1, 2);

  await opacitySlider.fill('35');
  await expect(page.locator('.db2-trace-controls')).toContainText('35%');
  expect(Number(await traceImg.evaluate(el => getComputedStyle(el).opacity))).toBeCloseTo(0.35, 2);
  expect(Number(await drawingCanvas.evaluate(el => getComputedStyle(el).opacity))).toBeCloseTo(1, 2);

  await page.getByRole('button', { name: 'Done positioning' }).click();
  expect(Number(await traceImg.evaluate(el => getComputedStyle(el).opacity))).toBeCloseTo(0.35, 2);

  await opacitySlider.fill('1');
  await expect(page.locator('.db2-trace-controls')).toContainText('1%');
  expect(Number(await traceImg.evaluate(el => getComputedStyle(el).opacity))).toBeCloseTo(0.01, 2);
  expect(Number(await drawingCanvas.evaluate(el => getComputedStyle(el).opacity))).toBeCloseTo(1, 2);
});

