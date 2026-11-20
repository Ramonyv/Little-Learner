import { expect, test } from '@playwright/test';

test('bottom tool sections expand and keep controls aligned', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1080 });
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
  for (const width of [390, 800, 1024, 1366]) {
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

test('desktop tools sit beside the canvas in every mode', async ({page})=>{
  await page.setViewportSize({width:1440,height:900});
  await page.goto('/drawing-board');
  for(const mode of ['Trace','Free Draw','Gods','Worksheet']){
    await page.getByRole('button',{name:mode,exact:true}).click();
    const panel=page.getByRole('complementary',{name:'Drawing tools'});
    expect(await panel.evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
    const sidebar=await panel.boundingBox();
    const paper=await page.locator('.board-paper:visible').boundingBox();
    expect(sidebar!.x+sidebar!.width).toBeLessThanOrEqual(paper!.x);
    await panel.getByRole('button',{name:'Marker',exact:true}).click();
    await panel.getByRole('button',{name:'Wide',exact:true}).click();
    await panel.getByRole('button',{name:'Blue',exact:true}).click();
    await expect(panel.getByRole('button',{name:'Fill',exact:true})).toHaveCount(mode==='Gods'?1:0);
    await expect(page.locator('.bottom-tool-menu:visible')).toHaveCount(0);
  }
  for(const [width,height] of [[1536,768],[2320,1254],[1496,1257]]){
    await page.setViewportSize({width,height});
    const panel=page.getByRole('complementary',{name:'Drawing tools'});
    expect(await panel.evaluate(el=>el.scrollHeight-el.clientHeight)).toBeLessThanOrEqual(1);
  }
  await page.setViewportSize({width:1366,height:1024});
  await expect(page.getByRole('button',{name:'Brush Types',exact:true})).toBeVisible();
});

test('custom palette and wheel share the drawing colour',async({page})=>{
  await page.goto('/drawing-board');
  await page.getByRole('button',{name:'Colors',exact:true}).click();
  const trigger=page.getByRole('button',{name:'Custom drawing colour'});
  await trigger.click();
  const dialog=page.getByRole('dialog',{name:'Custom drawing colour'});
  await dialog.getByRole('button',{name:'Blue',exact:true}).click();
  await expect(dialog.locator('code')).toHaveText('#3461EA');
  await dialog.getByRole('button',{name:'Blue shade 1',exact:true}).click();
  await expect(dialog.locator('code')).not.toHaveText('#3461EA');
  await dialog.getByRole('button',{name:'Wheel',exact:true}).click();
  await dialog.locator('canvas').click();
  await dialog.getByRole('button',{name:'Palette',exact:true}).click();
  const hex=await dialog.locator('code').textContent();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await trigger.click();
  await expect(dialog.locator('code')).toHaveText(hex!);
});
