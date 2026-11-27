import * as THREE from 'three';

export interface SceneLayer {
  mesh: THREE.Mesh;
  texture: THREE.CanvasTexture;
  speed: number;
}

export interface ProceduralSceneHandle {
  group: THREE.Group;
  update: (dt: number, elapsed: number) => void;
  dispose: () => void;
}

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

export function buildMeadowScene(stageWidth: number, stageHeight: number): ProceduralSceneHandle {
  const group = new THREE.Group();
  const layers: SceneLayer[] = [];

  // 1. Sky backdrop
  const skyTex = makeLayerTexture((ctx, w, h) => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#60a5fa');
    grad.addColorStop(0.65, '#bae6fd');
    grad.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Warm sun top-right
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(w * 0.84, h * 0.2, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(253, 224, 71, 0.25)';
    ctx.beginPath();
    ctx.arc(w * 0.84, h * 0.2, 68, 0, Math.PI * 2);
    ctx.fill();
  });

  // 2. Drifting clouds
  const cloudTex = makeLayerTexture((ctx) => {
    const clouds = [
      [140, 105, 1],
      [430, 82, 0.85],
      [760, 120, 1.1],
      [940, 75, 0.75],
    ];
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (const [cx, cy, s] of clouds) {
      ctx.beginPath();
      ctx.arc(cx, cy, 26 * s, 0, Math.PI * 2);
      ctx.arc(cx + 26 * s, cy - 10 * s, 30 * s, 0, Math.PI * 2);
      ctx.arc(cx + 56 * s, cy, 24 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // 3. Rolling green hills
  const hillsTex = makeLayerTexture((ctx, w, h) => {
    ctx.fillStyle = '#86efac';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.68);
    ctx.quadraticCurveTo(w * 0.25, h * 0.5, w * 0.5, h * 0.66);
    ctx.quadraticCurveTo(w * 0.75, h * 0.8, w, h * 0.68);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
  });

  // 4. Foreground meadow ground (ground line at ~18% from bottom)
  const groundTex = makeLayerTexture((ctx, w, h) => {
    const groundTop = h * 0.82;
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, groundTop, w, h - groundTop);

    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, groundTop, w, 10);

    // Little flowers along the meadow
    const flowerColors = ['#facc15', '#f472b6', '#ffffff', '#fb923c'];
    for (let i = 0; i < 16; i++) {
      const fx = (i * 64 + 28) % w;
      const fy = groundTop + 18 + (i % 3) * 20;
      ctx.fillStyle = flowerColors[i % flowerColors.length];
      ctx.beginPath();
      ctx.arc(fx, fy, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  const defs: [THREE.CanvasTexture, number, number][] = [
    [skyTex, -4, 0],
    [cloudTex, -3, 0.015],
    [hillsTex, -2, 0.03],
    [groundTex, -1, 0.07],
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
