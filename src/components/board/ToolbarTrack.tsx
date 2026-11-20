import { useEffect, useRef, useState, type ReactNode } from 'react';

export function ToolbarTrack({ children }: { children: ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const tools = track?.querySelector<HTMLElement>('#drawing-tools, #gods-tools');
    if (!track || !tools) return;

    const update = () => {
      // Measure the tool groups themselves. Their total width stays the same
      // whether the scroll arrows are currently shown or hidden.
      const style = getComputedStyle(tools);
      const visibleItems = Array.from(tools.children).filter((item) => getComputedStyle(item).display !== 'none');
      const gap = Number.parseFloat(style.columnGap) || 0;
      const padding = (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
      const contentWidth = visibleItems.reduce((width, item) => width + item.getBoundingClientRect().width, 0)
        + Math.max(0, visibleItems.length - 1) * gap + padding;
      setHasOverflow(contentWidth > track.clientWidth + 1);
    };
    const observer = new ResizeObserver(update);
    observer.observe(track);
    update();
    return () => observer.disconnect();
  }, [children]);

  return <div ref={trackRef} className={'toolbar-track'+(hasOverflow ? ' has-overflow' : '')}>
    <button className="track-arrow" aria-label="Scroll tools left" onClick={e=>e.currentTarget.nextElementSibling?.scrollBy({left:-240,behavior:'smooth'})}><img src="/SVG Icons/Next Bttom Menu.svg" alt="" width="36" height="36" draggable={false}/></button>
    {children}
    <button className="track-arrow" aria-label="Scroll tools right" onClick={e=>e.currentTarget.previousElementSibling?.scrollBy({left:240,behavior:'smooth'})}><img src="/SVG Icons/Prev Bttom Menu.svg" alt="" width="36" height="36" draggable={false}/></button>
  </div>;
}
