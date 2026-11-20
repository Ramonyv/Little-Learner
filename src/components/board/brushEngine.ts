export type Brush = 'Rainbow' | 'Pen' | 'Monoline' | 'Pencil' | 'Crayon' | 'Fountain Pen' | 'Reed' | 'Watercolor' | 'Brush' | 'Chalk' | 'Marker' | 'Ink' | 'Eraser';
export type Point = { x: number; y: number; pressure: number; time?: number };
export interface Stroke { widthScale?: number; brush: Brush; color: string; points: Point[] }

type Context = CanvasRenderingContext2D;
type Dab = { ctx: Context; x: number; y: number; angle: number; pressure: number; taper: number; unit: number; distance: number; random: () => number };
type Tip = { spacing: number; paint: (dab: Dab) => void };

function oval(ctx: Context, x: number, y: number, rx: number, ry = rx, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fill();
}

// Generate a small family of dry tips once per colour. Varying the impression
// and its orientation breaks up repeating marks without per-pixel canvas reads.
const stamps = new Map<string, HTMLCanvasElement>();
function impression(kind: 'Chalk' | 'Crayon' | 'Watercolor', color: string, variant: number) {
  const key = kind + color + variant;
  const cached = stamps.get(key);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 96;
  const ctx = canvas.getContext('2d')!;
  let seed = 7123 + variant * 839;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  ctx.fillStyle = color;
  if (kind === 'Watercolor') {
    // Uneven pigment boundaries stay visible through successive translucent washes.
    for (let layer = 0; layer < 5; layer++) {
      const offset = random() * 5;
      ctx.globalAlpha = .045;
      ctx.beginPath();
      for (let i = 0; i < 64; i++) {
        const angle = i * Math.PI / 32;
        const r = 34 + 5 * Math.sin(angle * 3 + offset) + 5 * random();
        ctx.lineTo(48 + r * Math.cos(angle), 48 + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = .05;
    for (let i = 0; i < 80; i++) {
      const a = random() * Math.PI * 2, r = Math.sqrt(random()) * 39;
      oval(ctx, 48 + r * Math.cos(a), 48 + r * Math.sin(a), 1 + random() * 3);
    }
  } else {
    const chalk = kind === 'Chalk';
    for (let i = 0; i < (chalk ? 120 : 95); i++) {
      const angle = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * (chalk && i % 8 === 0 ? 46 : 38);
      ctx.globalAlpha = .4 + random() * .55;
      oval(ctx, 48 + Math.cos(angle) * r, 48 + Math.sin(angle) * r,
        chalk ? 1.7 + random() * 4.6 : 5 + random() * 9,
        chalk ? 1.2 + random() * 3 : .7 + random() * 1.7, chalk ? angle : -.15);
    }
  }
  if (stamps.size >= 96) stamps.delete(stamps.keys().next().value!);
  stamps.set(key, canvas);
  return canvas;
}

function imprint(d: Dab, kind: 'Chalk' | 'Crayon' | 'Watercolor', width: number, angle: number) {
  const { ctx, random, x, y } = d;
  const stamp = impression(kind, String(ctx.fillStyle), Math.floor(random() * 5));
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(stamp, -width / 2, -width / 2, width, width);
  ctx.restore();
}

const tips: Record<Exclude<Brush, 'Monoline'>, Tip> = {
  Chalk: { spacing: 3.5, paint(d) {
    imprint(d, 'Chalk', d.unit * (18 + 5 * d.pressure), d.random() * Math.PI);
  }},
  Crayon: { spacing: 3, paint(d) {
    imprint(d, 'Crayon', d.unit * (17 + 7 * d.pressure), d.angle + .2 * d.random());
  }},
  Watercolor: { spacing: 5, paint(d) {
    d.ctx.globalCompositeOperation = 'multiply';
    imprint(d, 'Watercolor', d.unit * (28 + 10 * d.pressure + 2 * d.random()), d.random() * Math.PI);
  }},
  Pen: { spacing: .6, paint(d) {
    oval(d.ctx, d.x, d.y, d.unit * (.9 + 1.4 * d.pressure) * d.taper);
  }},
  Marker: { spacing: 1.5, paint(d) { oval(d.ctx, d.x, d.y, 10 * d.unit); }},
  Rainbow: { spacing: .95, paint(d) {
    d.ctx.fillStyle = 'hsl(' + (345 + d.distance / d.unit * 1.55) + ' 91% 57%)';
    oval(d.ctx, d.x, d.y, 9 * d.unit);
  }},
  'Fountain Pen': { spacing: .55, paint(d) {
    const width = d.unit * d.taper * (.65 + .55 * d.pressure);
    oval(d.ctx, d.x, d.y, 9 * width, 1.25 * width, -.78);
  }},
  Pencil: { spacing: .7, paint(d) {
    for (let i = 0; i < 5; i++) {
      d.ctx.globalAlpha = (.22 + d.random() * .4) * (.55 + d.pressure);
      oval(d.ctx, d.x + (d.random() - .5) * 2.4 * d.unit, d.y + (d.random() - .5) * 2.4 * d.unit, (.32 + d.random() * .45) * d.unit);
    }
  }},
  Brush: { spacing: .8, paint(d) {
    const r = d.unit * d.taper * (1.2 + 8 * d.pressure);
    oval(d.ctx, d.x, d.y, r, .84 * r, d.angle);
    d.ctx.globalAlpha = .38;
    for (const side of [-1, 1]) {
      const offset = side * r * (.86 + .12 * Math.sin(d.distance / (12 * d.unit)));
      oval(d.ctx, d.x - Math.sin(d.angle) * offset, d.y + Math.cos(d.angle) * offset, r * .25, r * .09, d.angle);
    }
  }},
  Ink: { spacing: .65, paint(d) {
    const r = d.unit * (.75 + 4.2 * d.pressure ** 1.5) * (.9 + .1 * Math.sin(d.distance / (11 * d.unit)));
    oval(d.ctx, d.x, d.y, r);
  }},
  Reed: { spacing: 1.3, paint(d) {
    for (let i = -3; i <= 3; i++) {
      if (d.random() < .19) continue;
      const offset = i * d.unit * (.8 + .5 * d.pressure);
      oval(d.ctx, d.x + offset, d.y - offset * .65, 1.6 * d.unit, .43 * d.unit, d.angle);
    }
  }},
  Eraser: { spacing: 2, paint(d) {
    d.ctx.globalCompositeOperation = 'destination-out';
    oval(d.ctx, d.x, d.y, 14 * d.unit);
  }},
};

function mix(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, pressure: a.pressure + (b.pressure - a.pressure) * t };
}

// Quadratic midpoint interpolation feeds a distance-spaced tip. Carrying the
// spacing remainder between curves makes density independent of pointer rate.
export function strokeRenderer(ctx: Context, stroke: Stroke, width: number, height: number, total = Infinity, measureOnly = false) {
  const unit = (stroke.widthScale ?? 1) * Math.max(.65, width / 800);
  if (stroke.brush === 'Monoline') {
    let last: Point | undefined, end: Point | undefined;
    function curve(target: Point) {
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = 6 * unit;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(end!.x, end!.y);
      ctx.quadraticCurveTo(last!.x, last!.y, target.x, target.y);
      ctx.stroke();
      ctx.restore();
      end = target;
    }
    return {
      add(point: Point) {
        const p = { ...point, x: point.x * width, y: point.y * height };
        if (last) curve(mix(last, p, .5));
        else {
          ctx.save();
          ctx.fillStyle = stroke.color;
          oval(ctx, p.x, p.y, 3 * unit);
          ctx.restore();
          end = p;
        }
        last = p;
      },
      finish() { if (last) curve(last); return 0; },
    };
  }
  const tip = tips[stroke.brush];
  const spacing = Math.max(.25, tip.spacing * unit);
  let last: Point | undefined, cursor: Point | undefined;
  let distance = 0, next = 0, seed = 6139;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  function paint(p: Point, angle: number, at: number) {
    const taper = Math.max(.09, Math.min(1, at / (15 * unit), (total - at) / (18 * unit)));
    ctx.fillStyle = stroke.color;
    ctx.globalAlpha = 1;
    tip.paint({ ctx, ...p, angle, pressure: p.pressure, taper, unit, distance: at, random });
  }
  function line(p: Point) {
    const a = cursor!;
    const dx = p.x - a.x, dy = p.y - a.y;
    const length = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx);
    while (!measureOnly && length && next <= distance + length) {
      paint(mix(a, p, (next - distance) / length), angle, next);
      next += spacing;
    }
    distance += length;
    cursor = p;
  }
  return {
    add(point: Point) {
      const p = { x: point.x * width, y: point.y * height, pressure: point.pressure ?? .5 };
      ctx.save();
      if (!last) {
        cursor = p;
        if (!measureOnly) paint(p, 0, 0);
        next = spacing;
      } else {
        const start = cursor!, end = mix(last, p, .5);
        const steps = Math.max(1, Math.ceil((Math.hypot(last.x-start.x,last.y-start.y) + Math.hypot(end.x-last.x,end.y-last.y)) / 4));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          line(mix(mix(start, last, t), mix(last, end, t), t));
        }
      }
      ctx.restore();
      last = p;
    },
    finish() {
      ctx.save();
      if (last) line(last);
      ctx.restore();
      return distance;
    },
  };
}

export function renderStroke(ctx: Context, stroke: Stroke, width: number, height: number, length = Infinity) {
  // Only variable-tip tools need a known end distance during history replay.
  if (!Number.isFinite(length) && ['Pen','Brush','Fountain Pen'].includes(stroke.brush)) {
    const measure = strokeRenderer(ctx, stroke, width, height, Infinity, true);
    stroke.points.forEach(measure.add);
    length = measure.finish();
  }
  const renderer = strokeRenderer(ctx, stroke, width, height, length);
  stroke.points.forEach(renderer.add);
  renderer.finish();
}
