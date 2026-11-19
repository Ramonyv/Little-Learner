import type { ReactNode } from 'react';

export function ToolbarTrack({ children }: { children: ReactNode }) {
  return <div className="toolbar-track">
    <button className="track-arrow" aria-label="Scroll tools left" onClick={e=>e.currentTarget.nextElementSibling?.scrollBy({left:-240,behavior:'smooth'})}><img src="/SVG Icons/Next Bttom Menu.svg" alt="" width="36" height="36" draggable={false}/></button>
    {children}
    <button className="track-arrow" aria-label="Scroll tools right" onClick={e=>e.currentTarget.previousElementSibling?.scrollBy({left:240,behavior:'smooth'})}><img src="/SVG Icons/Prev Bttom Menu.svg" alt="" width="36" height="36" draggable={false}/></button>
  </div>;
}
