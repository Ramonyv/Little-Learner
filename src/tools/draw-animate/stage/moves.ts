import type { MoveKind } from '../types';

export interface CharacterTransform {
  x: number;
  y: number;
  rotZ: number;
  scaleX: number;
  scaleY: number;
  beat: number;
  stepTriggered?: boolean;
  bounceLanded?: boolean;
}

export interface WalkState {
  x: number;
  dir: 1 | -1;
  pauseTimer: number;
  prevStepPhase: number;
}

export function createWalkState(): WalkState {
  return { x: 0, dir: 1, pauseTimer: 0, prevStepPhase: 0 };
}

export function computeMoveTransform(
  move: MoveKind,
  t: number,
  dt: number,
  speed: number,
  stageW: number,
  stageH: number,
  groundY: number,
  walkState: WalkState,
  prevBounceSin: { value: number },
): CharacterTransform {
  if (move === 'wiggle') {
    const pulse = 1 + Math.sin(t * 4) * 0.02;
    return { x: 0, y: groundY, rotZ: 0, scaleX: pulse, scaleY: 1 / pulse, beat: 0 };
  }

  if (move === 'bounce') {
    const rawSin = Math.abs(Math.sin(t * 3));
    const landed = prevBounceSin.value > 0.14 && rawSin <= 0.14;
    prevBounceSin.value = rawSin;
    // Brief hang time at top via gentle ease
    const hop = Math.pow(rawSin, 0.85) * 0.25 * stageH;
    const sy = rawSin < 0.14 ? 0.85 + (rawSin / 0.14) * 0.15 : 1.0 + rawSin * 0.12;
    return {
      x: 0,
      y: groundY + hop,
      rotZ: 0,
      scaleX: 1 / sy,
      scaleY: sy,
      beat: 0,
      bounceLanded: landed,
    };
  }

  if (move === 'walk') {
    const limitX = Math.max(0.35, stageW * 0.34);
    let stepTriggered = false;

    if (walkState.pauseTimer > 0) {
      walkState.pauseTimer = Math.max(0, walkState.pauseTimer - dt);
    } else {
      walkState.x += walkState.dir * speed * 0.21 * stageH * dt;
      if (walkState.x >= limitX) {
        walkState.x = limitX;
        walkState.dir = -1;
        walkState.pauseTimer = 0.3; // 300ms pause at edge
      } else if (walkState.x <= -limitX) {
        walkState.x = -limitX;
        walkState.dir = 1;
        walkState.pauseTimer = 0.3;
      }
      const stepPhase = Math.sin(t * 6);
      if (walkState.prevStepPhase <= 0 && stepPhase > 0) stepTriggered = true;
      if (walkState.prevStepPhase >= 0 && stepPhase < 0) stepTriggered = true;
      walkState.prevStepPhase = stepPhase;
    }

    const bob = walkState.pauseTimer > 0 ? 0 : Math.abs(Math.sin(t * 6)) * 0.03 * stageH;
    const tilt = walkState.pauseTimer > 0 ? 0 : Math.sin(t * 6) * ((4 * Math.PI) / 180);
    return {
      x: walkState.x,
      y: groundY + bob,
      rotZ: tilt,
      scaleX: walkState.dir,
      scaleY: 1,
      beat: 0,
      stepTriggered,
    };
  }

  if (move === 'fly') {
    const ampX = Math.max(0.3, stageW * 0.28);
    const ampY = 0.14 * stageH;
    const baseY = groundY + 0.34 * stageH;
    const x = Math.sin(t * 1.1) * ampX;
    const y = baseY + Math.sin(t * 2.2) * ampY;
    const vx = Math.cos(t * 1.1) * ampX * 1.1;
    const tilt = Math.max(-0.18, Math.min(0.18, -vx * 0.18));
    return {
      x,
      y,
      rotZ: tilt,
      scaleX: vx >= 0 ? 1 : -1,
      scaleY: 1,
      beat: 0,
    };
  }

  if (move === 'swim') {
    const ampX = Math.max(0.32, stageW * 0.3);
    const baseY = groundY + 0.24 * stageH;
    const x = Math.sin(t * 0.85) * ampX;
    const y = baseY + Math.sin(t * 1.7) * 0.07 * stageH;
    const vx = Math.cos(t * 0.85);
    const rot = Math.cos(t * 1.7) * 0.08;
    return {
      x,
      y,
      rotZ: rot,
      scaleX: vx >= 0 ? 1 : -1,
      scaleY: 1,
      beat: 0,
    };
  }

  // Dance: 100 BPM = 1.6667 beats/sec
  const beatPhase = (t * (100 / 60)) % 1;
  const beatPulse = Math.pow(Math.max(0, 1 - beatPhase * 2.2), 2);
  const rotZ = Math.sin(t * 3.5) * ((12 * Math.PI) / 180);
  const s = 1 + beatPulse * 0.08;
  return {
    x: 0,
    y: groundY + beatPulse * 0.03 * stageH,
    rotZ,
    scaleX: s,
    scaleY: 1 / (1 + beatPulse * 0.04),
    beat: beatPulse,
  };
}
