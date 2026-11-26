import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import confetti from 'canvas-confetti';
import { CANDY_PALETTE } from '../voxel/palette';
import { VOXEL_TEMPLATES } from '../voxel/templates';
import { GRID_MAX_Y, VoxelStore, isInBounds } from '../voxel/voxelStore';
import type {
  BlockStyle,
  CameraView,
  SavedVoxelWork,
  SymmetryMode,
  VoxelTool,
  VoxelTuple,
} from '../voxel/types';
import type { VoxelCanvasHandle } from '../voxel/VoxelCanvas';
import type { VoxelInteractionPayload } from '../voxel/VoxelScene';
import { readWork, saveWork } from '../utils/localWork';
import { playCelebrationFanfare, playClickSound } from '../utils/soundEffects';

const LazyVoxelCanvas = React.lazy(() =>
  import('../voxel/VoxelCanvas').then((m) => ({ default: m.VoxelCanvas })),
);

const VOXEL_STORAGE_KEY = 'll-voxels';
const DEFAULT_WORK_ID = 'voxel-studio-main';

function AccordionSection({
  title,
  icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-white rounded-2xl border border-[#dbe7f6] shadow-xs overflow-hidden">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left hover:bg-[#f7faff] transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-black text-[#172951]">
          <Icon icon={icon} className="w-4 h-4 text-[#1676ed]" />
          <span>{title}</span>
        </span>
        <Icon
          icon={open ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
          className="w-3.5 h-3.5 text-[#516587]"
        />
      </button>
      {open && <div className="px-3 pb-3 pt-1 border-t border-slate-100">{children}</div>}
    </section>
  );
}

export const VoxelStudioPage: React.FC = () => {
  const storeRef = useRef<VoxelStore | null>(null);
  if (!storeRef.current) {
    storeRef.current = new VoxelStore(VOXEL_TEMPLATES[0].voxels);
  }

  const canvasRef = useRef<VoxelCanvasHandle>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [voxels, setVoxels] = useState<VoxelTuple[]>(() => storeRef.current!.entries());
  const [, setVersion] = useState(0);

  const [tool, setTool] = useState<VoxelTool>('add');
  const [previousTool, setPreviousTool] = useState<VoxelTool>('add');
  const [activeColor, setActiveColor] = useState<string>(CANDY_PALETTE[0].hex);
  const [symmetry, setSymmetry] = useState<SymmetryMode>('none');
  const [blockStyle, setBlockStyle] = useState<BlockStyle>('rounded');
  const [cameraView, setCameraView] = useState<CameraView>('iso');
  const [gridSize, setGridSize] = useState<8 | 12 | 16>(16);
  const [maxLayer, setMaxLayer] = useState<number>(GRID_MAX_Y);
  const [gridVisible, setGridVisible] = useState(true);
  const [focusMode, setFocusMode] = useState(false);

  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const [activeGuideId, setActiveGuideId] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});
  const [selectedInfo, setSelectedInfo] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const celebratedGuideRef = useRef<string | null>(null);

  // Hydrate saved voxels & generate 3D template thumbnails lazily on client mount
  useEffect(() => {
    setIsClient(true);
    const saved = readWork<[string, SavedVoxelWork][]>(VOXEL_STORAGE_KEY, []);
    const existing = saved.find(([id]) => id === DEFAULT_WORK_ID)?.[1];
    if (existing && Array.isArray(existing.voxels) && existing.voxels.length > 0) {
      storeRef.current!.load(existing.voxels);
      setVoxels(storeRef.current!.entries());
    }
    void import('../voxel/renderThumbnails').then(({ renderTemplateThumbnails }) => {
      setThumbnails(renderTemplateThumbnails(VOXEL_TEMPLATES));
    });
  }, []);

  const syncFromStore = useCallback((persist = true) => {
    const entries = storeRef.current!.entries();
    setVoxels(entries);
    setVersion((v) => v + 1);
    if (persist) {
      const saved = readWork<[string, SavedVoxelWork][]>(VOXEL_STORAGE_KEY, []);
      const filtered = saved.filter(([id]) => id !== DEFAULT_WORK_ID);
      filtered.unshift([
        DEFAULT_WORK_ID,
        { id: DEFAULT_WORK_ID, title: 'My 3D Creation', updatedAt: Date.now(), voxels: entries },
      ]);
      saveWork(VOXEL_STORAGE_KEY, filtered.slice(0, 12));
    }
  }, []);

  const activeTemplate = useMemo(
    () => VOXEL_TEMPLATES.find((t) => t.id === activeGuideId) ?? null,
    [activeGuideId],
  );

  const guideProgress = useMemo(() => {
    if (!activeTemplate) return { remaining: [] as VoxelTuple[], matched: 0, total: 0, percent: 0 };
    const store = storeRef.current!;
    const remaining: VoxelTuple[] = [];
    let matched = 0;
    for (const [x, y, z, color] of activeTemplate.voxels) {
      if (store.has(x, y, z)) matched++;
      else remaining.push([x, y, z, color]);
    }
    const total = activeTemplate.voxels.length;
    const percent = total > 0 ? Math.round((matched / total) * 100) : 0;
    return { remaining, matched, total, percent };
  }, [activeTemplate, voxels]);

  useEffect(() => {
    if (
      activeTemplate &&
      guideProgress.total > 0 &&
      guideProgress.matched === guideProgress.total &&
      celebratedGuideRef.current !== activeTemplate.id
    ) {
      celebratedGuideRef.current = activeTemplate.id;
      void playCelebrationFanfare();
      void confetti({ particleCount: 70, spread: 65, origin: { y: 0.65 } });
      setStatusMessage(`Awesome! You finished building the ${activeTemplate.name}!`);
    }
  }, [activeTemplate, guideProgress]);

  const handleSelectTool = (next: VoxelTool) => {
    if (next !== 'eyedropper') setPreviousTool(next);
    setTool(next);
    if (next !== 'select') setSelectedInfo(null);
  };

  const handleBlockAction = useCallback(
    ({ x, y, z }: VoxelInteractionPayload) => {
      const store = storeRef.current!;

      if (tool === 'eyedropper') {
        const picked = store.get(x, y, z);
        if (picked) {
          setActiveColor(picked);
          setTool(previousTool === 'eyedropper' ? 'add' : previousTool);
          setStatusMessage(`Picked color ${picked}`);
        }
        return;
      }

      if (tool === 'select') {
        const picked = store.get(x, y, z);
        if (picked) {
          setSelectedInfo(`Block at (${x}, ${y + 1}, ${z}) · ${picked}`);
          setActiveColor(picked);
        } else {
          setSelectedInfo(null);
        }
        return;
      }

      let changed = false;
      if (tool === 'add') {
        let colorToUse = activeColor;
        if (activeTemplate) {
          const guideMatch = activeTemplate.voxels.find(([gx, gy, gz]) => gx === x && gy === y && gz === z);
          if (guideMatch) colorToUse = guideMatch[3];
        }
        changed = store.add(x, y, z, colorToUse, symmetry);
      } else if (tool === 'paint') {
        changed = store.paint(x, y, z, activeColor, symmetry);
      } else if (tool === 'erase') {
        changed = store.erase(x, y, z, symmetry);
      } else if (tool === 'fill') {
        changed = store.fill(x, y, z, activeColor);
      }

      if (changed) {
        void playClickSound();
        syncFromStore(true);
      }
    },
    [tool, previousTool, activeColor, symmetry, activeTemplate, syncFromStore],
  );

  const handleUndo = () => {
    if (storeRef.current!.undo()) {
      void playClickSound();
      syncFromStore(true);
    }
  };

  const handleRedo = () => {
    if (storeRef.current!.redo()) {
      void playClickSound();
      syncFromStore(true);
    }
  };

  const handleClear = () => {
    if (storeRef.current!.size === 0) return;
    if (!window.confirm('Clear all blocks from your 3D canvas? You can still Undo right after.')) return;
    if (storeRef.current!.clear()) {
      celebratedGuideRef.current = null;
      syncFromStore(true);
      setStatusMessage('Canvas cleared — ready to build!');
    }
  };

  const handleStartGuide = (templateId: string) => {
    const tpl = VOXEL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    celebratedGuideRef.current = null;
    storeRef.current!.clear();
    setActiveGuideId(tpl.id);
    handleSelectTool('add');
    syncFromStore(true);
    canvasRef.current?.frameModel(tpl.voxels);
    setStatusMessage(`Guided Mode: Tap glowing blocks to build ${tpl.name}!`);
  };

  const handleLoadFullTemplate = (templateId: string) => {
    const tpl = VOXEL_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setActiveGuideId(null);
    storeRef.current!.load(tpl.voxels, true);
    syncFromStore(true);
    canvasRef.current?.frameModel(tpl.voxels);
    setStatusMessage(`Loaded ${tpl.name}!`);
  };

  const handleExportPng = () => {
    const dataUrl = canvasRef.current?.capturePng();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'jugnu-voxel-creation.png';
    link.click();
    setStatusMessage('PNG snapshot saved!');
  };

  const handleExportVoxelJson = () => {
    const payload = JSON.stringify({ version: 1, voxels: storeRef.current!.entries() });
    const url = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jugnu-voxel-model.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    setStatusMessage('Voxel file exported!');
  };

  const handleImportVoxelJson = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const list = Array.isArray(parsed) ? parsed : parsed?.voxels;
      if (!Array.isArray(list)) throw new Error('Invalid');
      const valid: VoxelTuple[] = list.filter(
        (item: unknown): item is VoxelTuple =>
          Array.isArray(item) &&
          item.length === 4 &&
          isInBounds(item[0], item[1], item[2]) &&
          typeof item[3] === 'string' &&
          /^#[0-9a-f]{3,8}$/i.test(item[3]),
      );
      if (valid.length === 0) throw new Error('Empty');
      setActiveGuideId(null);
      storeRef.current!.load(valid, true);
      syncFromStore(true);
      canvasRef.current?.frameModel(valid);
      setStatusMessage(`Imported ${valid.length} blocks!`);
    } catch {
      setStatusMessage('Could not import file. Choose a valid Jugnu voxel JSON.');
    }
  };

  const cycleSymmetry = () => {
    const order: SymmetryMode[] = ['none', 'x', 'both'];
    const next = order[(order.indexOf(symmetry) + 1) % order.length];
    setSymmetry(next);
    setStatusMessage(
      next === 'none' ? 'Mirror off' : next === 'x' ? '2-Way Mirror on' : '4-Way Mirror on',
    );
  };

  const handleCameraView = (view: CameraView) => {
    setCameraView(view);
    canvasRef.current?.setCameraView(view);
  };

  const store = storeRef.current!;

  return (
    <section
      className={`voxel-studio ${focusMode ? 'focus-mode fixed inset-0 z-50' : 'min-h-[calc(100vh-80px)]'} bg-gradient-to-b from-[#e4f1fe] via-[#ebf5fe] to-[#dff0ff] px-3 sm:px-5 py-3 sm:py-4 flex flex-col gap-3`}
    >
      {/* Studio Header Bar */}
      <header className="max-w-[1440px] w-full mx-auto bg-white/85 backdrop-blur-sm rounded-2xl border border-[#dbe7f6] shadow-xs px-3 sm:px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Title + Colorful Icon + Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#4361ee] to-[#7c3aed] flex items-center justify-center text-white shadow-sm shrink-0">
            <Icon icon="solar:box-bold" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-[#172951] leading-tight">
              Voxel Studio
            </h1>
            <p className="text-[11px] sm:text-xs font-bold text-[#516587]">
              Build in 3D with colorful blocks · {voxels.length} placed
            </p>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <nav
          aria-label="Create Studio modes"
          className="hidden md:flex items-center gap-1 bg-[#f0f6ff] p-1 rounded-full border border-[#dbe7f6]"
        >
          <span className="px-4 py-1.5 rounded-full bg-[#1676ed] text-white text-xs font-black flex items-center gap-1.5 shadow-xs">
            <Icon icon="solar:box-bold" className="w-4 h-4" />
            <span>Voxel Studio</span>
          </span>
          <Link
            to="/drawing-board"
            className="px-4 py-1.5 rounded-full text-[#172951] hover:bg-white text-xs font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <Icon icon="solar:pen-bold" className="w-4 h-4 text-[#7c3aed]" />
            <span>Drawing</span>
          </Link>
          <Link
            to="/my-work"
            className="px-4 py-1.5 rounded-full text-[#172951] hover:bg-white text-xs font-extrabold flex items-center gap-1.5 transition-colors"
          >
            <Icon icon="solar:folder-with-files-bold" className="w-4 h-4 text-[#f59e0b]" />
            <span>My Work</span>
          </Link>
        </nav>

        {/* Studio Actions: Undo, Redo, Fullscreen, Save PNG */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center bg-[#f4f8ff] rounded-xl border border-[#dbe7f6] p-0.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!store.canUndo}
              title="Undo"
              aria-label="Undo"
              className="p-2 rounded-lg text-[#172951] hover:bg-white disabled:opacity-35 transition-colors"
            >
              <Icon icon="solar:undo-left-bold" className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!store.canRedo}
              title="Redo"
              aria-label="Redo"
              className="p-2 rounded-lg text-[#172951] hover:bg-white disabled:opacity-35 transition-colors"
            >
              <Icon icon="solar:undo-right-bold" className="w-4 h-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFocusMode((v) => !v)}
            title={focusMode ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            aria-label={focusMode ? 'Exit Fullscreen' : 'Fullscreen Workspace'}
            className={`p-2.5 rounded-xl border transition-colors ${
              focusMode
                ? 'bg-[#1676ed] text-white border-[#1676ed]'
                : 'bg-white hover:bg-[#f4f8ff] text-[#172951] border-[#dbe7f6]'
            }`}
          >
            <Icon
              icon={focusMode ? 'solar:quit-full-screen-bold' : 'solar:full-screen-bold'}
              className="w-4 h-4"
            />
          </button>

          <button
            type="button"
            onClick={handleExportPng}
            className="btn-glossy-yellow px-3.5 sm:px-4 py-2 rounded-xl text-xs font-black text-slate-900 flex items-center gap-1.5 cursor-pointer"
          >
            <Icon icon="solar:download-minimalistic-bold" className="w-4 h-4" />
            <span>Save PNG</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Workspace */}
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col lg:flex-row gap-3.5 items-stretch min-h-0">
        
        {/* Left Sidebar: Collapsible Creation Controls */}
        {leftOpen ? (
          <aside
            aria-label="Creation controls"
            className="w-full lg:w-[236px] shrink-0 flex flex-col gap-2.5 overflow-y-auto max-h-[calc(100vh-170px)] pr-0.5"
          >
            <div className="flex items-center justify-between px-1 lg:hidden">
              <span className="text-xs font-black text-[#172951]">Tools & Settings</span>
              <button
                type="button"
                onClick={() => setLeftOpen(false)}
                className="text-xs font-bold text-[#1676ed]"
              >
                Hide
              </button>
            </div>

            {/* Build Tools */}
            <AccordionSection title="Build Tools" icon="solar:box-minimalistic-bold">
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(
                  [
                    ['add', 'Add', 'solar:box-minimalistic-bold'],
                    ['paint', 'Paint', 'solar:pen-2-bold'],
                    ['erase', 'Erase', 'solar:eraser-bold'],
                    ['fill', 'Fill', 'solar:paint-roller-bold'],
                  ] as [VoxelTool, string, string][]
                ).map(([id, label, icon]) => {
                  const active = tool === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectTool(id)}
                      className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                        active
                          ? 'bg-[#1676ed] text-white border-[#1676ed] shadow-xs'
                          : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                      }`}
                    >
                      <Icon icon={icon} className="w-4 h-4" />
                      <span>{label}</span>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={cycleSymmetry}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                    symmetry !== 'none'
                      ? 'bg-[#7c3aed] text-white border-[#7c3aed] shadow-xs'
                      : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                  }`}
                >
                  <Icon icon="solar:mirror-left-bold" className="w-4 h-4" />
                  <span>{symmetry === 'none' ? 'Mirror' : symmetry === 'x' ? '2-Way' : '4-Way'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTool('select')}
                  className={`flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                    tool === 'select'
                      ? 'bg-[#f59e0b] text-white border-[#f59e0b] shadow-xs'
                      : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                  }`}
                >
                  <Icon icon="solar:cursor-square-bold" className="w-4 h-4" />
                  <span>Select</span>
                </button>
              </div>
            </AccordionSection>

            {/* Block Styles */}
            <AccordionSection title="Block Style" icon="solar:widget-4-bold">
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {(
                  [
                    ['classic', 'Classic', 'rounded-[3px]'],
                    ['rounded', 'Rounded', 'rounded-md'],
                    ['soft', 'Soft', 'rounded-xl'],
                  ] as [BlockStyle, string, string][]
                ).map(([id, label, radiusClass]) => {
                  const active = blockStyle === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setBlockStyle(id)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-2.5 px-1 rounded-xl text-[11px] font-extrabold border transition-all ${
                        active
                          ? 'bg-[#eef5ff] text-[#1676ed] border-[#1676ed] shadow-xs'
                          : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 ${radiusClass} ${
                          active ? 'bg-[#1676ed]' : 'bg-[#f59e0b]'
                        } shadow-xs block`}
                      />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionSection>

            {/* View & Grid */}
            <AccordionSection title="View & Grid" icon="solar:eye-bold" defaultOpen={true}>
              <div className="grid grid-cols-4 gap-1 pt-1 mb-2.5">
                {(
                  [
                    ['iso', 'Iso'],
                    ['front', 'Front'],
                    ['side', 'Side'],
                    ['top', 'Top'],
                  ] as [CameraView, string][]
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => handleCameraView(v)}
                    className={`py-1.5 rounded-lg text-[11px] font-extrabold border transition-colors ${
                      cameraView === v
                        ? 'bg-[#1676ed] text-white border-[#1676ed]'
                        : 'bg-[#f8fbff] text-[#172951] border-[#e2ecf8] hover:bg-[#eef5ff]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-[#516587]">
                <span>Grid Size</span>
                <select
                  value={gridSize}
                  onChange={(e) => setGridSize(Number(e.target.value) as 8 | 12 | 16)}
                  className="bg-[#f8fbff] border border-[#dbe7f6] rounded-lg px-2 py-1 text-xs font-extrabold text-[#172951]"
                >
                  <option value={8}>8 × 8 × 8</option>
                  <option value={12}>12 × 12 × 12</option>
                  <option value={16}>16 × 16 × 16</option>
                </select>
              </div>
            </AccordionSection>

            {/* Layers */}
            <AccordionSection title="Layers" icon="solar:layers-bold" defaultOpen={false}>
              <div className="pt-1 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-[#172951]">
                  <span>Visible Height</span>
                  <span className="text-[#1676ed] font-black">
                    {maxLayer === GRID_MAX_Y ? 'All Layers' : `Layer 1–${maxLayer + 1}`}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={GRID_MAX_Y}
                  value={maxLayer}
                  onChange={(e) => setMaxLayer(Number(e.target.value))}
                  className="w-full accent-[#1676ed]"
                />
                {maxLayer < GRID_MAX_Y && (
                  <button
                    type="button"
                    onClick={() => setMaxLayer(GRID_MAX_Y)}
                    className="w-full py-1.5 rounded-lg bg-[#f0f6ff] text-[#1676ed] text-[11px] font-black"
                  >
                    Show All Layers
                  </button>
                )}
              </div>
            </AccordionSection>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setLeftOpen(true)}
            className="self-start px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] flex items-center gap-1.5"
          >
            <Icon icon="solar:sidebar-minimalistic-bold" className="w-4 h-4 text-[#1676ed]" />
            <span>Tools</span>
          </button>
        )}

        {/* Center 3D Workspace */}
        <div className="flex-1 flex flex-col gap-3 min-w-0 min-h-[440px]">
          <div className="relative flex-1 rounded-3xl overflow-hidden border-2 border-white shadow-sm bg-[#dff0ff] min-h-[380px]">
            {isClient ? (
              <React.Suspense
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-[#172951] font-bold">
                    Loading 3D Voxel Studio…
                  </div>
                }
              >
                <LazyVoxelCanvas
                  ref={canvasRef}
                  voxels={voxels}
                  guideVoxels={guideProgress.remaining}
                  tool={tool}
                  activeColor={activeColor}
                  blockStyle={blockStyle}
                  gridSize={gridSize}
                  maxVisibleLayer={maxLayer}
                  gridVisible={gridVisible}
                  onBlockAction={handleBlockAction}
                />
              </React.Suspense>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#172951] font-bold">
                Preparing 3D Voxel Canvas…
              </div>
            )}

            {/* Floating Sidebar Collapse Toggles (Desktop) */}
            <button
              type="button"
              onClick={() => setLeftOpen((v) => !v)}
              title={leftOpen ? 'Collapse Tools' : 'Expand Tools'}
              className="hidden lg:flex absolute top-3 left-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#dbe7f6] shadow-xs items-center justify-center text-[#172951]"
            >
              <Icon
                icon={leftOpen ? 'solar:double-alt-arrow-left-bold' : 'solar:double-alt-arrow-right-bold'}
                className="w-4 h-4"
              />
            </button>

            <button
              type="button"
              onClick={() => setRightOpen((v) => !v)}
              title={rightOpen ? 'Collapse Templates' : 'Expand Templates'}
              className="hidden lg:flex absolute top-3 right-14 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#dbe7f6] shadow-xs items-center justify-center text-[#172951]"
            >
              <Icon
                icon={rightOpen ? 'solar:double-alt-arrow-right-bold' : 'solar:double-alt-arrow-left-bold'}
                className="w-4 h-4"
              />
            </button>

            {/* Floating Reset Isometric View */}
            <button
              type="button"
              onClick={() => {
                setCameraView('iso');
                canvasRef.current?.frameModel(voxels);
              }}
              title="Auto-Frame & Reset Isometric Camera"
              className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white border border-[#dbe7f6] shadow-xs flex items-center justify-center text-[#1676ed]"
            >
              <Icon icon="solar:compass-bold" className="w-5 h-5" />
            </button>

            {/* Guided Template Progress Pill */}
            {activeTemplate && (
              <div className="absolute top-3 left-14 z-10 bg-white/95 backdrop-blur-sm rounded-2xl px-3.5 py-2 border border-amber-300 shadow-sm flex items-center gap-3">
                <span className="text-base">{activeTemplate.emoji}</span>
                <div>
                  <div className="text-xs font-black text-[#172951]">
                    Building {activeTemplate.name} · {guideProgress.percent}%
                  </div>
                  <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden mt-1">
                    <div
                      className="h-full bg-brand-green transition-all duration-200"
                      style={{ width: `${guideProgress.percent}%` }}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveGuideId(null)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 ml-1"
                  aria-label="Exit guided mode"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Selected Block Info / Status Toast */}
            {(selectedInfo || statusMessage) && (
              <div
                role="status"
                className="pointer-events-none absolute bottom-14 left-1/2 -translate-x-1/2 z-10 bg-[#172951]/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-full shadow-sm whitespace-nowrap"
              >
                {selectedInfo || statusMessage}
              </div>
            )}

            {/* Bottom-Left Quick Layer Toggle */}
            <button
              type="button"
              onClick={() =>
                setMaxLayer((prev) => (prev === GRID_MAX_Y ? Math.min(4, GRID_MAX_Y) : GRID_MAX_Y))
              }
              title="Toggle Slice View"
              className={`absolute bottom-3 left-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                maxLayer < GRID_MAX_Y
                  ? 'bg-[#1676ed] text-white border-[#1676ed]'
                  : 'bg-white/95 text-[#172951] border-[#dbe7f6] hover:bg-white'
              }`}
            >
              <Icon icon="solar:layers-bold" className="w-5 h-5" />
            </button>

            {/* Bottom-Right Grid Toggle */}
            <button
              type="button"
              onClick={() => setGridVisible((v) => !v)}
              title="Toggle Ground Grid"
              className={`absolute bottom-3 right-3 z-10 w-10 h-10 rounded-full flex items-center justify-center border shadow-xs transition-colors ${
                gridVisible
                  ? 'bg-white/95 text-[#1676ed] border-[#dbe7f6]'
                  : 'bg-white/75 text-slate-400 border-[#dbe7f6]'
              }`}
            >
              <Icon icon="solar:hashtag-bold" className="w-5 h-5" />
            </button>
          </div>

          {/* Floating Bottom Candy Color Palette + Eyedropper + Custom Color Picker */}
          <div className="bg-white rounded-full border border-[#dbe7f6] shadow-xs px-3 sm:px-4 py-2 flex items-center justify-center gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => handleSelectTool('eyedropper')}
              title="Eyedropper (Pick color from any block)"
              aria-label="Eyedropper"
              className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center border transition-all ${
                tool === 'eyedropper'
                  ? 'bg-[#f59e0b] text-white border-[#f59e0b] scale-105'
                  : 'bg-[#f4f8ff] text-[#172951] border-[#dbe7f6] hover:bg-[#e8f2ff]'
              }`}
            >
              <Icon icon="solar:pipette-bold" className="w-4 h-4" />
            </button>

            <div className="w-px h-6 bg-slate-200 shrink-0" />

            {CANDY_PALETTE.map((c) => {
              const selected = activeColor.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveColor(c.hex)}
                  aria-label={c.name}
                  title={c.name}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl shrink-0 transition-transform flex items-center justify-center ${
                    selected ? 'scale-110 ring-2 ring-[#172951] ring-offset-2' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {selected && (
                    <Icon icon="solar:check-read-bold" className="w-4 h-4 text-slate-900 drop-shadow-xs" />
                  )}
                </button>
              );
            })}

            <label
              title="Custom Color"
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full shrink-0 cursor-pointer border-2 border-slate-200 overflow-hidden shadow-xs hover:scale-105 transition-transform"
              style={{
                background:
                  'conic-gradient(#ff4d6d, #ffc300, #22c55e, #38bdf8, #4361ee, #c77dff, #ff4d6d)',
              }}
            >
              <input
                type="color"
                value={activeColor}
                onChange={(e) => setActiveColor(e.target.value)}
                className="opacity-0 w-full h-full cursor-pointer"
                aria-label="Pick custom block color"
              />
            </label>
          </div>
        </div>

        {/* Right Sidebar: Build Together Templates + Quick Actions */}
        {rightOpen ? (
          <aside
            aria-label="Build Together templates"
            className="w-full lg:w-[248px] shrink-0 flex flex-col gap-3 overflow-y-auto max-h-[calc(100vh-170px)]"
          >
            <div className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs sm:text-sm font-black text-[#172951] flex items-center gap-1.5">
                  <Icon icon="solar:gamepad-bold" className="w-4 h-4 text-[#7c3aed]" />
                  <span>Build Together</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {VOXEL_TEMPLATES.map((tpl) => {
                  const isGuiding = activeGuideId === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      className={`rounded-2xl border-2 p-2 flex flex-col items-center text-center transition-all ${
                        isGuiding
                          ? 'border-[#ffc300] bg-amber-50/70 shadow-xs'
                          : 'border-[#eef3fb] bg-[#f9fbff] hover:border-[#cfe0f5]'
                      }`}
                    >
                      {thumbnails[tpl.id] ? (
                        <img
                          src={thumbnails[tpl.id]}
                          alt={`${tpl.name} 3D preview`}
                          className="w-14 h-14 object-contain mb-1"
                        />
                      ) : (
                        <span className="text-2xl mb-1">{tpl.emoji}</span>
                      )}
                      <span className="text-xs font-black text-[#172951] mb-1.5">{tpl.name}</span>
                      <div className="flex gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => handleStartGuide(tpl.id)}
                          className="flex-1 py-1 rounded-lg bg-white hover:bg-[#eef5ff] border border-[#dbe7f6] text-[10px] font-black text-[#1676ed]"
                        >
                          Guide
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLoadFullTemplate(tpl.id)}
                          className="flex-1 py-1 rounded-lg bg-[#172951] hover:bg-slate-800 text-[10px] font-black text-white"
                        >
                          Load
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-3.5 flex flex-col gap-2">
              <span className="text-xs font-black text-[#172951] flex items-center gap-1.5 px-1 mb-0.5">
                <Icon icon="solar:bolt-bold" className="w-4 h-4 text-[#f59e0b]" />
                <span>Quick Actions</span>
              </span>

              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-extrabold text-rose-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Icon icon="solar:trash-bin-minimalistic-bold" className="w-4 h-4" />
                <span>Clear Canvas</span>
              </button>

              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="w-full py-2 px-3 rounded-xl bg-[#f8fbff] hover:bg-[#eef5ff] border border-[#dbe7f6] text-xs font-extrabold text-[#172951] flex items-center justify-center gap-2 transition-colors"
              >
                <Icon icon="solar:upload-minimalistic-bold" className="w-4 h-4 text-[#1676ed]" />
                <span>Import Voxel</span>
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  void handleImportVoxelJson(e.target.files?.[0]);
                  e.target.value = '';
                }}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleExportVoxelJson}
                className="w-full py-2 px-3 rounded-xl bg-[#f8fbff] hover:bg-[#eef5ff] border border-[#dbe7f6] text-xs font-extrabold text-[#172951] flex items-center justify-center gap-2 transition-colors"
              >
                <Icon icon="solar:file-download-bold" className="w-4 h-4 text-[#7c3aed]" />
                <span>Export Voxel</span>
              </button>
            </div>
          </aside>
        ) : (
          <button
            type="button"
            onClick={() => setRightOpen(true)}
            className="self-start px-3 py-2 rounded-2xl bg-white border border-[#dbe7f6] shadow-xs text-xs font-black text-[#172951] flex items-center gap-1.5"
          >
            <Icon icon="solar:gamepad-bold" className="w-4 h-4 text-[#7c3aed]" />
            <span>Templates</span>
          </button>
        )}

      </div>
    </section>
  );
};
