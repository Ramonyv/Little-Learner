import type { ReactNode } from 'react';
const art: Record<string,ReactNode> = {
  Chalk:<g transform="rotate(34 20 20)"><rect x="14" y="4" width="12" height="32" rx="4" fill="#fff4d7"/><path d="M16 8h8" stroke="#dbbd91"/></g>,
  Marker:<g transform="rotate(34 20 20)"><path d="M14 11h13v19l-7 7-6-7z" fill="#62aeff"/><rect x="13" y="3" width="15" height="10" rx="4" fill="#2479fb"/><path d="m15 29 5 8 5-8z" fill="#203450"/></g>,
  Ink:<><path d="m12 16-4 7v11q12 5 24 0V23l-4-7z" fill="#8474f5"/><rect x="12" y="8" width="16" height="8" rx="2" fill="#d1caff"/><path d="M14 26q6 4 12 0"/></>,
  Eraser:<g transform="rotate(34 20 20)"><rect x="11" y="3" width="18" height="32" rx="4" fill="#ff9eb8"/><path d="M11 22h18v9q0 4-4 4H15q-4 0-4-4z" fill="#ffe6e7"/></g>,
  'Lines & curves':<path d="M3 24q8-20 17-5t17-5" stroke="#2479fb" strokeWidth="5"/>,
  Shapes:<><path d="m14 16 7-12 7 12z" fill="#ff8ba2"/><rect x="3" y="21" width="14" height="14" rx="2" fill="#69bdff"/><circle cx="29" cy="28" r="7" fill="#ffda42"/></>,
  Pictures:<><path d="M19 35V18m0 13q10 0 14-9-14-2-14 9" fill="#78ca83"/>{[0,72,144,216,288].map(a=><ellipse key={a} transform={'rotate('+a+' 19 15)'} cx="19" cy="8" rx="5" ry="7" fill="#ffa1bb"/>)}<circle cx="19" cy="15" r="5" fill="#ffd329"/></>,
  Board:<><rect x="3" y="5" width="34" height="25" rx="4" fill="#c4e9ff"/><path d="m11 37 3-7m15 7-3-7M9 22q5-13 10-5t11-4"/></>
};
export function BoardIcon({name}:{name:string}) {return <svg aria-hidden="true" viewBox="0 0 40 40" width="36" height="36" fill="none" stroke="#172653" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round">{art[name] || <text x="20" y="29" textAnchor="middle" strokeWidth=".7" fill="#477ce7" fontWeight="900" fontSize="22">{{Letters:'Aa',Numbers:'123',Words:'abc'}[name]}</text>}</svg>}
