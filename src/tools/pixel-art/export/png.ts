import type { GridSize, PixelColor } from '../engine/types';
import { renderPixelDataUrl } from '../storage/myWork';

export function exportPixelPng(
  pixels: Uint8Array | number[],
  size: GridSize,
  palette: PixelColor[],
  scale: 1 | 4 | 10,
  stickerTransparent: boolean,
  title: string,
): void {
  const outPx = size * scale * (scale === 1 ? 1 : 4);
  const dataUrl = renderPixelDataUrl(pixels, size, palette, outPx, stickerTransparent);
  if (!dataUrl) return;
  const safeName = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'pixel-art';
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${safeName}${stickerTransparent ? '-sticker' : ''}-${scale}x.png`;
  link.click();
}
