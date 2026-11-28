import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { STUDIO_SYSTEM_ICONS } from '../../utils/studioLayoutAb';

export type StudioTabId = 'pixel-art' | 'voxel-studio' | 'draw-animate' | 'drawing';

export const BetaBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <span
    className={`inline-flex items-center justify-center px-[5px] py-[2px] rounded-[5px] border border-[#bc4414] bg-gradient-to-b from-[#ec632c] to-[#e25a23] shadow-[inset_0_-1.7px_1.2px_0_rgba(0,0,0,0.25)] text-[9px] font-extrabold leading-none text-white uppercase tracking-[0.03em] shrink-0 select-none ${className}`}
  >
    Beta
  </span>
);

const STUDIO_TABS: {
  id: StudioTabId;
  label: string;
  menuTitle: string;
  tagline: string;
  to: string;
  iconSrc: string;
  activeBorder: string;
  isBeta?: boolean;
}[] = [
  {
    id: 'voxel-studio',
    label: 'Voxel Studio',
    menuTitle: 'Voxel Studio',
    tagline: 'Build in 3D with blocks',
    to: '/voxel-studio',
    iconSrc: '/Tools and Game Icons/3D Voxel Studio App icon.webp',
    activeBorder: 'border-[#9333ea]',
    isBeta: true,
  },
  {
    id: 'draw-animate',
    label: 'Draw & Animate',
    menuTitle: 'Draw & Animate',
    tagline: 'Draw it. Tap it. Watch it move!',
    to: '/tools/draw-animate',
    iconSrc: '/Tools and Game Icons/Draw and Animate App icon.webp',
    activeBorder: 'border-[#087CF7]',
    isBeta: true,
  },
  {
    id: 'pixel-art',
    label: 'Pixel Art',
    menuTitle: 'Pixel Art Studio',
    tagline: 'Make tiny pictures, one square at a time',
    to: '/tools/pixel-art',
    iconSrc: '/Tools and Game Icons/Pixel Art Studio App icon.webp',
    activeBorder: 'border-[#fb7185]',
    isBeta: true,
  },
  {
    id: 'drawing',
    label: 'Drawing',
    menuTitle: 'Drawing Board',
    tagline: 'Tracing, 13 brushes & coloring',
    to: '/drawing-board',
    iconSrc: '/home/draw-pencil.webp',
    activeBorder: 'border-[#7c3aed]',
  },
];

export const StudioSwitcher: React.FC<{
  active: StudioTabId;
  subtitle?: string;
}> = ({ active, subtitle }) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const current = STUDIO_TABS.find((t) => t.id === active) ?? STUDIO_TABS[0];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative flex items-center gap-3 shrink-0">
      <img
        src={current.iconSrc}
        alt=""
        className="w-[46px] h-[46px] rounded-2xl object-cover shrink-0 shadow-2xs"
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-[18px] sm:text-[20px] leading-[26px] font-black text-[#1b294e] truncate">
            {current.menuTitle}
          </h1>
          {current.isBeta && <BetaBadge />}
        </div>
        <p className="text-[11px] sm:text-[12px] leading-[16px] font-bold text-[#556484] truncate">
          {subtitle ?? current.tagline}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Switch studio"
        title="Switch studio"
        className="w-10 h-10 rounded-full bg-[#f5f8fe] hover:bg-[#eaf1fd] border-2 border-[#dde7f5] flex items-center justify-center text-[#1b294e] shrink-0 transition-colors"
      >
        <img
          src={STUDIO_SYSTEM_ICONS.dropdown}
          alt=""
          className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2.5 z-50 min-w-[300px] bg-white rounded-[24px] border border-[#dde7f5] shadow-xl p-2 space-y-1">
          {STUDIO_TABS.map((tab) => {
            const isCurrent = tab.id === active;
            return (
              <Link
                key={tab.id}
                to={tab.to}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl transition-colors ${
                  isCurrent ? 'bg-[#f0f6ff]' : 'hover:bg-[#f8fbff]'
                }`}
              >
                <img
                  src={tab.iconSrc}
                  alt=""
                  className="w-11 h-11 rounded-2xl object-cover shrink-0 shadow-2xs"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-black text-[#1b294e] leading-tight">
                    <span>{tab.menuTitle}</span>
                    {tab.isBeta && <BetaBadge />}
                  </div>
                  <div className="text-xs font-bold text-[#556484] truncate">
                    {tab.tagline}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const StudioModeTabs: React.FC<{
  active: StudioTabId;
  compact?: boolean;
}> = ({ active, compact = true }) => {
  if (!compact) {
    // Classic layout keeps full labels on all 4 tabs
    return (
      <nav
        aria-label="Create Studio modes"
        className="hidden md:flex items-center gap-1 bg-[#f0f6ff] p-1 rounded-full border border-[#dbe7f6] shrink-0"
      >
        {STUDIO_TABS.map((tab) => {
          const isCurrent = tab.id === active;
          const icon = (
            <img
              src={tab.iconSrc}
              alt=""
              className="w-5 h-5 rounded-md object-cover shrink-0 shadow-2xs"
            />
          );
          if (isCurrent) {
            return (
              <span
                key={tab.id}
                className="px-4 py-1.5 rounded-full bg-[#087CF7] text-white text-xs font-black flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                {icon}
                <span>{tab.label}</span>
              </span>
            );
          }
          return (
            <Link
              key={tab.id}
              to={tab.to}
              className="px-4 py-1.5 rounded-full text-[#172951] hover:bg-white text-xs font-extrabold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {icon}
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav
      aria-label="Create Studio modes"
      className="hidden md:flex items-center gap-1.5 bg-[#f0f6ff] p-1 rounded-full border border-[#dbe7f6] shrink-0"
    >
      {STUDIO_TABS.map((tab) => {
        const isCurrent = tab.id === active;

        if (isCurrent) {
          return (
            <span
              key={tab.id}
              className={`px-3.5 py-1.5 rounded-full bg-white border-2 ${tab.activeBorder} text-[#172951] text-xs font-black flex items-center gap-2 shadow-2xs whitespace-nowrap`}
            >
              <img
                src={tab.iconSrc}
                alt=""
                className="w-5 h-5 rounded-md object-cover shrink-0"
              />
              <span>{tab.label}</span>
            </span>
          );
        }

        return (
          <Link
            key={tab.id}
            to={tab.to}
            aria-label={tab.label}
            className="group relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-white transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087CF7]"
          >
            <img
              src={tab.iconSrc}
              alt=""
              className="w-6 h-6 rounded-lg object-cover shadow-2xs"
            />
            <span
              role="tooltip"
              className="pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 absolute top-full mt-2 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded-lg bg-[#172951] text-white text-[11px] font-black whitespace-nowrap shadow-md z-40"
            >
              <span
                aria-hidden="true"
                className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-[#172951]"
              />
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
};
