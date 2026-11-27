import React, { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { stampStrokeSegment, type Point2D } from '../draw/brush';
import { floodFillImageData } from '../draw/fill';
import { CanvasHistory } from '../draw/history';
import { getStickerImage, type StickerItem } from '../data/stickers';
import type { DrawTool } from '../types';

export const CANVAS_SIZE = 1024;
const STICKER_DRAW_SIZE = 160;

export interface DrawCanvasHandle {
  undo: () => boolean;
  redo: () => boolean;
  clearPoof: () => void;
  hasInk: () => boolean;
  toDataUrl: () => string;
  loadDataUrl: (dataUrl: string) => Promise<void>;
  loadSvg: (svg: string) => Promise<void>;
  getArtCanvas: () => HTMLCanvasElement | null;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

interface DrawCanvasProps {
  tool: DrawTool;
  color: string;
  brushSize: number;
  activeSticker?: StickerItem | null;
  onHistoryChange?: () => void;
  onStrokeEnd?: () => void;
  onStickerStamped?: () => void;
  onFillApplied?: () => void;
}

export const DrawCanvas = React.forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  (
    {
      tool,
      color,
      brushSize,
      activeSticker = null,
      onHistoryChange,
      onStrokeEnd,
      onStickerStamped,
      onFillApplied,
    },
    ref,
  ) => {
    const artRef = useRef<HTMLCanvasElement>(null);
    const cursorRef = useRef<HTMLCanvasElement>(null);
    const historyRef = useRef<CanvasHistory>(new CanvasHistory(35));

    const activePointersRef = useRef<Map<number, Point2D>>(new Map());
    const drawingRef = useRef(false);
    const lastPtRef = useRef<Point2D | null>(null);
    const preStrokeSnapshotRef = useRef<ImageData | null>(null);
    const [poofBurst, setPoofBurst] = useState(false);

    const drawCursorPreview = useCallback(
      (pt: Point2D | null) => {
        const cursor = cursorRef.current;
        if (!cursor) return;
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const rect = cursor.getBoundingClientRect();
        const targetW = Math.max(1, Math.round(rect.width * dpr));
        const targetH = Math.max(1, Math.round(rect.height * dpr));
        if (cursor.width !== targetW || cursor.height !== targetH) {
          cursor.width = targetW;
          cursor.height = targetH;
        }
        const ctx = cursor.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, cursor.width, cursor.height);
        if (!pt) return;

        const scaleX = cursor.width / CANVAS_SIZE;
        const scaleY = cursor.height / CANVAS_SIZE;

        if (tool === 'stickers' && activeSticker) {
          const half = (STICKER_DRAW_SIZE / 2) * scaleX;
          const cx = pt.x * scaleX;
          const cy = pt.y * scaleY;
          void getStickerImage(activeSticker).then((img) => {
            ctx.save();
            ctx.globalAlpha = 0.72;
            ctx.drawImage(img, cx - half, cy - half, half * 2, half * 2);
            ctx.restore();
          });
          return;
        }

        if (tool !== 'draw' && tool !== 'erase') return;

        const radius = Math.max(3, (brushSize / 2) * scaleX);
        const cx = pt.x * scaleX;
        const cy = pt.y * scaleY;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = tool === 'erase' ? '#e11d48' : '#172951';
        ctx.lineWidth = 2 * dpr;
        ctx.stroke();
        if (tool === 'draw') {
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.25;
          ctx.fill();
        }
        ctx.restore();
      },
      [tool, color, brushSize, activeSticker],
    );

    const triggerTapRipple = useCallback((pt: Point2D, rippleColor: string) => {
      const cursor = cursorRef.current;
      if (!cursor) return;
      const ctx = cursor.getContext('2d');
      if (!ctx) return;
      const cx = (pt.x / CANVAS_SIZE) * cursor.width;
      const cy = (pt.y / CANVAS_SIZE) * cursor.height;
      const maxR = Math.min(cursor.width, cursor.height) * 0.16;
      const start = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - start) / 300);
        ctx.clearRect(0, 0, cursor.width, cursor.height);
        ctx.save();
        ctx.strokeStyle = rippleColor;
        ctx.globalAlpha = (1 - t) * 0.75;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, 8 + t * maxR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, []);

    const clientToCanvas = (clientX: number, clientY: number): Point2D | null => {
      const canvas = artRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * CANVAS_SIZE,
        y: ((clientY - rect.top) / rect.height) * CANVAS_SIZE,
      };
    };

    const hasInkCheck = useCallback((): boolean => {
      const ctx = artRef.current?.getContext('2d');
      if (!ctx) return false;
      const data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
      for (let i = 3; i < data.length; i += 16) {
        if (data[i] > 8) return true;
      }
      return false;
    }, []);

    useImperativeHandle(ref, () => ({
      undo: () => {
        const ctx = artRef.current?.getContext('2d');
        if (!ctx) return false;
        const current = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const prev = historyRef.current.undo(current);
        if (!prev) return false;
        ctx.putImageData(prev, 0, 0);
        onHistoryChange?.();
        onStrokeEnd?.();
        return true;
      },
      redo: () => {
        const ctx = artRef.current?.getContext('2d');
        if (!ctx) return false;
        const current = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const next = historyRef.current.redo(current);
        if (!next) return false;
        ctx.putImageData(next, 0, 0);
        onHistoryChange?.();
        onStrokeEnd?.();
        return true;
      },
      clearPoof: () => {
        const ctx = artRef.current?.getContext('2d');
        if (!ctx) return;
        const current = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        historyRef.current.push(current);
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        setPoofBurst(true);
        window.setTimeout(() => setPoofBurst(false), 450);
        onHistoryChange?.();
        onStrokeEnd?.();
      },
      hasInk: hasInkCheck,
      toDataUrl: () => artRef.current?.toDataURL('image/png') ?? '',
      loadDataUrl: async (dataUrl: string) => {
        const ctx = artRef.current?.getContext('2d');
        if (!ctx || !dataUrl) return;
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            historyRef.current.clear();
            onHistoryChange?.();
            resolve();
          };
          img.onerror = () => resolve();
          img.src = dataUrl;
        });
      },
      loadSvg: async (svg: string) => {
        const ctx = artRef.current?.getContext('2d');
        if (!ctx || !svg) return;
        const snapshot = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        await new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            historyRef.current.push(snapshot);
            ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
            ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
            onHistoryChange?.();
            onStrokeEnd?.();
            resolve();
          };
          img.onerror = () => resolve();
          img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
        });
      },
      getArtCanvas: () => artRef.current,
      canUndo: () => historyRef.current.canUndo(),
      canRedo: () => historyRef.current.canRedo(),
    }));

    const finishStroke = () => {
      if (!drawingRef.current) return;
      drawingRef.current = false;
      lastPtRef.current = null;
      if (preStrokeSnapshotRef.current) {
        historyRef.current.push(preStrokeSnapshotRef.current);
        preStrokeSnapshotRef.current = null;
        onHistoryChange?.();
      }
      onStrokeEnd?.();
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const pt = clientToCanvas(e.clientX, e.clientY);
      if (!pt) return;

      activePointersRef.current.set(e.pointerId, pt);

      // Two-finger gestures must never draw
      if (activePointersRef.current.size > 1) {
        if (drawingRef.current && preStrokeSnapshotRef.current) {
          const ctx = artRef.current?.getContext('2d');
          ctx?.putImageData(preStrokeSnapshotRef.current, 0, 0);
        }
        drawingRef.current = false;
        lastPtRef.current = null;
        preStrokeSnapshotRef.current = null;
        drawCursorPreview(null);
        return;
      }

      if (tool === 'fill') {
        const ctx = artRef.current?.getContext('2d');
        if (!ctx) return;
        const before = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        const work = new ImageData(new Uint8ClampedArray(before.data), before.width, before.height);
        if (floodFillImageData(work, pt.x, pt.y, color, 24)) {
          historyRef.current.push(before);
          ctx.putImageData(work, 0, 0);
          triggerTapRipple(pt, color);
          onHistoryChange?.();
          onStrokeEnd?.();
          onFillApplied?.();
        }
        return;
      }

      if (tool === 'stickers') {
        if (!activeSticker) return;
        const ctx = artRef.current?.getContext('2d');
        if (!ctx) return;
        const before = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
        void getStickerImage(activeSticker).then((img) => {
          historyRef.current.push(before);
          ctx.drawImage(
            img,
            pt.x - STICKER_DRAW_SIZE / 2,
            pt.y - STICKER_DRAW_SIZE / 2,
            STICKER_DRAW_SIZE,
            STICKER_DRAW_SIZE,
          );
          triggerTapRipple(pt, '#087CF7');
          onHistoryChange?.();
          onStrokeEnd?.();
          onStickerStamped?.();
        });
        return;
      }

      if (tool !== 'draw' && tool !== 'erase') {
        return;
      }

      const ctx = artRef.current?.getContext('2d');
      if (!ctx) return;

      preStrokeSnapshotRef.current = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      drawingRef.current = true;
      lastPtRef.current = pt;
      stampStrokeSegment(ctx, pt, pt, brushSize, color, tool);
      drawCursorPreview(pt);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      const pt = clientToCanvas(e.clientX, e.clientY);
      if (!pt) return;
      if (activePointersRef.current.has(e.pointerId)) {
        activePointersRef.current.set(e.pointerId, pt);
      }
      drawCursorPreview(pt);

      if (!drawingRef.current || activePointersRef.current.size !== 1) return;
      if (tool !== 'draw' && tool !== 'erase') return;
      const ctx = artRef.current?.getContext('2d');
      if (!ctx || !lastPtRef.current) return;

      const coalesced = e.nativeEvent.getCoalescedEvents?.();
      const samples = coalesced && coalesced.length > 0 ? coalesced : [e.nativeEvent];
      for (const sample of samples) {
        const nextPt = clientToCanvas(sample.clientX, sample.clientY);
        if (!nextPt) continue;
        stampStrokeSegment(ctx, lastPtRef.current, nextPt, brushSize, color, tool);
        lastPtRef.current = nextPt;
      }
    };

    const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
      activePointersRef.current.delete(e.pointerId);
      if (activePointersRef.current.size === 0) {
        finishStroke();
      }
    };

    useEffect(() => {
      drawCursorPreview(null);
    }, [drawCursorPreview]);

    return (
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUpOrCancel}
        onPointerCancel={handlePointerUpOrCancel}
        onPointerLeave={() => drawCursorPreview(null)}
        style={{
          touchAction: 'none',
          backgroundImage: 'radial-gradient(#cbd5e1 1.35px, transparent 1.35px)',
          backgroundSize: '24px 24px',
        }}
        className="relative w-full aspect-square max-w-[720px] mx-auto rounded-[24px] bg-white border-2 border-[#dbe7f6] shadow-inner overflow-hidden select-none cursor-crosshair"
        role="img"
        aria-label="Drawing canvas"
      >
        <canvas
          ref={artRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="absolute inset-0 w-full h-full block"
        />
        <canvas
          ref={cursorRef}
          className="pointer-events-none absolute inset-0 w-full h-full block"
        />
        {poofBurst && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/60 animate-pulse"
          >
            <span className="px-5 py-2.5 rounded-full bg-white border-2 border-[#dbe7f6] shadow-md text-lg font-black text-[#172951]">
              Poof!
            </span>
          </div>
        )}
      </div>
    );
  },
);

DrawCanvas.displayName = 'DrawCanvas';
