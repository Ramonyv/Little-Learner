import type { MoveKind, SceneKind } from '../types';

export interface SampleDoodle {
  id: string;
  label: string;
  move: MoveKind;
  scene: SceneKind;
  svg: string;
}

const wrap = (inner: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">${inner}</svg>`;

export const SAMPLE_DOODLES: SampleDoodle[] = [
  {
    id: 'monster',
    label: 'Friendly Monster',
    move: 'bounce',
    scene: 'meadow',
    svg: wrap(`
      <g stroke-linecap="round" stroke-linejoin="round">
        <path d="M360 320c0-110 85-180 152-180s152 70 152 180l36 270c12 95-45 170-188 170s-200-75-188-170z" fill="#22C55E" stroke="#15803D" stroke-width="26"/>
        <path d="M390 190l-44-76 74 34" fill="#FACC15" stroke="#B45309" stroke-width="20"/>
        <path d="M634 190l44-76-74 34" fill="#FACC15" stroke="#B45309" stroke-width="20"/>
        <ellipse cx="512" cy="590" rx="115" ry="120" fill="#BBF7D0"/>
        <circle cx="445" cy="360" r="56" fill="#FFFFFF" stroke="#111827" stroke-width="18"/>
        <circle cx="579" cy="360" r="56" fill="#FFFFFF" stroke="#111827" stroke-width="18"/>
        <circle cx="455" cy="360" r="24" fill="#111827"/>
        <circle cx="589" cy="360" r="24" fill="#111827"/>
        <path d="M420 475q92 85 184 0" fill="none" stroke="#111827" stroke-width="22"/>
        <path d="M350 740v95M445 755v80M579 755v80M674 740v95" stroke="#15803D" stroke-width="34"/>
      </g>
    `),
  },
  {
    id: 'rocket',
    label: 'Space Rocket',
    move: 'fly',
    scene: 'space',
    svg: wrap(`
      <g stroke-linecap="round" stroke-linejoin="round">
        <path d="M512 130c125 145 145 350 115 520H397c-30-170-10-375 115-520z" fill="#EF4444" stroke="#991B1B" stroke-width="24"/>
        <path d="M397 520l-95 130 95-10zM627 520l95 130-95-10z" fill="#FACC15" stroke="#B45309" stroke-width="22"/>
        <circle cx="512" cy="380" r="78" fill="#38BDF8" stroke="#1E3A8A" stroke-width="22"/>
        <circle cx="490" cy="355" r="22" fill="#E0F2FE"/>
        <path d="M440 660c0 95 72 185 72 185s72-90 72-185z" fill="#F97316" stroke="#EA580C" stroke-width="18"/>
      </g>
    `),
  },
  {
    id: 'fish',
    label: 'Happy Fish',
    move: 'swim',
    scene: 'ocean',
    svg: wrap(`
      <g stroke-linecap="round" stroke-linejoin="round">
        <path d="M260 512L120 355v314z" fill="#F97316" stroke="#9A3412" stroke-width="24"/>
        <ellipse cx="545" cy="512" rx="285" ry="200" fill="#06B6D4" stroke="#0E7490" stroke-width="26"/>
        <path d="M500 315q60-95 130-30l-50 45" fill="#FACC15" stroke="#B45309" stroke-width="20"/>
        <circle cx="700" cy="455" r="44" fill="#FFFFFF" stroke="#111827" stroke-width="16"/>
        <circle cx="712" cy="455" r="18" fill="#111827"/>
        <path d="M675 565q45 38 95 5" fill="none" stroke="#111827" stroke-width="20"/>
        <path d="M445 430q45 82 0 164M530 410q45 102 0 204" fill="none" stroke="#BAE6FD" stroke-width="22"/>
      </g>
    `),
  },
  {
    id: 'butterfly',
    label: 'Butterfly',
    move: 'fly',
    scene: 'meadow',
    svg: wrap(`
      <g stroke-linecap="round" stroke-linejoin="round">
        <path d="M490 480C310 210 135 285 180 460c35 130 200 120 310 20z" fill="#C084FC" stroke="#6B21A8" stroke-width="24"/>
        <path d="M534 480c180-270 355-195 310-20-35 130-200 120-310 20z" fill="#C084FC" stroke="#6B21A8" stroke-width="24"/>
        <path d="M490 545c-150 45-250 185-160 270 85 80 145-65 160-270z" fill="#F472B6" stroke="#9D174D" stroke-width="24"/>
        <path d="M534 545c150 45 250 185 160 270-85 80-145-65-160-270z" fill="#F472B6" stroke="#9D174D" stroke-width="24"/>
        <rect x="480" y="340" width="64" height="390" rx="32" fill="#1E293B"/>
        <path d="M495 340q-45-95-105-95M529 340q45-95 105-95" fill="none" stroke="#1E293B" stroke-width="18"/>
        <circle cx="330" cy="425" r="42" fill="#FACC15"/>
        <circle cx="694" cy="425" r="42" fill="#FACC15"/>
      </g>
    `),
  },
  {
    id: 'cat',
    label: 'Dancing Kitty',
    move: 'dance',
    scene: 'diwali',
    svg: wrap(`
      <g stroke-linecap="round" stroke-linejoin="round">
        <path d="M350 320l-40-140 125 75M674 320l40-140-125 75" fill="#FB923C" stroke="#9A3412" stroke-width="24"/>
        <ellipse cx="512" cy="400" rx="185" ry="155" fill="#FDBA74" stroke="#9A3412" stroke-width="24"/>
        <ellipse cx="512" cy="655" rx="145" ry="175" fill="#FDBA74" stroke="#9A3412" stroke-width="24"/>
        <path d="M650 725c110 10 155-75 115-145" fill="none" stroke="#9A3412" stroke-width="28"/>
        <circle cx="445" cy="380" r="26" fill="#111827"/>
        <circle cx="579" cy="380" r="26" fill="#111827"/>
        <polygon points="512,420 492,445 532,445" fill="#EC4899"/>
        <path d="M472 465q20 25 40 0q20 25 40 0" fill="none" stroke="#111827" stroke-width="16"/>
        <path d="M355 415l-75-15M355 445l-75 15M669 415l75-15M669 445l75 15" stroke="#111827" stroke-width="12"/>
      </g>
    `),
  },
];
