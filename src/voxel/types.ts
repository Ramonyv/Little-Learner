export type VoxelTool = 'add' | 'paint' | 'erase' | 'fill' | 'select' | 'eyedropper';
export type SymmetryMode = 'none' | 'x' | 'z' | 'both';
export type BlockStyle = 'classic' | 'rounded' | 'soft';
export type CameraView = 'iso' | 'front' | 'side' | 'top';

export type VoxelTuple = [number, number, number, string];

export interface VoxelDeltaEntry {
  key: string;
  prev: string | null;
  next: string | null;
}

export interface PaletteColor {
  id: string;
  name: string;
  hex: string;
}

export interface TemplateBlueprint {
  id: string;
  name: string;
  emoji: string;
  badgeBg: string;
  voxels: VoxelTuple[];
}

export interface SavedVoxelWork {
  id: string;
  title: string;
  updatedAt: number;
  voxels: VoxelTuple[];
}
