import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import confetti from 'canvas-confetti';
import { useSession } from '../../context/SessionContext';
import { StudioModeTabs, StudioSwitcher } from '../../components/layout/StudioModeTabs';
import { playCelebrationFanfare } from '../../utils/soundEffects';
import { getAgeModeIconSrc, STUDIO_SYSTEM_ICONS, useStudioLayoutVariant } from '../../utils/studioLayoutAb';
import { playPixelErasePop, playPixelPip, speakPixelLabel } from './audio/sfx';
import { PIXEL_PALETTE_PACKS } from './data/palettes';
import { PIXEL_STAMPS } from './data/stamps';
import { getDailyPixelChallenge, PIXEL_TEMPLATES, type PixelTemplate } from './data/templates';
import { createGrid } from './engine/grid';
import { PixelHistory } from './engine/history';
import type {
  GridSize,
  MirrorMode,
  PixelColor,
  PixelDiff,
  PixelDocument,
  PixelTool,
  ShapeKind,
} from './engine/types';
import { PixelCanvas, type PixelCanvasHandle } from './PixelCanvas';
import { loadPixelAutosave, savePixelAutosave } from './storage/autosave';
import {
  deletePixelWork,
  getPixelWorkById,
  listPixelWorks,
  renderPixelDataUrl,
  savePixelWork,
  type SavedPixelWork,
} from './storage/myWork';
import { exportPixelPng } from './export/png';
import { printPixelColoringSheet } from './export/printSheet';
import { sendPixelArtToVoxelStudio } from './export/toVoxel';
import { Mascot } from './ui/Mascot';
import { MyArtPanel } from './ui/MyArtPanel';
import { ParentGate } from './ui/ParentGate';
import { TemplatePanel } from './ui/TemplatePanel';

export type PixelAgeMode = 'little' | 'builder' | 'pro';

const AGE_MODES: Record<
  PixelAgeMode,
  { label: string; age: string; emoji: string; title: string; desc: string }
> = {
  little: {
    label: 'Little',
    age: '4–6',
    emoji: '🐣',
    title: "I'm little",
    desc: 'Draw, Erase, Fill & Stamps with big squares!',
  },
  builder: {
    label: 'Builder',
    age: '7–9',
    emoji: '🧱',
    title: "I'm a builder",
    desc: 'Unlocks Shapes, Magic Mirror & Palettes!',
  },
  pro: {
    label: 'Pro',
    age: '10+',
    emoji: '🚀',
    title: "I'm a pro",
    desc: 'Unlocks Huge (64) canvas & custom colors!',
  },
};

const ALL_GRID_SIZE_OPTIONS: { size: GridSize; label: string }[] = [
  { size: 8, label: 'Small (8)' },
  { size: 16, label: 'Medium (16)' },
  { size: 32, label: 'Large (32)' },
  { size: 64, label: 'Huge (64)' },
];

function FrameThumb({
  pixels,
  size,
  palette,
}: {
  pixels: number[];
  size: number;
  palette: { hex: string }[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    for (let i = 0; i < pixels.length; i++) {
      const cIdx = pixels[i];
      if (!cIdx) continue;
      const color = palette[cIdx - 1]?.hex;
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(i % size, Math.floor(i / size), 1, 1);
    }
  }, [pixels, size, palette]);

  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      style={{ imageRendering: 'pixelated' }}
      className="w-full h-full block rounded-lg bg-white"
    />
  );
}

export const PixelStudio: React.FC = () => {
  const navigate = useNavigate();
  const { recordPuzzleWin } = useSession();
  const { variant: layoutVariant } = useStudioLayoutVariant();
  const isUnified = layoutVariant === 'unified';

  const [ageMode, setAgeMode] = useState<PixelAgeMode>('builder');
  const [showAgePicker, setShowAgePicker] = useState(false);

  const [size, setSize] = useState<GridSize>(16);
  const [title, setTitle] = useState('My Pixel Art');
  const [tool, setTool] = useState<PixelTool>('draw');
  const [mirror, setMirror] = useState<MirrorMode>('none');
  const [shapeKind, setShapeKind] = useState<ShapeKind>('rect');
  const [shapeFilled, setShapeFilled] = useState(true);
  const [stampId, setStampId] = useState(PIXEL_STAMPS[0].id);

  const [paletteId, setPaletteId] = useState<string>('default');
  const [customColors, setCustomColors] = useState<PixelColor[]>([]);
  const [activeColorIndex, setActiveColorIndex] = useState<number>(4);
  const [recentIndices, setRecentIndices] = useState<number[]>([4, 9, 11]);
  const [rightTab, setRightTab] = useState<'colors' | 'palettes' | 'templates' | 'art'>('colors');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [templateMode, setTemplateMode] = useState<'trace' | 'pbn'>('trace');

  const [showGrid, setShowGrid] = useState(true);
  const [brushSize, setBrushSize] = useState<1 | 2 | 3>(1);
  const [highContrastGrid, setHighContrastGrid] = useState(false);
  const [showCenterLines, setShowCenterLines] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const kbCursorRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [poofToastOpen, setPoofToastOpen] = useState(false);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);
  const [shutterFlash, setShutterFlash] = useState(false);
  const [savedWorks, setSavedWorks] = useState<SavedPixelWork[]>([]);
  const [workId, setWorkId] = useState<string>('pixel-studio-main');
  const [pendingGate, setPendingGate] = useState<{ label: string; run: () => void } | null>(null);
  const [mobileSheet, setMobileSheet] = useState<'colors' | 'templates' | 'art' | 'more' | null>(null);
  const [frames, setFrames] = useState<number[][]>(() => [Array(16 * 16).fill(0)]);
  const [activeFrameIdx, setActiveFrameIdx] = useState(0);
  const [flipbookOpen, setFlipbookOpen] = useState(false);
  const [flipbookPlaying, setFlipbookPlaying] = useState(false);
  const [flipbookFps, setFlipbookFps] = useState(4);
  const [onionSkin, setOnionSkin] = useState(true);
  const importImageInputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);

  // Mascot state (shows each tip at most once)
  const [mascotEnabled, setMascotEnabled] = useState(true);
  const [mascotTip, setMascotTip] = useState<string | null>(null);
  const seenTipsRef = useRef<Set<string>>(new Set());
  const idleTimerRef = useRef<number | null>(null);

  // Milestone tracking
  const awardedMilestonesRef = useRef<Set<string>>(new Set());

  const gridRef = useRef<Uint8Array>(createGrid(16));
  const historyRef = useRef<PixelHistory>(new PixelHistory());
  const canvasRef = useRef<PixelCanvasHandle>(null);
  const autosaveTimerRef = useRef<number | null>(null);
  const poofTimerRef = useRef<number | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const showMascotTip = useCallback(
    (tipId: string, text: string) => {
      if (!mascotEnabled || seenTipsRef.current.has(tipId)) return;
      seenTipsRef.current.add(tipId);
      setMascotTip(text);
    },
    [mascotEnabled],
  );

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      showMascotTip('idle', 'Try a Stamp or Magic Mirror for something fun!');
    }, 20000);
  }, [showMascotTip]);

  const awardMilestone = useCallback(
    (id: string, message: string) => {
      if (awardedMilestonesRef.current.has(id)) return;
      awardedMilestonesRef.current.add(id);
      recordPuzzleWin();
      void playCelebrationFanfare();
      if (!prefersReducedMotion) {
        void confetti({ particleCount: 45, spread: 60, origin: { y: 0.7 } });
      }
      setBannerMessage(`⭐ ${message}`);
      setTimeout(() => setBannerMessage(null), 3500);
    },
    [recordPuzzleWin, prefersReducedMotion],
  );

  // Load saved age mode on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('ll-pixel-age-mode');
      if (saved === 'little' || saved === 'builder' || saved === 'pro') {
        setAgeMode(saved);
        if (saved === 'little') setSize(8);
      } else {
        setShowAgePicker(true);
      }
      if (localStorage.getItem('ll-pixel-mascot-off') === '1') {
        setMascotEnabled(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Show welcome tip once when age picker closes
  useEffect(() => {
    if (!showAgePicker && mascotEnabled) {
      showMascotTip('welcome', 'Tap a square to color it!');
      resetIdleTimer();
    }
    return () => {
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current);
    };
  }, [showAgePicker, mascotEnabled, showMascotTip, resetIdleTimer]);

  const activeStamp = PIXEL_STAMPS.find((s) => s.id === stampId) ?? PIXEL_STAMPS[0];
  const dailyChallenge = useMemo(() => getDailyPixelChallenge(), []);
  const fullPalette = useMemo(
    () => [
      ...(PIXEL_PALETTE_PACKS.find((p) => p.id === paletteId)?.colors ?? PIXEL_PALETTE_PACKS[0].colors),
      ...(ageMode === 'pro' ? customColors : []),
    ],
    [paletteId, customColors, ageMode],
  );
  const palette = useMemo(
    () => (ageMode === 'little' ? fullPalette.slice(0, 16) : fullPalette),
    [ageMode, fullPalette],
  );
  const safeColorIdx = Math.min(activeColorIndex, palette.length);
  const activeColor = palette[safeColorIdx - 1] ?? palette[0];
  const activeTemplate = useMemo(
    () => PIXEL_TEMPLATES.find((t) => t.id === activeTemplateId) ?? null,
    [activeTemplateId],
  );

  const templateProgress = useMemo(() => {
    if (!activeTemplate || activeTemplate.size !== size) return { matched: 0, total: 0, percent: 0 };
    let matched = 0;
    let total = 0;
    for (let i = 0; i < activeTemplate.pixels.length; i++) {
      const target = activeTemplate.pixels[i];
      if (target > 0) {
        total++;
        if (gridRef.current[i] === target) matched++;
      }
    }
    return { matched, total, percent: total ? Math.round((matched / total) * 100) : 0 };
  }, [activeTemplate, size, version]);

  const handleLoadTemplate = (tpl: PixelTemplate, modeOverride?: 'trace' | 'pbn') => {
    gridRef.current = createGrid(tpl.size);
    historyRef.current.clear();
    setSize(tpl.size);
    setPaletteId('default');
    setActiveTemplateId(tpl.id);
    setTemplateMode(modeOverride ?? (ageMode === 'little' ? 'trace' : templateMode));
    setTitle(tpl.name);
    setTool('draw');
    canvasRef.current?.resetView();
    setVersion((v) => v + 1);
    scheduleAutosave();
    if (ageMode === 'little') speakPixelLabel(tpl.name);
  };

  const handleSurpriseMe = () => {
    const pool =
      ageMode === 'little'
        ? PIXEL_TEMPLATES.filter((t) => t.size === 8)
        : PIXEL_TEMPLATES;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) handleLoadTemplate(pick, 'trace');
  };

  const availableSizes = useMemo(() => {
    if (ageMode === 'little') return ALL_GRID_SIZE_OPTIONS.filter((o) => o.size === 8 || o.size === 16);
    if (ageMode === 'builder') return ALL_GRID_SIZE_OPTIONS.filter((o) => o.size === 16 || o.size === 32);
    return ALL_GRID_SIZE_OPTIONS;
  }, [ageMode]);

  const selectAgeMode = (mode: PixelAgeMode) => {
    setAgeMode(mode);
    setShowAgePicker(false);
    try {
      localStorage.setItem('ll-pixel-age-mode', mode);
    } catch {
      /* ignore */
    }
    if (mode === 'little') {
      setPaletteId('default');
      setRightTab('colors');
      setMirror('none');
      if (tool === 'shape' || tool === 'eyedropper' || tool === 'select') setTool('draw');
      if (size > 16) handleChangeSize(16);
    } else if (mode === 'builder') {
      if (size === 64) handleChangeSize(32);
      if (size === 8) handleChangeSize(16);
    }
    speakPixelLabel(AGE_MODES[mode].title);
  };

  useEffect(() => {
    if (activeTemplate && templateProgress.total > 0 && templateProgress.percent === 100) {
      awardMilestone(`tpl-${activeTemplate.id}`, `Finished ${activeTemplate.name}! +1 Trophy!`);
    }
  }, [activeTemplate, templateProgress, awardMilestone]);

  const selectColorIndex = useCallback((idx: number) => {
    setActiveColorIndex(idx);
    setRecentIndices((prev) => [idx, ...prev.filter((i) => i !== idx)].slice(0, 8));
  }, []);

  const flushAutosave = useCallback(() => {
    const doc: PixelDocument = {
      id: 'pixel-studio-main',
      title,
      size,
      paletteId,
      pixels: Array.from(gridRef.current),
      updatedAt: Date.now(),
    };
    void savePixelAutosave(doc);
  }, [size, title, paletteId]);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current !== null) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => flushAutosave(), 600);
  }, [flushAutosave]);

  useEffect(() => {
    setSavedWorks(listPixelWorks());
    const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : null;
    const requestedWorkId = params?.get('work');
    if (requestedWorkId) {
      const found = getPixelWorkById(requestedWorkId);
      if (found && found.pixels.length === found.size * found.size) {
        gridRef.current = Uint8Array.from(found.pixels);
        setWorkId(found.id);
        setSize(found.size);
        setPaletteId(found.paletteId || 'default');
        setTitle(found.title);
        canvasRef.current?.redrawAll();
        return;
      }
    }

    let active = true;
    void loadPixelAutosave().then((saved) => {
      if (!active || !saved) return;
      if (saved.pixels.length === saved.size * saved.size) {
        gridRef.current = Uint8Array.from(saved.pixels);
        setSize(saved.size);
        if (saved.paletteId) setPaletteId(saved.paletteId);
        setTitle(saved.title || 'My Pixel Art');
        canvasRef.current?.redrawAll();
        if (saved.pixels.some((p) => p > 0)) {
          setBannerMessage(`Welcome back! "${saved.title || 'Your art'}" is waiting 🎨`);
          setTimeout(() => setBannerMessage(null), 4000);
        }
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushAutosave();
    };
    window.addEventListener('blur', flushAutosave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', flushAutosave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [flushAutosave]);

  const handleSelectTool = (nextTool: PixelTool, label: string) => {
    setTool(nextTool);
    setAnnouncement(`${label} tool selected`);
    if (ageMode === 'little') speakPixelLabel(label);
    resetIdleTimer();
  };

  const handleCommitStroke = useCallback(
    (diffs: PixelDiff[]) => {
      historyRef.current.push(diffs);
      setVersion((v) => v + 1);
      scheduleAutosave();
      resetIdleTimer();

      if (tool === 'fill') {
        awardMilestone('first-fill', 'First Fill! +1 Trophy!');
      }

      // Count filled pixels for every-50-pixels milestones
      let filledCount = 0;
      for (let i = 0; i < gridRef.current.length; i++) {
        if (gridRef.current[i] > 0) filledCount++;
      }
      const bucket = Math.floor(filledCount / 50) * 50;
      if (bucket >= 50) {
        awardMilestone(`px-${bucket}`, `Wow, ${bucket} pixels! +1 Trophy!`);
      }
      if (filledCount >= 10 && ageMode !== 'little' && mirror === 'none') {
        showMascotTip('mirror', "Try the mirror, it's magic!");
      }
    },
    [scheduleAutosave, resetIdleTimer, tool, awardMilestone, ageMode, mirror, showMascotTip],
  );

  const handlePixelStep = useCallback((_x: number, _y: number, colorIdx: number, step: number) => {
    if (colorIdx === 0) playPixelErasePop();
    else playPixelPip(step);
  }, []);

  const handleUndo = () => {
    const diffs = historyRef.current.undo(gridRef.current);
    if (!diffs) return;
    canvasRef.current?.redrawCells(diffs.map((d) => d.index));
    playPixelErasePop();
    setVersion((v) => v + 1);
    scheduleAutosave();
  };

  const handleRedo = () => {
    const diffs = historyRef.current.redo(gridRef.current);
    if (!diffs) return;
    canvasRef.current?.redrawCells(diffs.map((d) => d.index));
    playPixelPip(2);
    setVersion((v) => v + 1);
    scheduleAutosave();
  };

  const handlePoofClear = () => {
    const diffs: PixelDiff[] = [];
    for (let i = 0; i < gridRef.current.length; i++) {
      if (gridRef.current[i] !== 0) {
        diffs.push({ index: i, prev: gridRef.current[i], next: 0 });
        gridRef.current[i] = 0;
      }
    }
    if (diffs.length === 0 && !activeTemplateId) return;
    if (diffs.length > 0) {
      historyRef.current.push(diffs);
    }
    if (activeTemplateId) {
      setActiveTemplateId(null);
    }
    canvasRef.current?.redrawAll();
    playPixelErasePop();
    setVersion((v) => v + 1);
    scheduleAutosave();
    setPoofToastOpen(true);
    if (poofTimerRef.current !== null) window.clearTimeout(poofTimerRef.current);
    poofTimerRef.current = window.setTimeout(() => setPoofToastOpen(false), 6000);
  };

  const handleChangeSize = (nextSize: GridSize) => {
    if (nextSize === size) return;
    gridRef.current = createGrid(nextSize);
    historyRef.current.clear();
    setSize(nextSize);
    canvasRef.current?.resetView();
    setVersion((v) => v + 1);
    scheduleAutosave();
  };

  const handleApplyPalettePack = (packId: string) => {
    const pack = PIXEL_PALETTE_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setPaletteId(packId);
    setCustomColors([]);
    const maxLen = pack.colors.length;
    for (let i = 0; i < gridRef.current.length; i++) {
      if (gridRef.current[i] > maxLen) {
        gridRef.current[i] = ((gridRef.current[i] - 1) % maxLen) + 1;
      }
    }
    if (activeColorIndex > maxLen) setActiveColorIndex(1);
    setRecentIndices((prev) => prev.filter((i) => i <= maxLen));
    scheduleAutosave();
  };

  const handleAddCustomColor = (hex: string) => {
    const existingIdx = palette.findIndex((c) => c.hex.toLowerCase() === hex.toLowerCase());
    if (existingIdx >= 0) {
      selectColorIndex(existingIdx + 1);
      return;
    }
    const baseLen =
      (PIXEL_PALETTE_PACKS.find((p) => p.id === paletteId)?.colors ?? PIXEL_PALETTE_PACKS[0].colors)
        .length;
    const nextCustom: PixelColor = { id: `custom-${hex}`, name: hex.toUpperCase(), hex };
    const updated = [...customColors, nextCustom].slice(-5);
    setCustomColors(updated);
    selectColorIndex(baseLen + updated.length);
  };

  const cycleMirror = () => {
    const order: MirrorMode[] = ['none', 'x', 'y', 'both'];
    const next = order[(order.indexOf(mirror) + 1) % order.length];
    setMirror(next);
    if (next !== 'none') {
      awardMilestone('first-mirror', 'Magic Mirror! +1 Trophy!');
    }
    if (ageMode === 'little') speakPixelLabel('Magic Mirror');
  };

  const toolItems: [PixelTool, string, string, string?][] = useMemo(() => {
    const list: [PixelTool, string, string, string?][] = [
      ['draw', 'Draw', 'solar:pen-bold', STUDIO_SYSTEM_ICONS.toolDraw],
      ['erase', 'Erase', 'solar:eraser-bold', STUDIO_SYSTEM_ICONS.toolErase],
      ['fill', 'Fill', 'solar:paint-roller-bold', STUDIO_SYSTEM_ICONS.toolFill],
      ['stamp', 'Stamps', 'solar:sticker-smile-circle-2-bold', STUDIO_SYSTEM_ICONS.toolStickers],
    ];
    if (ageMode !== 'little') {
      list.push(['eyedropper', 'Pick', 'solar:pipette-bold']);
      list.push(['shape', 'Shapes', 'solar:widget-4-bold']);
    }
    return list;
  }, [ageMode]);

  // Sync current grid into active flipbook frame
  useEffect(() => {
    setFrames((prev) => {
      const next = [...prev];
      next[activeFrameIdx] = Array.from(gridRef.current);
      return next;
    });
  }, [version, activeFrameIdx]);

  // Flipbook playback loop
  useEffect(() => {
    if (!flipbookPlaying || frames.length < 2) return;
    const id = window.setInterval(() => {
      setActiveFrameIdx((prev) => {
        const nextIdx = (prev + 1) % frames.length;
        const nextPixels = frames[nextIdx];
        if (nextPixels && nextPixels.length === size * size) {
          gridRef.current = Uint8Array.from(nextPixels);
          canvasRef.current?.redrawAll();
        }
        return nextIdx;
      });
    }, Math.round(1000 / flipbookFps));
    return () => window.clearInterval(id);
  }, [flipbookPlaying, flipbookFps, frames, size]);

  const switchFrame = (idx: number) => {
    setFlipbookPlaying(false);
    const snapshot = Array.from(gridRef.current);
    setFrames((prev) => {
      const next = [...prev];
      next[activeFrameIdx] = snapshot;
      const target = next[idx];
      if (target && target.length === size * size) {
        gridRef.current = Uint8Array.from(target);
        canvasRef.current?.redrawAll();
      }
      return next;
    });
    setActiveFrameIdx(idx);
    historyRef.current.clear();
  };

  const addFlipbookFrame = () => {
    if (frames.length >= 8) return;
    const blank = new Array<number>(size * size).fill(0);
    const nextIdx = frames.length;
    setFrames((prev) => {
      const copy = [...prev];
      copy[activeFrameIdx] = Array.from(gridRef.current);
      return [...copy, blank];
    });
    gridRef.current = Uint8Array.from(blank);
    setActiveFrameIdx(nextIdx);
    historyRef.current.clear();
    canvasRef.current?.redrawAll();
  };

  const duplicateFlipbookFrame = () => {
    if (frames.length >= 8) return;
    setFlipbookPlaying(false);
    const snapshot = Array.from(gridRef.current);
    const insertIdx = activeFrameIdx + 1;
    setFrames((prev) => {
      const next = [...prev];
      next[activeFrameIdx] = snapshot;
      next.splice(insertIdx, 0, [...snapshot]);
      return next;
    });
    setActiveFrameIdx(insertIdx);
    historyRef.current.clear();
  };

  const deleteFlipbookFrame = () => {
    if (frames.length <= 1) return;
    setFlipbookPlaying(false);
    const nextFrames = frames.filter((_, i) => i !== activeFrameIdx);
    const nextIdx = Math.min(activeFrameIdx, nextFrames.length - 1);
    const target = nextFrames[nextIdx];
    setFrames(nextFrames);
    if (target && target.length === size * size) {
      gridRef.current = Uint8Array.from(target);
      canvasRef.current?.redrawAll();
    }
    setActiveFrameIdx(nextIdx);
    historyRef.current.clear();
  };

  const handleMakeIt3D = () => {
    const count = sendPixelArtToVoxelStudio(title, gridRef.current, size, palette);
    if (count === 0) {
      setBannerMessage('Draw some pixels first to make it 3D!');
      setTimeout(() => setBannerMessage(null), 2500);
      return;
    }
    navigate('/voxel-studio');
  };

  const handleImportImageLocal = async (file?: File) => {
    if (!file) return;
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const off = document.createElement('canvas');
        off.width = size;
        off.height = size;
        const ctx = off.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          const next = createGrid(size);
          const palRgb = palette.map((c) => {
            const h = c.hex.replace('#', '');
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
          });
          for (let i = 0; i < size * size; i++) {
            const a = data[i * 4 + 3];
            if (a < 64) {
              next[i] = 0;
              continue;
            }
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            let best = 1;
            let bestDist = Infinity;
            for (let p = 0; p < palRgb.length; p++) {
              const dr = r - palRgb[p][0];
              const dg = g - palRgb[p][1];
              const db = b - palRgb[p][2];
              const d = dr * dr + dg * dg + db * db;
              if (d < bestDist) {
                bestDist = d;
                best = p + 1;
              }
            }
            next[i] = best;
          }
          gridRef.current = next;
          historyRef.current.clear();
          canvasRef.current?.redrawAll();
          setVersion((v) => v + 1);
          scheduleAutosave();
          setBannerMessage('Imported image locally! 🎨');
          setTimeout(() => setBannerMessage(null), 3000);
        }
        URL.revokeObjectURL(url);
      };
      img.src = url;
    } catch {
      /* ignore invalid image */
    }
  };

  const handleSaveToMyWork = () => {
    flushAutosave();
    const pixels = Array.from(gridRef.current);
    const thumbnail = renderPixelDataUrl(pixels, size, palette, 128, false);
    const id = workId === 'pixel-studio-main' ? `pixel-${Date.now().toString(36)}` : workId;
    setWorkId(id);
    savePixelWork({
      id,
      type: 'pixel',
      title,
      size,
      paletteId,
      pixels,
      thumbnail,
      updatedAt: Date.now(),
    });
    setSavedWorks(listPixelWorks());
    if (!prefersReducedMotion) {
      setShutterFlash(true);
      setTimeout(() => setShutterFlash(false), 240);
      void confetti({ particleCount: 55, spread: 70, origin: { y: 0.65 } });
    }
    awardMilestone('first-save', 'Saved to My Work! +1 Trophy!');
    setBannerMessage('Saved to My Work! ✨');
    setTimeout(() => setBannerMessage(null), 3000);
  };

  const handleLoadSavedWork = (work: SavedPixelWork) => {
    if (work.pixels.length !== work.size * work.size) return;
    gridRef.current = Uint8Array.from(work.pixels);
    historyRef.current.clear();
    setWorkId(work.id);
    setSize(work.size);
    setPaletteId(work.paletteId || 'default');
    setTitle(work.title);
    setActiveTemplateId(null);
    canvasRef.current?.resetView();
    canvasRef.current?.redrawAll();
    setVersion((v) => v + 1);
  };

  // Full keyboard accessibility: Arrows move cursor, Space/Enter draws, Ctrl/Cmd+Z undoes, B/E/F/G shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'b') {
        handleSelectTool('draw', 'Draw');
        return;
      }
      if (key === 'e') {
        handleSelectTool('erase', 'Erase');
        return;
      }
      if (key === 'f') {
        handleSelectTool('fill', 'Fill');
        return;
      }
      if (key === 'g') {
        setShowGrid((v) => !v);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        kbCursorRef.current.x = Math.min(size - 1, kbCursorRef.current.x + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        kbCursorRef.current.x = Math.max(0, kbCursorRef.current.x - 1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        kbCursorRef.current.y = Math.min(size - 1, kbCursorRef.current.y + 1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        kbCursorRef.current.y = Math.max(0, kbCursorRef.current.y - 1);
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (target?.tagName === 'BUTTON') return;
        e.preventDefault();
        const { x, y } = kbCursorRef.current;
        const idx = y * size + x;
        const nextVal = tool === 'erase' ? 0 : safeColorIdx;
        const prevVal = gridRef.current[idx];
        if (prevVal !== nextVal) {
          gridRef.current[idx] = nextVal;
          canvasRef.current?.redrawCells([idx]);
          handleCommitStroke([{ index: idx, prev: prevVal, next: nextVal }]);
          handlePixelStep(x, y, nextVal, 0);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <section className="flex-1 bg-gradient-to-b from-[#e4f1fe] via-[#ebf5fe] to-[#dff0ff] px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-3">
      {/* Shared Tool Header Bar */}
      <header className={`relative z-40 max-w-[1440px] w-full mx-auto bg-white/90 backdrop-blur-[4px] rounded-[16px] border ${isUnified ? 'border-[#dde7f5] px-4 py-2.5 xl:flex-nowrap' : 'border-[#dbe7f6] px-3 sm:px-4 py-2.5'} shadow-xs flex flex-wrap items-center justify-between gap-2.5`}>
        {isUnified ? (
          <StudioSwitcher active="pixel-art" />
        ) : (
          <>
            <div className="flex items-center gap-3 shrink-0">
              <img
                src="/Tools and Game Icons/Pixel Art Studio App icon.webp"
                alt=""
                className="w-10 h-10 rounded-2xl object-cover shadow-xs shrink-0"
              />
              <div>
                <h1 className="text-lg sm:text-xl font-black text-[#172951] leading-tight">
                  Pixel Art Studio
                </h1>
                <p className="text-[11px] sm:text-xs font-bold text-[#516587]">
                  Make tiny pictures, one square at a time
                </p>
              </div>
            </div>

            {/* Classic Shared Studio Navigation Tabs */}
            <StudioModeTabs active="pixel-art" compact={false} />
          </>
        )}

        {/* Top Bar Actions */}
        <div className={`flex items-center gap-1.5 ${isUnified ? 'flex-wrap sm:flex-nowrap' : 'flex-wrap'} shrink-0`}>
          <button
            type="button"
            onClick={() => setShowAgePicker(true)}
            title="Switch age mode"
            className={
              isUnified
                ? 'h-10 px-3 rounded-full bg-[#f5f8fe] hover:bg-[#eaf1fd] border-2 border-[#dde7f5] text-xs font-black text-[#1b294e] flex items-center gap-1.5'
                : 'min-h-[44px] px-3 rounded-xl bg-[#f4f8ff] hover:bg-[#e8f2ff] border border-[#dbe7f6] text-xs font-black text-[#172951] flex items-center gap-1.5'
            }
          >
            {isUnified ? (
              <img src={getAgeModeIconSrc(ageMode)} alt="" className="w-4 h-4 object-contain shrink-0" />
            ) : (
              <span>{AGE_MODES[ageMode].emoji}</span>
            )}
            <span className="hidden sm:inline">{AGE_MODES[ageMode].label}</span>
          </button>

          {isUnified ? (
            <div className="h-10 bg-white border-2 border-[#dee3ed] rounded-full px-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!historyRef.current.canUndo}
                aria-label="Undo"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#e5ecf8] hover:bg-[#d8e3f5] disabled:bg-transparent disabled:opacity-35 transition-colors"
              >
                <img src={STUDIO_SYSTEM_ICONS.undo} alt="" className="w-5 h-5 object-contain" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!historyRef.current.canRedo}
                aria-label="Redo"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#e5ecf8] hover:bg-[#d8e3f5] disabled:bg-transparent disabled:opacity-35 transition-colors"
              >
                <img src={STUDIO_SYSTEM_ICONS.redo} alt="" className="w-5 h-5 object-contain" />
              </button>
            </div>
          ) : (
            <div className="flex items-center bg-[#f4f8ff] rounded-xl border border-[#dbe7f6] p-0.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!historyRef.current.canUndo}
                aria-label="Undo"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#172951] hover:bg-white disabled:opacity-35"
              >
                <Icon icon="solar:undo-left-bold" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!historyRef.current.canRedo}
                aria-label="Redo"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[#172951] hover:bg-white disabled:opacity-35"
              >
                <Icon icon="solar:undo-right-bold" className="w-5 h-5" />
              </button>
            </div>
          )}

          <select
            aria-label="Canvas size"
            value={size}
            onChange={(e) => handleChangeSize(Number(e.target.value) as GridSize)}
            className={
              isUnified
                ? 'h-10 bg-white border-2 border-[#dde7f5] rounded-full px-3.5 text-xs font-black text-[#1b294e]'
                : 'min-h-[44px] bg-white border-2 border-[#dbe7f6] rounded-xl px-3 text-xs font-black text-[#172951]'
            }
          >
            {availableSizes.map((opt) => (
              <option key={opt.size} value={opt.size}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleSurpriseMe}
            title="Surprise me with a random template!"
            className={
              isUnified
                ? 'h-10 px-3.5 rounded-full bg-[#f9f5fe] hover:bg-[#f2e8fe] border-2 border-[#e6d6fc] text-xs font-black text-[#7429c6] flex items-center gap-1.5'
                : 'min-h-[44px] px-3 rounded-xl bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 text-xs font-black text-purple-700 flex items-center gap-1.5'
            }
          >
            {isUnified ? (
              <img src={STUDIO_SYSTEM_ICONS.surpriseMe} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Icon icon="solar:stars-minimalistic-bold" className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Surprise me</span>
          </button>

          <button
            type="button"
            onClick={handleMakeIt3D}
            title="Turn your pixel art into 3D blocks!"
            className={
              isUnified
                ? 'h-10 px-3.5 rounded-full bg-[#eff5fe] hover:bg-[#e1edfd] border-2 border-[#c4dafb] text-xs font-black text-[#377aef] flex items-center gap-1.5'
                : 'min-h-[44px] px-3 rounded-xl bg-[#eef5ff] hover:bg-[#dbeafe] border-2 border-[#bfdbfe] text-xs font-black text-[#087CF7] flex items-center gap-1.5'
            }
          >
            {isUnified ? (
              <img src={STUDIO_SYSTEM_ICONS.make3d} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Icon icon="solar:box-bold" className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Make it 3D</span>
          </button>

          <button
            type="button"
            onClick={handleSaveToMyWork}
            className={
              isUnified
                ? 'h-10 px-4 rounded-full border-[1.5px] border-[#ebb23d] bg-gradient-to-b from-[#fae25b] via-[#f7ce46] to-[#ffd67b] shadow-[0_6px_8px_rgba(235,182,62,0.35),inset_0_2px_2px_rgba(255,255,255,0.85),inset_0_-3px_3px_rgba(170,113,38,0.3)] text-xs font-black text-[#111729] flex items-center gap-1.5 cursor-pointer hover:brightness-105 active:translate-y-0.5'
                : 'btn-glossy-yellow min-h-[44px] px-4 rounded-xl text-xs font-black text-slate-900 flex items-center gap-1.5 cursor-pointer border-b-4 border-[#c98719] active:translate-y-0.5'
            }
          >
            {isUnified ? (
              <img src={STUDIO_SYSTEM_ICONS.save} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Icon icon="solar:download-minimalistic-bold" className="w-4 h-4" />
            )}
            <span>Save</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-4 items-stretch min-h-0">
        {/* Left Column */}
        <aside className="hidden lg:flex w-[252px] shrink-0 flex-col gap-3">
          <div className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3.5 flex flex-col gap-2">
            <span className="text-xs font-black text-[#172951] px-1">Tools</span>
            <div className="grid grid-cols-2 gap-2">
              {toolItems.map(([id, label, icon, svg]) => {
                const active = tool === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelectTool(id, label)}
                    className={`min-h-[54px] px-2.5 rounded-2xl border-2 border-b-4 font-extrabold text-xs flex flex-col items-center justify-center gap-1 transition-all active:translate-y-0.5 ${
                      active
                        ? 'bg-[#e8f2ff] border-[#087CF7] text-[#087CF7]'
                        : 'bg-[#f8fbff] border-[#dbe7f6] text-[#172951] hover:bg-[#eef5ff]'
                    }`}
                  >
                    {isUnified && svg ? (
                      <img src={svg} alt="" className="w-5 h-5 object-contain" />
                    ) : (
                      <Icon icon={icon} className="w-5 h-5" />
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>

            {ageMode !== 'little' && (
              <button
                type="button"
                onClick={cycleMirror}
                className={`min-h-[48px] px-3 rounded-2xl border-2 border-b-4 font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:translate-y-0.5 ${
                  mirror !== 'none'
                    ? 'bg-purple-600 border-purple-800 text-white'
                    : 'bg-[#f8fbff] border-[#dbe7f6] text-[#172951] hover:bg-[#eef5ff]'
                }`}
              >
                <Icon icon="solar:mirror-left-bold" className="w-5 h-5" />
                <span>
                  {mirror === 'none'
                    ? 'Magic Mirror'
                    : mirror === 'x'
                      ? 'Mirror: L ↔ R'
                      : mirror === 'y'
                        ? 'Mirror: U ↕ D'
                        : 'Mirror: 4-Way'}
                </span>
              </button>
            )}

            {tool === 'shape' && ageMode !== 'little' && (
              <div className="rounded-2xl bg-[#f4f8ff] border border-[#dbe7f6] p-2.5 space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  {(['line', 'rect', 'circle'] as ShapeKind[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setShapeKind(k)}
                      className={`py-1.5 rounded-lg text-[11px] font-black capitalize ${
                        shapeKind === k ? 'bg-[#087CF7] text-white' : 'bg-white text-[#172951]'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
                {shapeKind !== 'line' && (
                  <button
                    type="button"
                    onClick={() => setShapeFilled((v) => !v)}
                    className="w-full py-1.5 rounded-lg bg-white border border-[#dbe7f6] text-[11px] font-black text-[#172951]"
                  >
                    {shapeFilled ? 'Filled Shape' : 'Outline Only'}
                  </button>
                )}
              </div>
            )}

            {tool === 'stamp' && (
              <div className="rounded-2xl bg-[#f4f8ff] border border-[#dbe7f6] p-2 grid grid-cols-3 gap-1.5">
                {PIXEL_STAMPS.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStampId(st.id);
                      if (ageMode === 'little') speakPixelLabel(st.name);
                    }}
                    title={st.name}
                    className={`min-h-[42px] rounded-xl text-lg flex items-center justify-center border ${
                      stampId === st.id ? 'bg-white border-[#087CF7] shadow-xs' : 'border-transparent hover:bg-white'
                    }`}
                  >
                    {st.emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Brush Size (Draw / Erase) */}
            {(tool === 'draw' || tool === 'erase') && (
              <div className="rounded-2xl bg-[#f4f8ff] border border-[#dbe7f6] p-2 space-y-1.5">
                <div className="px-1 text-[10px] font-black uppercase tracking-wider text-[#516587]">
                  Brush Size
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {([1, 2, 3] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setBrushSize(sz)}
                      aria-label={`${sz} by ${sz} brush`}
                      className={`py-1.5 rounded-lg text-[11px] font-black flex items-center justify-center gap-1 transition-colors ${
                        brushSize === sz
                          ? 'bg-[#087CF7] text-white shadow-2xs'
                          : 'bg-white text-[#172951] hover:bg-[#e8f2ff]'
                      }`}
                    >
                      <span
                        className={`inline-block rounded-[2px] ${
                          brushSize === sz ? 'bg-white' : 'bg-[#172951]'
                        }`}
                        style={{ width: 4 + sz * 2, height: 4 + sz * 2 }}
                      />
                      <span>{sz}×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Current Color */}
            <div className="pt-2 border-t border-slate-100 flex items-center gap-3 px-1">
              <span
                className="w-11 h-11 rounded-2xl border-2 border-[#172951] shadow-xs shrink-0"
                style={{ backgroundColor: activeColor.hex }}
                aria-label={`Current color: ${activeColor.name}`}
              />
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-[#516587]">Current Color</div>
                <div className="text-xs font-black text-[#172951] truncate">{activeColor.name}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePoofClear}
              className="min-h-[48px] mt-1 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-b-4 border-rose-200 font-black text-xs text-rose-700 flex items-center justify-center gap-2 active:translate-y-0.5"
            >
              <Icon icon="solar:trash-bin-minimalistic-bold" className="w-5 h-5" />
              <span>Poof! Clear</span>
            </button>
          </div>
        </aside>

        {/* Center: Mascot + Golden Decorative Frame + Floating Mini-Toolbar */}
        <div className="flex-1 flex flex-col items-center justify-start pt-1 gap-2.5 relative min-w-0 pb-20 lg:pb-0">
          <Mascot
            message={mascotTip}
            onDismiss={() => setMascotTip(null)}
            onDisable={() => {
              setMascotEnabled(false);
              setMascotTip(null);
              try {
                localStorage.setItem('ll-pixel-mascot-off', '1');
              } catch {
                /* ignore */
              }
            }}
          />

          {bannerMessage && (
            <div role="status" className="rounded-full bg-[#172951] text-white px-4 py-1.5 text-xs font-black shadow-sm">
              {bannerMessage}
            </div>
          )}

          {poofToastOpen && (
            <div
              role="status"
              className="flex items-center gap-3 rounded-full bg-[#172951] text-white pl-4 pr-2 py-1.5 shadow-lg text-xs font-extrabold"
            >
              <span>✨ Poof! Canvas cleared</span>
              <button
                type="button"
                onClick={() => {
                  setPoofToastOpen(false);
                  handleUndo();
                }}
                className="px-3 py-1 rounded-full bg-[#FFC300] text-[#172951] font-black"
              >
                Undo
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="rounded-full bg-gradient-to-r from-amber-50 to-sky-50 border border-amber-200 px-3.5 py-1 text-[11px] font-black text-[#172951]">
              ⭐ {dailyChallenge}
            </div>
            {activeTemplate && (
              <div className="rounded-full bg-white border border-amber-300 px-3.5 py-1 flex items-center gap-2.5 shadow-2xs">
                <span className="text-xs font-black text-[#172951]">
                  {activeTemplate.emoji} {activeTemplate.name} · {templateProgress.percent}%
                </span>
                <div className="relative w-24 h-2 bg-slate-200 rounded-full overflow-visible">
                  <div
                    className="h-full bg-[#22C55E] rounded-full transition-all duration-200"
                    style={{ width: `${templateProgress.percent}%` }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute -top-2.5 text-xs transition-all duration-200"
                    style={{ left: `calc(${templateProgress.percent}% - 8px)` }}
                  >
                    🐝
                  </span>
                </div>
                {ageMode !== 'little' && (
                  <button
                    type="button"
                    onClick={() => setTemplateMode((m) => (m === 'trace' ? 'pbn' : 'trace'))}
                    className="px-2 py-0.5 rounded-full bg-[#e8f2ff] text-[#087CF7] text-[10px] font-black"
                  >
                    {templateMode === 'trace' ? 'Trace' : 'By #'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTemplateId(null)}
                  aria-label="Close template guide"
                  className="text-xs font-black text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div
            className={`relative w-full lg:w-[clamp(440px,calc(100vh-300px),820px)] max-w-[820px] rounded-[28px] p-3.5 sm:p-4 border-2 border-[#d78733] bg-gradient-to-b from-[#ffe452] to-[#ffbf23] shadow-[inset_0_3px_2px_rgba(255,255,255,0.55),0_10px_24px_rgba(120,69,27,0.22)] transition-all ${
              shutterFlash ? 'ring-4 ring-white brightness-110' : ''
            }`}
          >
            {shutterFlash && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 rounded-[26px] bg-white/80" />
            )}
            <PixelCanvas
              ref={canvasRef}
              gridRef={gridRef}
              size={size}
              palette={palette}
              tool={tool}
              activeColorIndex={safeColorIdx}
              mirror={mirror}
              brushSize={brushSize}
              shapeKind={shapeKind}
              shapeFilled={shapeFilled}
              activeStamp={activeStamp}
              showGrid={showGrid}
              highContrastGrid={highContrastGrid}
              showCenterLines={showCenterLines}
              templatePixels={activeTemplate?.size === size ? activeTemplate.pixels : null}
              templateMode={templateMode}
              onionPixels={onionSkin && !flipbookPlaying && activeFrameIdx > 0 ? frames[activeFrameIdx - 1] : null}
              overlayVersion={version}
              onCommitStroke={handleCommitStroke}
              onPixelStep={handlePixelStep}
              onPickColorIndex={(idx) => {
                selectColorIndex(idx);
                setTool('draw');
              }}
            />
          </div>

          <div className="bg-white/95 rounded-full border border-[#dbe7f6] shadow-xs px-3 py-1.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => canvasRef.current?.zoomOut()}
              aria-label="Zoom out"
              className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#f0f6ff] flex items-center justify-center text-[#172951]"
            >
              <Icon icon="solar:magnifer-zoom-out-bold" className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => canvasRef.current?.resetView()}
              aria-label="Reset zoom"
              className="px-2.5 min-h-[40px] rounded-full hover:bg-[#f0f6ff] text-xs font-black text-[#172951]"
            >
              100%
            </button>
            <button
              type="button"
              onClick={() => canvasRef.current?.zoomIn()}
              aria-label="Zoom in"
              className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#f0f6ff] flex items-center justify-center text-[#172951]"
            >
              <Icon icon="solar:magnifer-zoom-in-bold" className="w-5 h-5" />
            </button>
            <div className="w-px h-5 bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => setShowGrid((v) => !v)}
              aria-pressed={showGrid}
              className={`min-h-[40px] px-3 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                showGrid ? 'bg-[#e8f2ff] text-[#087CF7]' : 'text-[#516587] hover:bg-[#f0f6ff]'
              }`}
            >
              <Icon icon="solar:hashtag-bold" className="w-4 h-4" />
              <span>Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setHighContrastGrid((v) => !v)}
              aria-pressed={highContrastGrid}
              title="High contrast grid"
              className={`min-h-[40px] px-2.5 rounded-full text-xs font-extrabold ${
                highContrastGrid ? 'bg-[#172951] text-white' : 'text-[#516587] hover:bg-[#f0f6ff]'
              }`}
            >
              HC
            </button>
            <button
              type="button"
              onClick={() => setShowCenterLines((v) => !v)}
              aria-pressed={showCenterLines || mirror !== 'none'}
              className={`min-h-[40px] px-3 rounded-full text-xs font-extrabold flex items-center gap-1.5 ${
                showCenterLines || mirror !== 'none'
                  ? 'bg-purple-100 text-purple-700'
                  : 'text-[#516587] hover:bg-[#f0f6ff]'
              }`}
            >
              <Icon icon="solar:mirror-left-bold" className="w-4 h-4" />
              <span>Center</span>
            </button>
            {ageMode !== 'little' && (
              <button
                type="button"
                onClick={() => setFlipbookOpen((v) => !v)}
                aria-pressed={flipbookOpen}
                className={`min-h-[40px] px-3 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-colors ${
                  flipbookOpen ? 'bg-amber-100 text-amber-900' : 'text-[#516587] hover:bg-[#f0f6ff]'
                }`}
              >
                <Icon icon="solar:clapperboard-play-bold" className="w-4 h-4" />
                <span>Flipbook</span>
                {frames.length > 1 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-white/80 text-[10px] font-black text-amber-900">
                    {frames.length}
                  </span>
                )}
                <Icon
                  icon={flipbookOpen ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                  className="w-3 h-3 opacity-75"
                />
              </button>
            )}
          </div>

          {/* Solution 1: Two-Tier Scrollable Timeline Strip (Builder+ / Pro) */}
          {flipbookOpen && ageMode !== 'little' && (
            <div className="w-full max-w-[660px] bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3 space-y-2.5">
              {/* Row 1: Play + Frame Counter + Scrollable Live Thumbnail Strip + Add Frame */}
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setFlipbookPlaying((p) => !p)}
                  disabled={frames.length < 2}
                  aria-label={flipbookPlaying ? 'Pause animation' : 'Play animation'}
                  title={flipbookPlaying ? 'Pause' : 'Play'}
                  className="w-9 h-9 rounded-full bg-[#087CF7] hover:bg-[#066ad8] text-white flex items-center justify-center shadow-xs shrink-0 disabled:opacity-40 transition-colors"
                >
                  <Icon icon={flipbookPlaying ? 'solar:pause-bold' : 'solar:play-bold'} className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-0.5 bg-[#f4f8ff] border border-[#dbe7f6] rounded-full px-1 py-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => switchFrame(Math.max(0, activeFrameIdx - 1))}
                    disabled={activeFrameIdx <= 0}
                    aria-label="Previous frame"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#172951] hover:bg-white disabled:opacity-35"
                  >
                    <Icon icon="solar:alt-arrow-left-bold" className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-1.5 text-[11px] font-black text-[#172951] tabular-nums whitespace-nowrap">
                    Frame {activeFrameIdx + 1}/{frames.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => switchFrame(Math.min(frames.length - 1, activeFrameIdx + 1))}
                    disabled={activeFrameIdx >= frames.length - 1}
                    aria-label="Next frame"
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#172951] hover:bg-white disabled:opacity-35"
                  >
                    <Icon icon="solar:alt-arrow-right-bold" className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto py-1 px-0.5">
                  {frames.map((framePixels, i) => {
                    const isActive = activeFrameIdx === i;
                    const livePixels = isActive && version >= 0 ? Array.from(gridRef.current) : framePixels;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => switchFrame(i)}
                        aria-label={`Frame ${i + 1}`}
                        className={`relative w-10 h-10 p-0.5 rounded-xl border-2 shrink-0 transition-all ${
                          isActive
                            ? 'border-[#087CF7] ring-2 ring-[#087CF7]/25 bg-white scale-105'
                            : 'border-[#dbe7f6] bg-[#f8fbff] hover:border-[#9ec5f8]'
                        }`}
                      >
                        <FrameThumb pixels={livePixels} size={size} palette={palette} />
                        <span
                          className={`absolute -bottom-1 -left-1 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center border border-white ${
                            isActive ? 'bg-[#087CF7] text-white' : 'bg-slate-600 text-white'
                          }`}
                        >
                          {i + 1}
                        </span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={addFlipbookFrame}
                    disabled={frames.length >= 8}
                    title={frames.length >= 8 ? 'Max 8 frames' : 'Add blank frame'}
                    aria-label="Add animation frame"
                    className="w-10 h-10 rounded-xl border-2 border-dashed border-[#bcd4f2] bg-[#f4f8ff] hover:bg-[#e8f2ff] text-[#087CF7] flex items-center justify-center shrink-0 disabled:opacity-35 transition-colors"
                  >
                    <Icon icon="solar:add-circle-bold" className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Row 2: Onion Skin + FPS + Duplicate / Delete Frame + Export GIF */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setOnionSkin((v) => !v)}
                    aria-pressed={onionSkin}
                    title="Show previous frame ghost (Onion Skin)"
                    className={`h-8 px-2.5 rounded-full text-[11px] font-black border flex items-center gap-1 transition-colors ${
                      onionSkin
                        ? 'bg-purple-100 border-purple-300 text-purple-800'
                        : 'bg-[#f8fbff] border-[#dbe7f6] text-[#516587] hover:text-[#172951]'
                    }`}
                  >
                    <Icon icon="solar:layers-minimalistic-bold" className="w-3.5 h-3.5" />
                    <span>Onion</span>
                  </button>
                  <label className="text-[11px] font-bold text-[#516587] flex items-center gap-1.5">
                    <span className="tabular-nums">{flipbookFps} fps</span>
                    <input
                      type="range"
                      min={2}
                      max={10}
                      value={flipbookFps}
                      onChange={(e) => setFlipbookFps(Number(e.target.value))}
                      className="w-16 accent-[#087CF7]"
                    />
                  </label>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={duplicateFlipbookFrame}
                    disabled={frames.length >= 8}
                    title={frames.length >= 8 ? 'Max 8 frames' : 'Duplicate current frame'}
                    aria-label="Duplicate current frame"
                    className="w-8 h-8 rounded-full bg-[#f4f8ff] hover:bg-[#e8f2ff] border border-[#dbe7f6] text-[#172951] flex items-center justify-center disabled:opacity-35 transition-colors"
                  >
                    <Icon icon="solar:copy-bold" className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={deleteFlipbookFrame}
                    disabled={frames.length <= 1}
                    title={frames.length <= 1 ? 'Need at least 1 frame' : 'Delete current frame'}
                    aria-label="Delete current frame"
                    className="w-8 h-8 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center disabled:opacity-35 transition-colors"
                  >
                    <Icon icon="solar:trash-bin-minimalistic-bold" className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingGate({
                        label: 'export animated GIF',
                        run: () => {
                          void import('./export/gif').then(({ exportFlipbookGif }) =>
                            exportFlipbookGif(frames, size, palette, flipbookFps, title),
                          );
                        },
                      })
                    }
                    className="h-8 px-3 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-black flex items-center gap-1 transition-colors"
                  >
                    <Icon icon="solar:clapperboard-edit-bold" className="w-3.5 h-3.5" />
                    <span>Export GIF</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <aside className="hidden lg:flex w-[296px] shrink-0 flex-col gap-3">
          <div className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3.5 space-y-3">
            <div className="grid grid-cols-4 gap-1 bg-[#f0f6ff] p-1 rounded-full">
              <button
                type="button"
                onClick={() => setRightTab('colors')}
                className={`py-1.5 rounded-full text-[11px] font-black transition-colors ${
                  rightTab === 'colors' ? 'bg-[#087CF7] text-white shadow-xs' : 'text-[#516587]'
                }`}
              >
                Colors
              </button>
              {ageMode !== 'little' && (
                <button
                  type="button"
                  onClick={() => setRightTab('palettes')}
                  className={`py-1.5 rounded-full text-[11px] font-black transition-colors ${
                    rightTab === 'palettes' ? 'bg-[#087CF7] text-white shadow-xs' : 'text-[#516587]'
                  }`}
                >
                  Palettes
                </button>
              )}
              <button
                type="button"
                onClick={() => setRightTab('templates')}
                className={`py-1.5 rounded-full text-[11px] font-black transition-colors ${
                  rightTab === 'templates' ? 'bg-[#087CF7] text-white shadow-xs' : 'text-[#516587]'
                }`}
              >
                Ideas
              </button>
              <button
                type="button"
                onClick={() => setRightTab('art')}
                className={`py-1.5 rounded-full text-[11px] font-black transition-colors ${
                  rightTab === 'art' ? 'bg-[#087CF7] text-white shadow-xs' : 'text-[#516587]'
                }`}
              >
                My Art
              </button>
            </div>

            {rightTab === 'colors' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2">
                  {palette.map((c, idx) => {
                    const colorIdx = idx + 1;
                    const selected = safeColorIdx === colorIdx;
                    const isLight =
                      c.hex === '#FFFFFF' ||
                      c.hex === '#E2E8F0' ||
                      c.hex === '#FDE6C4' ||
                      c.hex === '#FFFDF7' ||
                      c.hex === '#FFF7ED';
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selectColorIndex(colorIdx);
                          if (tool === 'erase') setTool('draw');
                          if (ageMode === 'little') speakPixelLabel(c.name);
                        }}
                        aria-label={c.name}
                        title={c.name}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform ${
                          isLight ? 'border border-slate-300' : ''
                        } ${selected ? 'scale-110 ring-2 ring-[#172951] ring-offset-2' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {activeTemplate && templateMode === 'pbn' ? (
                          <span
                            className={`text-[11px] font-black ${
                              c.hex === '#111827' ||
                              c.hex === '#1E293B' ||
                              c.hex === '#0F172A' ||
                              c.hex === '#0F380F'
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}
                          >
                            {colorIdx}
                          </span>
                        ) : (
                          selected && (
                            <Icon
                              icon="solar:check-read-bold"
                              className={`w-4 h-4 ${
                                c.hex === '#111827' ||
                                c.hex === '#1E293B' ||
                                c.hex === '#0F172A' ||
                                c.hex === '#0F380F'
                                  ? 'text-white'
                                  : 'text-slate-900'
                              }`}
                            />
                          )
                        )}
                      </button>
                    );
                  })}
                  {ageMode === 'pro' && (
                    <label
                      title="More colors"
                      className="w-10 h-10 rounded-xl border-2 border-slate-200 cursor-pointer overflow-hidden hover:scale-105 transition-transform flex items-center justify-center"
                      style={{
                        background:
                          'conic-gradient(#ff4d6d, #ffc300, #22c55e, #38bdf8, #4361ee, #c77dff, #ff4d6d)',
                      }}
                    >
                      <input
                        type="color"
                        aria-label="More colors"
                        value={activeColor.hex}
                        onChange={(e) => handleAddCustomColor(e.target.value)}
                        className="opacity-0 w-full h-full cursor-pointer"
                      />
                    </label>
                  )}
                </div>

                {recentIndices.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-[#516587] mb-1.5">Recent Colors</div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentIndices.map((idx) => {
                        const c = palette[idx - 1];
                        if (!c) return null;
                        return (
                          <button
                            key={`recent-${idx}`}
                            type="button"
                            onClick={() => {
                              selectColorIndex(idx);
                              if (tool === 'erase') setTool('draw');
                            }}
                            aria-label={`Recent color ${c.name}`}
                            title={c.name}
                            className="w-7 h-7 rounded-full border border-slate-300"
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : rightTab === 'palettes' ? (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
                {PIXEL_PALETTE_PACKS.map((pack) => {
                  const active = pack.id === paletteId;
                  return (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => handleApplyPalettePack(pack.id)}
                      className={`w-full p-2.5 rounded-2xl border-2 flex items-center justify-between transition-all ${
                        active
                          ? 'border-[#087CF7] bg-[#eef5ff]'
                          : 'border-[#eef3fb] bg-[#f9fbff] hover:border-[#cfe0f5]'
                      }`}
                    >
                      <span className="text-xs font-black text-[#172951]">{pack.name}</span>
                      <span className="flex items-center gap-1">
                        {pack.colors.slice(0, 5).map((c) => (
                          <span
                            key={c.id}
                            className="w-4 h-4 rounded-full border border-slate-300/70"
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : rightTab === 'templates' ? (
              <TemplatePanel
                activeTemplateId={activeTemplateId}
                onSelectTemplate={(tpl) => handleLoadTemplate(tpl)}
              />
            ) : (
              <div className="space-y-3">
                <MyArtPanel
                  works={savedWorks}
                  onLoadWork={handleLoadSavedWork}
                  onDeleteWork={(id) => {
                    deletePixelWork(id);
                    setSavedWorks(listPixelWorks());
                  }}
                />
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-black text-[#516587]">Export &amp; Print</div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {([1, 4, 10] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() =>
                          setPendingGate({
                            label: `download ${sc}× PNG`,
                            run: () => exportPixelPng(gridRef.current, size, palette, sc, false, title),
                          })
                        }
                        className="py-1.5 rounded-xl bg-[#f4f8ff] border border-[#dbe7f6] text-[11px] font-black text-[#172951]"
                      >
                        PNG {sc}×
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingGate({
                        label: 'save transparent sticker',
                        run: () => exportPixelPng(gridRef.current, size, palette, 10, true, title),
                      })
                    }
                    className="w-full py-2 rounded-xl bg-[#eef5ff] border border-[#bfdbfe] text-xs font-black text-[#087CF7]"
                  >
                    Save as Sticker (PNG)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setPendingGate({
                        label: 'print coloring sheet',
                        run: () => printPixelColoringSheet(title, gridRef.current, size),
                      })
                    }
                    className="w-full py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs font-black text-amber-900"
                  >
                    🖨️ Print Coloring Sheet
                  </button>
                  {ageMode === 'pro' && (
                    <>
                      <button
                        type="button"
                        onClick={() => importImageInputRef.current?.click()}
                        className="w-full py-2 rounded-xl bg-[#f4f8ff] border border-[#dbe7f6] text-xs font-black text-[#172951]"
                      >
                        🖼️ Import Photo (Local)
                      </button>
                      <input
                        ref={importImageInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        onChange={(e) => {
                          void handleImportImageLocal(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Mobile Floating Bottom Bar */}
      <div className="lg:hidden fixed inset-x-3 bottom-3 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-[#dbe7f6] shadow-xl p-1.5 flex items-center gap-1.5 overflow-x-auto">
        {toolItems.slice(0, 4).map(([id, label, icon, svg]) => (
          <button
            key={id}
            type="button"
            onClick={() => handleSelectTool(id, label)}
            className={`min-h-[48px] px-3 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 ${
              tool === id ? 'bg-[#087CF7] text-white' : 'bg-[#f4f8ff] text-[#172951]'
            }`}
          >
            {isUnified && svg ? (
              <img src={svg} alt="" className="w-5 h-5 object-contain" />
            ) : (
              <Icon icon={icon} className="w-5 h-5" />
            )}
            <span>{label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setMobileSheet('colors')}
          className="min-h-[48px] px-3 rounded-xl bg-[#f4f8ff] text-[#172951] text-xs font-black flex items-center gap-1.5 shrink-0"
        >
          <span
            className="w-5 h-5 rounded-full border border-slate-300"
            style={{ backgroundColor: activeColor.hex }}
          />
          <span>Colors</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileSheet('templates')}
          className="min-h-[48px] px-3 rounded-xl bg-[#f4f8ff] text-[#172951] text-xs font-black flex items-center gap-1.5 shrink-0"
        >
          <Icon icon="solar:gallery-wide-bold" className="w-5 h-5 text-[#7c3aed]" />
          <span>Templates</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileSheet('more')}
          className="min-h-[48px] px-3 rounded-xl bg-[#f4f8ff] text-[#172951] text-xs font-black flex items-center gap-1.5 shrink-0"
        >
          <Icon icon="solar:tuning-2-bold" className="w-5 h-5" />
          <span>More</span>
        </button>
      </div>

      {/* Mobile Bottom Sheets */}
      {mobileSheet && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close panel"
            onClick={() => setMobileSheet(null)}
            className="absolute inset-0 bg-slate-900/35 backdrop-blur-[2px]"
          />
          <div className="relative z-10 bg-white rounded-t-3xl p-4 pb-6 space-y-4 shadow-2xl max-h-[75dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-sm font-black text-[#172951] capitalize">{mobileSheet}</span>
              <button
                type="button"
                onClick={() => setMobileSheet(null)}
                className="px-3 py-1.5 rounded-full bg-[#e8f2ff] text-xs font-black text-[#087CF7]"
              >
                Done
              </button>
            </div>

            {mobileSheet === 'colors' && (
              <div className="space-y-3">
                <div className="grid grid-cols-5 gap-2.5">
                  {palette.map((c, idx) => {
                    const colorIdx = idx + 1;
                    const selected = safeColorIdx === colorIdx;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          selectColorIndex(colorIdx);
                          if (tool === 'erase') setTool('draw');
                          if (ageMode === 'little') speakPixelLabel(c.name);
                          setMobileSheet(null);
                        }}
                        aria-label={c.name}
                        className={`min-h-[48px] rounded-2xl border border-slate-200 flex items-center justify-center ${
                          selected ? 'ring-2 ring-[#172951] ring-offset-2' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selected && (
                          <Icon
                            icon="solar:check-read-bold"
                            className={`w-5 h-5 ${
                              c.hex === '#111827' || c.hex === '#1E293B' || c.hex === '#0F172A'
                                ? 'text-white'
                                : 'text-slate-900'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                {ageMode !== 'little' && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {PIXEL_PALETTE_PACKS.map((pack) => (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => handleApplyPalettePack(pack.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                          pack.id === paletteId
                            ? 'bg-[#087CF7] text-white border-[#087CF7]'
                            : 'bg-[#f4f8ff] text-[#172951] border-[#dbe7f6]'
                        }`}
                      >
                        {pack.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {mobileSheet === 'templates' && (
              <TemplatePanel
                activeTemplateId={activeTemplateId}
                onSelectTemplate={(tpl) => {
                  handleLoadTemplate(tpl);
                  setMobileSheet(null);
                }}
              />
            )}

            {mobileSheet === 'art' && (
              <MyArtPanel
                works={savedWorks}
                onLoadWork={(w) => {
                  handleLoadSavedWork(w);
                  setMobileSheet(null);
                }}
                onDeleteWork={(id) => {
                  deletePixelWork(id);
                  setSavedWorks(listPixelWorks());
                }}
              />
            )}

            {mobileSheet === 'more' && (
              <div className="space-y-3">
                {ageMode !== 'little' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTool('shape', 'Shapes');
                          setMobileSheet(null);
                        }}
                        className="min-h-[48px] rounded-2xl bg-[#f4f8ff] text-xs font-black text-[#172951] flex items-center justify-center gap-2"
                      >
                        <Icon icon="solar:widget-4-bold" className="w-5 h-5 text-[#087CF7]" />
                        <span>Shapes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTool('eyedropper', 'Pick');
                          setMobileSheet(null);
                        }}
                        className="min-h-[48px] rounded-2xl bg-[#f4f8ff] text-xs font-black text-[#172951] flex items-center justify-center gap-2"
                      >
                        <Icon icon="solar:pipette-bold" className="w-5 h-5 text-[#f59e0b]" />
                        <span>Pick Color</span>
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={cycleMirror}
                      className="w-full min-h-[48px] rounded-2xl bg-purple-50 text-purple-700 text-xs font-black flex items-center justify-center gap-2"
                    >
                      <Icon icon="solar:mirror-left-bold" className="w-5 h-5" />
                      <span>
                        {mirror === 'none'
                          ? 'Magic Mirror: Off'
                          : `Magic Mirror: ${mirror.toUpperCase()}`}
                      </span>
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMobileSheet('art');
                  }}
                  className="w-full min-h-[48px] rounded-2xl bg-[#f4f8ff] text-[#172951] text-xs font-black flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:folder-with-files-bold" className="w-5 h-5 text-[#f59e0b]" />
                  <span>My Art &amp; Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileSheet(null);
                    setPendingGate({
                      label: 'print coloring sheet',
                      run: () => printPixelColoringSheet(title, gridRef.current, size),
                    });
                  }}
                  className="w-full min-h-[48px] rounded-2xl bg-amber-50 text-amber-900 text-xs font-black flex items-center justify-center gap-2"
                >
                  <span>🖨️ Print Coloring Sheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handlePoofClear();
                    setMobileSheet(null);
                  }}
                  className="w-full min-h-[48px] rounded-2xl bg-rose-50 text-rose-700 text-xs font-black flex items-center justify-center gap-2"
                >
                  <Icon icon="solar:trash-bin-minimalistic-bold" className="w-5 h-5" />
                  <span>Poof! Clear</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* First-Visit Age Mode Picker */}
      {showAgePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
          <div
            role="dialog"
            aria-label="Choose your pixel builder level"
            className="w-full max-w-md rounded-3xl bg-white border-2 border-[#dbe7f6] shadow-2xl p-5 sm:p-6 space-y-4"
          >
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-[#172951]">How do you want to create?</h2>
              <p className="text-xs font-bold text-[#516587]">
                Pick your age level — you can switch anytime!
              </p>
            </div>
            <div className="space-y-2.5">
              {(['little', 'builder', 'pro'] as PixelAgeMode[]).map((m) => {
                const info = AGE_MODES[m];
                const active = ageMode === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => selectAgeMode(m)}
                    className={`w-full flex items-center gap-3.5 p-3.5 rounded-2xl border-2 text-left transition-all ${
                      active
                        ? 'border-[#087CF7] bg-[#e8f2ff]'
                        : 'border-[#e7eff9] bg-[#f8fbff] hover:border-[#bfdbfe]'
                    }`}
                  >
                    <span className="w-12 h-12 rounded-2xl bg-white border border-[#dbe7f6] flex items-center justify-center shrink-0">
                      <img src={getAgeModeIconSrc(m)} alt="" className="w-4 h-4 object-contain" />
                    </span>
                    <div>
                      <div className="text-sm font-black text-[#172951]">
                        {info.title}{' '}
                        <span className="text-xs font-bold text-[#516587]">({info.age})</span>
                      </div>
                      <div className="text-xs font-bold text-[#516587]">{info.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <ParentGate
        open={Boolean(pendingGate)}
        actionLabel={pendingGate?.label ?? ''}
        onCancel={() => setPendingGate(null)}
        onPass={() => {
          const action = pendingGate?.run;
          setPendingGate(null);
          action?.();
        }}
      />
      <span className="sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </section>
  );
};

export default PixelStudio;
