import type { SymmetryMode, VoxelDeltaEntry, VoxelTuple } from './types';

export const GRID_HALF = 8; // x, z in [-8, 7] => 16x16 footprint
export const GRID_MIN_XZ = -GRID_HALF;
export const GRID_MAX_XZ = GRID_HALF - 1;
export const GRID_MAX_Y = 15; // 16 layers high (0..15)
export const MAX_VOXELS = 3000;
const MAX_HISTORY = 60;

export function coordKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

export function parseCoordKey(key: string): [number, number, number] {
  const [x, y, z] = key.split(',').map(Number);
  return [x, y, z];
}

export function isInBounds(x: number, y: number, z: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    Number.isInteger(z) &&
    x >= GRID_MIN_XZ &&
    x <= GRID_MAX_XZ &&
    z >= GRID_MIN_XZ &&
    z <= GRID_MAX_XZ &&
    y >= 0 &&
    y <= GRID_MAX_Y
  );
}

export function getSymmetryCoords(
  x: number,
  y: number,
  z: number,
  symmetry: SymmetryMode,
): [number, number, number][] {
  const coords: [number, number, number][] = [[x, y, z]];
  const mx = -1 - x;
  const mz = -1 - z;
  if (symmetry === 'x' || symmetry === 'both') coords.push([mx, y, z]);
  if (symmetry === 'z' || symmetry === 'both') coords.push([x, y, mz]);
  if (symmetry === 'both') coords.push([mx, y, mz]);

  const seen = new Set<string>();
  return coords.filter(([cx, cy, cz]) => {
    if (!isInBounds(cx, cy, cz)) return false;
    const k = coordKey(cx, cy, cz);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export class VoxelStore {
  private map = new Map<string, string>();
  private undoStack: VoxelDeltaEntry[][] = [];
  private redoStack: VoxelDeltaEntry[][] = [];

  constructor(initial: VoxelTuple[] = []) {
    this.load(initial);
  }

  get size(): number {
    return this.map.size;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get(x: number, y: number, z: number): string | undefined {
    return this.map.get(coordKey(x, y, z));
  }

  has(x: number, y: number, z: number): boolean {
    return this.map.has(coordKey(x, y, z));
  }

  entries(): VoxelTuple[] {
    const result: VoxelTuple[] = [];
    for (const [key, color] of this.map.entries()) {
      const [x, y, z] = parseCoordKey(key);
      result.push([x, y, z, color]);
    }
    return result;
  }

  load(voxels: VoxelTuple[], recordUndo = false): void {
    if (!recordUndo) {
      this.map.clear();
      for (const [x, y, z, color] of voxels) {
        if (isInBounds(x, y, z) && typeof color === 'string') {
          this.map.set(coordKey(x, y, z), color);
        }
      }
      this.undoStack = [];
      this.redoStack = [];
      return;
    }

    const delta: VoxelDeltaEntry[] = [];
    const nextMap = new Map<string, string>();
    for (const [x, y, z, color] of voxels) {
      if (isInBounds(x, y, z) && typeof color === 'string') {
        nextMap.set(coordKey(x, y, z), color);
      }
    }
    for (const [key, prev] of this.map.entries()) {
      const next = nextMap.get(key) ?? null;
      if (prev !== next) delta.push({ key, prev, next });
    }
    for (const [key, next] of nextMap.entries()) {
      if (!this.map.has(key)) delta.push({ key, prev: null, next });
    }
    this.commitDelta(delta);
  }

  private commitDelta(delta: VoxelDeltaEntry[]): boolean {
    if (delta.length === 0) return false;
    for (const { key, next } of delta) {
      if (next === null) this.map.delete(key);
      else this.map.set(key, next);
    }
    this.undoStack.push(delta);
    if (this.undoStack.length > MAX_HISTORY) this.undoStack.shift();
    this.redoStack = [];
    return true;
  }

  add(x: number, y: number, z: number, color: string, symmetry: SymmetryMode = 'none'): boolean {
    const targets = getSymmetryCoords(x, y, z, symmetry);
    const delta: VoxelDeltaEntry[] = [];
    for (const [cx, cy, cz] of targets) {
      const key = coordKey(cx, cy, cz);
      const prev = this.map.get(key) ?? null;
      if (prev === color) continue;
      if (prev === null && this.map.size + delta.filter((d) => d.prev === null).length >= MAX_VOXELS) {
        continue;
      }
      delta.push({ key, prev, next: color });
    }
    return this.commitDelta(delta);
  }

  paint(x: number, y: number, z: number, color: string, symmetry: SymmetryMode = 'none'): boolean {
    const targets = getSymmetryCoords(x, y, z, symmetry);
    const delta: VoxelDeltaEntry[] = [];
    for (const [cx, cy, cz] of targets) {
      const key = coordKey(cx, cy, cz);
      const prev = this.map.get(key);
      if (prev === undefined || prev === color) continue;
      delta.push({ key, prev, next: color });
    }
    return this.commitDelta(delta);
  }

  erase(x: number, y: number, z: number, symmetry: SymmetryMode = 'none'): boolean {
    const targets = getSymmetryCoords(x, y, z, symmetry);
    const delta: VoxelDeltaEntry[] = [];
    for (const [cx, cy, cz] of targets) {
      const key = coordKey(cx, cy, cz);
      const prev = this.map.get(key);
      if (prev === undefined) continue;
      delta.push({ key, prev, next: null });
    }
    return this.commitDelta(delta);
  }

  fill(x: number, y: number, z: number, nextColor: string, maxFill = 400): boolean {
    const startKey = coordKey(x, y, z);
    const targetColor = this.map.get(startKey);
    if (!targetColor || targetColor === nextColor) return false;

    const queue: [number, number, number][] = [[x, y, z]];
    const visited = new Set<string>([startKey]);
    const delta: VoxelDeltaEntry[] = [];
    const dirs: [number, number, number][] = [
      [1, 0, 0],
      [-1, 0, 0],
      [0, 1, 0],
      [0, -1, 0],
      [0, 0, 1],
      [0, 0, -1],
    ];

    while (queue.length > 0 && delta.length < maxFill) {
      const [cx, cy, cz] = queue.shift()!;
      const key = coordKey(cx, cy, cz);
      delta.push({ key, prev: targetColor, next: nextColor });

      for (const [dx, dy, dz] of dirs) {
        const nx = cx + dx;
        const ny = cy + dy;
        const nz = cz + dz;
        if (!isInBounds(nx, ny, nz)) continue;
        const nKey = coordKey(nx, ny, nz);
        if (visited.has(nKey)) continue;
        if (this.map.get(nKey) === targetColor) {
          visited.add(nKey);
          queue.push([nx, ny, nz]);
        }
      }
    }

    return this.commitDelta(delta);
  }

  undo(): boolean {
    const delta = this.undoStack.pop();
    if (!delta) return false;
    for (let i = delta.length - 1; i >= 0; i--) {
      const { key, prev } = delta[i];
      if (prev === null) this.map.delete(key);
      else this.map.set(key, prev);
    }
    this.redoStack.push(delta);
    return true;
  }

  redo(): boolean {
    const delta = this.redoStack.pop();
    if (!delta) return false;
    for (const { key, next } of delta) {
      if (next === null) this.map.delete(key);
      else this.map.set(key, next);
    }
    this.undoStack.push(delta);
    return true;
  }

  clear(): boolean {
    if (this.map.size === 0) return false;
    const delta: VoxelDeltaEntry[] = [];
    for (const [key, prev] of this.map.entries()) {
      delta.push({ key, prev, next: null });
    }
    return this.commitDelta(delta);
  }
}
