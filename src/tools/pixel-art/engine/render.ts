import type { CellCoord, PixelColor } from './types';

/**
 * Renders the pixel art layer with checkerboard transparency background.
 * Uses integer cell coordinates and disables image smoothing for crisp edges.
 */
export function renderArtLayer(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  size: number,
  palette: PixelColor[],
  canvasPx: number,
): void {
  ctx.imageSmoothingEnabled = false;
  const cell = canvasPx / size;

  // Crisp 2x2 sub-checkerboard per cell (or 1x1 alternating) for transparent backdrop
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const colorIdx = grid[y * size + x];
      const px = Math.floor(x * cell);
      const py = Math.floor(y * cell);
      const pw = Math.ceil((x + 1) * cell) - px;
      const ph = Math.ceil((y + 1) * cell) - py;

      if (colorIdx > 0 && colorIdx <= palette.length) {
        ctx.fillStyle = palette[colorIdx - 1].hex;
        ctx.fillRect(px, py, pw, ph);
      } else {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#f1f6fd';
        ctx.fillRect(px, py, pw, ph);
      }
    }
  }
}

/**
 * Renders only dirty cells on the art canvas during active pointer strokes
 * so 60fps drawing stays effortless even on 64x64 grids.
 */
export function renderDirtyCells(
  ctx: CanvasRenderingContext2D,
  grid: Uint8Array,
  size: number,
  palette: PixelColor[],
  canvasPx: number,
  indices: number[],
): void {
  ctx.imageSmoothingEnabled = false;
  const cell = canvasPx / size;
  for (const idx of indices) {
    const x = idx % size;
    const y = Math.floor(idx / size);
    const colorIdx = grid[idx];
    const px = Math.floor(x * cell);
    const py = Math.floor(y * cell);
    const pw = Math.ceil((x + 1) * cell) - px;
    const ph = Math.ceil((y + 1) * cell) - py;

    if (colorIdx > 0 && colorIdx <= palette.length) {
      ctx.fillStyle = palette[colorIdx - 1].hex;
      ctx.fillRect(px, py, pw, ph);
    } else {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#ffffff' : '#f1f6fd';
      ctx.fillRect(px, py, pw, ph);
    }
  }
}

export function renderGridOverlay(
  ctx: CanvasRenderingContext2D,
  size: number,
  canvasPx: number,
  showGrid: boolean,
  showCenterLines: boolean,
  highContrast = false,
  templatePixels?: number[] | null,
  templateMode: 'trace' | 'pbn' = 'trace',
  userGrid?: Uint8Array,
  palette?: PixelColor[],
  onionPixels?: number[] | null,
): void {
  ctx.clearRect(0, 0, canvasPx, canvasPx);
  const cell = canvasPx / size;

  // Onion-skin previous frame ghost
  if (onionPixels && onionPixels.length === size * size && palette) {
    ctx.save();
    ctx.globalAlpha = 0.2;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = onionPixels[y * size + x];
        if (idx > 0 && idx <= palette.length) {
          const px = Math.floor(x * cell);
          const py = Math.floor(y * cell);
          ctx.fillStyle = palette[idx - 1].hex;
          ctx.fillRect(px, py, Math.ceil((x + 1) * cell) - px, Math.ceil((y + 1) * cell) - py);
        }
      }
    }
    ctx.restore();
  }

  // Trace ghost or Paint-by-Number numbers
  if (templatePixels && templatePixels.length === size * size && palette) {
    ctx.save();
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const idx = y * size + x;
        const targetIdx = templatePixels[idx];
        if (!targetIdx || targetIdx > palette.length) continue;
        const currentIdx = userGrid ? userGrid[idx] : 0;
        const px = Math.floor(x * cell);
        const py = Math.floor(y * cell);
        const pw = Math.ceil((x + 1) * cell) - px;
        const ph = Math.ceil((y + 1) * cell) - py;

        if (templateMode === 'trace') {
          if (currentIdx === 0) {
            ctx.fillStyle = palette[targetIdx - 1].hex;
            ctx.globalAlpha = 0.28;
            ctx.fillRect(px, py, pw, ph);
          } else if (currentIdx === targetIdx) {
            ctx.strokeStyle = 'rgba(255, 195, 0, 0.85)';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.strokeRect(px + 2, py + 2, Math.max(2, pw - 4), Math.max(2, ph - 4));
          }
        } else if (templateMode === 'pbn' && currentIdx !== targetIdx) {
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = currentIdx === 0 ? '#172951' : '#ef4444';
          ctx.font = `900 ${Math.max(10, Math.floor(cell * 0.44))}px Nunito, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(targetIdx), px + pw / 2, py + ph / 2 + 1);
        }
      }
    }
    ctx.restore();
  }

  if (showGrid) {
    ctx.strokeStyle = highContrast ? 'rgba(23, 41, 81, 0.34)' : 'rgba(148, 163, 184, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < size; i++) {
      const pos = Math.round(i * cell) + 0.5;
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvasPx);
      ctx.moveTo(0, pos);
      ctx.lineTo(canvasPx, pos);
    }
    ctx.stroke();
  }

  if (showCenterLines) {
    const mid = Math.round((size / 2) * cell) + 0.5;
    ctx.save();
    ctx.strokeStyle = 'rgba(124, 58, 237, 0.65)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(mid, 0);
    ctx.lineTo(mid, canvasPx);
    ctx.moveTo(0, mid);
    ctx.lineTo(canvasPx, mid);
    ctx.stroke();
    ctx.restore();
  }
}

export function renderCursorLayer(
  ctx: CanvasRenderingContext2D,
  size: number,
  canvasPx: number,
  hoverCell: CellCoord | null,
  activeHex: string | null,
): void {
  ctx.clearRect(0, 0, canvasPx, canvasPx);
  if (!hoverCell) return;

  const cell = canvasPx / size;
  const px = Math.floor(hoverCell.x * cell);
  const py = Math.floor(hoverCell.y * cell);
  const pw = Math.ceil((hoverCell.x + 1) * cell) - px;
  const ph = Math.ceil((hoverCell.y + 1) * cell) - py;

  if (activeHex) {
    ctx.fillStyle = activeHex;
    ctx.globalAlpha = 0.45;
    ctx.fillRect(px, py, pw, ph);
    ctx.globalAlpha = 1;
  }

  ctx.strokeStyle = '#172951';
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, Math.max(2, pw - 2), Math.max(2, ph - 2));
}
