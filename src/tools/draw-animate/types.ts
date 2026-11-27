export type DrawTool = 'draw' | 'erase' | 'fill' | 'colors' | 'stickers';

export type MoveKind = 'wiggle' | 'bounce' | 'walk' | 'fly' | 'swim' | 'dance';

export type SceneKind = 'meadow' | 'ocean' | 'space' | 'diwali';

export type AgeMode = 'little' | 'builder' | 'pro';

export interface CuratedColor {
  id: string;
  name: string;
  hex: string;
}

export interface PinPoint {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

export interface SavedAnimationWork {
  id: string;
  type: 'animation';
  title: string;
  drawingPngDataUrl: string;
  cropBounds: { x: number; y: number; w: number; h: number };
  move: MoveKind;
  speed: number;
  scene: SceneKind;
  pins: PinPoint[];
  createdAt: number;
  thumbnail: string;
}

export const QUICK_COLORS: CuratedColor[] = [
  { id: 'red', name: 'Cherry Red', hex: '#EF4444' },
  { id: 'orange', name: 'Tangerine', hex: '#F97316' },
  { id: 'yellow', name: 'Sunny Yellow', hex: '#FACC15' },
  { id: 'green', name: 'Grass Green', hex: '#22C55E' },
  { id: 'blue', name: 'Sky Blue', hex: '#087CF7' },
  { id: 'purple', name: 'Grape Purple', hex: '#9333EA' },
];

export const CURATED_COLORS: CuratedColor[] = [
  ...QUICK_COLORS,
  { id: 'pink', name: 'Bubblegum', hex: '#EC4899' },
  { id: 'magenta', name: 'Berry Pink', hex: '#DB2777' },
  { id: 'coral', name: 'Coral', hex: '#FB7185' },
  { id: 'amber', name: 'Golden', hex: '#F59E0B' },
  { id: 'lime', name: 'Lime', hex: '#84CC16' },
  { id: 'mint', name: 'Mint', hex: '#34D399' },
  { id: 'teal', name: 'Teal', hex: '#14B8A6' },
  { id: 'cyan', name: 'Aqua', hex: '#06B6D4' },
  { id: 'indigo', name: 'Indigo', hex: '#4F46E5' },
  { id: 'navy', name: 'Deep Navy', hex: '#1E3A8A' },
  { id: 'lavender', name: 'Lavender', hex: '#C084FC' },
  { id: 'peach', name: 'Peach', hex: '#FDBA74' },
  { id: 'tan', name: 'Warm Sand', hex: '#E5B887' },
  { id: 'sienna', name: 'Caramel', hex: '#B45309' },
  { id: 'brown', name: 'Chocolate', hex: '#78350F' },
  { id: 'slate', name: 'Slate', hex: '#64748B' },
  { id: 'black', name: 'Charcoal Black', hex: '#111827' },
  { id: 'white', name: 'Cloud White', hex: '#FFFFFF' },
];

export const MOVE_OPTIONS: { id: MoveKind; label: string; emoji: string }[] = [
  { id: 'wiggle', label: 'Wiggle', emoji: '〰️' },
  { id: 'bounce', label: 'Bounce', emoji: '🏀' },
  { id: 'walk', label: 'Walk', emoji: '🐾' },
  { id: 'fly', label: 'Fly', emoji: '🪽' },
  { id: 'swim', label: 'Swim', emoji: '🌊' },
  { id: 'dance', label: 'Dance', emoji: '🎵' },
];

export const SCENE_OPTIONS: {
  id: SceneKind;
  label: string;
  gradient: string;
  accent: string;
}[] = [
  {
    id: 'meadow',
    label: 'Meadow',
    gradient: 'from-[#7dd3fc] via-[#bae6fd] to-[#4ade80]',
    accent: '#22c55e',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    gradient: 'from-[#38bdf8] via-[#0284c7] to-[#0f766e]',
    accent: '#0ea5e9',
  },
  {
    id: 'space',
    label: 'Space',
    gradient: 'from-[#0f172a] via-[#1e1b4b] to-[#312e81]',
    accent: '#a855f7',
  },
  {
    id: 'diwali',
    label: 'Diwali Night',
    gradient: 'from-[#1e1b4b] via-[#581c87] to-[#f59e0b]',
    accent: '#f59e0b',
  },
];
