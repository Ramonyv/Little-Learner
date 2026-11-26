import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import type { Question3DSceneId } from '../types';
import {
  JUGNU_VOXEL_DNA,
  applyStudioLighting,
  createSoftContactShadowTexture,
} from './visualDna';

interface Question3DStageProps {
  sceneId: Question3DSceneId;
}

function makeClayMat(hex: string) {
  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(hex),
    roughness: JUGNU_VOXEL_DNA.material.roughness,
    metalness: JUGNU_VOXEL_DNA.material.metalness,
  });
}

function buildSceneGroup(sceneId: Question3DSceneId): THREE.Group {
  const group = new THREE.Group();

  if (sceneId === 'cube') {
    const geo = new RoundedBoxGeometry(2.3, 2.3, 2.3, 3, 0.24);
    const mesh = new THREE.Mesh(geo, makeClayMat('#FFC300'));
    mesh.position.y = 1.25;
    group.add(mesh);
  } else if (sceneId === 'sphere') {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1.35, 32, 24), makeClayMat('#FF4D6D'));
    mesh.position.y = 1.45;
    group.add(mesh);
  } else if (sceneId === 'cone') {
    const mesh = new THREE.Mesh(new THREE.ConeGeometry(1.3, 2.6, 32), makeClayMat('#FB8500'));
    mesh.position.y = 1.4;
    group.add(mesh);
  } else if (sceneId === 'cylinder') {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 2.4, 32), makeClayMat('#38BDF8'));
    mesh.position.y = 1.3;
    group.add(mesh);
  } else if (sceneId === 'triangle') {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.55, 3), makeClayMat('#22C55E'));
    mesh.position.y = 0.85;
    mesh.rotation.x = 0.35;
    group.add(mesh);
  } else if (sceneId === 'square') {
    const geo = new RoundedBoxGeometry(2.5, 0.5, 2.5, 2, 0.14);
    const mesh = new THREE.Mesh(geo, makeClayMat('#4361EE'));
    mesh.position.y = 0.85;
    mesh.rotation.x = 0.35;
    group.add(mesh);
  } else if (sceneId === 'rectangle') {
    const geo = new RoundedBoxGeometry(3.4, 0.5, 1.85, 2, 0.14);
    const mesh = new THREE.Mesh(geo, makeClayMat('#C77DFF'));
    mesh.position.y = 0.85;
    mesh.rotation.x = 0.35;
    group.add(mesh);
  } else if (sceneId === 'circle') {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.45, 36), makeClayMat('#FF4D6D'));
    mesh.position.y = 0.85;
    mesh.rotation.x = 0.35;
    group.add(mesh);
  } else if (sceneId === 'beads-9-6' || sceneId === 'beads-7-5') {
    const [leftCount, rightCount] = sceneId === 'beads-9-6' ? [9, 6] : [7, 5];
    const beadGeo = new THREE.SphereGeometry(0.28, 20, 16);
    const matA = makeClayMat('#FFC300');
    const matB = makeClayMat('#FF4D6D');
    const placeCluster = (count: number, offsetX: number, mat: THREE.Material) => {
      const cols = 3;
      for (let i = 0; i < count; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const m = new THREE.Mesh(beadGeo, mat);
        m.position.set(offsetX + (col - 1) * 0.68, 0.45 + row * 0.62, 0);
        group.add(m);
      }
    };
    placeCluster(leftCount, -1.35, matA);
    placeCluster(rightCount, 1.35, matB);
  } else if (sceneId === 'clock-4' || sceneId === 'clock-3') {
    const frame = new THREE.Mesh(new THREE.CylinderGeometry(1.65, 1.65, 0.38, 36), makeClayMat('#4361EE'));
    frame.rotation.x = Math.PI / 2;
    frame.position.y = 1.65;
    group.add(frame);

    const face = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.42, 0.42, 36), makeClayMat('#FFFDF7'));
    face.rotation.x = Math.PI / 2;
    face.position.y = 1.65;
    group.add(face);

    const minuteHand = new THREE.Mesh(
      new RoundedBoxGeometry(0.12, 1.05, 0.14, 1, 0.03),
      makeClayMat('#172951'),
    );
    minuteHand.position.set(0, 1.65 + 0.48, 0.22);
    group.add(minuteHand);

    const hourAngle = sceneId === 'clock-4' ? -Math.PI / 6 - Math.PI / 2 : 0; // 4 o'clock vs 3 o'clock
    const hourGroup = new THREE.Group();
    hourGroup.position.set(0, 1.65, 0.25);
    const hourHand = new THREE.Mesh(
      new RoundedBoxGeometry(0.75, 0.15, 0.14, 1, 0.03),
      makeClayMat('#FF4D6D'),
    );
    hourHand.position.x = 0.34;
    hourGroup.add(hourHand);
    hourGroup.rotation.z = hourAngle;
    group.add(hourGroup);
  } else if (sceneId === 'saturn') {
    const planet = new THREE.Mesh(new THREE.SphereGeometry(1.15, 28, 22), makeClayMat('#FDE68A'));
    planet.position.y = 1.5;
    group.add(planet);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.85, 0.18, 14, 48), makeClayMat('#38BDF8'));
    ring.position.y = 1.5;
    ring.rotation.x = Math.PI / 2.4;
    ring.rotation.y = 0.3;
    group.add(ring);
  } else if (sceneId === 'earth') {
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(1.35, 32, 24), makeClayMat('#38BDF8'));
    ocean.position.y = 1.5;
    group.add(ocean);
    const landMat = makeClayMat('#22C55E');
    const patch1 = new THREE.Mesh(new THREE.SphereGeometry(0.65, 16, 12), landMat);
    patch1.position.set(0.65, 1.75, 0.78);
    const patch2 = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), landMat);
    patch2.position.set(-0.7, 1.35, 0.82);
    group.add(patch1, patch2);
  } else if (sceneId === 'sun') {
    const core = new THREE.Mesh(new THREE.SphereGeometry(1.25, 28, 22), makeClayMat('#FFC300'));
    core.position.y = 1.55;
    group.add(core);
    const rayGeo = new RoundedBoxGeometry(0.32, 0.6, 0.32, 1, 0.08);
    const rayMat = makeClayMat('#FB8500');
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const ray = new THREE.Mesh(rayGeo, rayMat);
      ray.position.set(Math.cos(angle) * 1.65, 1.55 + Math.sin(angle) * 1.65, 0);
      ray.rotation.z = angle - Math.PI / 2;
      group.add(ray);
    }
  } else if (sceneId === 'coins') {
    const coinGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.18, 24);
    const gold = makeClayMat('#FFC300');
    const copper = makeClayMat('#FB8500');
    [0, 0.2, 0.4].forEach((y, i) => {
      const c = new THREE.Mesh(coinGeo, i % 2 === 0 ? gold : copper);
      c.position.set(-0.6, 0.25 + y, 0);
      group.add(c);
    });
    [0, 0.2].forEach((y) => {
      const c = new THREE.Mesh(coinGeo, gold);
      c.position.set(0.65, 0.25 + y, 0.2);
      group.add(c);
    });
  } else if (sceneId === 'ruler') {
    const body = new THREE.Mesh(
      new RoundedBoxGeometry(3.4, 0.28, 0.9, 2, 0.06),
      makeClayMat('#FFC300'),
    );
    body.position.y = 0.6;
    body.rotation.x = 0.3;
    const tickMat = makeClayMat('#172951');
    const tickGeo = new RoundedBoxGeometry(0.08, 0.08, 0.3, 1, 0.02);
    for (let i = -3; i <= 3; i++) {
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(i * 0.45, 0.15, -0.25);
      body.add(tick);
    }
    group.add(body);
  } else if (sceneId === 'balance') {
    const base = new THREE.Mesh(new RoundedBoxGeometry(1.8, 0.3, 1.1, 2, 0.08), makeClayMat('#4361EE'));
    base.position.y = 0.2;
    const post = new THREE.Mesh(new CylinderGeometrySafe(0.14, 0.14, 1.8), makeClayMat('#94A3B8'));
    post.position.y = 1.1;
    const beam = new THREE.Mesh(new RoundedBoxGeometry(2.8, 0.16, 0.2, 1, 0.04), makeClayMat('#FFC300'));
    beam.position.y = 1.95;
    beam.rotation.z = 0.15;
    const panGeo = new THREE.CylinderGeometry(0.55, 0.45, 0.16, 20);
    const panL = new THREE.Mesh(panGeo, makeClayMat('#FF4D6D'));
    panL.position.set(-1.2, -0.4, 0);
    const panR = new THREE.Mesh(panGeo, makeClayMat('#22C55E'));
    panR.position.set(1.2, -0.4, 0);
    beam.add(panL, panR);
    group.add(base, post, beam);
  } else if (sceneId === 'moon') {
    const moon = new THREE.Mesh(new THREE.SphereGeometry(1.3, 28, 22), makeClayMat('#FEF08A'));
    moon.position.y = 1.5;
    const craterMat = makeClayMat('#FDE047');
    const c1 = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), craterMat);
    c1.position.set(0.45, 1.8, 1.05);
    const c2 = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), craterMat);
    c2.position.set(-0.5, 1.2, 1.08);
    group.add(moon, c1, c2);
  } else if (sceneId === 'rainbow') {
    const colors = ['#FF4D6D', '#FB8500', '#FFC300', '#22C55E', '#38BDF8', '#4361EE', '#C77DFF'];
    colors.forEach((hex, idx) => {
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(1.8 - idx * 0.16, 0.08, 12, 32, Math.PI),
        makeClayMat(hex),
      );
      torus.position.y = 0.45;
      group.add(torus);
    });
  } else if (sceneId === 'cloud-rain') {
    const cloudMat = makeClayMat('#FFFFFF');
    const sGeo = new THREE.SphereGeometry(0.65, 16, 14);
    [[-0.6, 1.85, 0, 0.85], [0, 2.05, 0, 1.05], [0.65, 1.85, 0, 0.8]].forEach(([x, y, z, s]) => {
      const m = new THREE.Mesh(sGeo, cloudMat);
      m.position.set(x, y, z);
      m.scale.setScalar(s);
      group.add(m);
    });
    const dropGeo = new THREE.SphereGeometry(0.14, 12, 10);
    const dropMat = makeClayMat('#38BDF8');
    [[-0.5, 1.0], [0, 0.75], [0.5, 1.05]].forEach(([x, y]) => {
      const d = new THREE.Mesh(dropGeo, dropMat);
      d.position.set(x, y, 0);
      d.scale.set(0.85, 1.35, 0.85);
      group.add(d);
    });
  } else if (sceneId === 'tree') {
    const trunk = new THREE.Mesh(new RoundedBoxGeometry(0.55, 1.4, 0.55, 2, 0.08), makeClayMat('#9A5B25'));
    trunk.position.y = 0.75;
    const crown1 = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.1, 1.8, 2, 0.18), makeClayMat('#22C55E'));
    crown1.position.y = 1.85;
    const crown2 = new THREE.Mesh(new RoundedBoxGeometry(1.2, 0.8, 1.2, 2, 0.16), makeClayMat('#9EF01A'));
    crown2.position.y = 2.6;
    group.add(trunk, crown1, crown2);
  } else if (sceneId === 'flower') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 12), makeClayMat('#22C55E'));
    stem.position.y = 0.8;
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.45, 18, 14), makeClayMat('#FFC300'));
    center.position.y = 1.75;
    const petalGeo = new THREE.SphereGeometry(0.36, 14, 12);
    const petalMat = makeClayMat('#FF4D6D');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const p = new THREE.Mesh(petalGeo, petalMat);
      p.position.set(Math.cos(a) * 0.65, 1.75 + Math.sin(a) * 0.65, 0);
      group.add(p);
    }
    group.add(stem, center);
  } else if (sceneId === 'apple') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.15, 24, 18), makeClayMat('#FF4D6D'));
    body.position.y = 1.3;
    body.scale.set(1.05, 0.92, 1.05);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 10), makeClayMat('#9A5B25'));
    stem.position.y = 2.4;
    const leaf = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.14, 0.3, 1, 0.06), makeClayMat('#22C55E'));
    leaf.position.set(0.3, 2.45, 0);
    leaf.rotation.z = 0.35;
    group.add(body, stem, leaf);
  } else if (sceneId === 'house') {
    const walls = new THREE.Mesh(new RoundedBoxGeometry(2.0, 1.4, 1.8, 2, 0.1), makeClayMat('#FFE8C2'));
    walls.position.y = 0.75;
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.75, 1.2, 4), makeClayMat('#FF4D6D'));
    roof.position.y = 2.05;
    roof.rotation.y = Math.PI / 4;
    const door = new THREE.Mesh(new RoundedBoxGeometry(0.55, 0.85, 0.18, 1, 0.04), makeClayMat('#9A5B25'));
    door.position.set(0, 0.48, 0.9);
    group.add(walls, roof, door);
  } else if (sceneId === 'car') {
    const chassis = new THREE.Mesh(new RoundedBoxGeometry(2.6, 0.75, 1.4, 2, 0.14), makeClayMat('#FF4D6D'));
    chassis.position.y = 0.7;
    const cabin = new THREE.Mesh(new RoundedBoxGeometry(1.4, 0.65, 1.2, 2, 0.12), makeClayMat('#38BDF8'));
    cabin.position.set(-0.1, 1.32, 0);
    const wheelGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.24, 18);
    const wheelMat = makeClayMat('#334155');
    [[-0.8, 0.7], [0.8, 0.7], [-0.8, -0.7], [0.8, -0.7]].forEach(([x, z]) => {
      const w = new THREE.Mesh(wheelGeo, wheelMat);
      w.rotation.x = Math.PI / 2;
      w.position.set(x, 0.36, z);
      group.add(w);
    });
    group.add(chassis, cabin);
  } else if (sceneId === 'book') {
    const cover = new THREE.Mesh(new RoundedBoxGeometry(2.3, 0.38, 1.7, 2, 0.08), makeClayMat('#4361EE'));
    cover.position.y = 0.65;
    cover.rotation.x = 0.25;
    const pages = new THREE.Mesh(new RoundedBoxGeometry(2.05, 0.32, 1.45, 1, 0.04), makeClayMat('#FFFDF7'));
    pages.position.set(0.08, 0.1, 0);
    cover.add(pages);
    group.add(cover);
  } else if (sceneId === 'pencil') {
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 2.2, 16), makeClayMat('#FFC300'));
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.65, 16), makeClayMat('#FFE8C2'));
    tip.position.y = 1.42;
    const eraser = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.35, 16), makeClayMat('#FF4D6D'));
    eraser.position.y = -1.25;
    const holder = new THREE.Group();
    holder.add(body, tip, eraser);
    holder.position.y = 1.45;
    holder.rotation.z = -0.45;
    group.add(holder);
  } else if (sceneId === 'flag-india') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 12), makeClayMat('#94A3B8'));
    pole.position.set(-0.9, 1.4, 0);
    const bandGeo = new RoundedBoxGeometry(1.75, 0.38, 0.12, 1, 0.03);
    const top = new THREE.Mesh(bandGeo, makeClayMat('#FB8500'));
    top.position.set(0.02, 2.45, 0);
    const mid = new THREE.Mesh(bandGeo, makeClayMat('#FFFFFF'));
    mid.position.set(0.02, 2.07, 0);
    const bot = new THREE.Mesh(bandGeo, makeClayMat('#22C55E'));
    bot.position.set(0.02, 1.69, 0);
    group.add(pole, top, mid, bot);
  } else if (sceneId === 'robot') {
    const body = new THREE.Mesh(new RoundedBoxGeometry(1.4, 1.2, 1.1, 2, 0.14), makeClayMat('#94A3B8'));
    body.position.y = 0.85;
    const head = new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.95, 1.0, 2, 0.14), makeClayMat('#38BDF8'));
    head.position.y = 2.0;
    const eyeGeo = new THREE.SphereGeometry(0.16, 12, 10);
    const eyeMat = makeClayMat('#FFC300');
    const e1 = new THREE.Mesh(eyeGeo, eyeMat);
    e1.position.set(-0.3, 2.05, 0.5);
    const e2 = new THREE.Mesh(eyeGeo, eyeMat);
    e2.position.set(0.3, 2.05, 0.5);
    group.add(body, head, e1, e2);
  } else if (sceneId === 'pattern-blocks') {
    const blockGeo = new RoundedBoxGeometry(0.7, 0.7, 0.7, 2, 0.1);
    const colors = ['#FFC300', '#38BDF8', '#FF4D6D'];
    [1, 2, 3].forEach((height, col) => {
      for (let row = 0; row < height; row++) {
        const b = new THREE.Mesh(blockGeo, makeClayMat(colors[col]));
        b.position.set((col - 1) * 0.85, 0.4 + row * 0.74, 0);
        group.add(b);
      }
    });
  } else if (sceneId === 'pattern-shapes') {
    const c1 = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.85, 0.85, 2, 0.12), makeClayMat('#FFC300'));
    c1.position.set(-1.1, 0.65, 0);
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 20, 16), makeClayMat('#FF4D6D'));
    s1.position.set(0, 0.65, 0);
    const c2 = new THREE.Mesh(new RoundedBoxGeometry(0.85, 0.85, 0.85, 2, 0.12), makeClayMat('#4361EE'));
    c2.position.set(1.1, 0.65, 0);
    group.add(c1, s1, c2);
  }

  return group;
}

class CylinderGeometrySafe extends THREE.CylinderGeometry {
  constructor(rt: number, rb: number, h: number) {
    super(rt, rb, h, 16);
  }
}

export function Question3DStage({ sceneId }: Question3DStageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(container.clientWidth, 260);
    const height = Math.max(container.clientHeight, 180);
    const aspect = width / height;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#cbe4fc');
    sceneRef.current = scene;

    const frustum = 5.4;
    const camera = new THREE.OrthographicCamera(
      (-frustum * aspect) / 2,
      (frustum * aspect) / 2,
      frustum / 2,
      -frustum / 2,
      0.1,
      60,
    );
    camera.position.set(6, 5, 7);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, JUGNU_VOXEL_DNA.renderer.maxPixelRatio));
    renderer.setSize(width, height);
    renderer.outputColorSpace = JUGNU_VOXEL_DNA.renderer.outputColorSpace;
    renderer.toneMapping = JUGNU_VOXEL_DNA.renderer.toneMapping;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.35, 0);
    controls.enableZoom = false;
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.6;
    controls.update();

    applyStudioLighting(scene, false);

    const shadowTex = createSoftContactShadowTexture();
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4.2, 4.2),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.22,
        depthWrite: false,
      }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.01;
    scene.add(shadowPlane);

    const ro = new ResizeObserver(() => {
      const w = Math.max(container.clientWidth, 1);
      const h = Math.max(container.clientHeight, 1);
      const asp = w / h;
      camera.left = (-frustum * asp) / 2;
      camera.right = (frustum * asp) / 2;
      camera.top = frustum / 2;
      camera.bottom = -frustum / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    let rafId = 0;
    const animate = () => {
      rafId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.dispose();
      shadowTex.dispose();
      shadowPlane.geometry.dispose();
      (shadowPlane.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // Swap only the 3D object group when advancing questions (zero WebGL context churn!)
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    if (modelGroupRef.current) {
      scene.remove(modelGroupRef.current);
      modelGroupRef.current.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }
    const nextGroup = buildSceneGroup(sceneId);
    modelGroupRef.current = nextGroup;
    scene.add(nextGroup);
  }, [sceneId]);

  return (
    <div className="relative w-full h-48 sm:h-56 rounded-3xl overflow-hidden bg-[#cbe4fc] border-2 border-blue-200/70 mb-5">
      <div
        ref={containerRef}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
        aria-label="Interactive 3D visual hint"
      />
      <span className="pointer-events-none absolute bottom-2.5 right-3 px-2.5 py-1 rounded-full bg-white/80 text-[11px] font-extrabold text-slate-700">
        Drag to spin 3D
      </span>
    </div>
  );
}
