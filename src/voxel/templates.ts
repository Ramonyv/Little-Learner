import type { TemplateBlueprint, VoxelTuple } from './types';

const fillBox = (
  x0: number,
  y0: number,
  z0: number,
  x1: number,
  y1: number,
  z1: number,
  color: string,
  out: VoxelTuple[],
) => {
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      for (let z = z0; z <= z1; z++) {
        out.push([x, y, z, color]);
      }
    }
  }
};

function buildHouse(): VoxelTuple[] {
  const v: VoxelTuple[] = [];
  // Grass & soil base
  fillBox(-4, 0, -4, 3, 0, 3, '#9A5B25', v);
  fillBox(-4, 1, -4, 3, 1, 3, '#9EF01A', v);
  // Cream cottage walls (hollowed cleanly)
  for (let x = -2; x <= 2; x++) {
    for (let z = -2; z <= 2; z++) {
      for (let y = 2; y <= 4; y++) {
        if (x === -2 || x === 2 || z === -2 || z === 2) {
          v.push([x, y, z, '#FFE8C2']);
        }
      }
    }
  }
  // Wooden front door & glowing windows
  const filtered = v.filter(([x, y, z]) => {
    if (z === 2 && x === 0 && (y === 2 || y === 3)) return false;
    if (z === 2 && x === -1 && y === 3) return false;
    if (z === 2 && x === 1 && y === 3) return false;
    if (x === 2 && z === 0 && y === 3) return false;
    return true;
  });
  filtered.push([0, 2, 2, '#9A5B25'], [0, 3, 2, '#9A5B25']);
  filtered.push([-1, 3, 2, '#FFC300'], [1, 3, 2, '#FFC300'], [2, 3, 0, '#FFC300']);

  // Pitched Berry-Red Roof
  fillBox(-3, 5, -3, 3, 5, 3, '#FF4D6D', filtered);
  fillBox(-2, 6, -2, 2, 6, 2, '#FF4D6D', filtered);
  fillBox(-1, 7, -1, 1, 7, 1, '#FF4D6D', filtered);
  // Chimney
  filtered.push([1, 8, -1, '#FB8500'], [1, 9, -1, '#FB8500']);
  // Little side tree
  filtered.push([-3, 2, 2, '#9A5B25'], [-3, 3, 2, '#9A5B25']);
  fillBox(-4, 4, 1, -2, 5, 3, '#22C55E', filtered);
  return filtered;
}

function buildTree(): VoxelTuple[] {
  const v: VoxelTuple[] = [];
  fillBox(-3, 0, -3, 2, 0, 2, '#9EF01A', v);
  fillBox(-1, 1, -1, 0, 4, 0, '#9A5B25', v);
  fillBox(-2, 5, -2, 1, 6, 1, '#22C55E', v);
  fillBox(-1, 7, -1, 0, 7, 0, '#9EF01A', v);
  // Little apples
  v.push([-2, 5, 1, '#FF4D6D'], [1, 6, -1, '#FF4D6D']);
  return v;
}

function buildCastle(): VoxelTuple[] {
  const v: VoxelTuple[] = [];
  fillBox(-4, 0, -4, 3, 0, 3, '#22C55E', v);
  // Stone keep walls
  for (let x = -3; x <= 2; x++) {
    for (let z = -3; z <= 2; z++) {
      for (let y = 1; y <= 4; y++) {
        if (x === -3 || x === 2 || z === -3 || z === 2) {
          v.push([x, y, z, '#94A3B8']);
        }
      }
    }
  }
  // 4 Corner Towers + Purple Flags
  const corners: [number, number][] = [[-3, -3], [2, -3], [-3, 2], [2, 2]];
  for (const [cx, cz] of corners) {
    v.push([cx, 5, cz, '#94A3B8'], [cx, 6, cz, '#C77DFF'], [cx, 7, cz, '#FFC300']);
  }
  return v;
}

function buildCar(): VoxelTuple[] {
  const v: VoxelTuple[] = [];
  // Wheels
  v.push([-2, 0, -2, '#334155'], [2, 0, -2, '#334155'], [-2, 0, 1, '#334155'], [2, 0, 1, '#334155']);
  // Red body
  fillBox(-3, 1, -2, 3, 1, 1, '#FF4D6D', v);
  // Cabin & sky-blue windshield
  fillBox(-1, 2, -2, 1, 2, 1, '#38BDF8', v);
  fillBox(-1, 3, -2, 1, 3, 1, '#FF4D6D', v);
  // Headlights
  v.push([3, 1, -2, '#FFC300'], [3, 1, 1, '#FFC300']);
  return v;
}

function buildPenguin(): VoxelTuple[] {
  const v: VoxelTuple[] = [];
  // Orange feet
  v.push([-1, 0, 1, '#FB8500'], [1, 0, 1, '#FB8500']);
  // Body
  fillBox(-2, 1, -1, 1, 4, 1, '#334155', v);
  // White belly
  const body = v.filter(([x, y, z]) => !(z === 1 && (x === -1 || x === 0) && y >= 1 && y <= 3));
  fillBox(-1, 1, 1, 0, 3, 1, '#FFE8C2', body);
  // Head & Beak
  fillBox(-1, 5, -1, 0, 6, 1, '#334155', body);
  body.push([-1, 5, 2, '#FFC300'], [0, 5, 2, '#FFC300']);
  return body;
}

function buildRobot(): VoxelTuple[] {
  const v: VoxelTuple[] = [];
  // Legs
  v.push([-2, 0, 0, '#4361EE'], [-2, 1, 0, '#94A3B8'], [1, 0, 0, '#4361EE'], [1, 1, 0, '#94A3B8']);
  // Torso
  fillBox(-2, 2, -1, 1, 4, 1, '#94A3B8', v);
  v.push([-1, 3, 1, '#FFC300'], [0, 3, 1, '#FF4D6D']);
  // Head & glowing eyes + antenna
  fillBox(-2, 5, -1, 1, 7, 1, '#38BDF8', v);
  v.push([-1, 6, 2, '#FFC300'], [0, 6, 2, '#FFC300'], [-1, 8, 0, '#FB8500']);
  return v;
}

export const VOXEL_TEMPLATES: TemplateBlueprint[] = [
  { id: 'house', name: 'House', emoji: '🏠', badgeBg: 'bg-amber-50 border-amber-300', voxels: buildHouse() },
  { id: 'castle', name: 'Castle', emoji: '🏰', badgeBg: 'bg-purple-50 border-purple-200', voxels: buildCastle() },
  { id: 'tree', name: 'Tree', emoji: '🌳', badgeBg: 'bg-emerald-50 border-emerald-200', voxels: buildTree() },
  { id: 'car', name: 'Car', emoji: '🚗', badgeBg: 'bg-rose-50 border-rose-200', voxels: buildCar() },
  { id: 'penguin', name: 'Animal', emoji: '🐧', badgeBg: 'bg-sky-50 border-sky-200', voxels: buildPenguin() },
  { id: 'robot', name: 'Robot', emoji: '🤖', badgeBg: 'bg-indigo-50 border-indigo-200', voxels: buildRobot() },
];
