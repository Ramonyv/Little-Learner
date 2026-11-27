export type GridSize = 8 | 16 | 32 | 64;

export type PixelTool = 'draw' | 'erase' | 'fill' | 'eyedropper' | 'shape' | 'stamp' | 'select';

export type MirrorMode = 'none' | 'x' | 'y' | 'both';

export type ShapeKind = 'line' | 'rect' | 'circle';

export interface CellCoord {
  x: number;
  y: number;
}

export interface PixelDiff {
  index: number;
  prev: number;
  next: number;
}

export interface PixelColor {
  id: string;
  name: string;
  hex: string;
}

export interface PixelPalettePack {
  id: string;
  name: string;
  colors: PixelColor[];
}

export interface PixelStamp {
  id: string;
  name: string;
  emoji: string;
  rows: string[];
}

export interface PixelDocument {
  id: string;
  title: string;
  size: GridSize;
  paletteId: string;
  pixels: number[];
  updatedAt: number;
  templateId?: string;
}
