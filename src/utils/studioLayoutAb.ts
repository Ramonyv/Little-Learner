import { useCallback, useEffect, useState } from 'react';

export type StudioLayoutVariant = 'unified' | 'classic';

export const STUDIO_SYSTEM_ICONS = {
  undo: '/Tools System Icon/Undo.svg',
  redo: '/Tools System Icon/Redo.svg',
  surpriseMe: '/Tools System Icon/Surprise me-ic.svg',
  make3d: '/Tools System Icon/Make it 3D.svg',
  save: '/Tools System Icon/Take a Photo-ic.svg',
  takePhoto: '/Tools System Icon/Take a Photo-ic-1.svg',
  dropdown: '/Tools System Icon/Dropdown-ic.svg',
  ageLittle: '/Tools System Icon/I’m Litttle-ic.svg',
  ageBuilder: '/Tools System Icon/I’ am Builder-ic.svg',
  agePro: '/Tools System Icon/I’ am Pro-ic.svg',
  tortoise: '/Tools System Icon/Tortoise.svg',
  rabbit: '/Tools System Icon/Rabbit.svg',
  mute: '/Tools System Icon/Mute.svg',
  unmute: '/Tools System Icon/Unmute.svg',
  fullscreen: '/Tools System Icon/Full screen-ic.svg',
  toolDraw: '/Tools System Icon/Draw.svg',
  toolErase: '/Tools System Icon/Eraser.svg',
  toolFill: '/Tools System Icon/Fill.svg',
  toolColors: '/Tools System Icon/Color.svg',
  toolStickers: '/Tools System Icon/Sticker.svg',
} as const;

export function getAgeModeIconSrc(mode: 'little' | 'builder' | 'pro'): string {
  if (mode === 'little') return STUDIO_SYSTEM_ICONS.ageLittle;
  if (mode === 'pro') return STUDIO_SYSTEM_ICONS.agePro;
  return STUDIO_SYSTEM_ICONS.ageBuilder;
}

const STORAGE_KEY = 'll-studio-layout-ab';

export function readInitialStudioLayout(): StudioLayoutVariant {
  if (typeof window === 'undefined') return 'unified';
  try {
    const param = new URLSearchParams(window.location.search).get('layout');
    if (param === 'classic' || param === 'unified') return param;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'classic' || saved === 'unified') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'unified';
}

export function useStudioLayoutVariant() {
  const [variant, setVariant] = useState<StudioLayoutVariant>(readInitialStudioLayout);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'classic' || e.newValue === 'unified')) {
        setVariant(e.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggleVariant = useCallback(() => {
    setVariant((prev) => {
      const next: StudioLayoutVariant = prev === 'unified' ? 'classic' : 'unified';
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  return { variant, toggleVariant };
}
