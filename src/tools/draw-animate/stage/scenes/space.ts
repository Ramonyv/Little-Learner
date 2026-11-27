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

export function buildSpaceScene(stageWidth: number, stageHeight: number): ProceduralSceneHandle {
  const group = new THREE.Group();
  const layers: SceneLayer[] = [];

  // 1. Deep cosmos backdrop
  const spaceTex = makeLayerTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.6, '#1e1b4b');
    grad.addColorStop(1, '#312e81');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Twinkling stars
    for (let i = 0; i < 65; i++) {
      const sx = (i * 157 + 41) % w;
      const sy = (i * 97 + 23) % (h * 0.78);
      const r = (i % 3) + 1.2;
      ctx.fillStyle = i % 5 === 0 ? '#fde047' : '#e0f2fe';
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 2. Planets & shooting star layer
  const planetTex = makeLayerTexture((ctx) => {
    // Ringed pastel planet
    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(240, 130, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.ellipse(240, 134, 72, 16, -0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Small teal moon
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(780, 110, 26, 0, Math.PI * 2);
    ctx.fill();

    // Shooting star
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(560, 70);
    ctx.lineTo(630, 95);
    ctx.stroke();
  });

  // 3. Glowing moon surface at 18% from bottom
  const moonTex = makeLayerTexture((ctx, w, h) => {
    const groundTop = h * 0.82;
    ctx.fillStyle = '#c7d2fe';
    ctx.fillRect(0, groundTop, w, h - groundTop);
    ctx.fillStyle = '#a5b4fc';
    ctx.fillRect(0, groundTop, w, 10);

    // Moon craters
    ctx.fillStyle = '#818cf8';
    for (let i = 0; i < 8; i++) {
      const cx = (i * 128 + 54) % w;
      ctx.beginPath();
      ctx.ellipse(cx, groundTop + 34 + (i % 2) * 18, 28, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const defs: [THREE.CanvasTexture, number, number][] = [
    [spaceTex, -4, 0.005],
    [planetTex, -2.5, 0.015],
    [moonTex, -1, 0.04],
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
