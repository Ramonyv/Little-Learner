import { expect, test } from '@playwright/test';

test('gallery renders twelve different brush impressions', async ({page}) => {
  await page.setViewportSize({width:1200,height:800});
  await page.goto('/dev/brushes');
  await expect(page.locator('article canvas')).toHaveCount(12);
  const samples = await page.locator('article canvas').evaluateAll(nodes => nodes.map(node => {
    const canvas = node as HTMLCanvasElement;
    const pixels = canvas.getContext('2d')!.getImageData(0,0,canvas.width,canvas.height);
    if (!pixels.data.some((v,i)=>i%4===3 && v>0)) throw new Error('Blank sample');
    return canvas.toDataURL();
  }));
  expect(new Set(samples).size).toBe(12);
  await page.screenshot({path:'test-results/brush-gallery.png',fullPage:true});
});

test('textured and rainbow strokes replay exactly after undo and redo', async ({page})=>{
  await page.goto('/drawing-board');
  await page.getByRole('button',{name:'Free Draw',exact:true}).click();
  const canvas = page.locator('canvas[aria-label="Drawing surface"]:visible');
  const pixels = ()=>canvas.evaluate(async element=>{
    const c = element as HTMLCanvasElement;
    const data = c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;
    const digest = await crypto.subtle.digest('SHA-256',data);
    return [c.width,c.height,data.filter((v,i)=>i%4===3 && v>0).length,...new Uint8Array(digest).slice(0,8)].join('-');
  });
  for (const brush of ['Crayon','Rainbow','Water','Fountain']) {
    await page.getByRole('button',{name:'Brush Types',exact:true}).click();
    await page.getByRole('button',{name:brush,exact:true}).click();
    await expect.poll(()=>canvas.evaluate(el => (el as HTMLCanvasElement).height === el.clientHeight)).toBe(true);
    const bounds = (await canvas.boundingBox())!;
    const before = await pixels();
    await page.mouse.move(bounds.x+80,bounds.y+bounds.height*.45);
    await page.mouse.down();
    await page.mouse.move(bounds.x+310,bounds.y+bounds.height*.59,{steps:18});
    await page.mouse.up();
    const after = await pixels();
    expect(after).not.toBe(before);
    await page.getByRole('button',{name:'Undo',exact:true}).click();
    expect(await pixels(),brush+' undo').toBe(before);
    await page.getByRole('button',{name:'Redo',exact:true}).click();
    expect(await pixels(),brush+' redo').toBe(after);
  }
});
