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

export function buildDiwaliScene(stageWidth: number, stageHeight: number): ProceduralSceneHandle {
  const group = new THREE.Group();
  const layers: SceneLayer[] = [];

  // 1. Warm indigo-plum night sky + gentle fireworks
  const skyTex = makeLayerTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.65, '#4c1d95');
    grad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Soft golden firework bursts
    const bursts = [
      [220, 120, '#fde047'],
      [780, 105, '#fb7185'],
      [510, 85, '#38bdf8'],
    ] as const;
    for (const [bx, by, col] of bursts) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(bx + Math.cos(a) * 10, by + Math.sin(a) * 10);
        ctx.lineTo(bx + Math.cos(a) * 42, by + Math.sin(a) * 42);
        ctx.stroke();
      }
    }
  });

  // 2. Floating lanterns
  const lanternTex = makeLayerTexture((ctx) => {
    const lanterns = [
      [140, 190],
      [380, 145],
      [640, 180],
      [900, 135],
    ];
    for (const [lx, ly] of lanterns) {
      ctx.fillStyle = 'rgba(251, 146, 60, 0.28)';
      ctx.beginPath();
      ctx.arc(lx, ly, 32, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.roundRect(lx - 13, ly - 18, 26, 34, 8);
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(lx, ly + 4, 7, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Festive ground + glowing diyas at 18% from bottom
  const groundTex = makeLayerTexture((ctx, w, h) => {
    const groundTop = h * 0.82;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(0, groundTop, w, h - groundTop);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(0, groundTop, w, 8);

    // Glowing diyas along the ground
    for (let i = 0; i < 9; i++) {
      const dx = (i * 114 + 45) % w;
      const dy = groundTop + 14;
      ctx.fillStyle = 'rgba(253, 224, 71, 0.35)';
      ctx.beginPath();
      ctx.arc(dx, dy - 10, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(dx, dy, 13, 0, Math.PI);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(dx, dy - 9, 4.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const defs: [THREE.CanvasTexture, number, number][] = [
    [skyTex, -4, 0],
    [lanternTex, -2.5, 0.018],
    [groundTex, -1, 0.045],
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
