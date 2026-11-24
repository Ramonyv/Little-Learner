import type { RunnerCue } from './audio';
export type Mode = 'ready' | 'running' | 'paused' | 'over';
export type HazardKind =
  | 'rock'
  | 'crate'
  | 'spikes'
  | 'wheel'
  | 'mace'
  | 'sword'
  | 'club'
  | 'log'
  | 'fence'
  | 'boulder'
  | 'rockCluster'
  | 'mediumSpikes';
export type CoinKind =
  | 'basic'
  | 'golden'
  | 'glow'
  | 'star'
  | 'shield'
  | 'winged'
  | 'flying';
export interface Hazard {
  kind: HazardKind;
  alternateMace: boolean;
  origin: number;
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Coin {
  kind: CoinKind;
  x: number;
  y: number;
  taken: boolean;
}
export const scenes = ['Temple Path', 'Waterfall Adventure', 'Sky Challenge'];
const courses: HazardKind[][] = [
  [
    'rock',
    'crate',
    'spikes',
    'sword',
    'wheel',
    'mace',
    'club',
    'log',
    'wheel',
    'fence',
  ],
  [
    'crate',
    'mace',
    'rock',
    'wheel',
    'sword',
    'spikes',
    'mace',
    'club',
    'mediumSpikes',
    'rockCluster',
    'boulder',
  ],
  [
    'wheel',
    'rock',
    'mace',
    'club',
    'spikes',
    'crate',
    'sword',
    'wheel',
    'mace',
    'spikes',
    'club',
    'rock',
  ],
];
const sizes: Record<HazardKind, [number, number]> = {
  log: [65, 30],
  fence: [57, 36],
  boulder: [85, 45],
  rockCluster: [48, 33],
  mediumSpikes: [75, 35],
  rock: [54, 30],
  crate: [48, 42],
  spikes: [70, 28],
  wheel: [46, 46],
  mace: [46, 46],
  sword: [54, 65],
  club: [60, 65],
};
const speed = 225,
  gravity = 1200,
  jump = 580;
const spacing = speed * ((2 * jump) / gravity + 0.95);
const pickups: CoinKind[] = [
  'winged',
  'golden',
  'glow',
  'star',
  'shield',
  'winged',
  'flying',
];

export const temple = { rate: 0.38, spacing: 940, offset: 195 };

export class Game {
  private lastTemple = -Infinity;
  scene = 0;
  mode: Mode = 'ready';
  x = 0;
  y = 0;
  vy = 0;
  time = 0;
  hearts = 3;
  total = 0;
  flight = 0;
  magnet = 0;
  double = 0;
  invulnerable = 0;
  land = 0;
  shield = false;
  safeLanding = false;
  held = false;
  grounded = true;
  buffer = 0;
  grace = 0;
  length = 0;
  private nextSceneAt = Infinity;
  lowEffects = false;
  hazards: Hazard[] = [];
  coins: Coin[] = [];
  platforms: { wooden: boolean; x: number; y: number; w: number }[] = [];
  particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
  }[] = [];
  constructor(readonly effect: (event: RunnerCue) => void = () => {}, readonly endless = false) {
    this.appendCourse(this.scene, 0);
  }
  private appendCourse(scene: number, start: number) {
    courses[scene].forEach((kind, i) => {
      const x = start + 460 + i * spacing,
        [baseW, baseH] = sizes[kind],
        // The 3D hanging ball has more visual detail and needs a larger
        // footprint. Keep its collision area aligned with the artwork.
        [w, h] = this.endless && kind === 'mace' ? [62, 62] : [baseW, baseH];
      this.hazards.push({
        kind,
        x,
        alternateMace: kind === 'mace' && scene !== 0,
        origin: x,
        y: kind === 'mace' ? 100 : 0,
        w,
        h,
      });
      if (i % (scene === 2 ? 2 : 3) === 1) {
        this.platforms.push({ wooden: i % 2 === 0, x: x + 162, y: 84, w: 108 });
        this.coins.push({ kind: 'golden', x: x + 162, y: 116, taken: false });
      }
      this.coins.push({
        kind: pickups[i % 7],
        x: x - 205,
        y: 36,
        taken: false,
      });
      for (const offset of [-42, 0, 42])
        this.coins.push({
          kind: 'basic',
          x: x + offset,
          y: kind === 'mace' ? 34 : 120 - Math.abs(offset) * 0.25,
          taken: false,
        });
    });
    this.length = this.hazards[this.hazards.length - 1].origin + 550;
  }
  get score() {
    return Math.floor(this.x / 10) + this.total * 10;
  }
  press() {
    if (this.mode === 'running') {
      this.held = true;
      this.buffer = 0.14;
    }
  }
  pause() {
    if (this.mode === 'running' || this.mode === 'paused') {
      this.mode = this.mode === 'paused' ? 'running' : 'paused';
      this.held = false;
      this.buffer = 0;
    }
  }
  burst(x: number, y: number, color: string) {
    for (let i = 0; i < (this.lowEffects ? 2 : 6); i++)
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 90,
        vy: 30 + Math.random() * 75,
        life: 0.34,
        color,
      });
  }
  collect(c: Coin) {
    c.taken = true;
    switch (c.kind) {
      case 'shield':
        this.shield = true;
        break;
      case 'glow':
        this.double = 8;
        break;
      case 'winged':
        this.magnet = 6;
        break;
      case 'flying':
        this.flight = 6;
        this.vy = 160;
        this.safeLanding = false;
        break;
      default:
        this.total +=
          { basic: 1, golden: 5, star: 10 }[c.kind] * (this.double > 0 ? 2 : 1);
    }
    this.burst(c.x, c.y, '#ffbc24');
    this.effect(
      c.kind === 'basic'
        ? 'ram-coin'
        : c.kind === 'flying'
          ? 'flight-start'
          : 'special-coin',
    );
  }
  step(dt: number, playerScreenX = 130) {
    if (this.mode !== 'running') return;
    if (this.x >= this.nextSceneAt) {
      this.scene = (this.scene + 1) % scenes.length;
      this.nextSceneAt = Infinity;
    }
    if (this.x + 1800 >= this.length) {
      this.nextSceneAt = this.length;
      const behind = this.x - 300;
      this.hazards = this.hazards.filter((hazard) => hazard.origin > behind);
      this.coins = this.coins.filter((coin) => coin.x > behind);
      this.platforms = this.platforms.filter((platform) => platform.x > behind);
      this.appendCourse((this.scene + 1) % scenes.length, this.length);
    }
    this.time += dt;
    const beforeX = this.x;
    this.x = Math.min(this.length, this.x + speed * dt);
    if (this.scene === 0 && this.time - this.lastTemple >= 45) {
      const templeIndex = (x: number) =>
        Math.floor(
          (x * temple.rate + playerScreenX - temple.offset) / temple.spacing,
        );
      if (templeIndex(this.x) > templeIndex(beforeX)) {
        this.effect('temple');
        this.lastTemple = this.time;
      }
    }
    const oldY = this.y,
      wasFlying = this.flight > 0;
    for (const key of [
      'flight',
      'magnet',
      'double',
      'invulnerable',
      'land',
      'buffer',
      'grace',
    ] as const)
      this[key] = Math.max(0, this[key] - dt);
    if (wasFlying && !this.flight) this.safeLanding = true;
    if (this.flight > 0) {
      this.vy += ((this.held ? 175 : -58) - this.vy) * Math.min(1, dt * 8);
    } else if (this.buffer > 0 && (this.grounded || this.grace > 0)) {
      this.effect('jump');
      this.vy = jump;
      this.buffer = this.grace = 0;
    } else
      this.vy = Math.max(
        this.safeLanding ? -115 : -700,
        this.vy - gravity * dt,
      );
    this.y = Math.min(232, this.y + this.vy * dt);
    if (this.y === 232) this.vy = Math.min(0, this.vy);
    let surface = 0;
    for (const p of this.platforms)
      if (
        Math.abs(this.x - p.x) < p.w / 2 + 9 &&
        oldY >= p.y - 0.01 &&
        this.vy <= 0
      )
        surface = Math.max(surface, p.y);
    const supported = this.y <= surface && this.vy <= 0;
    if (supported) {
      if (!this.grounded) {
        this.land = 0.11;
        this.burst(this.x, surface, '#bd955f');
      }
      this.y = surface;
      this.vy = 0;
      if (this.safeLanding) {
        this.safeLanding = false;
        this.invulnerable = Math.max(this.invulnerable, 0.65);
      }
    } else if (this.grounded && this.vy <= 0) this.grace = 0.1;
    this.grounded = supported;
    for (const c of this.coins) {
      if (c.taken) continue;
      const dx = this.x - c.x,
        dy = this.y + 33 - c.y,
        d = Math.hypot(dx, dy);
      if (this.magnet && d < 155 && d > 1) {
        const f = Math.min(1, (480 * dt) / d);
        c.x += dx * f;
        c.y += dy * f;
      }
      if (Math.abs(this.x - c.x) < 27 && Math.abs(this.y + 33 - c.y) < 40)
        this.collect(c);
    }
    for (const z of this.hazards) {
      if (z.kind === 'mace') {
        const a = Math.sin(this.time * 2) * 0.47;
        z.x = z.origin + Math.sin(a) * 102;
        z.y = 100 + (1 - Math.cos(a)) * 102;
      }
      if (z.kind === 'sword' || z.kind === 'club')
        z.x = z.origin + Math.sin(this.time * 2) * 13;
      if (z.kind === 'log') z.x = z.origin + 20 * Math.sin(this.time * 2);
      const dx = Math.abs(this.x - z.x);
      if (this.invulnerable || this.safeLanding || dx > z.w / 2 + 13) continue;
      const round = z.kind === 'wheel' || z.kind === 'mace';
      const tip =
        z.kind === 'rock' || z.kind === 'spikes'
          ? z.h * Math.max(0.5, 1 - dx / (z.w + 26))
          : z.h;
      const hit = round
        ? Math.hypot(
            Math.max(0, dx - 12),
            Math.max(
              0,
              this.y + 5 - z.y - z.h / 2,
              z.y + z.h / 2 - this.y - 57,
            ),
          ) <
          z.w * 0.46
        : dx < z.w * 0.42 + 12 && this.y + 5 < z.y + tip && this.y + 57 > z.y;
      if (hit) {
        this.effect(this.shield ? 'shield-break' : 'heart-lost');
        if (this.shield) this.shield = false;
        else this.hearts--;
        this.invulnerable = 2;
        if (!this.hearts) {
          if (this.endless) this.hearts = 3;
          else this.mode = 'over';
        }
      }
    }
    for (const p of this.particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 220 * dt;
    }
    this.particles = this.particles.filter((p) => p.life > 0);
  }
}
