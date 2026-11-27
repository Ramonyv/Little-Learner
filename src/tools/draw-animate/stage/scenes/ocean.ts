import * as THREE from 'three';
import type { ProceduralSceneHandle, SceneLayer } from './meadow';

function makeLayerTexture(draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  draw(ctx, canvas.width, canvas.height);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}

export function buildOceanScene(stageWidth: number, stageHeight: number): ProceduralSceneHandle {
  const group = new THREE.Group();
  const layers: SceneLayer[] = [];

  // 1. Underwater gradient + light rays
  const waterTex = makeLayerTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(0.55, '#0284c7');
    grad.addColorStop(1, '#0f766e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft light rays from surface
    ctx.fillStyle = 'rgba(224, 242, 254, 0.14)';
    for (let i = 0; i < 4; i++) {
      const rx = 120 + i * 240;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 85, 0);
      ctx.lineTo(rx + 185, h);
      ctx.lineTo(rx + 55, h);
      ctx.closePath();
      ctx.fill();
    }
  });

  // 2. Distant coral reef silhouettes
  const farCoralTex = makeLayerTexture((ctx, _w, h) => {
    const groundTop = h * 0.82;
    ctx.fillStyle = 'rgba(13, 148, 136, 0.55)';
    for (let i = 0; i < 8; i++) {
      const cx = i * 135 + 40;
      const ch = 60 + (i % 3) * 28;
      ctx.beginPath();
      ctx.roundRect(cx, groundTop - ch, 26, ch + 10, 13);
      ctx.roundRect(cx + 22, groundTop - ch * 0.7, 20, ch * 0.7 + 10, 10);
      ctx.fill();
    }
  });

  // 3. Sandy ocean floor + foreground coral
  const sandTex = makeLayerTexture((ctx, w, h) => {
    const groundTop = h * 0.82;
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(0, groundTop, w, h - groundTop);
    ctx.fillStyle = '#fcd34d';
    ctx.fillRect(0, groundTop, w, 10);

    const coralColors = ['#fb7185', '#f472b6', '#fb923c', '#34d399'];
    for (let i = 0; i < 10; i++) {
      const x = (i * 104 + 32) % w;
      ctx.fillStyle = coralColors[i % coralColors.length];
      ctx.beginPath();
      ctx.arc(x, groundTop + 4, 14, Math.PI, 0);
      ctx.fill();
    }
  });

  const defs: [THREE.CanvasTexture, number, number][] = [
    [waterTex, -4, 0],
    [farCoralTex, -2.5, 0.02],
    [sandTex, -1, 0.05],
  ];

  for (const [texture, z, speed] of defs) {
    const geo = new THREE.PlaneGeometry(stageWidth, stageHeight);
    const mat = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = z;
    group.add(mesh);
    layers.push({ mesh, texture, speed });
  }

  return {
    group,
    update: (dt) => {
      for (const layer of layers) {
        if (layer.speed > 0) {
          layer.texture.offset.x = (layer.texture.offset.x + layer.speed * dt) % 1;
        }
      }
    },
    dispose: () => {
      for (const layer of layers) {
        layer.mesh.geometry.dispose();
        (layer.mesh.material as THREE.Material).dispose();
        layer.texture.dispose();
      }
    },
  };
}
