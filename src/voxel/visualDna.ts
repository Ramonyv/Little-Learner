import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { BlockStyle } from './types';

/**
 * Centralized Jugnu Voxel Visual DNA configuration.
 * Shared by both the live interactive VoxelScene and the offscreen thumbnail renderer
 * so every 3D block, light, shadow, and camera angle stays visually consistent.
 */
export const JUGNU_VOXEL_DNA = {
  colors: {
    skyBackground: '#dff0ff',
    fogColor: '#dff0ff',
    gridCenter: '#93c5fd',
    gridLines: '#c7e2ff',
    contactShadowHex: '#1e3a5f',
  },
  geometry: {
    blockSize: 0.955, // Leaves a consistent 0.045 toy-brick seam between blocks
    bevelSegments: 2, // 300 tris/block — benchmarked for 60fps on iPad/mobile up to 3,000 blocks
    bevelRadius: 0.105, // Subtle candy-clay chamfer without looking blobby
    styles: {
      classic: { blockSize: 0.96, bevelSegments: 1, bevelRadius: 0.03 },
      rounded: { blockSize: 0.955, bevelSegments: 2, bevelRadius: 0.105 },
      soft: { blockSize: 0.95, bevelSegments: 3, bevelRadius: 0.22 },
    },
  },
  material: {
    baseColor: 0xffffff, // Required so InstancedMesh instanceColor multiplies accurately
    roughness: 0.78, // Soft velvety matte clay (avoids plastic gloss)
    metalness: 0.0,
    guideOpacity: 0.28,
    hoverOpacity: 0.42,
  },
  lighting: {
    ambient: { color: 0xffffff, intensity: 0.78 },
    hemisphere: { skyColor: 0xffffff, groundColor: 0xdbeafe, intensity: 0.85 },
    key: {
      color: 0xfffaf2,
      intensity: 0.82,
      position: [14, 22, 16] as const,
      shadowMapSize: 512, // Lightweight floor-only shadow map for mobile/iPad speed
      shadowBias: -0.0005,
    },
    fill: {
      color: 0xe0f2fe,
      intensity: 0.45,
      position: [-14, 10, -12] as const,
    },
  },
  shadows: {
    voxelCastShadow: true,
    voxelReceiveShadow: false, // Prevents dark muddy self-shadowing in crevices
    floorShadowOpacity: 0.09,
    contactGlowOpacity: 0.14,
  },
  camera: {
    frustumSize: 15,
    near: 0.1,
    far: 120,
    defaultPosition: [18, 15.5, 18] as const,
    defaultTarget: [-0.5, 2.2, -0.5] as const,
    minZoom: 0.65,
    maxZoom: 2.8,
    dampingFactor: 0.08,
    maxPolarAngle: Math.PI / 2 - 0.04,
  },
  renderer: {
    maxPixelRatio: 2,
    outputColorSpace: THREE.SRGBColorSpace,
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 1.0,
  },
} as const;

export function createCandyVoxelGeometry(style: BlockStyle = 'rounded'): THREE.BufferGeometry {
  const { blockSize, bevelSegments, bevelRadius } = JUGNU_VOXEL_DNA.geometry.styles[style];
  return new RoundedBoxGeometry(blockSize, blockSize, blockSize, bevelSegments, bevelRadius);
}

export function createCandyClayMaterial(): THREE.MeshStandardMaterial {
  const { baseColor, roughness, metalness } = JUGNU_VOXEL_DNA.material;
  return new THREE.MeshStandardMaterial({
    color: baseColor,
    roughness,
    metalness,
  });
}

export function applyStudioLighting(scene: THREE.Scene, withFloorShadow = true): void {
  const { ambient, hemisphere, key, fill } = JUGNU_VOXEL_DNA.lighting;

  scene.add(new THREE.AmbientLight(ambient.color, ambient.intensity));
  scene.add(new THREE.HemisphereLight(hemisphere.skyColor, hemisphere.groundColor, hemisphere.intensity));

  const keyLight = new THREE.DirectionalLight(key.color, key.intensity);
  keyLight.position.set(...key.position);
  if (withFloorShadow) {
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(key.shadowMapSize, key.shadowMapSize);
    keyLight.shadow.camera.near = 2;
    keyLight.shadow.camera.far = 55;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    keyLight.shadow.bias = key.shadowBias;
  }
  scene.add(keyLight);

  const fillLight = new THREE.DirectionalLight(fill.color, fill.intensity);
  fillLight.position.set(...fill.position);
  scene.add(fillLight);
}

export function createSoftContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const half = size / 2;
  const grad = ctx.createRadialGradient(half, half, size * 0.08, half, half, half);
  grad.addColorStop(0, 'rgba(30, 58, 95, 0.36)');
  grad.addColorStop(0.55, 'rgba(30, 58, 95, 0.14)');
  grad.addColorStop(1, 'rgba(30, 58, 95, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
