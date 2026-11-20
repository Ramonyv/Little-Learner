import { expect, test } from '@playwright/test';

test('Ganesha fill stays in the chosen shape and outlines remain above drawing', async ({ page }) => {
  await page.goto('/drawing-board?deity=Ganesha');
  await page.getByRole('button', { name: 'Gods', exact: true }).click();
  await page.getByRole('button', { name: 'Colors', exact: true }).click();
  await page.getByRole('button', { name: 'Yellow colour' }).click();

  const canvas = page.locator('canvas[aria-label="Ganesha colouring page"]');
  await expect(canvas).toBeVisible();
  const bounds = await canvas.boundingBox();
  if (!bounds) throw new Error('Colouring canvas is missing');
  const before = await canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d')!;
    return [400, 150].map((y) => [...context.getImageData(500, y, 1, 1).data].slice(0, 3));
  });
  const side = Math.min(bounds.width, bounds.height);
  await page.mouse.click(bounds.x + (bounds.width - side) / 2 + side * 0.5, bounds.y + (bounds.height - side) / 2 + side * 0.4);

  await expect.poll(() => canvas.evaluate((element) => {
    const context = (element as HTMLCanvasElement).getContext('2d');
    return context?.getImageData(500, 400, 1, 1).data[1];
  })).toBe(200);
  const outside = await canvas.evaluate((element) => {
    const data = (element as HTMLCanvasElement).getContext('2d')!.getImageData(500, 150, 1, 1).data;
    return [...data].slice(0, 3);
  });
  expect(outside).toEqual(before[1]);

  const image = page.locator('img.board-guide[src="/Ganesha.svg"]');
  await expect(image).toBeVisible();
  expect(await image.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe('none');
});

test('vector coloring pages keep outlines above brush strokes', async ({ page }) => {
  await page.goto('/drawing-board?deity=Saraswati');
  await page.getByRole('button', { name: 'Gods', exact: true }).click();
  const paper = page.locator('.board-frame:has(.deity-picker) .board-paper');
  await expect(paper.locator('svg.board-guide')).toHaveCount(2);
  const layers = await paper.locator('svg.board-guide, canvas').evaluateAll((elements) =>
    elements.map((element) => element.tagName.toLowerCase()));
  expect(layers.at(-1)).toBe('svg');
});

test('Gods toolbar exposes the supplied brush icons and working choices', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/drawing-board?deity=Ganesha');
  await page.getByRole('button', { name: 'Gods', exact: true }).click();
  await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
  await expect.poll(() => page.locator('.bottom-tool-menu img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  const rainbow = page.getByRole('button', { name: 'Rainbow', exact: true });
  await rainbow.click();
  await page.getByRole('button', { name: 'Brush Types', exact: true }).click();
  await expect(rainbow).toHaveAttribute('aria-pressed', 'true');
  await expect(rainbow.locator('img')).toHaveAttribute('src', /Bottom%20Toolbar\/Brush Types\/Rainbow\.svg/);
});
