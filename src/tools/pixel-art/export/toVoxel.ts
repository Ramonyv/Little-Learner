import { readWork, saveWork } from '../../../utils/localWork';
import { GRID_MAX_XZ, GRID_MAX_Y, GRID_MIN_XZ, isInBounds } from '../../../voxel/voxelStore';
import type { SavedVoxelWork, VoxelTuple } from '../../../voxel/types';
import type { GridSize, PixelColor } from '../engine/types';

/**
 * Converts a 2D pixel grid into a standing 3D Voxel sculpture and saves it
 * into Voxel Studio's active local workspace so /voxel-studio opens right on it.
 */
export function sendPixelArtToVoxelStudio(
  title: string,
  pixels: Uint8Array | number[],
  size: GridSize,
  palette: PixelColor[],
): number {
  const targetSpan = Math.min(size, 16);
  const step = size / targetSpan;
  const offset = Math.floor(targetSpan / 2);
  const voxels: VoxelTuple[] = [];

  for (let sy = 0; sy < targetSpan; sy++) {
    for (let sx = 0; sx < targetSpan; sx++) {
      const px = Math.min(size - 1, Math.floor(sx * step));
      const py = Math.min(size - 1, Math.floor(sy * step));
      const colorIdx = pixels[py * size + px];
      if (!colorIdx || colorIdx > palette.length) continue;

      const vx = Math.max(GRID_MIN_XZ, Math.min(GRID_MAX_XZ, sx - offset));
      const vy = Math.max(0, Math.min(GRID_MAX_Y, targetSpan - 1 - sy));
      const vz = 0;
      if (isInBounds(vx, vy, vz)) {
        voxels.push([vx, vy, vz, palette[colorIdx - 1].hex]);
      }
    }
  }

  const saved = readWork<[string, SavedVoxelWork][]>('ll-voxels', []);
  const entry: SavedVoxelWork = {
    id: 'voxel-studio-main',
    title: `${title} (3D)`,
    updatedAt: Date.now(),
    voxels,
  };
  const filtered = saved.filter(([k]) => k !== 'voxel-studio-main');
  saveWork('ll-voxels', [['voxel-studio-main', entry], ...filtered]);
  return voxels.length;
}
