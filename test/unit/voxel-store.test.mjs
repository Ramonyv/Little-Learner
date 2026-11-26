import test from 'node:test';
import assert from 'node:assert/strict';
import { VoxelStore, getSymmetryCoords, isInBounds } from '../../src/voxel/voxelStore.ts';
import { VOXEL_TEMPLATES } from '../../src/voxel/templates.ts';

test('VoxelStore supports add, paint, erase, undo, and redo', () => {
  const store = new VoxelStore();
  assert.equal(store.size, 0);

  assert.equal(store.add(0, 0, 0, '#FFC300'), true);
  assert.equal(store.get(0, 0, 0), '#FFC300');
  assert.equal(store.size, 1);

  assert.equal(store.paint(0, 0, 0, '#FF4D6D'), true);
  assert.equal(store.get(0, 0, 0), '#FF4D6D');

  assert.equal(store.undo(), true);
  assert.equal(store.get(0, 0, 0), '#FFC300');

  assert.equal(store.redo(), true);
  assert.equal(store.get(0, 0, 0), '#FF4D6D');

  assert.equal(store.erase(0, 0, 0), true);
  assert.equal(store.size, 0);
  assert.equal(store.undo(), true);
  assert.equal(store.size, 1);
});

test('VoxelStore symmetry mirrors across X and both axes', () => {
  const xSym = getSymmetryCoords(2, 1, 3, 'x');
  assert.deepEqual(xSym, [
    [2, 1, 3],
    [-3, 1, 3],
  ]);

  const store = new VoxelStore();
  store.add(1, 0, 2, '#38BDF8', 'both');
  assert.equal(store.size, 4);
  assert.equal(store.has(-2, 0, -3), true);
});

test('VoxelStore 3D flood fill updates connected same-color voxels only', () => {
  const store = new VoxelStore([
    [0, 0, 0, '#FF4D6D'],
    [1, 0, 0, '#FF4D6D'],
    [1, 1, 0, '#FF4D6D'],
    [2, 0, 0, '#22C55E'],
  ]);

  assert.equal(store.fill(0, 0, 0, '#4361EE'), true);
  assert.equal(store.get(0, 0, 0), '#4361EE');
  assert.equal(store.get(1, 1, 0), '#4361EE');
  assert.equal(store.get(2, 0, 0), '#22C55E');
});

test('All guided Build Together templates stay within grid bounds', () => {
  assert.ok(VOXEL_TEMPLATES.length >= 6);
  for (const tpl of VOXEL_TEMPLATES) {
    assert.ok(tpl.voxels.length > 0, `${tpl.id} should have voxels`);
    for (const [x, y, z] of tpl.voxels) {
      assert.equal(isInBounds(x, y, z), true, `${tpl.id} out of bounds at ${x},${y},${z}`);
    }
  }
});
