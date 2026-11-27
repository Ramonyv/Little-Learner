export interface Point2D {
  x: number;
  y: number;
}

const stampCache = new Map<string, HTMLCanvasElement>();

function parseHexRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Generates a waxy crayon stamp with a deterministic organic noise alpha mask.
 * Cached by rounded diameter + color so fast strokes remain 60fps.
 */
function getCrayonStamp(diameter: number, colorHex: string, isErase: boolean): HTMLCanvasElement {
  const size = Math.max(4, Math.ceil(diameter));
  const key = `${isErase ? 'erase' : colorHex.toLowerCase()}:${size}`;
  const cached = stampCache.get(key);
  if (cached) return cached;

  if (stampCache.size > 64) {
    const firstKey = stampCache.keys().next().value;
    if (firstKey) stampCache.delete(firstKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const img = ctx.createImageData(size, size);
  const data = img.data;
  const [r, g, b] = isErase ? [0, 0, 0] : parseHexRgb(colorHex);
  const radius = size / 2;

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = px + 0.5 - radius;
      const dy = py + 0.5 - radius;
      const dist = Math.hypot(dx, dy) / radius;
      if (dist > 1) continue;

      // Soft circular falloff + deterministic waxy grain
      const edgeFade = dist < 0.72 ? 1 : Math.max(0, 1 - (dist - 0.72) / 0.28);
      const grain = isErase
        ? 1
        : 0.62 + 0.38 * Math.abs(Math.sin(px * 12.9898 + py * 78.233) * 43758.5453 % 1);
      const alpha = Math.round(255 * edgeFade * grain);

      const idx = (py * size + px) * 4;
      data[idx] = r;
      data[idx + 1] = g;
      data[idx + 2] = b;
      data[idx + 3] = alpha;
    }
  }

  ctx.putImageData(img, 0, 0);
  stampCache.set(key, canvas);
  return canvas;
}

/**
 * Draws an interpolated waxy crayon (or destination-out eraser) stroke segment
 * with stamp spacing <= 25% of brush diameter so fast strokes leave no gaps.
 */
export function stampStrokeSegment(
  ctx: CanvasRenderingContext2D,
  from: Point2D,
  to: Point2D,
  brushSize: number,
  colorHex: string,
  mode: 'draw' | 'erase',
): void {
  const diameter = Math.max(6, Math.min(48, brushSize));
  const stamp = getCrayonStamp(diameter, colorHex, mode === 'erase');
  const step = Math.max(1.5, diameter * 0.22);
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / step));
  const half = stamp.width / 2;

  ctx.save();
  ctx.globalCompositeOperation = mode === 'erase' ? 'destination-out' : 'source-over';

  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const baseX = from.x + dx * t;
    const baseY = from.y + dy * t;
    const jitterX = mode === 'erase' ? 0 : (Math.random() - 0.5) * 2; // ±1px
    const jitterY = mode === 'erase' ? 0 : (Math.random() - 0.5) * 2;
    ctx.globalAlpha = mode === 'erase' ? 1 : 0.82 + Math.random() * 0.18;
    ctx.drawImage(stamp, baseX - half + jitterX, baseY - half + jitterY);
  }

  ctx.restore();
}
