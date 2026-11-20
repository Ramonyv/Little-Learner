import { ColorPicker, colorShades } from './ColorPicker';
import { type CSSProperties, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { BoardIcon } from './BoardIcon';
import { brushSizes, type Brush } from './InkCanvas';

const asset = '/Bottom%20Toolbar/';
export const drawingBrushes: Brush[] = ['Chalk', 'Pen', 'Marker', 'Rainbow', 'Monoline', 'Crayon', 'Fountain Pen', 'Watercolor', 'Brush', 'Ink', 'Pencil', 'Reed', 'Eraser'];
const brushIcons: Partial<Record<Brush | 'Fill', string>> = {
  Brush: 'Brush Types/Brush.svg', Chalk: 'Brush Types/Chawk.svg',
  Pen: 'Brush Types/Pen.svg', Marker: 'Brush Types/Marker.svg',
  Rainbow: 'Brush Types/Rainbow.svg', Monoline: 'Brush Types/Monoline.svg',
  Crayon: 'Brush Types/Crayon.svg', 'Fountain Pen': 'Brush Types/Fountain Pain.svg',
  Watercolor: 'Brush Types/Watercolor.svg',
  Pencil: 'Brush Types/Pen.svg', Reed: 'Brush Types/Fountain Pain.svg',
};

export function BrushIcon({brush}: {brush: Brush | 'Fill'}) {
  return brushIcons[brush] ? <img src={asset + brushIcons[brush]} alt=""/> : <BoardIcon name={brush}/>;
}

const desktop = window.matchMedia('(min-width: 1367px) and (pointer: fine)');
function subscribeLayout(update: () => void) {
  desktop.addEventListener('change', update);
  return () => desktop.removeEventListener('change', update);
}

type Props = {
  brushes: readonly (Brush | 'Fill')[];
  brush: Brush | 'Fill';
  onBrush: (value: Brush | 'Fill') => void;
  colors: readonly (readonly [string, string])[];
  color: string;
  onColor: (value: string) => void;
  size: number;
  onSize: (value: number) => void;

};

export function BottomToolMenu({ brushes, brush, onBrush, color, onColor, size, onSize }: Props) {
  const sidebar = useSyncExternalStore(subscribeLayout, () => desktop.matches);
  const rail = useRef<HTMLElement>(null);
  const [railHeight, setRailHeight] = useState(0);
  useLayoutEffect(() => {
    const element = rail.current;
    if (!element) return;
    const measure = () => setRailHeight(element.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [sidebar]);
  const [shadeBase, setShadeBase] = useState(color);
  const shades = colorShades(shadeBase);
  function chooseColor(value: string) {
    setShadeBase(value);
    onColor(value);
  }
  const brushOption = (value: Brush | 'Fill') =>
    <button key={value} type="button" className="bottom-tool-choice" aria-pressed={brush === value} aria-label={value} title={value} onClick={() => onBrush(value)}>
      <BrushIcon brush={value}/>
      <span>{value === 'Fountain Pen' ? 'Fountain' : value === 'Watercolor' ? 'Water' : value}</span>
    </button>;
  const visibleSizes = [...brushSizes, {scale:1.5,label:"Medium wide"}, {scale:3.5,label:"Extra broad"}].sort((a,b)=>a.scale-b.scale);
  const sizeChoices = visibleSizes.map(({ scale, label }) =>
          <button key={scale} type="button" className="bottom-size" aria-label={label} title={label} aria-pressed={size === scale} onClick={() => onSize(scale)}><svg viewBox="-7 -7 46 36" aria-hidden="true"><path d="M2 10 Q8 1 15 10 T30 8" fill="none" stroke="currentColor" strokeWidth={Math.max(1.5, scale * 2.5)} strokeLinecap="round"/></svg></button>);
  if (sidebar) return <aside className="drawing-tool-sidebar" aria-label="Drawing tools">
    <ColorPicker inline color={color} onColor={onColor}/>
    <section><h3>Brush type</h3><div className="sidebar-brushes">{brushes.filter(b=>b!=='Fill').map(brushOption)}{brushes.includes('Fill') && brushOption('Fill')}</div></section>
    <section><h3>Brush Size</h3><div className="sidebar-sizes">{sizeChoices}</div></section>
  </aside>;

  // Allow 56px for group padding, borders and the two gaps between groups.
  const counts = [1 + shades.length, brushes.length, visibleSizes.length];
  const rows = (columns: number) => counts.reduce((sum, count) => sum + Math.ceil(count / columns), 0);
  const cellSize = (columns: number) => Math.floor((railHeight - 56 - (rows(columns) - 3) * 3) / rows(columns));
  const columns = [1, 2, 3].find(count => cellSize(count) >= 28) ?? 3;
  const cell = Math.min(34, Math.max(24, cellSize(columns)));
  return <aside ref={rail} className="drawing-rail" style={{
    '--rail-columns': columns,
    '--rail-cell': cell + 'px',
    width: Math.max(48, columns * cell + (columns - 1) * 3 + 8)
  } as CSSProperties} aria-label="Drawing tools">
    <div className="rail-group" role="group" aria-label="Colors">
      <ColorPicker color={color} onColor={chooseColor}/>
      {shades.map((value, index) => <button key={index} type="button" className="rail-shade"
        style={{backgroundColor: value}} aria-label={`Shade ${index + 1}`} aria-pressed={value.toLowerCase() === color.toLowerCase()}
        onClick={() => onColor(value)}>{value.toLowerCase() === color.toLowerCase() && '✓'}</button>)}
    </div>
    <div className="rail-group" role="group" aria-label="Brush Types">{brushes.map(brushOption)}</div>
    <div className="rail-group" role="group" aria-label="Brush Size">{sizeChoices}</div>
  </aside>;
}
