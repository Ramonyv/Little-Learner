export interface StickerItem {
  id: string;
  label: string;
  svg: string;
}

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">${inner}</svg>`;

export const BUNDLED_STICKERS: StickerItem[] = [
  {
    id: 'star',
    label: 'Star',
    svg: wrap(
      '<path d="M64 10l15.8 32 35.3 5.1-25.5 24.9 6 35.2L64 90.6 32.4 107.2l6-35.2L12.9 47.1 48.2 42z" fill="#FACC15" stroke="#B45309" stroke-width="6" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'heart',
    label: 'Heart',
    svg: wrap(
      '<path d="M64 108S18 78 18 46a24 24 0 0 1 46-9.5A24 24 0 0 1 110 46c0 32-46 62-46 62z" fill="#EF4444" stroke="#991B1B" stroke-width="6" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'flower',
    label: 'Flower',
    svg: wrap(
      '<circle cx="64" cy="28" r="18" fill="#F472B6" stroke="#9D174D" stroke-width="5"/><circle cx="98" cy="54" r="18" fill="#F472B6" stroke="#9D174D" stroke-width="5"/><circle cx="85" cy="94" r="18" fill="#F472B6" stroke="#9D174D" stroke-width="5"/><circle cx="43" cy="94" r="18" fill="#F472B6" stroke="#9D174D" stroke-width="5"/><circle cx="30" cy="54" r="18" fill="#F472B6" stroke="#9D174D" stroke-width="5"/><circle cx="64" cy="64" r="19" fill="#FACC15" stroke="#B45309" stroke-width="5"/>',
    ),
  },
  {
    id: 'sun',
    label: 'Sun',
    svg: wrap(
      '<g stroke="#F59E0B" stroke-width="8" stroke-linecap="round"><line x1="64" y1="8" x2="64" y2="22"/><line x1="64" y1="106" x2="64" y2="120"/><line x1="8" y1="64" x2="22" y2="64"/><line x1="106" y1="64" x2="120" y2="64"/><line x1="24" y1="24" x2="34" y2="34"/><line x1="94" y1="94" x2="104" y2="104"/><line x1="104" y1="24" x2="94" y2="34"/><line x1="34" y1="94" x2="24" y2="104"/></g><circle cx="64" cy="64" r="30" fill="#FDE047" stroke="#D97706" stroke-width="6"/>',
    ),
  },
  {
    id: 'cloud',
    label: 'Cloud',
    svg: wrap(
      '<path d="M34 94h62a20 20 0 0 0 4-39.6A28 28 0 0 0 46 42a22 22 0 0 0-12 52z" fill="#E0F2FE" stroke="#0284C7" stroke-width="6" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'rainbow',
    label: 'Rainbow',
    svg: wrap(
      '<path d="M16 92a48 48 0 0 1 96 0" fill="none" stroke="#EF4444" stroke-width="10" stroke-linecap="round"/><path d="M26 92a38 38 0 0 1 76 0" fill="none" stroke="#FACC15" stroke-width="10" stroke-linecap="round"/><path d="M36 92a28 28 0 0 1 56 0" fill="none" stroke="#22C55E" stroke-width="10" stroke-linecap="round"/><path d="M46 92a18 18 0 0 1 36 0" fill="none" stroke="#087CF7" stroke-width="10" stroke-linecap="round"/>',
    ),
  },
  {
    id: 'eyes-googly',
    label: 'Googly Eyes',
    svg: wrap(
      '<circle cx="42" cy="64" r="24" fill="#FFF" stroke="#111827" stroke-width="6"/><circle cx="86" cy="64" r="24" fill="#FFF" stroke="#111827" stroke-width="6"/><circle cx="48" cy="64" r="10" fill="#111827"/><circle cx="92" cy="64" r="10" fill="#111827"/><circle cx="51" cy="60" r="3.5" fill="#FFF"/><circle cx="95" cy="60" r="3.5" fill="#FFF"/>',
    ),
  },
  {
    id: 'eyes-happy',
    label: 'Happy Eyes',
    svg: wrap(
      '<path d="M22 70q18-24 36 0" fill="none" stroke="#111827" stroke-width="8" stroke-linecap="round"/><path d="M70 70q18-24 36 0" fill="none" stroke="#111827" stroke-width="8" stroke-linecap="round"/>',
    ),
  },
  {
    id: 'eyes-wink',
    label: 'Wink Eyes',
    svg: wrap(
      '<circle cx="42" cy="62" r="20" fill="#FFF" stroke="#111827" stroke-width="6"/><circle cx="45" cy="62" r="9" fill="#111827"/><circle cx="48" cy="58" r="3" fill="#FFF"/><path d="M72 64q16-16 34 0" fill="none" stroke="#111827" stroke-width="8" stroke-linecap="round"/>',
    ),
  },
  {
    id: 'mouth-smile',
    label: 'Big Smile',
    svg: wrap(
      '<path d="M24 46q40 54 80 0z" fill="#EF4444" stroke="#111827" stroke-width="6" stroke-linejoin="round"/><path d="M40 74q24 14 48 0" fill="#FB7185"/>',
    ),
  },
  {
    id: 'mouth-silly',
    label: 'Silly Tongue',
    svg: wrap(
      '<path d="M24 52q40 28 80 0" fill="none" stroke="#111827" stroke-width="8" stroke-linecap="round"/><path d="M52 66v16a12 12 0 0 0 24 0V66z" fill="#FB7185" stroke="#111827" stroke-width="5"/>',
    ),
  },
  {
    id: 'mouth-wow',
    label: 'Wow Mouth',
    svg: wrap(
      '<ellipse cx="64" cy="64" rx="22" ry="28" fill="#EF4444" stroke="#111827" stroke-width="6"/>',
    ),
  },
  {
    id: 'wings-fairy',
    label: 'Fairy Wings',
    svg: wrap(
      '<path d="M60 66C36 22 10 26 14 54c3 18 24 20 46 12z" fill="#C084FC" fill-opacity="0.85" stroke="#6B21A8" stroke-width="5"/><path d="M68 66c24-44 50-40 46-12-3 18-24 20-46 12z" fill="#C084FC" fill-opacity="0.85" stroke="#6B21A8" stroke-width="5"/><path d="M60 72c-22 6-38 24-26 36 10 10 22-8 26-36z" fill="#F472B6" fill-opacity="0.85" stroke="#9D174D" stroke-width="5"/><path d="M68 72c22 6 38 24 26 36-10 10-22-8-26-36z" fill="#F472B6" fill-opacity="0.85" stroke="#9D174D" stroke-width="5"/>',
    ),
  },
  {
    id: 'wings-dragon',
    label: 'Dragon Wings',
    svg: wrap(
      '<path d="M60 72L14 28l8 34-12 18 26-4 8 18 16-22z" fill="#F97316" stroke="#9A3412" stroke-width="5" stroke-linejoin="round"/><path d="M68 72l46-44-8 34 12 18-26-4-8 18-16-22z" fill="#F97316" stroke="#9A3412" stroke-width="5" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'tail',
    label: 'Fluffy Tail',
    svg: wrap(
      '<path d="M22 92c14-44 52-58 76-46 14 8 12 28-4 32-18 5-32-10-42 14z" fill="#FB923C" stroke="#9A3412" stroke-width="6" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'hat-party',
    label: 'Party Hat',
    svg: wrap(
      '<polygon points="64,20 26,104 102,104" fill="#38BDF8" stroke="#0369A1" stroke-width="6" stroke-linejoin="round"/><circle cx="64" cy="18" r="10" fill="#FACC15" stroke="#B45309" stroke-width="4"/><line x1="42" y1="70" x2="86" y2="70" stroke="#F472B6" stroke-width="7"/>',
    ),
  },
  {
    id: 'hat-wizard',
    label: 'Wizard Hat',
    svg: wrap(
      '<path d="M64 16l24 68H40z" fill="#4F46E5" stroke="#1E1B4B" stroke-width="6" stroke-linejoin="round"/><ellipse cx="64" cy="88" rx="48" ry="12" fill="#4F46E5" stroke="#1E1B4B" stroke-width="6"/><polygon points="64,40 68,50 78,50 70,56 73,66 64,60 55,66 58,56 50,50 60,50" fill="#FACC15"/>',
    ),
  },
  {
    id: 'crown',
    label: 'Crown',
    svg: wrap(
      '<path d="M18 96L12 42l28 24 24-36 24 36 28-24-6 54z" fill="#FACC15" stroke="#B45309" stroke-width="6" stroke-linejoin="round"/><circle cx="64" cy="72" r="7" fill="#EF4444"/><circle cx="38" cy="76" r="6" fill="#087CF7"/><circle cx="90" cy="76" r="6" fill="#22C55E"/>',
    ),
  },
  {
    id: 'bow',
    label: 'Bow',
    svg: wrap(
      '<path d="M58 64L20 38v52z" fill="#EC4899" stroke="#9D174D" stroke-width="6" stroke-linejoin="round"/><path d="M70 64l38-26v52z" fill="#EC4899" stroke="#9D174D" stroke-width="6" stroke-linejoin="round"/><circle cx="64" cy="64" r="12" fill="#F472B6" stroke="#9D174D" stroke-width="5"/>',
    ),
  },
  {
    id: 'glasses',
    label: 'Cool Shades',
    svg: wrap(
      '<rect x="14" y="44" width="42" height="32" rx="10" fill="#111827" stroke="#087CF7" stroke-width="5"/><rect x="72" y="44" width="42" height="32" rx="10" fill="#111827" stroke="#087CF7" stroke-width="5"/><line x1="56" y1="56" x2="72" y2="56" stroke="#087CF7" stroke-width="6"/>',
    ),
  },
  {
    id: 'music',
    label: 'Music Note',
    svg: wrap(
      '<path d="M52 92V30l44-10v60" fill="none" stroke="#7C3AED" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="40" cy="94" r="14" fill="#A855F7" stroke="#5B21B6" stroke-width="5"/><circle cx="84" cy="82" r="14" fill="#A855F7" stroke="#5B21B6" stroke-width="5"/>',
    ),
  },
  {
    id: 'lightning',
    label: 'Spark Bolt',
    svg: wrap(
      '<polygon points="72,12 28,70 60,70 50,116 100,56 68,56" fill="#FDE047" stroke="#CA8A04" stroke-width="6" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'blush',
    label: 'Rosy Cheeks',
    svg: wrap(
      '<ellipse cx="32" cy="64" rx="18" ry="11" fill="#FB7185" fill-opacity="0.8"/><ellipse cx="96" cy="64" rx="18" ry="11" fill="#FB7185" fill-opacity="0.8"/>',
    ),
  },
  {
    id: 'paw',
    label: 'Paw Print',
    svg: wrap(
      '<ellipse cx="64" cy="82" rx="24" ry="20" fill="#B45309"/><circle cx="34" cy="52" r="10" fill="#B45309"/><circle cx="54" cy="36" r="10" fill="#B45309"/><circle cx="76" cy="36" r="10" fill="#B45309"/><circle cx="94" cy="52" r="10" fill="#B45309"/>',
    ),
  },
];

const stickerImageCache = new Map<string, HTMLImageElement>();

export function getStickerImage(sticker: StickerItem): Promise<HTMLImageElement> {
  const cached = stickerImageCache.get(sticker.id);
  if (cached && cached.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      stickerImageCache.set(sticker.id, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error('Sticker decode failed'));
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(sticker.svg)}`;
  });
}
