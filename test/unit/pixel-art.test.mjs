import assert from 'node:assert/strict';
import test from 'node:test';
import { bresenhamLine, floodFill, getShapeCells } from '../../src/tools/pixel-art/engine/draw.ts';
import { createGrid } from '../../src/tools/pixel-art/engine/grid.ts';
import { PixelHistory } from '../../src/tools/pixel-art/engine/history.ts';
import { getMirroredCells } from '../../src/tools/pixel-art/engine/mirror.ts';
import { PIXEL_TEMPLATES } from '../../src/tools/pixel-art/data/templates.ts';

test('bresenhamLine produces continuous gap-free coordinates', () => {
  const pts = bresenhamLine(0, 0, 5, 3);
  assert.equal(pts[0].x, 0);
  assert.equal(pts[0].y, 0);
  assert.equal(pts[pts.length - 1].x, 5);
  assert.equal(pts[pts.length - 1].y, 3);
  for (let i = 1; i < pts.length; i++) {
    const dx = Math.abs(pts[i].x - pts[i - 1].x);
    const dy = Math.abs(pts[i].y - pts[i - 1].y);
    assert.ok(dx <= 1 && dy <= 1);
  }
});

test('floodFill updates connected region only and supports undo/redo', () => {
  const grid = createGrid(8);
  // Draw a vertical wall at x=3
  for (let y = 0; y < 8; y++) grid[y * 8 + 3] = 1;

  const diffs = floodFill(grid, 8, 0, 0, 4);
  assert.equal(diffs.length, 24); // 3 columns x 8 rows on left side
  assert.equal(grid[0], 4);
  assert.equal(grid[4], 0); // Right side untouched

  const history = new PixelHistory();
  history.push(diffs);
  assert.equal(history.canUndo, true);
  history.undo(grid);
  assert.equal(grid[0], 0);
  history.redo(grid);
  assert.equal(grid[0], 4);
});

test('getMirroredCells mirrors across X, Y, and both axes', () => {
  const both = getMirroredCells(1, 2, 8, 'both');
  assert.equal(both.length, 4);
  assert.deepEqual(
    both.map((c) => `${c.x},${c.y}`).sort(),
    ['1,2', '1,5', '6,2', '6,5'].sort(),
  );
});

test('getShapeCells generates outlined rectangle perimeter', () => {
  const rect = getShapeCells('rect', { x: 1, y: 1 }, { x: 3, y: 3 }, false, 8);
  assert.equal(rect.length, 8);
});

test('All 32+ Pixel Art templates match their declared grid dimensions', () => {
  assert.ok(PIXEL_TEMPLATES.length >= 30);
  for (const tpl of PIXEL_TEMPLATES) {
    assert.equal(tpl.pixels.length, tpl.size * tpl.size, `${tpl.id} size mismatch`);
  }
});
