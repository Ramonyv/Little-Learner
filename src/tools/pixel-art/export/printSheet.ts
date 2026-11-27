import type { GridSize } from '../engine/types';

export function printPixelColoringSheet(
  title: string,
  pixels: Uint8Array | number[],
  size: GridSize,
): void {
  const win = window.open('', '_blank', 'width=820,height=980');
  if (!win) return;

  const cellsHtml: string[] = [];
  for (let i = 0; i < size * size; i++) {
    const val = pixels[i];
    const label = val > 0 ? String(val) : '';
    cellsHtml.push(`<div class="cell">${label}</div>`);
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title.replace(/</g, '&lt;')} — Jugnu Coloring Sheet</title>
  <style>
    @page { size: A4 portrait; margin: 16mm; }
    body { font-family: system-ui, sans-serif; color: #172951; margin: 0; text-align: center; }
    h1 { font-size: 22px; margin: 0 0 6px; }
    p { font-size: 13px; color: #516587; margin: 0 0 18px; }
    .grid {
      display: grid;
      grid-template-columns: repeat(${size}, 1fr);
      width: min(165mm, 92vw);
      aspect-ratio: 1;
      margin: 0 auto;
      border: 2.5px solid #172951;
    }
    .cell {
      border: 0.75px solid #94a3b8;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: ${size <= 16 ? '12px' : size <= 32 ? '8px' : '5px'};
      font-weight: 700;
      color: #64748b;
    }
    footer { margin-top: 16px; font-size: 11px; color: #64748b; }
  </style>
</head>
<body>
  <h1>${title.replace(/</g, '&lt;')}</h1>
  <p>Color the squares to bring your pixel art to life!</p>
  <div class="grid">${cellsHtml.join('')}</div>
  <footer>Made with Jugnu Pixel Art Studio • jugnu.fun</footer>
  <script>window.onload = () => { window.print(); };</script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
}
