import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { bresenhamLine, floodFill, getShapeCells, getStampCells } from './engine/draw';
import { getCellColorIndex, isInsideGrid } from './engine/grid';
import { getMirroredCells } from './engine/mirror';
import { renderArtLayer, renderCursorLayer, renderDirtyCells, renderGridOverlay } from './engine/render';
import type {
  CellCoord,
  GridSize,
  MirrorMode,
  PixelColor,
  PixelDiff,
  PixelStamp,
  PixelTool,
  ShapeKind,
} from './engine/types';

export interface PixelCanvasHandle {
  redrawAll: () => void;
  redrawCells: (indices: number[]) => void;
  resetView: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
}

interface PixelCanvasProps {
  gridRef: React.MutableRefObject<Uint8Array>;
  size: GridSize;
  palette: PixelColor[];
  tool: PixelTool;
  activeColorIndex: number;
  mirror: MirrorMode;
  brushSize?: 1 | 2 | 3;
  shapeKind: ShapeKind;
  shapeFilled: boolean;
  activeStamp: PixelStamp;
  showGrid: boolean;
  showCenterLines: boolean;
  highContrastGrid?: boolean;
  lockPanZoom?: boolean;
  templatePixels?: number[] | null;
  templateMode?: 'trace' | 'pbn';
  onionPixels?: number[] | null;
  overlayVersion?: number;
  onCommitStroke: (diffs: PixelDiff[]) => void;
  onPickColorIndex: (colorIndex: number) => void;
  onPixelStep?: (x: number, y: number, colorIndex: number, strokeStep: number) => void;
}

const LOGICAL_PX = 512;

export const PixelCanvas = React.forwardRef<PixelCanvasHandle, PixelCanvasProps>(
  (
    {
      gridRef,
      size,
      palette,
      tool,
      activeColorIndex,
      mirror,
      brushSize = 1,
      shapeKind,
      shapeFilled,
      activeStamp,
      showGrid,
      showCenterLines,
      highContrastGrid = false,
      lockPanZoom = false,
      templatePixels = null,
      templateMode = 'trace',
      onionPixels = null,
      overlayVersion = 0,
      onCommitStroke,
      onPickColorIndex,
      onPixelStep,
    },
    ref,
  ) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const artCanvasRef = useRef<HTMLCanvasElement>(null);
    const gridCanvasRef = useRef<HTMLCanvasElement>(null);
    const cursorCanvasRef = useRef<HTMLCanvasElement>(null);

    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [hoverCell, setHoverCell] = useState<CellCoord | null>(null);
    const [shapeStart, setShapeStart] = useState<CellCoord | null>(null);

    const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
    const pinchRef = useRef<{ dist: number; midX: number; midY: number; startZoom: number; startPanX: number; startPanY: number } | null>(null);
    const drawingRef = useRef(false);
    const lastCellRef = useRef<CellCoord | null>(null);
    const strokeDiffsRef = useRef<Map<number, PixelDiff>>(new Map());
    const strokeStepRef = useRef(0);
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const redrawAll = useCallback(() => {
      const ctx = artCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      renderArtLayer(ctx, gridRef.current, size, palette, LOGICAL_PX);
    }, [gridRef, size, palette]);

    const redrawCells = useCallback(
      (indices: number[]) => {
        const ctx = artCanvasRef.current?.getContext('2d');
        if (!ctx) return;
        renderDirtyCells(ctx, gridRef.current, size, palette, LOGICAL_PX, indices);
      },
      [gridRef, size, palette],
    );

    useImperativeHandle(ref, () => ({
      redrawAll,
      redrawCells,
      resetView: () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      },
      zoomIn: () => setZoom((z) => Math.min(4, Number((z + 0.25).toFixed(2)))),
      zoomOut: () => setZoom((z) => Math.max(0.75, Number((z - 0.25).toFixed(2)))),
    }));

    useEffect(() => {
      redrawAll();
    }, [redrawAll]);

    useEffect(() => {
      const ctx = gridCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      renderGridOverlay(
        ctx,
        size,
        LOGICAL_PX,
        showGrid,
        showCenterLines || mirror !== 'none',
        highContrastGrid,
        templatePixels,
        templateMode,
        gridRef.current,
        palette,
        onionPixels,
      );
    }, [size, showGrid, showCenterLines, mirror, highContrastGrid, templatePixels, templateMode, onionPixels, overlayVersion, gridRef, palette]);

    // Cursor + live Shape/Stamp preview overlay
    useEffect(() => {
      const ctx = cursorCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      const hex =
        tool === 'erase'
          ? '#ffffff'
          : activeColorIndex > 0 && activeColorIndex <= palette.length
            ? palette[activeColorIndex - 1].hex
            : null;
      renderCursorLayer(ctx, size, LOGICAL_PX, hoverCell, hex);

      if (!hoverCell || !hex) return;
      const cellPx = LOGICAL_PX / size;

      const drawPreviewCells = (cells: CellCoord[]) => {
        ctx.save();
        ctx.fillStyle = hex;
        ctx.globalAlpha = 0.45;
        for (const c of cells) {
          for (const mc of getMirroredCells(c.x, c.y, size, mirror)) {
            const px = Math.floor(mc.x * cellPx);
            const py = Math.floor(mc.y * cellPx);
            const pw = Math.ceil((mc.x + 1) * cellPx) - px;
            const ph = Math.ceil((mc.y + 1) * cellPx) - py;
            ctx.fillRect(px, py, pw, ph);
          }
        }
        ctx.restore();
      };

      if (tool === 'shape' && shapeStart) {
        drawPreviewCells(getShapeCells(shapeKind, shapeStart, hoverCell, shapeFilled, size));
      } else if (tool === 'stamp') {
        drawPreviewCells(getStampCells(activeStamp.rows, hoverCell.x, hoverCell.y, size));
      } else if ((tool === 'draw' || tool === 'erase') && brushSize > 1) {
        const footprint: CellCoord[] = [];
        if (brushSize === 2) {
          for (let dy = 0; dy <= 1; dy++) {
            for (let dx = 0; dx <= 1; dx++) {
              footprint.push({ x: hoverCell.x + dx, y: hoverCell.y + dy });
            }
          }
        } else {
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              footprint.push({ x: hoverCell.x + dx, y: hoverCell.y + dy });
            }
          }
        }
        drawPreviewCells(footprint);
      }
    }, [hoverCell, shapeStart, shapeKind, shapeFilled, activeStamp, mirror, brushSize, size, tool, activeColorIndex, palette]);

    const triggerFillRipple = (cell: CellCoord, colorHex: string) => {
      const ctx = cursorCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      const cx = ((cell.x + 0.5) / size) * LOGICAL_PX;
      const cy = ((cell.y + 0.5) / size) * LOGICAL_PX;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 280);
        ctx.clearRect(0, 0, LOGICAL_PX, LOGICAL_PX);
        ctx.save();
        ctx.strokeStyle = colorHex;
        ctx.globalAlpha = (1 - t) * 0.7;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, t * (LOGICAL_PX * 0.45), 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const clientToCell = (clientX: number, clientY: number): CellCoord | null => {
      const canvas = cursorCanvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      const nx = (clientX - rect.left) / rect.width;
      const ny = (clientY - rect.top) / rect.height;
      const x = Math.floor(nx * size);
      const y = Math.floor(ny * size);
      return isInsideGrid(x, y, size) ? { x, y } : null;
    };

    const triggerCellPop = (cells: CellCoord[], colorHex: string, isMirrored: boolean) => {
      if (prefersReducedMotion || cells.length === 0) return;
      const ctx = cursorCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      const cellPx = LOGICAL_PX / size;
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 180);
        if (t >= 1) {
          renderCursorLayer(ctx, size, LOGICAL_PX, hoverCell, colorHex);
          return;
        }
        ctx.save();
        for (let i = 0; i < cells.length; i++) {
          const c = cells[i];
          const cx = (c.x + 0.5) * cellPx;
          const cy = (c.y + 0.5) * cellPx;
          const scale = 1 + Math.sin(t * Math.PI) * 0.28;
          const box = cellPx * scale;
          ctx.globalAlpha = (1 - t) * 0.55;
          ctx.fillStyle = i > 0 && isMirrored ? '#FFC300' : colorHex;
          ctx.fillRect(cx - box / 2, cy - box / 2, box, box);
        }
        ctx.restore();
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const paintCellWithMirror = (x: number, y: number, targetColor: number, dirty: number[]) => {
      const brushOffsets: CellCoord[] =
        brushSize === 2
          ? [
              { x, y },
              { x: x + 1, y },
              { x, y: y + 1 },
              { x: x + 1, y: y + 1 },
            ]
          : brushSize === 3
            ? [
                { x: x - 1, y: y - 1 },
                { x, y: y - 1 },
                { x: x + 1, y: y - 1 },
                { x: x - 1, y },
                { x, y },
                { x: x + 1, y },
                { x: x - 1, y: y + 1 },
                { x, y: y + 1 },
                { x: x + 1, y: y + 1 },
              ]
            : [{ x, y }];

      const changedCells: CellCoord[] = [];
      for (const bc of brushOffsets) {
        const mirrored = getMirroredCells(bc.x, bc.y, size, mirror);
        for (const mc of mirrored) {
          if (!isInsideGrid(mc.x, mc.y, size)) continue;
          const idx = mc.y * size + mc.x;
          const current = gridRef.current[idx];
          if (current === targetColor) continue;
          const existing = strokeDiffsRef.current.get(idx);
          const prev = existing ? existing.prev : current;
          gridRef.current[idx] = targetColor;
          if (prev === targetColor) {
            strokeDiffsRef.current.delete(idx);
          } else {
            strokeDiffsRef.current.set(idx, { index: idx, prev, next: targetColor });
          }
          dirty.push(idx);
          changedCells.push(mc);
        }
      }
      if (changedCells.length > 0) {
        const step = strokeStepRef.current++;
        onPixelStep?.(x, y, targetColor, step);
        const hex = targetColor === 0 ? '#ffffff' : palette[targetColor - 1]?.hex ?? '#087CF7';
        triggerCellPop(changedCells, hex, mirror !== 'none');
      }
    };

    const applyStrokeSegment = (from: CellCoord, to: CellCoord) => {
      const targetColor = tool === 'erase' ? 0 : activeColorIndex;
      const points = bresenhamLine(from.x, from.y, to.x, to.y);
      const dirty: number[] = [];
      for (const pt of points) {
        paintCellWithMirror(pt.x, pt.y, targetColor, dirty);
      }
      if (dirty.length > 0) {
        redrawCells(dirty);
      }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointersRef.current.size === 2 && !lockPanZoom) {
        drawingRef.current = false;
        lastCellRef.current = null;
        setShapeStart(null);
        const pts = [...activePointersRef.current.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        pinchRef.current = {
          dist: Math.max(1, dist),
          midX: (pts[0].x + pts[1].x) / 2,
          midY: (pts[0].y + pts[1].y) / 2,
          startZoom: zoom,
          startPanX: pan.x,
          startPanY: pan.y,
        };
        return;
      }

      if (activePointersRef.current.size !== 1) return;
      const cell = clientToCell(e.clientX, e.clientY);
      if (!cell) return;
      setHoverCell(cell);

      if (tool === 'eyedropper') {
        const picked = getCellColorIndex(gridRef.current, size, cell.x, cell.y);
        if (picked > 0) onPickColorIndex(picked);
        return;
      }

      if (tool === 'fill') {
        const diffs = floodFill(gridRef.current, size, cell.x, cell.y, activeColorIndex);
        if (diffs.length > 0) {
          redrawCells(diffs.map((d) => d.index));
          onCommitStroke(diffs);
          const hex = palette[activeColorIndex - 1]?.hex ?? '#087CF7';
          triggerFillRipple(cell, hex);
        }
        return;
      }

      if (tool === 'stamp') {
        strokeDiffsRef.current.clear();
        const dirty: number[] = [];
        for (const sc of getStampCells(activeStamp.rows, cell.x, cell.y, size)) {
          paintCellWithMirror(sc.x, sc.y, activeColorIndex, dirty);
        }
        if (dirty.length > 0) {
          redrawCells(dirty);
          onCommitStroke([...strokeDiffsRef.current.values()]);
          strokeDiffsRef.current.clear();
        }
        return;
      }

      if (tool === 'shape') {
        setShapeStart(cell);
        return;
      }

      if (tool === 'draw' || tool === 'erase') {
        drawingRef.current = true;
        strokeDiffsRef.current.clear();
        strokeStepRef.current = 0;
        lastCellRef.current = cell;
        applyStrokeSegment(cell, cell);
      }
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activePointersRef.current.size >= 2 && pinchRef.current && !lockPanZoom) {
        const pts = [...activePointersRef.current.values()];
        const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
        const midX = (pts[0].x + pts[1].x) / 2;
        const midY = (pts[0].y + pts[1].y) / 2;
        const scale = dist / pinchRef.current.dist;
        setZoom(Math.max(0.75, Math.min(4, pinchRef.current.startZoom * scale)));
        setPan({
          x: pinchRef.current.startPanX + (midX - pinchRef.current.midX),
          y: pinchRef.current.startPanY + (midY - pinchRef.current.midY),
        });
        return;
      }

      if (!drawingRef.current) {
        setHoverCell(clientToCell(e.clientX, e.clientY));
        return;
      }

      const native = e.nativeEvent;
      const samples =
        typeof native.getCoalescedEvents === 'function' && native.getCoalescedEvents().length > 0
          ? native.getCoalescedEvents()
          : [native];

      for (const sample of samples) {
        const cell = clientToCell(sample.clientX, sample.clientY);
        if (!cell) continue;
        const prev = lastCellRef.current ?? cell;
        applyStrokeSegment(prev, cell);
        lastCellRef.current = cell;
        setHoverCell(cell);
      }
    };

    const finishPointer = (e: React.PointerEvent<HTMLDivElement>) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size < 2) {
        pinchRef.current = null;
      }
      if (tool === 'shape' && shapeStart) {
        const endCell = clientToCell(e.clientX, e.clientY) ?? hoverCell ?? shapeStart;
        strokeDiffsRef.current.clear();
        const dirty: number[] = [];
        for (const sc of getShapeCells(shapeKind, shapeStart, endCell, shapeFilled, size)) {
          paintCellWithMirror(sc.x, sc.y, activeColorIndex, dirty);
        }
        setShapeStart(null);
        if (dirty.length > 0) {
          redrawCells(dirty);
          onCommitStroke([...strokeDiffsRef.current.values()]);
          strokeDiffsRef.current.clear();
        }
        return;
      }
      if (drawingRef.current) {
        drawingRef.current = false;
        lastCellRef.current = null;
        if (strokeDiffsRef.current.size > 0) {
          onCommitStroke([...strokeDiffsRef.current.values()]);
          strokeDiffsRef.current.clear();
        }
      }
    };

    return (
      <div
        ref={viewportRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onPointerLeave={() => {
          if (!drawingRef.current && !shapeStart) setHoverCell(null);
        }}
        style={{ touchAction: 'none' }}
        className="relative w-full aspect-square max-w-[820px] mx-auto overflow-hidden rounded-2xl border-[4px] border-[#843f17] bg-white select-none cursor-crosshair"
      >
        <div
          className="relative w-full h-full origin-center transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <canvas
            ref={artCanvasRef}
            width={LOGICAL_PX}
            height={LOGICAL_PX}
            style={{ imageRendering: 'pixelated' }}
            className="absolute inset-0 w-full h-full block"
          />
          <canvas
            ref={gridCanvasRef}
            width={LOGICAL_PX}
            height={LOGICAL_PX}
            className="absolute inset-0 w-full h-full pointer-events-none block"
          />
          <canvas
            ref={cursorCanvasRef}
            width={LOGICAL_PX}
            height={LOGICAL_PX}
            className="absolute inset-0 w-full h-full pointer-events-none block"
          />
        </div>
      </div>
    );
  },
);

PixelCanvas.displayName = 'PixelCanvas';
