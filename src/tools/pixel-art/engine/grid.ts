import type { GridSize } from './types';

export function createGrid(size: GridSize): Uint8Array {
  return new Uint8Array(size * size);
}

export function cloneGrid(grid: Uint8Array): Uint8Array {
  return new Uint8Array(grid);
}

export function isInsideGrid(x: number, y: number, size: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size;
}

export function getCellIndex(x: number, y: number, size: number): number {
  return y * size + x;
}

export function getCellColorIndex(grid: Uint8Array, size: number, x: number, y: number): number {
  if (!isInsideGrid(x, y, size)) return 0;
  return grid[y * size + x];
}

export function resizeGridData(prev: Uint8Array, prevSize: GridSize, nextSize: GridSize): Uint8Array {
  const next = createGrid(nextSize);
  const copySize = Math.min(prevSize, nextSize);
  for (let y = 0; y < copySize; y++) {
    for (let x = 0; x < copySize; x++) {
      next[y * nextSize + x] = prev[y * prevSize + x];
    }
  }
  return next;
}
