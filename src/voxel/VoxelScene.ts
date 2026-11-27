import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GRID_MAX_Y, GRID_MIN_XZ, GRID_MAX_XZ, MAX_VOXELS, isInBounds } from './voxelStore';
import {
  JUGNU_VOXEL_DNA,
  applyStudioLighting,
  createCandyClayMaterial,
  createCandyVoxelGeometry,
  createSoftContactShadowTexture,
} from './visualDna';
import type { BlockStyle, CameraView, VoxelTool, VoxelTuple } from './types';

export interface VoxelInteractionPayload {
  x: number;
  y: number;
  z: number;
  action?: 'erase';
}

export interface VoxelSceneOptions {
  container: HTMLElement;
  onBlockAction: (payload: VoxelInteractionPayload) => void;
}

export class VoxelSceneController {
  private container: HTMLElement;
  private onBlockAction: (payload: VoxelInteractionPayload) => void;

  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;

  private voxelGeometry: THREE.BufferGeometry;
  private voxelMaterial: THREE.MeshStandardMaterial;
  private voxelMesh: THREE.InstancedMesh;
  private renderedCoords: [number, number, number][] = [];

  private guideMaterial: THREE.MeshStandardMaterial;
  private guideMesh: THREE.InstancedMesh;

  private hoverMesh: THREE.Mesh;
  private hoverOutline: THREE.LineSegments;
  private nextGuideMesh: THREE.Mesh;
  private confettiMesh: THREE.InstancedMesh;
  private confettiParticles: Array<{
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
    life: number;
    maxLife: number;
  }> = [];
  private contactShadowMesh: THREE.Mesh;
  private contactShadowTex: THREE.CanvasTexture;
  private gridHelper: THREE.GridHelper;
  private groundPlaneMesh: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointerNDC = new THREE.Vector2();

  private currentTool: VoxelTool = 'add';
  private activeColor = '#FFC300';
  private maxVisibleLayer = GRID_MAX_Y;
  private prefersReducedMotion = false;
  private prevVoxelKeys = new Set<string>();
  private activeBounces = new Map<string, { index: number; start: number; x: number; y: number; z: number }>();
  private lastInteractionTime = performance.now();
  private celebrationSpinUntil = 0;
  private pointerDownPos: { x: number; y: number } | null = null;
  private pointerDownTime = 0;
  private longPressTimer: number | null = null;
  private longPressFired = false;
  private rafId = 0;
  private resizeObserver: ResizeObserver;

  private dummy = new THREE.Object3D();
  private tempColor = new THREE.Color();

  constructor({ container, onBlockAction }: VoxelSceneOptions) {
    this.container = container;
    this.onBlockAction = onBlockAction;

    const width = Math.max(container.clientWidth, 300);
    const height = Math.max(container.clientHeight, 300);
    const aspect = width / height;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(JUGNU_VOXEL_DNA.colors.skyBackground);
    this.scene.fog = new THREE.Fog(JUGNU_VOXEL_DNA.colors.fogColor, 36, 75);

    // Orthographic isometric camera (MagicaVoxel / toy diorama feel)
    const { frustumSize, near, far, defaultPosition, defaultTarget } = JUGNU_VOXEL_DNA.camera;
    this.camera = new THREE.OrthographicCamera(
      (-frustumSize * aspect) / 2,
      (frustumSize * aspect) / 2,
      frustumSize / 2,
      -frustumSize / 2,
      near,
      far,
    );
    this.camera.position.set(...defaultPosition);

    const { maxPixelRatio, outputColorSpace, toneMapping, toneMappingExposure } =
      JUGNU_VOXEL_DNA.renderer;
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    this.prefersReducedMotion = Boolean(prefersReducedMotion);
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, Math.min(maxPixelRatio, 2)));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = outputColorSpace;
    this.renderer.toneMapping = toneMapping;
    this.renderer.toneMappingExposure = toneMappingExposure;
    // Use lightweight fake contact shadow instead of expensive real-time shadow maps
    this.renderer.shadowMap.enabled = false;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...defaultTarget);
    this.controls.enableDamping = !prefersReducedMotion;
    this.controls.dampingFactor = JUGNU_VOXEL_DNA.camera.dampingFactor;
    this.controls.enablePan = true;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.minZoom = JUGNU_VOXEL_DNA.camera.minZoom;
    this.controls.maxZoom = JUGNU_VOXEL_DNA.camera.maxZoom;
    this.controls.maxPolarAngle = JUGNU_VOXEL_DNA.camera.maxPolarAngle;
    this.controls.update();

    // Balanced pastel studio lighting (no real-time shadow map needed)
    applyStudioLighting(this.scene, false);

    // Subtle procedural sky clouds
    this.addClouds();

    // Soft radial contact shadow directly beneath the model
    this.contactShadowTex = createSoftContactShadowTexture();
    this.contactShadowMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: this.contactShadowTex,
        transparent: true,
        opacity: JUGNU_VOXEL_DNA.shadows.contactGlowOpacity,
        depthWrite: false,
      }),
    );
    this.contactShadowMesh.rotation.x = -Math.PI / 2;
    this.contactShadowMesh.position.set(-0.5, 0.002, -0.5);
    this.contactShadowMesh.scale.set(10, 10, 1);
    this.scene.add(this.contactShadowMesh);

    // Invisible raycast plane for y=0 grid placement
    this.groundPlaneMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    this.groundPlaneMesh.rotation.x = -Math.PI / 2;
    this.groundPlaneMesh.position.set(-0.5, 0, -0.5);
    this.scene.add(this.groundPlaneMesh);

    this.gridHelper = new THREE.GridHelper(
      16,
      16,
      JUGNU_VOXEL_DNA.colors.gridCenter,
      JUGNU_VOXEL_DNA.colors.gridLines,
    );
    this.gridHelper.position.set(-0.5, 0.004, -0.5);
    const gridMat = this.gridHelper.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.55;
    this.scene.add(this.gridHelper);

    // Matte candy-clay rounded block geometry & material from Visual DNA
    this.voxelGeometry = createCandyVoxelGeometry();
    this.voxelMaterial = createCandyClayMaterial();

    this.voxelMesh = new THREE.InstancedMesh(this.voxelGeometry, this.voxelMaterial, MAX_VOXELS);
    this.voxelMesh.count = 0;
    this.voxelMesh.castShadow = JUGNU_VOXEL_DNA.shadows.voxelCastShadow;
    this.voxelMesh.receiveShadow = JUGNU_VOXEL_DNA.shadows.voxelReceiveShadow;
    this.scene.add(this.voxelMesh);

    // Translucent guided template ("Build Together") blocks
    this.guideMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0,
      transparent: true,
      opacity: JUGNU_VOXEL_DNA.material.guideOpacity,
      depthWrite: false,
    });
    this.guideMesh = new THREE.InstancedMesh(this.voxelGeometry, this.guideMaterial, MAX_VOXELS);
    this.guideMesh.count = 0;
    this.scene.add(this.guideMesh);

    // Subtle rounded ghost block preview + EdgesGeometry hover outline before placement
    this.hoverMesh = new THREE.Mesh(
      this.voxelGeometry,
      new THREE.MeshBasicMaterial({
        color: this.activeColor,
        transparent: true,
        opacity: JUGNU_VOXEL_DNA.material.hoverOpacity,
        depthWrite: false,
      }),
    );
    this.hoverOutline = new THREE.LineSegments(
      new THREE.EdgesGeometry(this.voxelGeometry, 24),
      new THREE.LineBasicMaterial({
        color: '#172951',
        transparent: true,
        opacity: 0.65,
      }),
    );
    this.hoverMesh.add(this.hoverOutline);
    this.hoverMesh.scale.setScalar(1.02);
    this.hoverMesh.visible = false;
    this.scene.add(this.hoverMesh);

    // Next-layer pulsing highlight for guided Ideas
    this.nextGuideMesh = new THREE.Mesh(
      this.voxelGeometry,
      new THREE.MeshBasicMaterial({
        color: '#FFC300',
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      }),
    );
    this.nextGuideMesh.scale.setScalar(1.05);
    this.nextGuideMesh.visible = false;
    this.scene.add(this.nextGuideMesh);

    // Pooled 24-particle InstancedMesh for block-place confetti
    const confettiGeo = new THREE.PlaneGeometry(0.16, 0.16);
    const confettiMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      depthWrite: false,
    });
    this.confettiMesh = new THREE.InstancedMesh(confettiGeo, confettiMat, 24);
    this.confettiMesh.count = 0;
    this.confettiMesh.frustumCulled = false;
    this.scene.add(this.confettiMesh);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.handlePointerDown);
    dom.addEventListener('pointermove', this.handlePointerMove);
    dom.addEventListener('pointerup', this.handlePointerUp);
    dom.addEventListener('pointerleave', this.handlePointerLeave);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    this.animate();
  }

  private addClouds() {
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0,
    });
    const sphereGeo = new THREE.SphereGeometry(1, 14, 14);
    const makeCloud = (x: number, y: number, z: number, scale: number) => {
      const group = new THREE.Group();
      const puffs: [number, number, number, number][] = [
        [0, 0, 0, 1.15],
        [-0.9, -0.15, 0, 0.85],
        [0.95, -0.2, 0.1, 0.8],
        [0.2, 0.45, -0.1, 0.9],
      ];
      for (const [px, py, pz, ps] of puffs) {
        const m = new THREE.Mesh(sphereGeo, cloudMat);
        m.position.set(px, py, pz);
        m.scale.setScalar(ps);
        group.add(m);
      }
      group.position.set(x, y, z);
      group.scale.setScalar(scale);
      this.scene.add(group);
    };
    makeCloud(-12, 10.5, -14, 1.25);
    makeCloud(12, 9, -13, 1.05);
  }

  setTool(tool: VoxelTool) {
    this.currentTool = tool;
    this.updateHoverAppearance();
  }

  setActiveColor(hex: string) {
    this.activeColor = hex;
    this.updateHoverAppearance();
  }

  setMaxVisibleLayer(layer: number) {
    this.maxVisibleLayer = layer;
  }

  setGridVisible(visible: boolean) {
    this.gridHelper.visible = visible;
  }

  setBlockStyle(style: BlockStyle) {
    const nextGeo = createCandyVoxelGeometry(style);
    const oldGeo = this.voxelGeometry;
    this.voxelGeometry = nextGeo;
    this.voxelMesh.geometry = nextGeo;
    this.guideMesh.geometry = nextGeo;
    this.hoverMesh.geometry = nextGeo;
    this.hoverOutline.geometry.dispose();
    this.hoverOutline.geometry = new THREE.EdgesGeometry(nextGeo, 24);
    oldGeo.dispose();
  }

  setGridSize(size: 8 | 12 | 16) {
    this.scene.remove(this.gridHelper);
    this.gridHelper.dispose();
    this.gridHelper = new THREE.GridHelper(
      size,
      size,
      JUGNU_VOXEL_DNA.colors.gridCenter,
      JUGNU_VOXEL_DNA.colors.gridLines,
    );
    this.gridHelper.position.set(-0.5, 0.004, -0.5);
    this.scene.add(this.gridHelper);

    this.groundPlaneMesh.geometry.dispose();
    this.groundPlaneMesh.geometry = new THREE.PlaneGeometry(size, size);
  }

  setCameraView(view: CameraView) {
    const target = this.controls.target;
    const dist = 24;
    if (view === 'iso') {
      const { defaultPosition, defaultTarget } = JUGNU_VOXEL_DNA.camera;
      this.camera.position.set(...defaultPosition);
      this.controls.target.set(...defaultTarget);
    } else if (view === 'front') {
      this.camera.position.set(target.x, target.y + 1.5, target.z + dist);
    } else if (view === 'side') {
      this.camera.position.set(target.x + dist, target.y + 1.5, target.z);
    } else if (view === 'top') {
      this.camera.position.set(target.x, target.y + dist, target.z + 0.01);
    }
    this.camera.updateProjectionMatrix();
    this.controls.update();
  }

  resetCamera() {
    const { defaultPosition, defaultTarget } = JUGNU_VOXEL_DNA.camera;
    this.camera.position.set(...defaultPosition);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(...defaultTarget);
    this.controls.update();
  }

  frameModel(voxels: VoxelTuple[]) {
    if (voxels.length === 0) {
      this.resetCamera();
      return;
    }
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    for (const [x, y, z] of voxels) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY + 1) / 2;
    const cz = (minZ + maxZ) / 2;
    const span = Math.max(maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1, 6);
    const zoom = Math.max(0.85, Math.min(1.55, 11.5 / span));

    const { defaultPosition } = JUGNU_VOXEL_DNA.camera;
    this.camera.position.set(cx + defaultPosition[0], cy + defaultPosition[1] - 2.2, cz + defaultPosition[2]);
    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(cx, cy, cz);
    this.controls.update();
  }

  triggerCelebrationSpin(durationMs = 1500) {
    if (this.prefersReducedMotion) return;
    this.celebrationSpinUntil = performance.now() + durationMs;
  }

  private spawnConfetti(x: number, y: number, z: number, hex: string) {
    if (this.prefersReducedMotion) return;
    const palette = [hex, '#FFC300', '#38BDF8', '#FF4D6D', '#22C55E'];
    this.confettiParticles = [];
    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + Math.random() * 0.3;
      const speed = 1.6 + Math.random() * 2.2;
      this.confettiParticles.push({
        x,
        y: y + 0.65,
        z,
        vx: Math.cos(angle) * speed,
        vy: 2.2 + Math.random() * 2.4,
        vz: Math.sin(angle) * speed,
        life: 0,
        maxLife: 0.38 + Math.random() * 0.18,
      });
      this.tempColor.set(palette[i % palette.length]);
      this.confettiMesh.setColorAt(i, this.tempColor);
    }
    if (this.confettiMesh.instanceColor) {
      this.confettiMesh.instanceColor.needsUpdate = true;
    }
  }

  updateVoxels(voxels: VoxelTuple[], guideVoxels: VoxelTuple[] = []) {
    this.renderedCoords = [];
    const nextKeys = new Set<string>();
    const newlyAdded: Array<{ key: string; index: number; x: number; y: number; z: number; hex: string }> = [];
    let count = 0;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const [x, y, z, hex] of voxels) {
      if (y > this.maxVisibleLayer) continue;
      if (count >= MAX_VOXELS) break;
      const key = `${x},${y},${z}`;
      nextKeys.add(key);
      if (this.prevVoxelKeys.size > 0 && !this.prevVoxelKeys.has(key)) {
        newlyAdded.push({ key, index: count, x, y, z, hex });
      }
      this.dummy.position.set(x, y + 0.5, z);
      this.dummy.scale.set(1, 1, 1);
      this.dummy.updateMatrix();
      this.voxelMesh.setMatrixAt(count, this.dummy.matrix);
      this.tempColor.set(hex);
      this.voxelMesh.setColorAt(count, this.tempColor);
      this.renderedCoords.push([x, y, z]);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (z < minZ) minZ = z;
      if (z > maxZ) maxZ = z;
      count++;
    }

    if (!this.prefersReducedMotion && newlyAdded.length > 0 && newlyAdded.length <= 8) {
      const now = performance.now();
      for (const item of newlyAdded) {
        this.activeBounces.set(item.key, {
          index: item.index,
          start: now,
          x: item.x,
          y: item.y,
          z: item.z,
        });
      }
      const first = newlyAdded[0];
      this.spawnConfetti(first.x, first.y, first.z, first.hex);
    }
    this.prevVoxelKeys = nextKeys;

    this.voxelMesh.count = count;
    this.voxelMesh.instanceMatrix.needsUpdate = true;
    if (this.voxelMesh.instanceColor) {
      this.voxelMesh.instanceColor.needsUpdate = true;
    }
    this.voxelMesh.computeBoundingSphere();

    // Update soft contact shadow footprint beneath the current build
    if (count > 0) {
      const spanX = Math.max(4, maxX - minX + 3.2);
      const spanZ = Math.max(4, maxZ - minZ + 3.2);
      this.contactShadowMesh.visible = true;
      this.contactShadowMesh.position.set((minX + maxX) / 2, 0.002, (minZ + maxZ) / 2);
      this.contactShadowMesh.scale.set(spanX, spanZ, 1);
    } else {
      this.contactShadowMesh.visible = false;
    }

    // Update guided template ghost blocks
    let guideCount = 0;
    for (const [x, y, z, hex] of guideVoxels) {
      if (y > this.maxVisibleLayer) continue;
      if (guideCount >= MAX_VOXELS) break;
      this.dummy.position.set(x, y + 0.5, z);
      this.dummy.updateMatrix();
      this.guideMesh.setMatrixAt(guideCount, this.dummy.matrix);
      this.tempColor.set(hex);
      this.guideMesh.setColorAt(guideCount, this.tempColor);
      guideCount++;
    }
    this.guideMesh.count = guideCount;
    this.guideMesh.instanceMatrix.needsUpdate = true;
    if (this.guideMesh.instanceColor) {
      this.guideMesh.instanceColor.needsUpdate = true;
    }
    this.guideMesh.computeBoundingSphere();

    // Highlight the next block on the lowest remaining layer
    if (guideVoxels.length > 0) {
      let minGuideY = Infinity;
      for (const [, gy] of guideVoxels) {
        if (gy < minGuideY) minGuideY = gy;
      }
      const nextBlock = guideVoxels.find(([, gy]) => gy === minGuideY);
      if (nextBlock) {
        this.nextGuideMesh.position.set(nextBlock[0], nextBlock[1] + 0.5, nextBlock[2]);
        this.nextGuideMesh.visible = true;
      } else {
        this.nextGuideMesh.visible = false;
      }
    } else {
      this.nextGuideMesh.visible = false;
    }
  }

  capturePngDataUrl(): string {
    const prevHover = this.hoverMesh.visible;
    const prevGuide = this.guideMesh.visible;
    const prevNextGuide = this.nextGuideMesh.visible;
    this.hoverMesh.visible = false;
    this.guideMesh.visible = false;
    this.nextGuideMesh.visible = false;
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    this.hoverMesh.visible = prevHover;
    this.guideMesh.visible = prevGuide;
    this.nextGuideMesh.visible = prevNextGuide;
    return dataUrl;
  }

  private updateHoverAppearance() {
    const mat = this.hoverMesh.material as THREE.MeshBasicMaterial;
    if (this.currentTool === 'erase') {
      mat.color.set('#ef4444');
    } else if (this.currentTool === 'add') {
      mat.color.set(this.activeColor);
    } else if (this.currentTool === 'select' || this.currentTool === 'eyedropper') {
      mat.color.set('#f59e0b');
    } else {
      mat.color.set('#3b82f6');
    }
  }

  private pickVoxelTarget(clientX: number, clientY: number): VoxelInteractionPayload | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);

    const hits = this.voxelMesh.count > 0 ? this.raycaster.intersectObject(this.voxelMesh, false) : [];
    if (hits.length > 0 && hits[0].instanceId !== undefined) {
      const hit = hits[0];
      const [bx, by, bz] = this.renderedCoords[hit.instanceId!];
      if (this.currentTool === 'add' && hit.face) {
        const nx = bx + Math.round(hit.face.normal.x);
        const ny = by + Math.round(hit.face.normal.y);
        const nz = bz + Math.round(hit.face.normal.z);
        return isInBounds(nx, ny, nz) ? { x: nx, y: ny, z: nz } : null;
      }
      return { x: bx, y: by, z: bz };
    }

    if (this.currentTool === 'add') {
      const groundHits = this.raycaster.intersectObject(this.groundPlaneMesh, false);
      if (groundHits.length > 0) {
        const pt = groundHits[0].point;
        const gx = Math.round(pt.x);
        const gz = Math.round(pt.z);
        const clampedX = Math.max(GRID_MIN_XZ, Math.min(GRID_MAX_XZ, gx));
        const clampedZ = Math.max(GRID_MIN_XZ, Math.min(GRID_MAX_XZ, gz));
        if (isInBounds(clampedX, 0, clampedZ)) {
          return { x: clampedX, y: 0, z: clampedZ };
        }
      }
    }

    return null;
  }

  private clearLongPress() {
    if (this.longPressTimer !== null) {
      window.clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private pickExistingVoxel(clientX: number, clientY: number): VoxelInteractionPayload | null {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNDC.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hits = this.voxelMesh.count > 0 ? this.raycaster.intersectObject(this.voxelMesh, false) : [];
    if (hits.length > 0 && hits[0].instanceId !== undefined) {
      const [bx, by, bz] = this.renderedCoords[hits[0].instanceId!];
      return { x: bx, y: by, z: bz };
    }
    return null;
  }

  private handlePointerDown = (e: PointerEvent) => {
    this.lastInteractionTime = performance.now();
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    if (!e.isPrimary) {
      this.clearLongPress();
      this.pointerDownPos = null;
      return;
    }
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    this.pointerDownTime = performance.now();
    this.longPressFired = false;
    this.clearLongPress();

    const startX = e.clientX;
    const startY = e.clientY;
    this.longPressTimer = window.setTimeout(() => {
      this.longPressTimer = null;
      const existing = this.pickExistingVoxel(startX, startY);
      if (existing) {
        this.longPressFired = true;
        this.hoverMesh.visible = false;
        this.onBlockAction({ ...existing, action: 'erase' });
      }
    }, 500);
  };

  private handlePointerMove = (e: PointerEvent) => {
    if (this.pointerDownPos) {
      const moved = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
      if (moved >= 6) {
        this.clearLongPress();
      }
    }
    const target = this.pickVoxelTarget(e.clientX, e.clientY);
    if (target) {
      this.hoverMesh.position.set(target.x, target.y + 0.5, target.z);
      this.hoverMesh.visible = true;
    } else {
      this.hoverMesh.visible = false;
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    this.clearLongPress();
    if (this.longPressFired) {
      this.longPressFired = false;
      this.pointerDownPos = null;
      return;
    }
    if (!this.pointerDownPos) return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    const elapsed = performance.now() - this.pointerDownTime;
    this.pointerDownPos = null;
    // Separate tap from drag: must move < 6px and finish within ~260ms
    if (Math.hypot(dx, dy) > 6 || elapsed > 260) return;

    const target = this.pickVoxelTarget(e.clientX, e.clientY);
    if (target) {
      this.onBlockAction(target);
    }
  };

  private handlePointerLeave = () => {
    this.clearLongPress();
    this.hoverMesh.visible = false;
    this.pointerDownPos = null;
  };

  private handleResize() {
    const width = Math.max(this.container.clientWidth, 1);
    const height = Math.max(this.container.clientHeight, 1);
    const aspect = width / height;
    const { frustumSize } = JUGNU_VOXEL_DNA.camera;
    this.camera.left = (-frustumSize * aspect) / 2;
    this.camera.right = (frustumSize * aspect) / 2;
    this.camera.top = frustumSize / 2;
    this.camera.bottom = -frustumSize / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    this.rafId = requestAnimationFrame(this.animate);
    const now = performance.now();

    // Squash-and-bounce newly placed voxels (~260ms)
    if (this.activeBounces.size > 0) {
      let updated = false;
      for (const [key, b] of this.activeBounces) {
        if (b.index >= this.voxelMesh.count) {
          this.activeBounces.delete(key);
          continue;
        }
        const t = Math.min(1, (now - b.start) / 260);
        let sy = 1;
        let sxz = 1;
        if (t < 1) {
          const wave = Math.sin(t * Math.PI * 1.5) * (1 - t);
          sy = 1 + wave * 0.28 - (t < 0.25 ? (0.25 - t) * 1.1 : 0);
          sxz = 1 / Math.sqrt(Math.max(0.55, sy));
        } else {
          this.activeBounces.delete(key);
        }
        this.dummy.position.set(b.x, b.y + 0.5 * sy, b.z);
        this.dummy.scale.set(sxz, sy, sxz);
        this.dummy.updateMatrix();
        this.voxelMesh.setMatrixAt(b.index, this.dummy.matrix);
        updated = true;
      }
      if (updated) {
        this.voxelMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // Pooled confetti burst
    if (this.confettiParticles.length > 0) {
      const dt = 0.016;
      const alive: typeof this.confettiParticles = [];
      for (let i = 0; i < this.confettiParticles.length; i++) {
        const p = this.confettiParticles[i];
        p.life += dt;
        if (p.life >= p.maxLife) continue;
        p.vy -= 9.5 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        const s = Math.max(0.1, 1 - p.life / p.maxLife);
        this.dummy.position.set(p.x, p.y, p.z);
        this.dummy.rotation.set(p.life * 8, p.life * 6, 0);
        this.dummy.scale.setScalar(s);
        this.dummy.updateMatrix();
        this.confettiMesh.setMatrixAt(alive.length, this.dummy.matrix);
        alive.push(p);
      }
      this.dummy.rotation.set(0, 0, 0);
      this.dummy.scale.setScalar(1);
      this.confettiParticles = alive;
      this.confettiMesh.count = alive.length;
      if (alive.length > 0) {
        this.confettiMesh.instanceMatrix.needsUpdate = true;
      }
    }

    // Pulsing glow on next guided block
    if (this.nextGuideMesh.visible && !this.prefersReducedMotion) {
      const mat = this.nextGuideMesh.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.42 + 0.32 * (0.5 + 0.5 * Math.sin(now * 0.006));
    }

    // Celebratory save spin or gentle idle turntable
    if (!this.prefersReducedMotion) {
      if (now < this.celebrationSpinUntil) {
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 8.0;
      } else if (now - this.lastInteractionTime > 5500 && this.renderedCoords.length > 0) {
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 0.8;
      } else {
        this.controls.autoRotate = false;
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
    this.clearLongPress();
    cancelAnimationFrame(this.rafId);
    this.resizeObserver.disconnect();
    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this.handlePointerDown);
    dom.removeEventListener('pointermove', this.handlePointerMove);
    dom.removeEventListener('pointerup', this.handlePointerUp);
    dom.removeEventListener('pointerleave', this.handlePointerLeave);
    this.controls.dispose();
    this.voxelGeometry.dispose();
    this.voxelMaterial.dispose();
    this.guideMaterial.dispose();
    this.contactShadowTex.dispose();
    (this.contactShadowMesh.material as THREE.Material).dispose();
    this.contactShadowMesh.geometry.dispose();
    this.hoverOutline.geometry.dispose();
    (this.hoverOutline.material as THREE.Material).dispose();
    (this.hoverMesh.material as THREE.Material).dispose();
    (this.nextGuideMesh.material as THREE.Material).dispose();
    this.confettiMesh.geometry.dispose();
    (this.confettiMesh.material as THREE.Material).dispose();
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
