export interface CropResult {
  canvas: HTMLCanvasElement;
  cropBounds: { x: number; y: number; w: number; h: number };
  aspect: number;
}

/**
 * Applies a 1px 4-neighbor dilation to strengthen very thin line drawings
 * (e.g. stick figures drawn with a <6px stroke at 1024px resolution).
 */
function dilateThinStrokes(canvas: HTMLCanvasElement): void {
  const w = canvas.width;
  const h = canvas.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const src = ctx.getImageData(0, 0, w, h);
  const s = src.data;
  let opaqueCount = 0;
  let edgeCount = 0;

  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const a = s[(row + x) * 4 + 3];
      if (a > 24) {
        opaqueCount++;
        if (
          s[(row + x - 1) * 4 + 3] <= 24 ||
          s[(row + x + 1) * 4 + 3] <= 24 ||
          s[(row - w + x) * 4 + 3] <= 24 ||
          s[(row + w + x) * 4 + 3] <= 24
        ) {
          edgeCount++;
        }
      }
    }
  }

  // Average stroke thickness ~ 2 * opaque / edge; if < 6px, dilate by 1px
  const avgWidth = edgeCount > 0 ? (2 * opaqueCount) / edgeCount : 99;
  if (avgWidth >= 6) return;

  const out = ctx.createImageData(w, h);
  const d = out.data;
  d.set(s);

  for (let y = 1; y < h - 1; y++) {
    const row = y * w;
    for (let x = 1; x < w - 1; x++) {
      const idx = (row + x) * 4;
      if (s[idx + 3] > 24) continue;
      const neighbors = [
        (row + x - 1) * 4,
        (row + x + 1) * 4,
        (row - w + x) * 4,
        (row + w + x) * 4,
      ];
      let best = -1;
      let bestA = 24;
      for (const n of neighbors) {
        if (s[n + 3] > bestA) {
          bestA = s[n + 3];
          best = n;
        }
      }
      if (best >= 0) {
        d[idx] = s[best];
        d[idx + 1] = s[best + 1];
        d[idx + 2] = s[best + 2];
        d[idx + 3] = Math.round(bestA * 0.85);
      }
    }
  }

  ctx.putImageData(out, 0, 0);
}

/**
 * Finds the tight bounding box of pixels with alpha > 8, adds 24px padding,
 * and returns a cropped canvas (max 1024px on the long side) preserving aspect ratio.
 */
export function autoCropCanvas(source: HTMLCanvasElement, padding = 24): CropResult | null {
  const srcW = source.width;
  const srcH = source.height;
  const ctx = source.getContext('2d');
  if (!ctx) return null;

  const { data } = ctx.getImageData(0, 0, srcW, srcH);
  let minX = srcW;
  let minY = srcH;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < srcH; y++) {
    const rowOffset = y * srcW * 4;
    for (let x = 0; x < srcW; x++) {
      if (data[rowOffset + x * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const x0 = Math.max(0, minX - padding);
  const y0 = Math.max(0, minY - padding);
  const x1 = Math.min(srcW, maxX + 1 + padding);
  const y1 = Math.min(srcH, maxY + 1 + padding);

  const w = Math.max(1, x1 - x0);
  const h = Math.max(1, y1 - y0);

  const scale = Math.min(1, 1024 / Math.max(w, h));
  const outW = Math.max(2, Math.round(w * scale));
  const outH = Math.max(2, Math.round(h * scale));

  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const outCtx = out.getContext('2d');
  if (!outCtx) return null;

  outCtx.drawImage(source, x0, y0, w, h, 0, 0, outW, outH);
  dilateThinStrokes(out);

  return {
    canvas: out,
    cropBounds: { x: x0, y: y0, w, h },
    aspect: outW / outH,
  };
}
