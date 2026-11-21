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
  await page.goto('/drawing-board?deity=Vishnu');
  await page.getByRole('button', { name: 'Gods', exact: true }).click();
  const paper = page.locator('.board-frame:has(.deity-picker) .board-paper');
  await expect(paper.locator('svg.board-guide')).toHaveCount(2);
  const layers = await paper.locator('svg.board-guide, canvas').evaluateAll((elements) =>
    elements.map((element) => element.tagName.toLowerCase()));
  expect(layers.at(-1)).toBe('svg');
});

test('Gods toolbar exposes the supplied brush icons and working choices', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 });
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

test('a new fill covers earlier ink only inside the tapped region and undo restores it', async ({page})=>{
  await page.addInitScript(()=>{
    localStorage.setItem('ll-coloring',JSON.stringify([['Ganesha',{
      fills:{},undo:[[]],strokes:[{brush:'Marker',color:'#795548',widthScale:3,points:[
        {x:.5,y:.15,pressure:.6},{x:.5,y:.5,pressure:.6}
      ]}]
    }]]));
  });
  await page.goto('/drawing-board?mode=Gods&deity=Ganesha');
  await page.getByRole('button',{name:'Gods',exact:true}).click();
  const paper=page.locator('.board-frame:has(.deity-picker)');
  const ink=paper.locator('canvas[aria-label="Drawing surface"]');
  const region=paper.locator('canvas[aria-label="Ganesha colouring page"]');
  const sample=(y:number)=>ink.evaluate((node,fraction)=>{
    const c=node as HTMLCanvasElement;
    return c.getContext('2d')!.getImageData(c.width/2,c.height*fraction,1,1).data[3];
  },y);
  const rect=(await region.boundingBox())!,side=Math.min(rect.width,rect.height);
  const y=.5-.1*side/rect.height;
  await expect.poll(()=>sample(y)).toBe(255);
  await region.click({position:{x:rect.width/2,y:rect.height*y}});
  await expect.poll(()=>sample(y)).toBe(0);
  await expect.poll(()=>sample(.16)).toBe(255);
  await paper.getByRole('button',{name:'Undo',exact:true}).click();
  await expect.poll(()=>sample(y)).toBe(255);
});

test('PDF keeps the colouring layer aligned with the square outline on a portrait board', async ({page}, testInfo)=>{
  await page.setViewportSize({width:820,height:1250});
  await page.goto('/drawing-board?mode=Gods&deity=Ganesha');
  const art=page.getByLabel('Ganesha colouring page');
  await expect.poll(()=>art.evaluate(node=>(node as HTMLCanvasElement).getContext('2d')!.getImageData(500,400,1,1).data[3])).toBe(255);
  await art.click({position:{x:(await art.boundingBox())!.width/2,y:(await art.boundingBox())!.height/2}});
  const paper=page.locator('.board-paper:visible');
  await paper.locator('summary').click();
  const download=page.waitForEvent('download');
  await paper.getByRole('button',{name:'Save PDF'}).click();
  const path=testInfo.outputPath('portrait.pdf');
  await (await download).saveAs(path);
  const {readFile}=await import('node:fs/promises');
  const pdf=await readFile(path);
  const jpeg=pdf.subarray(pdf.indexOf(Buffer.from([255,216])),pdf.lastIndexOf(Buffer.from([255,217]))+2);
  const mismatch=await art.evaluate(async(node,data)=>{
    const img=new Image();img.src='data:image/jpeg;base64,'+data;await img.decode();
    const c=document.createElement('canvas');c.width=c.height=300;
    const ctx=c.getContext('2d')!,side=Math.min(img.width,img.height);
    ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,300,300);
    const actual=ctx.getImageData(0,0,300,300).data;
    ctx.drawImage(node as HTMLCanvasElement,0,0,300,300);
    const expected=ctx.getImageData(0,0,300,300).data;
    let different=0;
    for(let i=0;i<actual.length;i+=4)if(Math.abs(actual[i]-expected[i])>90)different++;
    return different/(300*300);
  },jpeg.toString('base64'));
  expect(mismatch).toBeLessThan(.018);
});
