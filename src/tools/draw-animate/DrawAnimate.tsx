import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import confetti from 'canvas-confetti';
import { useSession } from '../../context/SessionContext';
import { StudioModeTabs, StudioSwitcher } from '../../components/layout/StudioModeTabs';
import { playCelebrationFanfare } from '../../utils/soundEffects';
import { getAgeModeIconSrc, STUDIO_SYSTEM_ICONS, useStudioLayoutVariant } from '../../utils/studioLayoutAb';
import { DrawCanvas, type DrawCanvasHandle } from './ui/DrawCanvas';
import { autoCropCanvas, type CropResult } from './draw/crop';
import { loadDraft, saveDraft } from './storage/autosave';
import { listCreations, makeThumbnailDataUrl, saveCreation } from './storage/myWork';
import { playMagicWhooshDing, playPoofSound, playStickerPop } from './audio/sfx';
import { exportTransparentPng } from './export/png';
import { downloadVideoBlob, startStageRecording, type RecordingSession } from './export/record';
import { ParentGate } from './ui/ParentGate';
import { BUNDLED_STICKERS, type StickerItem } from './data/stickers';
import { SAMPLE_DOODLES } from './data/sampleDoodles';
import { MASCOT_TIPS } from './data/tips';

const StageScene = React.lazy(() =>
  import('./stage/StageScene').then((m) => ({ default: m.StageScene })),
);
import {
  CURATED_COLORS,
  MOVE_OPTIONS,
  QUICK_COLORS,
  SCENE_OPTIONS,
  type AgeMode,
  type DrawTool,
  type MoveKind,
  type PinPoint,
  type SavedAnimationWork,
  type SceneKind,
} from './types';

function speakLabel(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.0;
    u.pitch = 1.1;
    window.speechSynthesis.speak(u);
  } catch {
    // Ignore speech errors
  }
}

const TOOL_ITEMS: { id: DrawTool; label: string; icon: string; svg: string }[] = [
  { id: 'draw', label: 'Draw', icon: 'solar:pen-new-square-bold', svg: STUDIO_SYSTEM_ICONS.toolDraw },
  { id: 'erase', label: 'Erase', icon: 'solar:eraser-bold', svg: STUDIO_SYSTEM_ICONS.toolErase },
  { id: 'fill', label: 'Fill', icon: 'solar:paint-roller-bold', svg: STUDIO_SYSTEM_ICONS.toolFill },
  { id: 'colors', label: 'Colors', icon: 'solar:pallete-2-bold', svg: STUDIO_SYSTEM_ICONS.toolColors },
  { id: 'stickers', label: 'Stickers', icon: 'solar:star-bold', svg: STUDIO_SYSTEM_ICONS.toolStickers },
];

export const DrawAnimate: React.FC = () => {
  const { soundOn, setSoundOn, recordPuzzleWin } = useSession();
  const { variant: layoutVariant } = useStudioLayoutVariant();
  const isUnified = layoutVariant === 'unified';
  const canvasRef = useRef<DrawCanvasHandle>(null);

  const [tool, setTool] = useState<DrawTool>('draw');
  const [activeColor, setActiveColor] = useState<string>(QUICK_COLORS[3].hex); // Grass Green default
  const [drawSize, setDrawSize] = useState<number>(18);
  const [eraseSize, setEraseSize] = useState<number>(32);

  const [move, setMove] = useState<MoveKind>('wiggle');
  const [speed, setSpeed] = useState<number>(1.0);
  const [scene, setScene] = useState<SceneKind>('meadow');
  const manualSceneRef = useRef(false);
  const triedMovesRef = useRef<Set<MoveKind>>(new Set(['wiggle']));
  const milestonesRef = useRef<Set<string>>(new Set());

  const awardMilestone = useCallback(
    (id: string, message: string) => {
      if (milestonesRef.current.has(id)) return;
      milestonesRef.current.add(id);
      try {
        localStorage.setItem('ll-draw-animate-milestones', JSON.stringify([...milestonesRef.current]));
      } catch {
        // Ignore
      }
      recordPuzzleWin();
      setToastMsg(`⭐ ${message}`);
      window.setTimeout(() => setToastMsg(null), 3200);
    },
    [recordPuzzleWin],
  );

  const selectMove = useCallback((nextMove: MoveKind) => {
    setMove(nextMove);
    triedMovesRef.current.add(nextMove);
    if (triedMovesRef.current.size >= MOVE_OPTIONS.length) {
      awardMilestone('all-moves', 'Awesome! You tried all 6 moves!');
    }
    if (nextMove === 'swim' && !manualSceneRef.current) {
      setScene('ocean');
    }
  }, [awardMilestone]);

  const selectScene = useCallback((nextScene: SceneKind) => {
    manualSceneRef.current = true;
    setScene(nextScene);
    awardMilestone('first-scene', 'Cool new world!');
  }, [awardMilestone]);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [mobileSheet, setMobileSheet] = useState<'colors' | 'stickers' | 'scene' | null>(null);
  const [colorsOpen, setColorsOpen] = useState(false);
  const [stickersOpen, setStickersOpen] = useState(false);
  const [activeSticker, setActiveSticker] = useState<StickerItem>(BUNDLED_STICKERS[0]);

  const [mascotEnabled, setMascotEnabled] = useState(true);
  const [mascotVisible, setMascotVisible] = useState(true);
  const [mascotTip, setMascotTip] = useState<string>('Draw anything!');
  const seenTipsRef = useRef<Set<string>>(new Set(['draw-anything']));
  const sampleIdxRef = useRef(0);
  const idleTimerRef = useRef<number | null>(null);

  const [poofToastOpen, setPoofToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [shakeBringBtn, setShakeBringBtn] = useState(false);

  // View B ("Stage") state
  const [view, setView] = useState<'draw' | 'stage'>('draw');
  const [bringingToLife, setBringingToLife] = useState(false);
  const [stagePaused, setStagePaused] = useState(false);
  const [stageCrop, setStageCrop] = useState<CropResult | null>(null);
  const [stageTransitioning, setStageTransitioning] = useState(false);
  const [creations, setCreations] = useState<SavedAnimationWork[]>([]);
  const [goldFlash, setGoldFlash] = useState(false);

  // Age mode, Parent Gate, Record & Pro Pins
  const [ageMode, setAgeMode] = useState<AgeMode>('builder');
  const [showAgePicker, setShowAgePicker] = useState(false);
  const [pins, setPins] = useState<PinPoint[]>([]);
  const [pinMode, setPinMode] = useState(false);
  const [pendingGate, setPendingGate] = useState<{ label: string; run: () => void } | null>(null);
  const [recordingSec, setRecordingSec] = useState<number | null>(null);
  const stageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recordSessionRef = useRef<RecordingSession | null>(null);

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const showTipOnce = useCallback(
    (tipId: string, text?: string) => {
      if (!mascotEnabled || seenTipsRef.current.has(tipId)) return;
      const found = text ?? MASCOT_TIPS.find((t) => t.id === tipId)?.text;
      if (!found) return;
      seenTipsRef.current.add(tipId);
      setMascotTip(found);
      setMascotVisible(true);
    },
    [mascotEnabled],
  );

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    if (!mascotEnabled) return;
    idleTimerRef.current = window.setTimeout(() => {
      if (canvasRef.current?.hasInk()) {
        showTipOnce('bring-to-life', 'Tap Bring it to life!');
      } else {
        showTipOnce('try-stickers');
      }
    }, 20000);
  }, [mascotEnabled, showTipOnce]);

  const poofTimerRef = useRef<number | null>(null);
  const autosaveTimerRef = useRef<number | null>(null);

  const brushSize = tool === 'erase' ? eraseSize : drawSize;
  const setBrushSize = (val: number) => {
    if (tool === 'erase') setEraseSize(val);
    else setDrawSize(val);
  };

  const syncHistoryFlags = useCallback(() => {
    setCanUndo(canvasRef.current?.canUndo() ?? false);
    setCanRedo(canvasRef.current?.canRedo() ?? false);
  }, []);

  const persistDraftNow = useCallback(() => {
    const handle = canvasRef.current;
    if (!handle || !handle.hasInk()) return;
    const dataUrl = handle.toDataUrl();
    if (!dataUrl) return;
    void saveDraft({
      dataUrl,
      move,
      speed,
      scene,
      updatedAt: Date.now(),
    });
  }, [move, speed, scene]);

  const scheduleAutosave = useCallback(() => {
    if (autosaveTimerRef.current) window.clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = window.setTimeout(() => {
      persistDraftNow();
    }, 1200);
  }, [persistDraftNow]);

  // Restore autosaved draft, saved creations, and milestones on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('ll-draw-animate-age-mode') as AgeMode | null;
      if (savedMode === 'little' || savedMode === 'builder' || savedMode === 'pro') {
        setAgeMode(savedMode);
      } else {
        setShowAgePicker(true);
      }
      const raw = localStorage.getItem('ll-draw-animate-milestones');
      if (raw) {
        for (const id of JSON.parse(raw) as string[]) milestonesRef.current.add(id);
      }
    } catch {
      // Ignore
    }
    void listCreations().then((items) => setCreations(items));

    let mounted = true;
    void loadDraft().then(async (draft) => {
      if (!mounted || !draft?.dataUrl) return;
      await canvasRef.current?.loadDataUrl(draft.dataUrl);
      if (!mounted) return;
      if (draft.move) setMove(draft.move);
      if (typeof draft.speed === 'number') setSpeed(draft.speed);
      if (draft.scene) setScene(draft.scene);
      setToastMsg('Welcome back! Your drawing is waiting');
      window.setTimeout(() => setToastMsg(null), 3500);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Save on tab blur / pagehide
  useEffect(() => {
    const onBlur = () => persistDraftNow();
    const onVis = () => {
      if (document.visibilityState === 'hidden') persistDraftNow();
    };
    window.addEventListener('pagehide', onBlur);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pagehide', onBlur);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [persistDraftNow]);

  const handleUndo = useCallback(() => {
    if (canvasRef.current?.undo()) {
      syncHistoryFlags();
      setPoofToastOpen(false);
    }
  }, [syncHistoryFlags]);

  const handleRedo = useCallback(() => {
    if (canvasRef.current?.redo()) {
      syncHistoryFlags();
    }
  }, [syncHistoryFlags]);

  const handlePoofClear = () => {
    playPoofSound();
    canvasRef.current?.clearPoof();
    syncHistoryFlags();
    setPoofToastOpen(true);
    if (poofTimerRef.current) window.clearTimeout(poofTimerRef.current);
    poofTimerRef.current = window.setTimeout(() => setPoofToastOpen(false), 6000);
  };

  // Keyboard shortcuts: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, B (brush), E (erase)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
        return;
      }
      const key = e.key.toLowerCase();
      if (view === 'stage') {
        if (e.key === 'Escape') {
          e.preventDefault();
          setView('draw');
          setStagePaused(false);
        } else if (e.key === ' ') {
          e.preventDefault();
          setStagePaused((p) => !p);
        }
        return;
      }
      if (key === 'b') {
        setTool('draw');
        setStickersOpen(false);
      } else if (key === 'e') {
        setTool('erase');
        setStickersOpen(false);
      } else if (key === 'f') {
        setTool('fill');
        setStickersOpen(false);
        showTipOnce('try-fill');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [view, handleUndo, handleRedo, showTipOnce]);

  useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  const handleSelectTool = (next: DrawTool) => {
    resetIdleTimer();
    if (ageMode === 'little') {
      const label = TOOL_ITEMS.find((t) => t.id === next)?.label;
      if (label) speakLabel(label);
    }
    if (next === 'colors') {
      setStickersOpen(false);
      setColorsOpen((v) => !v);
      setMobileSheet('colors');
      return;
    }
    if (next === 'stickers') {
      setColorsOpen(false);
      setStickersOpen((v) => !v);
      setMobileSheet('stickers');
      setTool('stickers');
      showTipOnce('try-stickers');
      return;
    }
    setColorsOpen(false);
    setStickersOpen(false);
    if (next === 'fill') showTipOnce('try-fill');
    setTool(next);
  };

  const handleTryExample = async () => {
    resetIdleTimer();
    const doodle = SAMPLE_DOODLES[sampleIdxRef.current % SAMPLE_DOODLES.length];
    sampleIdxRef.current += 1;
    await canvasRef.current?.loadSvg(doodle.svg);
    setMove(doodle.move);
    setScene(doodle.scene);
    syncHistoryFlags();
    showTipOnce('bring-to-life', `Loaded ${doodle.label}! Tap Bring it to life!`);
  };

  const handleBringToLife = () => {
    const artCanvas = canvasRef.current?.getArtCanvas();
    if (!artCanvas || !canvasRef.current?.hasInk()) {
      setShakeBringBtn(true);
      setMascotVisible(true);
      setMascotTip('Draw something first!');
      window.setTimeout(() => setShakeBringBtn(false), 450);
      return;
    }

    const cropped = autoCropCanvas(artCanvas, 24);
    if (!cropped) {
      setShakeBringBtn(true);
      setMascotVisible(true);
      setMascotTip('Draw something first!');
      window.setTimeout(() => setShakeBringBtn(false), 450);
      return;
    }

    persistDraftNow();
    playMagicWhooshDing();
    if (ageMode === 'little' && !manualSceneRef.current) {
      const randomScene = SCENE_OPTIONS[Math.floor(Math.random() * SCENE_OPTIONS.length)].id;
      setScene(randomScene);
    }
    setBringingToLife(true);
    setStageCrop(cropped);
    setStagePaused(false);

    if (!prefersReducedMotion) {
      void confetti({
        particleCount: 36,
        spread: 65,
        origin: { y: 0.65 },
        colors: ['#4ade80', '#facc15', '#38bdf8', '#c084fc'],
      });
    }

    const delayMs = prefersReducedMotion ? 140 : 420;
    window.setTimeout(() => {
      setStageTransitioning(true);
      setBringingToLife(false);
      setView('stage');
      awardMilestone('first-animate', 'You brought it to life!');
      showTipOnce('tap-character', 'Tap your character on stage!');
      window.setTimeout(() => setStageTransitioning(false), prefersReducedMotion ? 150 : 320);
    }, delayMs);
  };

  const handleSaveCreation = async () => {
    const artCanvas = canvasRef.current?.getArtCanvas() ?? stageCrop?.canvas;
    const dataUrl = stageCrop?.canvas.toDataURL('image/png') ?? canvasRef.current?.toDataUrl() ?? '';
    if (!artCanvas || !dataUrl || (view === 'draw' && !canvasRef.current?.hasInk())) {
      setMascotVisible(true);
      setMascotTip('Draw something first before saving!');
      return;
    }

    persistDraftNow();
    const cropped = stageCrop ?? autoCropCanvas(artCanvas, 24);
    const thumbSource = cropped?.canvas ?? artCanvas;
    const work: SavedAnimationWork = {
      id: `anim-${Date.now()}`,
      type: 'animation',
      title: `My ${move[0].toUpperCase()}${move.slice(1)} Character`,
      drawingPngDataUrl: dataUrl,
      cropBounds: cropped?.cropBounds ?? { x: 0, y: 0, w: 1024, h: 1024 },
      move,
      speed,
      scene,
      pins,
      createdAt: Date.now(),
      thumbnail: makeThumbnailDataUrl(thumbSource, 160),
    };

    await saveCreation(work);
    setCreations((prev) => [work, ...prev].slice(0, 24));
    setGoldFlash(true);
    window.setTimeout(() => setGoldFlash(false), 380);
    if (soundOn) playCelebrationFanfare();
    if (!prefersReducedMotion) {
      void confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.35 },
        colors: ['#FFC300', '#4ade80', '#087CF7', '#ec4899'],
      });
    }
    awardMilestone('first-save', 'Saved to My Creations! +1 Star!');
    if (milestonesRef.current.has('first-save')) {
      setToastMsg('Saved to My Creations!');
      window.setTimeout(() => setToastMsg(null), 2600);
    }
  };

  const handleReopenCreation = async (item: SavedAnimationWork) => {
    setMove(item.move);
    setSpeed(item.speed);
    setScene(item.scene);
    setPins(item.pins ?? []);
    manualSceneRef.current = true;
    await canvasRef.current?.loadDataUrl(item.drawingPngDataUrl);

    // Load cropped texture and go straight to Stage view
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.width;
      c.height = img.height;
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const cropped = autoCropCanvas(c, 24) ?? {
        canvas: c,
        cropBounds: item.cropBounds,
        aspect: c.width / Math.max(1, c.height),
      };
      setStageCrop(cropped);
      setStagePaused(false);
      setView('stage');
    };
    img.src = item.drawingPngDataUrl;
  };

  if (view === 'stage' && stageCrop) {
    return (
      <section className="flex-1 bg-gradient-to-b from-[#dff0ff] via-[#ebf5fe] to-[#d9eeff] px-3 sm:px-5 py-3 sm:py-4 flex items-center justify-center">
        <h1 className="sr-only">Draw &amp; Animate Stage</h1>
        <div
          style={{ width: 'min(100%, calc((100vh - 220px) * 16 / 9))' }}
          className={`relative aspect-video mx-auto rounded-[28px] border-4 border-white shadow-xl overflow-hidden bg-[#bae6fd] transition-opacity duration-300 ${
            stageTransitioning ? 'opacity-70' : 'opacity-100'
          }`}
        >
          <React.Suspense
            fallback={
              <div className="w-full h-full flex items-center justify-center text-lg font-black text-[#172951]">
                Bringing your drawing to life…
              </div>
            }
          >
            <StageScene
              croppedCanvas={stageCrop.canvas}
              cropAspect={stageCrop.aspect}
              move={move}
              speed={speed}
              scene={scene}
              paused={stagePaused}
              reducedMotion={prefersReducedMotion}
              pins={pins}
              pinMode={pinMode}
              onCanvasReady={(el) => {
                stageCanvasRef.current = el;
              }}
              onAddPin={(p) => {
                setPins((prev) => (prev.length >= 4 ? [...prev.slice(1), p] : [...prev, p]));
              }}
              onTapCharacter={() => {
                if (!prefersReducedMotion) {
                  void confetti({
                    particleCount: 18,
                    spread: 50,
                    origin: { y: 0.55 },
                    colors: ['#facc15', '#4ade80', '#38bdf8'],
                  });
                }
              }}
            />
          </React.Suspense>

          {/* Top-Left: Back to drawing + Pro Pins */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                recordSessionRef.current?.stop();
                setPinMode(false);
                setView('draw');
                setStagePaused(false);
              }}
              className="min-h-[48px] px-4 py-2 rounded-full bg-white/95 hover:bg-white border-2 border-b-4 border-[#dbe7f6] text-[#172951] text-sm sm:text-base font-black flex items-center gap-2 shadow-md active:translate-y-0.5 transition-transform duration-75"
            >
              <Icon icon="solar:arrow-left-bold" className="w-5 h-5" />
              <span>Back to drawing</span>
            </button>
            {ageMode === 'pro' && (
              <button
                type="button"
                onClick={() => setPinMode((p) => !p)}
                aria-pressed={pinMode}
                className={`min-h-[48px] px-4 py-2 rounded-full border-2 border-b-4 text-sm font-black flex items-center gap-1.5 shadow-md active:translate-y-0.5 transition-transform duration-75 ${
                  pinMode
                    ? 'bg-[#7c3aed] border-[#5b21b6] text-white'
                    : 'bg-white/95 border-[#dbe7f6] text-[#172951]'
                }`}
              >
                <Icon icon="solar:pin-bold" className="w-4 h-4" />
                <span>{pinMode ? `Tap Character (${pins.length}/4)` : 'Pins'}</span>
              </button>
            )}
            {ageMode === 'pro' && pinMode && pins.length > 0 && (
              <button
                type="button"
                onClick={() => setPins([])}
                className="min-h-[48px] px-3 rounded-full bg-white/95 border-2 border-[#dbe7f6] text-xs font-black text-rose-600 shadow-md"
              >
                Clear Pins
              </button>
            )}
          </div>

          {/* Recording indicator */}
          {recordingSec !== null && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-full bg-rose-600 text-white text-sm font-black flex items-center gap-2 shadow-lg animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-white" />
              <span>Recording… {recordingSec}s</span>
            </div>
          )}

          {/* Top-Right: Pause/Play + Sound + Record (Pro) + Save */}
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 flex items-center gap-2">
            {ageMode === 'pro' && (
              <button
                type="button"
                disabled={recordingSec !== null}
                onClick={() =>
                  setPendingGate({
                    label: 'record a video clip',
                    run: () => {
                      const c = stageCanvasRef.current;
                      if (!c) return;
                      recordSessionRef.current = startStageRecording(
                        c,
                        6000,
                        (rem) => setRecordingSec(rem),
                        (blob, ext, err) => {
                          setRecordingSec(null);
                          if (err || !blob) {
                            setToastMsg(err ?? 'Recording unavailable');
                            window.setTimeout(() => setToastMsg(null), 3000);
                            return;
                          }
                          downloadVideoBlob(blob, ext);
                          setToastMsg('Saved video clip!');
                          window.setTimeout(() => setToastMsg(null), 2600);
                        },
                      );
                    },
                  })
                }
                aria-label="Record video"
                className="min-h-[48px] px-3.5 rounded-full bg-rose-50 hover:bg-rose-100 border-2 border-b-4 border-rose-200 text-rose-700 text-sm font-black flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Icon icon="solar:videocamera-record-bold" className="w-5 h-5" />
                <span className="hidden sm:inline">Record</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setStagePaused((p) => !p)}
              aria-label={stagePaused ? 'Play animation' : 'Pause animation'}
              title={stagePaused ? 'Play (Space)' : 'Pause (Space)'}
              className="w-12 h-12 rounded-full bg-white/95 hover:bg-white border-2 border-b-4 border-[#dbe7f6] text-[#172951] flex items-center justify-center shadow-md active:translate-y-0.5 transition-transform duration-75"
            >
              <Icon icon={stagePaused ? 'solar:play-bold' : 'solar:pause-bold'} className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setSoundOn(!soundOn)}
              aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
              className="w-12 h-12 rounded-full bg-white/95 hover:bg-white border-2 border-b-4 border-[#dbe7f6] text-[#172951] flex items-center justify-center shadow-md active:translate-y-0.5 transition-transform duration-75"
            >
              <img
                src={soundOn ? STUDIO_SYSTEM_ICONS.unmute : STUDIO_SYSTEM_ICONS.mute}
                alt=""
                className="w-5 h-5 object-contain"
              />
            </button>
            <button
              type="button"
              onClick={() => void handleSaveCreation()}
              className="min-h-[48px] px-4 rounded-full bg-[#FFC300] hover:bg-[#ffb700] border-2 border-b-4 border-[#d97706] text-[#172951] text-sm sm:text-base font-black flex items-center gap-1.5 shadow-md active:translate-y-0.5 transition-transform duration-75"
            >
              <Icon icon="solar:download-minimalistic-bold" className="w-5 h-5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>

          {/* Bottom-Center Floating Stage Controls (16px from bottom of stage frame) */}
          <div className="absolute bottom-4 inset-x-3 z-20 flex flex-wrap items-center justify-center gap-2 pointer-events-none">
            {/* Compact Move Picker (colorful icons matching Draw view) */}
            <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full border-2 border-[#dbe7f6] shadow-lg px-2 py-1 flex items-center gap-1 overflow-x-auto max-w-full">
              {MOVE_OPTIONS.map((m) => {
                const selected = move === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => selectMove(m.id)}
                    aria-label={m.label}
                    aria-pressed={selected}
                    title={m.label}
                    className={`min-h-[48px] px-3 rounded-full text-xs font-black flex items-center gap-1.5 shrink-0 transition-colors ${
                      selected
                        ? 'bg-[#e8f3ff] ring-2 ring-[#087CF7] text-[#087CF7] shadow-2xs'
                        : 'text-[#172951] hover:bg-[#f0f6ff]'
                    }`}
                  >
                    <span className="text-lg leading-none" aria-hidden="true">{m.emoji}</span>
                    <span className="hidden md:inline">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Speed Pill */}
            <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-full border-2 border-[#dbe7f6] shadow-lg px-3 py-1.5 flex items-center gap-2 min-h-[48px]">
              <img src={STUDIO_SYSTEM_ICONS.tortoise} alt="" className="w-5 h-5 object-contain shrink-0" />
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                aria-label="Animation speed"
                className="w-20 sm:w-24 accent-[#087CF7] cursor-pointer"
              />
              <img src={STUDIO_SYSTEM_ICONS.rabbit} alt="" className="w-5 h-5 object-contain shrink-0" />
            </div>

            {/* Live Scene Switcher Pill (4 circles + visible label under selected) */}
            <div className="pointer-events-auto bg-white/95 backdrop-blur-sm rounded-3xl border-2 border-[#dbe7f6] shadow-lg px-2.5 py-1.5 flex items-start gap-2 min-h-[48px]">
              {SCENE_OPTIONS.map((sc) => {
                const selected = scene === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => selectScene(sc.id)}
                    aria-label={sc.label}
                    aria-pressed={selected}
                    title={sc.label}
                    className="flex flex-col items-center gap-0.5 shrink-0"
                  >
                    <span
                      className={`w-8 h-8 rounded-full bg-gradient-to-b ${sc.gradient} border-2 transition-transform ${
                        selected
                          ? 'border-[#087CF7] ring-2 ring-[#087CF7]/30 scale-105'
                          : 'border-[#dbe7f6] hover:scale-105'
                      }`}
                    />
                    {selected && (
                      <span className="text-[10px] font-black text-[#087CF7] leading-none whitespace-nowrap">
                        {sc.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        {toastMsg && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-[#087CF7] text-[#172951] px-4 py-2 rounded-full shadow-md text-sm font-extrabold">
            {toastMsg}
          </div>
        )}
        {pendingGate && (
          <ParentGate
            actionLabel={pendingGate.label}
            onCancel={() => setPendingGate(null)}
            onPass={() => {
              const run = pendingGate.run;
              setPendingGate(null);
              run();
            }}
          />
        )}
      </section>
    );
  }

  const visibleTools =
    ageMode === 'little'
      ? TOOL_ITEMS.filter((t) => t.id === 'draw' || t.id === 'erase' || t.id === 'fill')
      : TOOL_ITEMS;

  const visibleMoves =
    ageMode === 'little'
      ? MOVE_OPTIONS.filter((m) => m.id === 'wiggle' || m.id === 'bounce' || m.id === 'dance')
      : MOVE_OPTIONS;

  return (
    <section className="flex-1 bg-gradient-to-b from-[#dff0ff] via-[#ebf5fe] to-[#d9eeff] px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-3 pb-24 lg:pb-4">
      {/* Top Studio Bar */}
      <header
        className={`${isUnified ? 'max-w-[1440px] border-[#dde7f5] px-4 py-2.5 lg:flex-nowrap' : 'max-w-[1360px] border-[#dbe7f6] px-3 sm:px-4 py-2.5 flex-wrap'} relative z-40 w-full mx-auto bg-white/90 backdrop-blur-[4px] rounded-[16px] border shadow-xs flex flex-wrap items-center justify-between gap-2.5`}
      >
        {isUnified ? (
          <StudioSwitcher active="draw-animate" />
        ) : (
          <>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ede9fe] to-[#ddd6fe] border border-[#c4b5fd] text-[#5b21b6] flex items-center gap-2 shadow-2xs">
                <Icon icon="solar:magic-stick-3-bold" className="w-5 h-5" />
                <h1 className="text-base sm:text-lg font-black leading-none">Draw &amp; Animate</h1>
              </div>
            </div>

            {/* Classic Shared Studio Navigation Tabs */}
            <StudioModeTabs active="draw-animate" compact={false} />
          </>
        )}

        {/* Undo / Redo / Age Mode / A-B Layout Toggle / Export PNG (Pro) / Save */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowAgePicker(true)}
            className={`${isUnified ? 'h-10 px-3.5 rounded-full bg-[#f5f8fe] hover:bg-[#eaf1fd] border-2 border-[#dde7f5] text-[#1b294e]' : 'min-h-[40px] px-3 rounded-full bg-[#f4f8ff] hover:bg-[#e8f2ff] border border-[#dbe7f6] text-[#172951]'} text-xs font-black flex items-center gap-1.5`}
          >
            {isUnified && (
              <img src={getAgeModeIconSrc(ageMode)} alt="" className="w-4 h-4 object-contain shrink-0" />
            )}
            <span>
              {ageMode === 'little' ? "I'm little" : ageMode === 'builder' ? "I'm a builder" : "I'm a pro"}
            </span>
            {isUnified ? (
              <img src={STUDIO_SYSTEM_ICONS.dropdown} alt="" className="w-3 h-3 shrink-0" />
            ) : (
              <Icon icon="solar:alt-arrow-down-bold" className="w-3.5 h-3.5 text-[#516587]" />
            )}
          </button>
          {ageMode === 'pro' && (
            <button
              type="button"
              onClick={() =>
                setPendingGate({
                  label: 'export your drawing as PNG',
                  run: () => {
                    const art = canvasRef.current?.getArtCanvas();
                    if (art) exportTransparentPng(art);
                  },
                })
              }
              className={`${isUnified ? 'h-10 px-3.5 rounded-full border-2 border-[#dde7f5] text-[#1b294e]' : 'min-h-[48px] px-3.5 rounded-full border-2 border-b-4 border-[#dbe7f6] text-[#172951]'} bg-white text-xs font-black hidden sm:flex items-center gap-1`}
            >
              <Icon icon="solar:gallery-download-bold" className="w-4 h-4 text-[#087CF7]" />
              <span>PNG</span>
            </button>
          )}
          {isUnified ? (
            <div className="h-10 bg-white border-2 border-[#dee3ed] rounded-full px-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                aria-label="Undo"
                title="Undo (Ctrl/Cmd+Z)"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#e5ecf8] hover:bg-[#d8e3f5] disabled:bg-transparent disabled:opacity-35 transition-colors"
              >
                <img src={STUDIO_SYSTEM_ICONS.undo} alt="" className="w-5 h-5 object-contain" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                aria-label="Redo"
                title="Redo (Ctrl/Cmd+Shift+Z)"
                className="w-7 h-7 flex items-center justify-center rounded-full bg-[#e5ecf8] hover:bg-[#d8e3f5] disabled:bg-transparent disabled:opacity-35 transition-colors"
              >
                <img src={STUDIO_SYSTEM_ICONS.redo} alt="" className="w-5 h-5 object-contain" />
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                aria-label="Undo"
                title="Undo (Ctrl/Cmd+Z)"
                className="w-12 h-12 rounded-full bg-white border-2 border-b-4 border-[#dbe7f6] flex items-center justify-center text-[#172951] disabled:opacity-40 active:translate-y-0.5 transition-transform duration-75"
              >
                <Icon icon="solar:undo-left-round-bold" className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                aria-label="Redo"
                title="Redo (Ctrl/Cmd+Shift+Z)"
                className="w-12 h-12 rounded-full bg-white border-2 border-b-4 border-[#dbe7f6] flex items-center justify-center text-[#172951] disabled:opacity-40 active:translate-y-0.5 transition-transform duration-75"
              >
                <Icon icon="solar:undo-right-round-bold" className="w-5 h-5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => void handleSaveCreation()}
            className={`${isUnified ? 'h-10 px-4 rounded-full border-[1.5px] border-[#ebb23d] bg-gradient-to-b from-[#fae25b] via-[#f7ce46] to-[#ffd67b] shadow-[0_6px_8px_rgba(235,182,62,0.35),inset_0_2px_2px_rgba(255,255,255,0.85),inset_0_-3px_3px_rgba(170,113,38,0.3)] text-xs text-[#111729]' : 'min-h-[48px] px-5 rounded-full bg-[#FFC300] border-2 border-b-4 border-[#d97706] text-base text-[#172951]'} hover:brightness-105 font-black flex items-center gap-1.5 active:translate-y-0.5 transition-transform duration-75 ${
              goldFlash ? 'ring-4 ring-[#fde047] brightness-110' : ''
            }`}
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

      {/* Main 3-Column Draw Workspace (centered, cards sized to content) */}
      <div className={`${isUnified ? 'max-w-[1440px]' : 'max-w-[1360px]'} w-full mx-auto flex-1 flex flex-col lg:flex-row gap-4 items-center lg:items-start justify-center min-h-0`}>
        {/* Left Card: Tools + 6 Quick Colors + Brush Size + 96px Mascot */}
        <aside className="hidden lg:flex w-[252px] shrink-0 flex-col gap-4 self-start">
          <div className="bg-white rounded-[24px] border border-[#dbe7f6] shadow-xs p-3.5 space-y-3 relative">
            <div className="space-y-1.5">
              {visibleTools.map((item) => {
                const selected = tool === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTool(item.id)}
                    aria-pressed={selected}
                    className={`w-full min-h-[48px] px-3.5 rounded-2xl border-2 text-base font-extrabold flex items-center justify-between transition-all active:translate-y-0.5 duration-75 ${
                      selected
                        ? 'bg-[#e8f3ff] border-[#087CF7] border-b-4 text-[#087CF7]'
                        : 'bg-white border-transparent hover:bg-[#f4f8ff] text-[#172951]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      {isUnified ? (
                        <img src={item.svg} alt="" className="w-5 h-5 object-contain" />
                      ) : (
                        <Icon icon={item.icon} className="w-5 h-5" />
                      )}
                      <span>{item.label}</span>
                    </span>
                    {selected && <Icon icon="solar:check-circle-bold" className="w-4 h-4 text-[#087CF7]" />}
                  </button>
                );
              })}
            </div>

            {/* Extended 24-Color Popover */}
            {colorsOpen && (
              <div className="absolute left-full top-12 ml-3 z-30 w-[260px] bg-white rounded-3xl border-2 border-[#dbe7f6] shadow-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#172951]">Pick a Color</span>
                  <button
                    type="button"
                    onClick={() => setColorsOpen(false)}
                    aria-label="Close colors"
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-black text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {CURATED_COLORS.map((c) => {
                    const selected = activeColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setActiveColor(c.hex);
                          setTool('draw');
                        }}
                        aria-label={c.name}
                        title={c.name}
                        className={`w-9 h-9 rounded-full border border-slate-300/80 flex items-center justify-center transition-transform ${
                          selected ? 'ring-2 ring-[#087CF7] ring-offset-2 scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {selected && (
                          <Icon
                            icon="solar:check-read-bold"
                            className={`w-4 h-4 ${c.hex === '#111827' || c.hex === '#1E3A8A' ? 'text-white' : 'text-slate-900'}`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 cursor-pointer">
                  <span className="text-xs font-extrabold text-[#516587]">More colors</span>
                  <input
                    type="color"
                    value={activeColor}
                    onChange={(e) => {
                      setActiveColor(e.target.value);
                      setTool('draw');
                    }}
                    aria-label="Custom color picker"
                    className="w-10 h-8 rounded-lg border border-slate-200 cursor-pointer"
                  />
                </label>
              </div>
            )}

            {/* Extended 24-Sticker Popover */}
            {stickersOpen && (
              <div className="absolute left-full top-24 ml-3 z-30 w-[280px] bg-white rounded-3xl border-2 border-[#dbe7f6] shadow-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-[#172951]">Tap a Sticker, then tap canvas!</span>
                  <button
                    type="button"
                    onClick={() => setStickersOpen(false)}
                    aria-label="Close stickers"
                    className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-black text-xs shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[280px] overflow-y-auto pr-0.5">
                  {BUNDLED_STICKERS.map((st) => {
                    const selected = activeSticker.id === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => {
                          setActiveSticker(st);
                          setTool('stickers');
                          setStickersOpen(false);
                        }}
                        aria-label={st.label}
                        title={st.label}
                        className={`h-14 rounded-2xl border-2 p-1.5 flex items-center justify-center transition-all ${
                          selected
                            ? 'bg-[#e8f3ff] border-[#087CF7] scale-105'
                            : 'bg-[#f8fbff] border-[#dbe7f6] hover:bg-white'
                        }`}
                      >
                        <img
                          src={`data:image/svg+xml;utf8,${encodeURIComponent(st.svg)}`}
                          alt={st.label}
                          className="w-9 h-9 object-contain"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-3 space-y-3">
              {/* 6 Quick Color Dots */}
              <div className="grid grid-cols-6 gap-1.5">
                {QUICK_COLORS.map((c) => {
                  const selected = activeColor.toLowerCase() === c.hex.toLowerCase();
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setActiveColor(c.hex);
                        if (tool === 'erase') setTool('draw');
                      }}
                      aria-label={c.name}
                      title={c.name}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                        selected ? 'ring-2 ring-[#087CF7] ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.hex }}
                    >
                      {selected && <Icon icon="solar:check-read-bold" className="w-3.5 h-3.5 text-white drop-shadow-xs" />}
                    </button>
                  );
                })}
              </div>

              {/* Brush Size Slider */}
              <div className="flex items-center gap-2 px-1">
                <span className="w-2 h-2 rounded-full bg-[#172951] shrink-0" aria-hidden="true" />
                <input
                  type="range"
                  min={6}
                  max={48}
                  value={brushSize}
                  onChange={(e) => setBrushSize(Number(e.target.value))}
                  aria-label="Brush size"
                  className="w-full accent-[#087CF7] cursor-pointer"
                />
                <span className="w-4 h-4 rounded-full bg-[#172951] shrink-0" aria-hidden="true" />
              </div>

              {/* Poof! Clear Button */}
              <button
                type="button"
                onClick={handlePoofClear}
                className="w-full min-h-[48px] px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 border-2 border-b-4 border-rose-200 text-rose-700 text-base font-black flex items-center justify-center gap-2 active:translate-y-0.5 transition-transform duration-75"
              >
                <Icon icon="solar:trash-bin-minimalistic-bold" className="w-5 h-5" />
                <span>Poof!</span>
              </button>
            </div>
          </div>

          {/* Bottom-left Jugnu Bee Mascot (~96px) */}
          {mascotEnabled && mascotVisible && (
            <div className="flex items-end gap-2.5 px-1 pt-1">
              <div className="w-24 h-24 rounded-3xl bg-white/95 border-2 border-[#dbe7f6] shadow-sm flex items-center justify-center text-6xl shrink-0">
                🐝
              </div>
              <div className="relative bg-white rounded-2xl border-2 border-[#dbe7f6] shadow-xs px-3.5 py-2.5 text-sm font-extrabold text-[#172951] flex items-center gap-2 mb-3">
                <span>{mascotTip}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMascotVisible(false);
                    setMascotEnabled(false);
                  }}
                  aria-label="Turn off bee tips"
                  title="Turn off bee tips"
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Center Column: Canvas + Big Green "Bring it to life!" + Try an example */}
        <div className="flex-1 flex flex-col items-center justify-start gap-4 min-w-0">
          <div className={`w-full transition-transform duration-150 ${bringingToLife ? 'animate-pulse scale-[0.98]' : ''}`}>
            <DrawCanvas
            ref={canvasRef}
            tool={tool}
            color={activeColor}
            brushSize={brushSize}
            activeSticker={activeSticker}
            onHistoryChange={syncHistoryFlags}
            onStrokeEnd={() => {
              resetIdleTimer();
              scheduleAutosave();
            }}
            onFillApplied={() => resetIdleTimer()}
            onStickerStamped={() => {
              playStickerPop();
              resetIdleTimer();
            }}
          />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleBringToLife}
              className={`min-h-[58px] px-8 py-3 rounded-full bg-gradient-to-b from-[#4ade80] to-[#16a34a] hover:brightness-105 border-2 border-b-[6px] border-[#15803d] text-white text-xl font-black shadow-md flex items-center gap-2.5 active:translate-y-1 transition-transform duration-75 ${
                shakeBringBtn ? 'animate-bounce' : ''
              }`}
            >
              <Icon icon="solar:stars-minimalistic-bold" className="w-6 h-6" />
              <span>Bring it to life!</span>
            </button>

            <button
              type="button"
              onClick={() => void handleTryExample()}
              className="min-h-[48px] px-4 py-2.5 rounded-full bg-white hover:bg-[#f4f8ff] border-2 border-b-4 border-[#dbe7f6] text-[#172951] text-sm font-black flex items-center gap-1.5 active:translate-y-0.5 transition-transform duration-75"
            >
              <Icon icon="solar:magic-stick-2-bold" className="w-4 h-4 text-[#7c3aed]" />
              <span>Try an example</span>
            </button>
          </div>
        </div>

        {/* Right Card: Pick a Move + Speed + Scene + My Creations */}
        <aside className="w-full lg:w-[300px] shrink-0 self-start bg-white rounded-[24px] border border-[#dbe7f6] shadow-xs p-3.5 space-y-4">
          {/* Pick a Move */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-1">
              <Icon icon="solar:clapperboard-play-bold" className="w-5 h-5 text-[#7c3aed]" />
              <h2 className="text-base font-black text-[#172951]">Pick a Move</h2>
            </div>
            <div className="flex lg:grid lg:grid-cols-3 gap-2 overflow-x-auto pb-1 lg:pb-0">
              {visibleMoves.map((m) => {
                const selected = move === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (ageMode === 'little') speakLabel(m.label);
                      selectMove(m.id);
                    }}
                    aria-pressed={selected}
                    className={`relative min-w-[84px] lg:min-w-0 min-h-[68px] p-2 rounded-2xl border-2 flex flex-col items-center justify-center gap-1 text-sm font-extrabold shrink-0 transition-all active:translate-y-0.5 duration-75 ${
                      selected
                        ? 'bg-[#e8f3ff] border-[#087CF7] border-b-4 ring-2 ring-[#087CF7]/25 text-[#087CF7]'
                        : 'bg-[#f8fbff] border-[#dbe7f6] hover:bg-white text-[#172951]'
                    }`}
                  >
                    {selected && (
                      <Icon
                        icon="solar:check-circle-bold"
                        className="w-4 h-4 text-[#087CF7] absolute top-1.5 right-1.5"
                      />
                    )}
                    <span className="text-2xl leading-none" aria-hidden="true">{m.emoji}</span>
                    <span className="text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Speed + Sound Toggle (hidden in Little mode) */}
          {ageMode !== 'little' && (
            <div className="space-y-1.5">
            <div className="text-sm font-black text-[#172951] px-1">Speed</div>
            <div className="flex items-center gap-2.5">
              <img src={STUDIO_SYSTEM_ICONS.tortoise} alt="" className="w-5 h-5 object-contain shrink-0" />
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.1}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                aria-label="Animation speed"
                className="flex-1 accent-[#087CF7] cursor-pointer"
              />
              <img src={STUDIO_SYSTEM_ICONS.rabbit} alt="" className="w-5 h-5 object-contain shrink-0" />
              <button
                type="button"
                onClick={() => setSoundOn(!soundOn)}
                aria-label={soundOn ? 'Mute sound' : 'Unmute sound'}
                aria-pressed={soundOn}
                className="w-12 h-12 rounded-full bg-[#f4f8ff] hover:bg-[#e8f2ff] border border-[#dbe7f6] flex items-center justify-center text-[#172951] shrink-0 transition-colors"
              >
                <img
                  src={soundOn ? STUDIO_SYSTEM_ICONS.unmute : STUDIO_SYSTEM_ICONS.mute}
                  alt=""
                  className="w-5 h-5 object-contain"
                />
              </button>
            </div>
          </div>
          )}

          {/* Scene (hidden in Little mode) */}
          {ageMode !== 'little' && (
          <div className="hidden lg:block space-y-2">
            <div className="text-sm font-black text-[#172951] px-1">Scene</div>
            <div className="grid grid-cols-4 gap-1.5">
              {SCENE_OPTIONS.map((sc) => {
                const selected = scene === sc.id;
                return (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => selectScene(sc.id)}
                    aria-pressed={selected}
                    className="flex flex-col items-center gap-1"
                  >
                    <span
                      className={`w-full h-11 rounded-xl bg-gradient-to-b ${sc.gradient} border-2 transition-transform ${
                        selected ? 'border-[#087CF7] ring-2 ring-[#087CF7]/30 scale-105' : 'border-[#dbe7f6]'
                      }`}
                    />
                    <span className="text-[11px] font-extrabold text-[#172951] leading-tight text-center">
                      {sc.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* My Creations (hidden in Little mode) */}
          {ageMode !== 'little' && (
          <div className="hidden lg:block space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-black text-[#172951]">My Creations</span>
              <Link to="/my-work" className="text-xs font-extrabold text-[#087CF7] hover:underline">
                See All
              </Link>
            </div>
            {creations.length === 0 ? (
              <div className="rounded-2xl bg-[#f8fbff] border border-dashed border-[#cfe0f5] p-3 text-center text-xs font-bold text-[#516587]">
                Your saved animations will appear here!
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-1.5">
                {creations.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void handleReopenCreation(item)}
                    title={`${item.title} (${item.move})`}
                    aria-label={`Open ${item.title}`}
                    className="aspect-square rounded-2xl bg-[#f8fbff] border-2 border-[#dbe7f6] hover:border-[#087CF7] p-1 overflow-hidden transition-transform hover:scale-105"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          )}
        </aside>
      </div>

      {/* Mobile Fixed Bottom Tool Bar (< lg) */}
      <nav
        aria-label="Drawing tools"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur-md border-t border-[#dbe7f6] px-2 py-1.5 flex items-center justify-around gap-1"
      >
        {visibleTools.map((item) => {
          const selected = tool === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectTool(item.id)}
              className={`min-w-[56px] min-h-[48px] px-2 py-1 rounded-2xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-extrabold ${
                selected ? 'bg-[#e8f3ff] text-[#087CF7]' : 'text-[#172951]'
              }`}
            >
              {isUnified ? (
                <img src={item.svg} alt="" className="w-5 h-5 object-contain" />
              ) : (
                <Icon icon={item.icon} className="w-5 h-5" />
              )}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Colors Bottom Sheet */}
      {mobileSheet === 'colors' && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close colors sheet"
            onClick={() => setMobileSheet(null)}
            className="flex-1 bg-slate-900/30"
          />
          <div className="bg-white rounded-t-3xl border-t border-[#dbe7f6] p-4 pb-6 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-[#172951]">Colors &amp; Size</span>
              <button
                type="button"
                onClick={() => setMobileSheet(null)}
                className="px-3 py-1 rounded-full bg-slate-100 text-xs font-black text-[#172951]"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {CURATED_COLORS.map((c) => {
                const selected = activeColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setActiveColor(c.hex);
                      setTool('draw');
                    }}
                    aria-label={c.name}
                    className={`w-11 h-11 rounded-full border border-slate-300 flex items-center justify-center ${
                      selected ? 'ring-2 ring-[#087CF7] ring-offset-2' : ''
                    }`}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected && <Icon icon="solar:check-read-bold" className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-black text-[#516587]">Size</span>
              <input
                type="range"
                min={6}
                max={48}
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="flex-1 accent-[#087CF7]"
              />
              <button
                type="button"
                onClick={() => {
                  handlePoofClear();
                  setMobileSheet(null);
                }}
                className="min-h-[48px] px-4 rounded-2xl bg-rose-50 text-rose-700 text-sm font-black"
              >
                Poof!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Stickers Bottom Sheet */}
      {mobileSheet === 'stickers' && (
        <div className="lg:hidden fixed inset-0 z-40 flex flex-col justify-end">
          <button
            type="button"
            aria-label="Close stickers sheet"
            onClick={() => setMobileSheet(null)}
            className="flex-1 bg-slate-900/30"
          />
          <div className="bg-white rounded-t-3xl border-t border-[#dbe7f6] p-4 pb-6 space-y-3 shadow-2xl max-h-[65dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <span className="text-base font-black text-[#172951]">Pick a Sticker</span>
              <button
                type="button"
                onClick={() => setMobileSheet(null)}
                className="px-3 py-1 rounded-full bg-slate-100 text-xs font-black text-[#172951]"
              >
                Done
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {BUNDLED_STICKERS.map((st) => {
                const selected = activeSticker.id === st.id;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setActiveSticker(st);
                      setTool('stickers');
                      setMobileSheet(null);
                    }}
                    aria-label={st.label}
                    className={`h-16 rounded-2xl border-2 p-2 flex flex-col items-center justify-center gap-1 ${
                      selected ? 'bg-[#e8f3ff] border-[#087CF7]' : 'bg-[#f8fbff] border-[#dbe7f6]'
                    }`}
                  >
                    <img
                      src={`data:image/svg+xml;utf8,${encodeURIComponent(st.svg)}`}
                      alt={st.label}
                      className="w-9 h-9 object-contain"
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Poof! Undo Toast (6s) */}
      {poofToastOpen && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#172951] text-white px-4 py-2.5 rounded-full shadow-lg flex items-center gap-3 text-sm font-extrabold">
          <span>Canvas cleared!</span>
          <button
            type="button"
            onClick={handleUndo}
            className="px-3 py-1 rounded-full bg-[#FFC300] text-[#172951] font-black"
          >
            Undo
          </button>
        </div>
      )}

      {/* Info Toast */}
      {toastMsg && !poofToastOpen && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white border-2 border-[#087CF7] text-[#172951] px-4 py-2 rounded-full shadow-md text-sm font-extrabold">
          {toastMsg}
        </div>
      )}

      {/* First-Visit Age Mode Picker */}
      {showAgePicker && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Pick your studio mode"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border-2 border-[#dbe7f6] shadow-2xl p-5 sm:p-6 space-y-4 text-center">
            <h2 className="text-xl font-black text-[#172951]">Who&apos;s drawing today?</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {(
                [
                  { id: 'little', emoji: '🐣', title: "I'm little", desc: 'Ages 4–6 · Simple tools & big fun' },
                  { id: 'builder', emoji: '🧱', title: "I'm a builder", desc: 'Ages 7–9 · Stickers, scenes & all moves' },
                  { id: 'pro', emoji: '🚀', title: "I'm a pro", desc: 'Ages 10+ · Pins, video record & PNG' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setAgeMode(opt.id);
                    try {
                      localStorage.setItem('ll-draw-animate-age-mode', opt.id);
                    } catch {
                      // Ignore
                    }
                    setShowAgePicker(false);
                  }}
                  className="p-4 rounded-2xl border-2 border-b-4 border-[#dbe7f6] hover:border-[#087CF7] bg-[#f8fbff] hover:bg-[#e8f3ff] flex flex-col items-center gap-1.5 transition-all"
                >
                  <span className="w-11 h-11 rounded-2xl bg-white border border-[#dde7f5] shadow-2xs flex items-center justify-center shrink-0">
                    <img src={getAgeModeIconSrc(opt.id)} alt="" className="w-4 h-4 object-contain" />
                  </span>
                  <span className="text-base font-black text-[#172951]">{opt.title}</span>
                  <span className="text-xs font-bold text-[#516587]">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {pendingGate && (
        <ParentGate
          actionLabel={pendingGate.label}
          onCancel={() => setPendingGate(null)}
          onPass={() => {
            const run = pendingGate.run;
            setPendingGate(null);
            run();
          }}
        />
      )}
    </section>
  );
};
