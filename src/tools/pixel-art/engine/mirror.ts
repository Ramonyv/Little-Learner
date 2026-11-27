import type { CellCoord, MirrorMode } from './types';

export function getMirroredCells(
  x: number,
  y: number,
  size: number,
  mirror: MirrorMode,
): CellCoord[] {
  const result: CellCoord[] = [{ x, y }];
  const seen = new Set<number>([y * size + x]);

  const push = (nx: number, ny: number) => {
    if (nx < 0 || ny < 0 || nx >= size || ny >= size) return;
    const key = ny * size + nx;
    if (!seen.has(key)) {
      seen.add(key);
      result.push({ x: nx, y: ny });
    }
  };

  const mx = size - 1 - x;
  const my = size - 1 - y;

  if (mirror === 'x' || mirror === 'both') {
    push(mx, y);
  }
  if (mirror === 'y' || mirror === 'both') {
    push(x, my);
  }
  if (mirror === 'both') {
    push(mx, my);
  }

  return result;
}
