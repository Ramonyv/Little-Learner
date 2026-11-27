import type { CellCoord, PixelDiff, ShapeKind } from './types';

function isInsideGrid(x: number, y: number, size: number): boolean {
  return x >= 0 && y >= 0 && x < size && y < size;
}

/**
 * Integer Bresenham line interpolation so fast pointer/finger strokes
 * never leave gaps between sampled cells.
 */
export function bresenhamLine(x0: number, y0: number, x1: number, y1: number): CellCoord[] {
  const points: CellCoord[] = [];
  let cx = x0;
  let cy = y0;
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push({ x: cx, y: cy });
    if (cx === x1 && cy === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      cx += sx;
    }
    if (e2 < dx) {
      err += dx;
      cy += sy;
    }
  }
  return points;
}

/**
 * Iterative stack flood fill (never recursion) so even 64x64 fills
 * never risk stack overflow.
 */
export function floodFill(
  grid: Uint8Array,
  size: number,
  startX: number,
  startY: number,
  replacementColor: number,
): PixelDiff[] {
  if (!isInsideGrid(startX, startY, size)) return [];
  const startIdx = startY * size + startX;
  const targetColor = grid[startIdx];
  if (targetColor === replacementColor) return [];

  const diffs: PixelDiff[] = [];
  const stack: number[] = [startIdx];
  const visited = new Uint8Array(size * size);
  visited[startIdx] = 1;

  while (stack.length > 0) {
    const idx = stack.pop()!;
    if (grid[idx] !== targetColor) continue;

    diffs.push({ index: idx, prev: targetColor, next: replacementColor });
    grid[idx] = replacementColor;

    const x = idx % size;
    const y = Math.floor(idx / size);

    if (x > 0) {
      const left = idx - 1;
      if (!visited[left]) {
        visited[left] = 1;
        stack.push(left);
      }
    }
    if (x < size - 1) {
      const right = idx + 1;
      if (!visited[right]) {
        visited[right] = 1;
        stack.push(right);
      }
    }
    if (y > 0) {
      const up = idx - size;
      if (!visited[up]) {
        visited[up] = 1;
        stack.push(up);
      }
    }
    if (y < size - 1) {
      const down = idx + size;
      if (!visited[down]) {
        visited[down] = 1;
        stack.push(down);
      }
    }
  }

  return diffs;
}

export function getShapeCells(
  kind: ShapeKind,
  start: CellCoord,
  end: CellCoord,
  filled: boolean,
  size: number,
): CellCoord[] {
  if (kind === 'line') {
    return bresenhamLine(start.x, start.y, end.x, end.y).filter((c) =>
      isInsideGrid(c.x, c.y, size),
    );
  }

  const minX = Math.max(0, Math.min(start.x, end.x));
  const maxX = Math.min(size - 1, Math.max(start.x, end.x));
  const minY = Math.max(0, Math.min(start.y, end.y));
  const maxY = Math.min(size - 1, Math.max(start.y, end.y));

  if (kind === 'rect') {
    const cells: CellCoord[] = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (filled || x === minX || x === maxX || y === minY || y === maxY) {
          cells.push({ x, y });
        }
      }
    }
    return cells;
  }

  // Ellipse / Circle inside bounding box
  const cx = (start.x + end.x) / 2;
  const cy = (start.y + end.y) / 2;
  const rx = Math.max(0.5, Math.abs(end.x - start.x) / 2 + 0.25);
  const ry = Math.max(0.5, Math.abs(end.y - start.y) / 2 + 0.25);
  const cells: CellCoord[] = [];

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - cy) / ry;
      const d = nx * nx + ny * ny;
      if (filled) {
        if (d <= 1.0) cells.push({ x, y });
      } else {
        const innerX = Math.max(0.01, rx - 1);
        const innerY = Math.max(0.01, ry - 1);
        const dInner = ((x - cx) / innerX) ** 2 + ((y - cy) / innerY) ** 2;
        if (d <= 1.0 && (rx < 1.5 || ry < 1.5 || dInner >= 0.85)) {
          cells.push({ x, y });
        }
      }
    }
  }
  return cells;
}

export function getStampCells(
  rows: string[],
  centerX: number,
  centerY: number,
  size: number,
): CellCoord[] {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const startX = centerX - Math.floor(w / 2);
  const startY = centerY - Math.floor(h / 2);
  const cells: CellCoord[] = [];

  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (rows[r][c] === '#') {
        const gx = startX + c;
        const gy = startY + r;
        if (isInsideGrid(gx, gy, size)) {
          cells.push({ x: gx, y: gy });
        }
      }
    }
  }
  return cells;
}
