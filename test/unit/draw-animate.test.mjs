import assert from 'node:assert/strict';
import test from 'node:test';
import { CanvasHistory } from '../../src/tools/draw-animate/draw/history.ts';
import { computeMoveTransform, createWalkState } from '../../src/tools/draw-animate/stage/moves.ts';
import { BUNDLED_STICKERS } from '../../src/tools/draw-animate/data/stickers.ts';
import { SAMPLE_DOODLES } from '../../src/tools/draw-animate/data/sampleDoodles.ts';

test('CanvasHistory supports 35-step push, undo, redo, and clear', () => {
  const history = new CanvasHistory(35);
  const makeSnap = (v) => ({ width: 2, height: 2, data: new Uint8ClampedArray(16).fill(v) });

  for (let i = 1; i <= 40; i++) {
    history.push(makeSnap(i));
  }
  assert.equal(history.canUndo(), true);
  assert.equal(history.canRedo(), false);

  const undone = history.undo(makeSnap(99));
  assert.equal(undone?.data[0], 40);
  assert.equal(history.canRedo(), true);

  const redone = history.redo(makeSnap(40));
  assert.equal(redone?.data[0], 99);

  history.clear();
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);
});

test('computeMoveTransform handles all 6 moves and preserves Bounce visual volume', () => {
  const walkState = createWalkState();
  const prevBounce = { value: 0 };

  const wiggle = computeMoveTransform('wiggle', 1.2, 1 / 60, 1, 3.2, 2.0, -0.64, walkState, prevBounce);
  assert.ok(Math.abs(wiggle.scaleX * wiggle.scaleY - 1) < 1e-6);

  const bounce = computeMoveTransform('bounce', 0.5, 1 / 60, 1, 3.2, 2.0, -0.64, walkState, prevBounce);
  assert.ok(bounce.y >= -0.64);
  assert.ok(Math.abs(bounce.scaleX * bounce.scaleY - 1) < 1e-6);

  const walk = computeMoveTransform('walk', 2.0, 0.5, 1, 3.2, 2.0, -0.64, walkState, prevBounce);
  assert.ok(walk.scaleX === 1 || walk.scaleX === -1);

  const fly = computeMoveTransform('fly', 1.0, 1 / 60, 1, 3.2, 2.0, -0.64, walkState, prevBounce);
  assert.ok(fly.y > -0.64);

  const swim = computeMoveTransform('swim', 1.0, 1 / 60, 1, 3.2, 2.0, -0.64, walkState, prevBounce);
  assert.ok(swim.y > -0.64);

  const dance = computeMoveTransform('dance', 0.3, 1 / 60, 1, 3.2, 2.0, -0.64, walkState, prevBounce);
  assert.ok(dance.beat >= 0 && dance.beat <= 1);
});

test('Draw & Animate bundles 24 SVG stickers and 5 sample doodles', () => {
  assert.equal(BUNDLED_STICKERS.length, 24);
  assert.equal(SAMPLE_DOODLES.length, 5);
  for (const s of BUNDLED_STICKERS) {
    assert.ok(s.svg.includes('<svg'));
  }
  for (const d of SAMPLE_DOODLES) {
    assert.ok(d.svg.includes('<svg'));
  }
});
