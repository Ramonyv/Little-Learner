import type { PaletteColor } from './types';

export const CANDY_PALETTE: PaletteColor[] = [
  { id: 'sun', name: 'Sunny Yellow', hex: '#FFC300' },
  { id: 'tangerine', name: 'Tangerine', hex: '#FB8500' },
  { id: 'berry', name: 'Berry Red', hex: '#FF4D6D' },
  { id: 'grape', name: 'Grape Purple', hex: '#C77DFF' },
  { id: 'royal', name: 'Royal Blue', hex: '#4361EE' },
  { id: 'sky', name: 'Sky Blue', hex: '#38BDF8' },
  { id: 'meadow', name: 'Meadow Green', hex: '#22C55E' },
  { id: 'lime', name: 'Lime Leaf', hex: '#9EF01A' },
  { id: 'cream', name: 'Warm Cream', hex: '#FFE8C2' },
  { id: 'wood', name: 'Cocoa Wood', hex: '#9A5B25' },
  { id: 'navy', name: 'Midnight Navy', hex: '#1E293B' },
  { id: 'black', name: 'Charcoal Black', hex: '#111827' },
  { id: 'white', name: 'Cloud White', hex: '#FFFFFF' },
];

export interface PalettePack {
  id: 'candy' | 'ocean' | 'jungle';
  label: string;
  colors: PaletteColor[];
}

export const VOXEL_PALETTE_PACKS: PalettePack[] = [
  {
    id: 'candy',
    label: 'Candy',
    colors: CANDY_PALETTE,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    colors: [
      { id: 'deep', name: 'Deep Sea', hex: '#0F172A' },
      { id: 'cobalt', name: 'Ocean Blue', hex: '#1D4ED8' },
      { id: 'aqua', name: 'Aqua Wave', hex: '#06B6D4' },
      { id: 'lagoon', name: 'Lagoon Mint', hex: '#2DD4BF' },
      { id: 'coral', name: 'Coral Reef', hex: '#FB7185' },
      { id: 'shell', name: 'Seashell Pink', hex: '#FBCFE8' },
      { id: 'sand', name: 'Warm Sand', hex: '#FDE68A' },
      { id: 'pearl', name: 'Pearl White', hex: '#FFFFFF' },
      { id: 'kelp', name: 'Sea Kelp', hex: '#10B981' },
      { id: 'treasure', name: 'Treasure Gold', hex: '#F59E0B' },
    ],
  },
  {
    id: 'jungle',
    label: 'Jungle',
    colors: [
      { id: 'canopy', name: 'Canopy Green', hex: '#15803D' },
      { id: 'fern', name: 'Fern Leaf', hex: '#22C55E' },
      { id: 'sprout', name: 'Lime Sprout', hex: '#A3E635' },
      { id: 'bark', name: 'Tree Bark', hex: '#78350F' },
      { id: 'earth', name: 'Warm Earth', hex: '#B45309' },
      { id: 'mango', name: 'Mango', hex: '#F59E0B' },
      { id: 'hibiscus', name: 'Hibiscus', hex: '#EF4444' },
      { id: 'orchid', name: 'Wild Orchid', hex: '#D946EF' },
      { id: 'river', name: 'River Blue', hex: '#38BDF8' },
      { id: 'panther', name: 'Panther Black', hex: '#111827' },
      { id: 'ivory', name: 'Ivory', hex: '#FFFBEB' },
    ],
  },
];
