import { expect, test } from '@playwright/test';

test('removes All colors everywhere and applies iPad portrait header and 6-size layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/drawing-board?mode=Worksheet');

  await expect(page.locator('.db2-settings')).not.toContainText('All colors');
  await expect(page.locator('.db2-settings')).toContainText('Shades');
  await expect(page.locator('.db2-settings')).toContainText('Recent Colors');
  await expect(page.getByRole('button', { name: 'Brush size 0.5' })).toBeVisible();
  await expect(page.locator('.db2-sizes button:visible')).toHaveCount(7);

  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('.db2-activity p')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Brush size 0.5' })).toBeHidden();
    await expect(page.locator('.db2-sizes button:visible')).toHaveCount(6);

    const headBox = await page.locator('.db2-canvas-head').boundingBox();
    const titleBox = await page.locator('.db2-activity h2').boundingBox();
    const badgesBox = await page.locator('.db2-badges').boundingBox();
    expect(headBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(badgesBox).not.toBeNull();
    const titleCenterY = titleBox!.y + titleBox!.height / 2;
    const badgesCenterY = badgesBox!.y + badgesBox!.height / 2;
    expect(Math.abs(titleCenterY - badgesCenterY)).toBeLessThan(12);
    expect(badgesBox!.x + badgesBox!.width).toBeLessThanOrEqual(headBox!.x + headBox!.width + 1);
  }

  const clearBox = await page.getByRole('button', { name: 'Clear', exact: true }).boundingBox();
  const chalkBox = await page.getByRole('button', { name: 'Chalkboard', exact: true }).boundingBox();
  expect(clearBox).not.toBeNull();
  expect(chalkBox).not.toBeNull();
  const y = clearBox!.y + clearBox!.height / 2;
  const cursors = await page.evaluate(({ startX, endX, yPos }) => {
    const seen: string[] = [];
    for (let x = Math.round(startX); x <= Math.round(endX); x += 2) {
      const el = document.elementFromPoint(x, yPos);
      if (el) seen.push(getComputedStyle(el).cursor);
    }
    return seen;
  }, { startX: clearBox!.x + clearBox!.width / 2, endX: chalkBox!.x + chalkBox!.width / 2, yPos: y });
  expect(cursors.length).toBeGreaterThan(5);
  expect(cursors.every(c => c === 'pointer')).toBe(true);

  let dialogOpened = false;
  page.on('dialog', async dialog => {
    dialogOpened = true;
    await dialog.dismiss();
  });
  const canvas = page.locator('.db2-paper > canvas[aria-label="Drawing surface"]');
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * 0.3, box!.y + box!.height * 0.4);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5);
  await page.mouse.up();
  await page.getByRole('button', { name: 'Clear', exact: true }).click();
  expect(dialogOpened).toBe(false);
  await expect.poll(() => canvas.evaluate(node => {
    const c = node as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    return Array.from(data).some((v, i) => i % 4 === 3 && v > 0);
  })).toBe(false);
  await page.getByRole('button', { name: 'Undo', exact: true }).click();
  await expect.poll(() => canvas.evaluate(node => {
    const c = node as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0, 0, c.width, c.height).data;
    return Array.from(data).some((v, i) => i % 4 === 3 && v > 0);
  })).toBe(true);
});

