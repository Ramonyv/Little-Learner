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
  private contactShadowMesh: THREE.Mesh;
  private contactShadowTex: THREE.CanvasTexture;
  private gridHelper: THREE.GridHelper;
  private groundPlaneMesh: THREE.Mesh;
  private raycaster = new THREE.Raycaster();
  private pointerNDC = new THREE.Vector2();

  private currentTool: VoxelTool = 'add';
  private activeColor = '#FFC300';
  private maxVisibleLayer = GRID_MAX_Y;
  private pointerDownPos: { x: number; y: number } | null = null;
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
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxPixelRatio));
    this.renderer.setSize(width, height);
    this.renderer.outputColorSpace = outputColorSpace;
    this.renderer.toneMapping = toneMapping;
    this.renderer.toneMappingExposure = toneMappingExposure;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...defaultTarget);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = JUGNU_VOXEL_DNA.camera.dampingFactor;
    this.controls.minZoom = JUGNU_VOXEL_DNA.camera.minZoom;
    this.controls.maxZoom = JUGNU_VOXEL_DNA.camera.maxZoom;
    this.controls.maxPolarAngle = JUGNU_VOXEL_DNA.camera.maxPolarAngle;
    this.controls.update();

    // Balanced pastel studio lighting
    applyStudioLighting(this.scene, true);

    // Subtle procedural sky clouds
    this.addClouds();

    // Soft directional floor shadow catcher
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 34),
      new THREE.ShadowMaterial({ opacity: JUGNU_VOXEL_DNA.shadows.floorShadowOpacity }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.001;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);

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

    // Subtle rounded ghost block preview before placement
    this.hoverMesh = new THREE.Mesh(
      this.voxelGeometry,
      new THREE.MeshBasicMaterial({
        color: this.activeColor,
        transparent: true,
        opacity: JUGNU_VOXEL_DNA.material.hoverOpacity,
        depthWrite: false,
      }),
    );
    this.hoverMesh.scale.setScalar(1.02);
    this.hoverMesh.visible = false;
    this.scene.add(this.hoverMesh);

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

  updateVoxels(voxels: VoxelTuple[], guideVoxels: VoxelTuple[] = []) {
    this.renderedCoords = [];
    let count = 0;
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;

    for (const [x, y, z, hex] of voxels) {
      if (y > this.maxVisibleLayer) continue;
      if (count >= MAX_VOXELS) break;
      this.dummy.position.set(x, y + 0.5, z);
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
  }

  capturePngDataUrl(): string {
    const prevHover = this.hoverMesh.visible;
    const prevGuide = this.guideMesh.visible;
    this.hoverMesh.visible = false;
    this.guideMesh.visible = false;
    this.renderer.render(this.scene, this.camera);
    const dataUrl = this.renderer.domElement.toDataURL('image/png');
    this.hoverMesh.visible = prevHover;
    this.guideMesh.visible = prevGuide;
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

  private handlePointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private handlePointerMove = (e: PointerEvent) => {
    const target = this.pickVoxelTarget(e.clientX, e.clientY);
    if (target) {
      this.hoverMesh.position.set(target.x, target.y + 0.5, target.z);
      this.hoverMesh.visible = true;
    } else {
      this.hoverMesh.visible = false;
    }
  };

  private handlePointerUp = (e: PointerEvent) => {
    if (!this.pointerDownPos) return;
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    this.pointerDownPos = null;
    if (Math.hypot(dx, dy) > 6) return;

    const target = this.pickVoxelTarget(e.clientX, e.clientY);
    if (target) {
      this.onBlockAction(target);
    }
  };

  private handlePointerLeave = () => {
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
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  dispose() {
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
    (this.hoverMesh.material as THREE.Material).dispose();
    this.renderer.dispose();
    if (dom.parentElement === this.container) {
      this.container.removeChild(dom);
    }
  }
}
