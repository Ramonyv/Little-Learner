import { readWork, saveWork } from '../../../utils/localWork';
import type { GridSize, PixelColor } from '../engine/types';

export const PIXEL_MY_WORK_KEY = 'll-pixel-works';

export interface SavedPixelWork {
  id: string;
  type: 'pixel';
  title: string;
  size: GridSize;
  paletteId: string;
  pixels: number[];
  thumbnail: string;
  updatedAt: number;
}

export function renderPixelDataUrl(
  pixels: number[] | Uint8Array,
  size: GridSize,
  palette: PixelColor[],
  outPx = 128,
  transparent = false,
): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = outPx;
  canvas.height = outPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.imageSmoothingEnabled = false;
  if (!transparent) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outPx, outPx);
  }
  const cell = outPx / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = pixels[y * size + x];
      if (idx > 0 && idx <= palette.length) {
        const px = Math.floor(x * cell);
        const py = Math.floor(y * cell);
        const pw = Math.ceil((x + 1) * cell) - px;
        const ph = Math.ceil((y + 1) * cell) - py;
        ctx.fillStyle = palette[idx - 1].hex;
        ctx.fillRect(px, py, pw, ph);
      }
    }
  }
  return canvas.toDataURL('image/png');
}

export function listPixelWorks(): SavedPixelWork[] {
  const entries = readWork<[string, SavedPixelWork][]>(PIXEL_MY_WORK_KEY, []);
  return entries
    .map(([, item]) => item)
    .filter((item): item is SavedPixelWork => Boolean(item && item.type === 'pixel' && Array.isArray(item.pixels)))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getPixelWorkById(id: string): SavedPixelWork | null {
  const entries = readWork<[string, SavedPixelWork][]>(PIXEL_MY_WORK_KEY, []);
  const found = entries.find(([key]) => key === id);
  return found ? found[1] : null;
}

export function savePixelWork(work: SavedPixelWork): void {
  const entries = readWork<[string, SavedPixelWork][]>(PIXEL_MY_WORK_KEY, []);
  const filtered = entries.filter(([key]) => key !== work.id);
  saveWork(PIXEL_MY_WORK_KEY, [[work.id, work], ...filtered].slice(0, 24));
}

export function deletePixelWork(id: string): void {
  const entries = readWork<[string, SavedPixelWork][]>(PIXEL_MY_WORK_KEY, []);
  saveWork(
    PIXEL_MY_WORK_KEY,
    entries.filter(([key]) => key !== id),
  );
}
