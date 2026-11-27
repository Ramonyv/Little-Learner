import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CHARACTER_FRAGMENT_SHADER, CHARACTER_VERTEX_SHADER } from './shaders';
import { buildStageScene } from './scenes';
import type { ProceduralSceneHandle } from './scenes/meadow';
import { computeMoveTransform, createWalkState } from './moves';
import { StageParticlePool } from './particles';
import {
  playBoing,
  playBubbleBlip,
  playDanceBeatStep,
  playFlutter,
  playFootstepPop,
  playGiggle,
} from '../audio/sfx';
import type { MoveKind, PinPoint, SceneKind } from '../types';

const MOVE_TO_INT: Record<MoveKind, number> = {
  wiggle: 0,
  bounce: 1,
  walk: 2,
  fly: 3,
  swim: 4,
  dance: 5,
};

interface StageSceneProps {
  croppedCanvas: HTMLCanvasElement;
  cropAspect: number;
  move: MoveKind;
  speed: number;
  scene: SceneKind;
  paused: boolean;
  reducedMotion: boolean;
  pins?: PinPoint[];
  pinMode?: boolean;
  onAddPin?: (pin: PinPoint) => void;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onTapCharacter?: () => void;
}

export const StageScene: React.FC<StageSceneProps> = ({
  croppedCanvas,
  cropAspect,
  move,
  speed,
  scene,
  paused,
  reducedMotion,
  pins = [],
  pinMode = false,
  onAddPin,
  onCanvasReady,
  onTapCharacter,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const liveRef = useRef({
    move,
    speed,
    scene,
    paused,
    reducedMotion,
    pins,
    pinMode,
    onAddPin,
    onTapCharacter,
  });
  liveRef.current = {
    move,
    speed,
    scene,
    paused,
    reducedMotion,
    pins,
    pinMode,
    onAddPin,
    onTapCharacter,
  };

  const reactPulseRef = useRef(0);
  const bgSceneRef = useRef<{
    threeScene: THREE.Scene;
    handle: ProceduralSceneHandle;
    kind: SceneKind;
    stageW: number;
    stageH: number;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = Math.max(320, container.clientWidth);
    const height = Math.max(180, container.clientHeight);
    const stageH = 10.0;
    let stageW = stageH * (width / height);
    const groundY = -stageH / 2 + 0.18 * stageH; // -3.2 (18% from bottom)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    onCanvasReady?.(renderer.domElement);

    const threeScene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(
      -stageW / 2,
      stageW / 2,
      stageH / 2,
      -stageH / 2,
      0.1,
      20,
    );
    camera.position.z = 5;

    let bgHandle = buildStageScene(liveRef.current.scene, stageW, stageH);
    threeScene.add(bgHandle.group);
    bgSceneRef.current = {
      threeScene,
      handle: bgHandle,
      kind: liveRef.current.scene,
      stageW,
      stageH,
    };

    const particles = new StageParticlePool(liveRef.current.reducedMotion ? 16 : 48);
    threeScene.add(particles.group);

    // Character mesh: 45% of stage height, width capped at 40% of stage width, pivot at bottom-center
    let charH = 0.45 * stageH;
    let charW = charH * cropAspect;
    const maxCharW = 0.4 * stageW;
    if (charW > maxCharW) {
      charW = maxCharW;
      charH = charW / Math.max(0.01, cropAspect);
    }
    const charGeo = new THREE.PlaneGeometry(charW, charH, 32, 32);
    charGeo.translate(0, charH / 2, 0);

    // Soft oval contact shadow under the feet (hidden for Fly and Swim)
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d')!;
    const sgrad = sctx.createRadialGradient(64, 32, 6, 64, 32, 60);
    sgrad.addColorStop(0, 'rgba(15, 23, 42, 0.34)');
    sgrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.14)');
    sgrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 128, 64);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(charW * 0.72, Math.max(0.32, charW * 0.14));
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.set(0, groundY + 0.04, -0.15);
    threeScene.add(shadowMesh);

    const charTex = new THREE.CanvasTexture(croppedCanvas);
    charTex.premultiplyAlpha = true;
    charTex.generateMipmaps = true;
    charTex.minFilter = THREE.LinearMipmapLinearFilter;
    charTex.magFilter = THREE.LinearFilter;
    charTex.needsUpdate = true;

    const uniforms = {
      uMap: { value: charTex },
      uTime: { value: 0 },
      uSpeed: { value: liveRef.current.speed },
      uAmp: { value: 1.0 },
      uMove: { value: MOVE_TO_INT[liveRef.current.move] },
      uBeat: { value: 0 },
      uSize: { value: new THREE.Vector2(charW, charH) },
      uPinCount: { value: 0 },
      uPins: {
        value: [
          new THREE.Vector2(0.5, 0.5),
          new THREE.Vector2(0.5, 0.5),
          new THREE.Vector2(0.5, 0.5),
          new THREE.Vector2(0.5, 0.5),
        ],
      },
    };

    const charMat = new THREE.ShaderMaterial({
      vertexShader: CHARACTER_VERTEX_SHADER,
      fragmentShader: CHARACTER_FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      depthWrite: false,
    });

    const charMesh = new THREE.Mesh(charGeo, charMat);
    charMesh.position.set(0, groundY, 0);
    threeScene.add(charMesh);

    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();

    const handlePointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointerNdc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObject(charMesh);
      if (hits.length > 0) {
        if (liveRef.current.pinMode && hits[0].uv) {
          liveRef.current.onAddPin?.({ x: hits[0].uv.x, y: hits[0].uv.y });
          return;
        }
        reactPulseRef.current = 1.0;
        playGiggle();
        for (let i = 0; i < 6; i++) {
          const ang = (i / 6) * Math.PI * 2;
          particles.spawn(
            'sparkle',
            charMesh.position.x + Math.cos(ang) * 0.75,
            charMesh.position.y + charH * 0.6 + Math.sin(ang) * 0.75,
            Math.cos(ang) * 2.6,
            Math.sin(ang) * 2.6 + 1.0,
            0.65,
            0.7,
          );
        }
        liveRef.current.onTapCharacter?.();
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(240, container.clientHeight);
      stageW = stageH * (w / h);
      renderer.setSize(w, h);
      camera.left = -stageW / 2;
      camera.right = stageW / 2;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', handleResize);

    // Fixed-timestep animation loop + 300ms cross-ease between moves
    let rafId = 0;
    let prevTime = performance.now();
    let accumulator = 0;
    let simTime = 0;
    const FIXED_DT = 1 / 60;

    const walkState = createWalkState();
    const prevBounceSin = { value: 0 };
    let lastMove: MoveKind = liveRef.current.move;
    let blendElapsed = 0.3;
    let blendFrom = { x: 0, y: groundY, rotZ: 0, sx: 1, sy: 1 };
    let particleTimer = 0;
    let danceBeatCount = -1;
    let slowDurationMs = 0;
    let degraded = false;

    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      const frameDt = Math.min(0.1, (now - prevTime) / 1000);
      prevTime = now;

      // Graceful degradation if frame time exceeds 20ms for 2 seconds
      if (!degraded) {
        if (frameDt > 0.02) {
          slowDurationMs += frameDt * 1000;
          if (slowDurationMs >= 2000) {
            degraded = true;
            const lowGeo = new THREE.PlaneGeometry(charW, charH, 16, 16);
            lowGeo.translate(0, charH / 2, 0);
            charMesh.geometry.dispose();
            charMesh.geometry = lowGeo;
          }
        } else {
          slowDurationMs = 0;
        }
      }

      const { move: curMove, speed: curSpeed, paused: isPaused, reducedMotion: isReduced, pins: curPins } = liveRef.current;

      if (curMove !== lastMove) {
        blendFrom = {
          x: charMesh.position.x,
          y: charMesh.position.y,
          rotZ: charMesh.rotation.z,
          sx: charMesh.scale.x,
          sy: charMesh.scale.y,
        };
        blendElapsed = 0;
        lastMove = curMove;
      }

      uniforms.uMove.value = MOVE_TO_INT[curMove];
      uniforms.uSpeed.value = curSpeed;
      uniforms.uAmp.value = isReduced ? 0.55 : 1.0;
      const pinCount = Math.min(4, curPins.length);
      uniforms.uPinCount.value = pinCount;
      for (let i = 0; i < pinCount; i++) {
        uniforms.uPins.value[i].set(curPins[i].x, curPins[i].y);
      }

      if (!isPaused) {
        accumulator += frameDt;
        while (accumulator >= FIXED_DT) {
          simTime += FIXED_DT;
          blendElapsed = Math.min(0.3, blendElapsed + FIXED_DT);
          bgSceneRef.current?.handle.update(FIXED_DT * (isReduced ? 0.25 : curSpeed), simTime);
          particles.update(FIXED_DT);
          if (reactPulseRef.current > 0) {
            reactPulseRef.current = Math.max(0, reactPulseRef.current - FIXED_DT * 2.5);
          }

          const t = simTime * curSpeed;
          const tr = computeMoveTransform(
            curMove,
            t,
            FIXED_DT,
            curSpeed,
            stageW,
            stageH,
            groundY,
            walkState,
            prevBounceSin,
          );

          // Per-move SFX & particle emitters
          particleTimer += FIXED_DT;
          if (curMove === 'bounce' && tr.bounceLanded) {
            playBoing();
          }
          if (curMove === 'walk' && tr.stepTriggered) {
            playFootstepPop();
            particles.spawn('dust', tr.x - tr.scaleX * 0.4, groundY + 0.15, -tr.scaleX * 0.9, 0.85, 0.52, 0.55);
          }
          if (curMove === 'fly' && particleTimer > 0.35) {
            particleTimer = 0;
            playFlutter();
            particles.spawn('cloud', tr.x - tr.scaleX * 0.7, tr.y + charH * 0.35, -tr.scaleX * 1.1, 0.25, 0.75, 0.9);
          }
          if (curMove === 'swim' && particleTimer > 0.32) {
            particleTimer = 0;
            playBubbleBlip();
            particles.spawn('bubble', tr.x + (Math.random() - 0.5) * 1.0, tr.y + charH * 0.45, (Math.random() - 0.5) * 0.5, 1.8, 0.48, 1.0);
          }
          if (curMove === 'dance') {
            const beatIdx = Math.floor(t * (100 / 60));
            if (beatIdx !== danceBeatCount) {
              danceBeatCount = beatIdx;
              playDanceBeatStep(beatIdx % 2 === 0);
              particles.spawn(
                beatIdx % 2 === 0 ? 'star' : 'note',
                (Math.random() - 0.5) * 2.4,
                groundY + charH * 0.75,
                (Math.random() - 0.5) * 1.2,
                1.5,
                0.62,
                0.85,
              );
            }
          }

          uniforms.uTime.value = simTime;
          uniforms.uBeat.value = tr.beat;

          const tapJump = Math.sin(reactPulseRef.current * Math.PI) * 0.14 * stageH;
          const ease = blendElapsed < 0.3 ? 1 - Math.pow(1 - blendElapsed / 0.3, 3) : 1;

          const targetX = tr.x;
          const targetY = tr.y + tapJump;
          charMesh.position.set(
            blendFrom.x + (targetX - blendFrom.x) * ease,
            blendFrom.y + (targetY - blendFrom.y) * ease,
            0,
          );
          charMesh.rotation.z = blendFrom.rotZ + (tr.rotZ - blendFrom.rotZ) * ease;
          charMesh.scale.set(
            blendFrom.sx + (tr.scaleX - blendFrom.sx) * ease,
            blendFrom.sy + (tr.scaleY - blendFrom.sy) * ease,
            1,
          );

          // Update contact shadow (hidden for Fly and Swim)
          const showShadow = curMove !== 'fly' && curMove !== 'swim';
          shadowMesh.visible = showShadow;
          if (showShadow) {
            const lift = Math.max(0, charMesh.position.y - groundY);
            const shadowScale = Math.max(0.45, 1 - lift * 0.16);
            shadowMesh.position.x = charMesh.position.x;
            shadowMesh.scale.set(shadowScale, shadowScale, 1);
            shadowMat.opacity = Math.max(0.25, 1 - lift * 0.22);
          }

          accumulator -= FIXED_DT;
        }
      }

      renderer.render(threeScene, camera);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      particles.dispose();
      bgSceneRef.current?.handle.dispose();
      bgSceneRef.current = null;
      charMesh.geometry.dispose();
      charMat.dispose();
      charTex.dispose();
      shadowGeo.dispose();
      shadowMat.dispose();
      shadowTex.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [croppedCanvas, cropAspect]);

  // Swap background scene live without reloading the character mesh/texture
  useEffect(() => {
    const active = bgSceneRef.current;
    if (!active || active.kind === scene) return;
    active.threeScene.remove(active.handle.group);
    active.handle.dispose();
    const nextHandle = buildStageScene(scene, active.stageW, active.stageH);
    active.threeScene.add(nextHandle.group);
    active.handle = nextHandle;
    active.kind = scene;
  }, [scene]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full rounded-[28px] overflow-hidden cursor-pointer select-none"
      aria-label="Animated 3D stage — tap your character!"
    />
  );
};
