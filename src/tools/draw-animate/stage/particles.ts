import * as THREE from 'three';

export type ParticleKind = 'dust' | 'cloud' | 'bubble' | 'star' | 'note' | 'sparkle';

interface ParticleItem {
  sprite: THREE.Sprite;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  baseScale: number;
}

function makeSpriteTexture(kind: ParticleKind): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'dust' || kind === 'cloud') {
    ctx.fillStyle = kind === 'dust' ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.92)';
    ctx.beginPath();
    ctx.arc(24, 36, 14, 0, Math.PI * 2);
    ctx.arc(36, 30, 16, 0, Math.PI * 2);
    ctx.arc(46, 38, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'bubble') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 4;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
    ctx.beginPath();
    ctx.arc(32, 32, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(24, 24, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'star' || kind === 'sparkle') {
    ctx.fillStyle = kind === 'star' ? '#facc15' : '#fde047';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 24 : 10;
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const x = 32 + Math.cos(a) * r;
      const y = 32 + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (kind === 'note') {
    ctx.strokeStyle = '#a855f7';
    ctx.fillStyle = '#a855f7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(28, 44);
    ctx.lineTo(28, 16);
    ctx.lineTo(48, 12);
    ctx.lineTo(48, 38);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(22, 46, 8, 0, Math.PI * 2);
    ctx.arc(42, 40, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export class StageParticlePool {
  readonly group = new THREE.Group();
  private textures = new Map<ParticleKind, THREE.CanvasTexture>();
  private active: ParticleItem[] = [];
  private readonly maxParticles: number;

  constructor(maxParticles = 40) {
    this.maxParticles = maxParticles;
  }

  private getTexture(kind: ParticleKind): THREE.CanvasTexture {
    let tex = this.textures.get(kind);
    if (!tex) {
      tex = makeSpriteTexture(kind);
      this.textures.set(kind, tex);
    }
    return tex;
  }

  spawn(kind: ParticleKind, x: number, y: number, vx: number, vy: number, scale = 0.14, maxLife = 0.9): void {
    if (this.active.length >= this.maxParticles) return;
    const mat = new THREE.SpriteMaterial({
      map: this.getTexture(kind),
      transparent: true,
      depthWrite: false,
      opacity: 0.95,
    });
    const sprite = new THREE.Sprite(mat);
    sprite.position.set(x, y, 0.2);
    sprite.scale.set(scale, scale, 1);
    this.group.add(sprite);
    this.active.push({ sprite, vx, vy, life: 0, maxLife, baseScale: scale });
  }

  update(dt: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.group.remove(p.sprite);
        (p.sprite.material as THREE.SpriteMaterial).dispose();
        this.active.splice(i, 1);
        continue;
      }
      const ratio = p.life / p.maxLife;
      p.sprite.position.x += p.vx * dt;
      p.sprite.position.y += p.vy * dt;
      (p.sprite.material as THREE.SpriteMaterial).opacity = Math.max(0, 1 - ratio);
      const s = p.baseScale * (1 + ratio * 0.35);
      p.sprite.scale.set(s, s, 1);
    }
  }

  dispose(): void {
    for (const p of this.active) {
      this.group.remove(p.sprite);
      (p.sprite.material as THREE.SpriteMaterial).dispose();
    }
    this.active.length = 0;
    for (const tex of this.textures.values()) {
      tex.dispose();
    }
    this.textures.clear();
  }
}
