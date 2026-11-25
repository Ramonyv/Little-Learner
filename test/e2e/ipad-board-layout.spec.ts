import { expect, test } from '@playwright/test';

test('removes All colors everywhere and applies iPad portrait header and 6-size layout', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/drawing-board?mode=Worksheet');

  await expect(page.locator('.db2-settings')).not.toContainText('All colors');
  await expect(page.locator('.db2-settings')).toContainText('Shades');
  await expect(page.locator('.db2-settings')).toContainText('Recent Colors');
  await expect(page.getByRole('button', { name: 'Brush size 0.5' })).toBeVisible();
  await expect(page.locator('.db2-sizes button:visible')).toHaveCount(7);
  await expect(page.getByRole('button', { name: 'Letter Style', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Drawing Tools', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Brush Size', exact: true })).toBeVisible();

  for (const viewport of [
    { width: 820, height: 1180 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.getByRole('button', { name: 'Letter', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Drawing', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Size', exact: true })).toBeVisible();
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

  for (const viewport of [
    { width: 1024, height: 900 },
    { width: 901, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    const h1Box = await page.locator('.db2-header h1').boundingBox();
    const modesBox = await page.locator('.db2-modes').boundingBox();
    expect(h1Box).not.toBeNull();
    expect(modesBox).not.toBeNull();
    expect(Math.abs((h1Box!.y + h1Box!.height / 2) - (modesBox!.y + modesBox!.height / 2))).toBeLessThan(8);
    expect(h1Box!.x + h1Box!.width).toBeLessThan(modesBox!.x);
  }

  for (const viewport of [
    { width: 1024, height: 900 },
    { width: 820, height: 1180 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    const modesOverflow = await page.locator('.db2-modes').evaluate(el => ({
      x: el.scrollWidth - el.clientWidth,
      y: el.scrollHeight - el.clientHeight,
    }));
    expect(modesOverflow.x).toBeLessThanOrEqual(0);
    expect(modesOverflow.y).toBeLessThanOrEqual(0);

    const actionYs = await page.locator('.db2-actions > button').evaluateAll(btns =>
      btns.map(b => Math.round(b.getBoundingClientRect().y)),
    );
    expect(actionYs.length).toBe(4);
    expect(new Set(actionYs).size).toBe(1);
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

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('button', { name: 'Letter', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Drawing', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Size', exact: true })).toBeVisible();

  await page.setViewportSize({ width: 1024, height: 900 });
  await expect(page.locator('.db2-focus-rail')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(page.locator('.db2-focus-rail')).toBeVisible();
  const toolHeight = await page.locator('.db2-focus-tool').first().evaluate(el => el.getBoundingClientRect().height);
  expect(toolHeight).toBeGreaterThanOrEqual(32);
  expect(toolHeight).toBeLessThanOrEqual(42);
  const railOverflow = await page.locator('.db2-focus-rail-items').evaluate(el => el.scrollHeight - el.clientHeight);
  expect(railOverflow).toBeLessThanOrEqual(1);
  await page.locator('.db2-focus-color-btn').click();
  await expect(page.locator('.db2-focus-colors')).toBeVisible();
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();
  await expect(page.locator('.db2-focus-rail')).toHaveCount(0);

  await page.setViewportSize({ width: 768, height: 1024 });
  await page.getByRole('button', { name: 'Trace', exact: true }).click();
  await page.getByRole('button', { name: 'Letters', exact: true }).click();
  await page.getByRole('button', { name: 'Next →', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Trace B' })).toBeVisible();
  await expect(page.locator('.db2-header-print')).toBeHidden();
  await expect(page.locator('.db2-tablet-action')).toHaveCount(2);
  await expect(page.locator('.db2-tablet-action').first()).toBeHidden();
  const titleRect = await page.locator('.db2-activity h2').boundingBox();
  const prevRect = await page.locator('.db2-prev').boundingBox();
  expect(titleRect).not.toBeNull();
  expect(prevRect).not.toBeNull();
  expect(titleRect!.x + titleRect!.width).toBeLessThan(prevRect!.x);
  const titleOverflow = await page.locator('.db2-activity h2').evaluate(el => el.scrollWidth - el.clientWidth);
  expect(titleOverflow).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  await expect(page.locator('.db2-header-print')).toBeVisible();
  await expect(page.locator('.db2-tablet-action').first()).toBeVisible();
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();

  await page.evaluate(() => {
    Object.defineProperty(window.crypto, 'randomUUID', { value: undefined, configurable: true });
  });
  await page.getByRole('button', { name: 'Trace', exact: true }).click();
  await page.getByRole('button', { name: 'Words', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Trace the word' })).toBeVisible();
  const arrowBg = await page.locator('.db2-next .db2-nav-arrow').evaluate(el => getComputedStyle(el).backgroundColor);
  expect(arrowBg).toBe('rgba(0, 0, 0, 0)');

  await page.getByRole('button', { name: 'Gods', exact: true }).click();
  await page.getByRole('button', { name: 'Fullscreen', exact: true }).click();
  const godsToolBox = await page.locator('.db2-focus-tool').first().boundingBox();
  const godsSizeBox = await page.locator('.db2-focus-size').first().boundingBox();
  expect(godsToolBox).not.toBeNull();
  expect(godsSizeBox).not.toBeNull();
  expect(Math.abs(godsToolBox!.width - godsToolBox!.height)).toBeLessThanOrEqual(1);
  expect(Math.abs(godsSizeBox!.width - godsSizeBox!.height)).toBeLessThanOrEqual(1);
  const godsRailOverflow = await page.locator('.db2-focus-rail-items').evaluate(el => el.scrollHeight - el.clientHeight);
  expect(godsRailOverflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Exit fullscreen', exact: true }).click();

  const toolCenterOffsets = await page.locator('.db2-tool-grid button').evaluateAll(buttons =>
    buttons.map(btn => {
      const b = btn.getBoundingClientRect();
      const img = btn.querySelector('img')!.getBoundingClientRect();
      return {
        dx: Math.abs((b.left + b.width / 2) - (img.left + img.width / 2)),
        dy: Math.abs((b.top + b.height / 2) - (img.top + img.height / 2)),
      };
    }),
  );
  for (const offset of toolCenterOffsets) {
    expect(offset.dx).toBeLessThanOrEqual(2);
    expect(offset.dy).toBeLessThanOrEqual(2);
  }
});

