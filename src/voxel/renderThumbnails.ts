import * as THREE from 'three';
import type { TemplateBlueprint } from './types';
import {
  JUGNU_VOXEL_DNA,
  applyStudioLighting,
  createCandyClayMaterial,
  createCandyVoxelGeometry,
  createSoftContactShadowTexture,
} from './visualDna';

const cachedThumbnails: Record<string, string> = {};

/**
 * Renders crisp 3D isometric thumbnails for all Build Together templates using
 * a single transient offscreen WebGLRenderer + Jugnu Visual DNA, then immediately disposes it.
 */
export function renderTemplateThumbnails(templates: TemplateBlueprint[]): Record<string, string> {
  const missing = templates.filter((t) => !cachedThumbnails[t.id]);
  if (missing.length === 0) return { ...cachedThumbnails };

  try {
    const size = 144;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(1);
    renderer.setSize(size, size);
    renderer.outputColorSpace = JUGNU_VOXEL_DNA.renderer.outputColorSpace;
    renderer.toneMapping = JUGNU_VOXEL_DNA.renderer.toneMapping;
    renderer.toneMappingExposure = JUGNU_VOXEL_DNA.renderer.toneMappingExposure;

    const scene = new THREE.Scene();
    applyStudioLighting(scene, false);

    const geometry = createCandyVoxelGeometry();
    const material = createCandyClayMaterial();
    const shadowTex = createSoftContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.16,
        depthWrite: false,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    scene.add(shadowPlane);

    const camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 100);
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (const tpl of missing) {
      const mesh = new THREE.InstancedMesh(geometry, material, tpl.voxels.length);
      let minX = Infinity, maxX = -Infinity;
      let minY = Infinity, maxY = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;

      tpl.voxels.forEach(([x, y, z, hex], idx) => {
        dummy.position.set(x, y + 0.5, z);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        color.set(hex);
        mesh.setColorAt(idx, color);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      scene.add(mesh);

      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY + 1) / 2;
      const cz = (minZ + maxZ) / 2;
      const span = Math.max(maxX - minX + 1, maxY - minY + 1, maxZ - minZ + 1);
      const half = span * 0.78;
      camera.left = -half;
      camera.right = half;
      camera.top = half;
      camera.bottom = -half;
      camera.position.set(cx + 14, cy + 11.5, cz + 14);
      camera.lookAt(cx, cy, cz);
      camera.updateProjectionMatrix();

      shadowPlane.position.set(cx, minY + 0.002, cz);
      shadowPlane.scale.set(Math.max(4, maxX - minX + 3), Math.max(4, maxZ - minZ + 3), 1);

      renderer.render(scene, camera);
      cachedThumbnails[tpl.id] = renderer.domElement.toDataURL('image/png');
      scene.remove(mesh);
      mesh.dispose();
    }

    geometry.dispose();
    material.dispose();
    shadowTex.dispose();
    shadowPlane.geometry.dispose();
    (shadowPlane.material as THREE.Material).dispose();
    renderer.dispose();
  } catch {
    // Graceful fallback to emoji badges if offscreen WebGL is unavailable
  }

  return { ...cachedThumbnails };
}
