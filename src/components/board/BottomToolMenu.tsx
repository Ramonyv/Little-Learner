import { ColorPicker } from './ColorPicker';
import { useState, useSyncExternalStore, type ReactNode } from 'react';
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
  actions?: ReactNode;
};

export function BottomToolMenu({ brushes, brush, onBrush, colors, color, onColor, size, onSize, actions }: Props) {
  const sidebar = useSyncExternalStore(subscribeLayout, () => desktop.matches);
  const [open, setOpen] = useState<'brush' | 'color' | 'size' | null>(null);
  const [moreBrushes, setMoreBrushes] = useState(false);
  const toggle = (section: 'brush' | 'color' | 'size') => {
    setMoreBrushes(false);
    setOpen(current => current === section ? null : section);
  };
  const primaryBrushes = brushes.filter(value => value === 'Fill' || ['Chalk','Pen','Marker','Rainbow','Monoline','Crayon','Fountain Pen','Watercolor'].includes(value));
  const extraBrushes = brushes.filter(value => !primaryBrushes.includes(value));
  const brushOption = (value: Brush | 'Fill') =>
    <button key={value} type="button" className="bottom-tool-choice" aria-pressed={brush === value} onClick={() => {onBrush(value);setOpen(null);setMoreBrushes(false)}}>
      <BrushIcon brush={value}/>
      <span>{value === 'Fountain Pen' ? 'Fountain' : value === 'Watercolor' ? 'Water' : value}</span>
    </button>;
  const section = (id: 'brush' | 'color' | 'size', title: string, icon: string) =>
    <div className={'bottom-tool-section' + (open === id ? ' expanded' : '')}>
      <button type="button" className="bottom-tool-heading" aria-expanded={open === id} aria-label={title} onClick={() => toggle(id)}>
        <img src={asset + icon} alt="" />
        <span>{title}</span>
        <img className="bottom-tool-arrow" src={asset + (open === id ? 'Expand.svg' : 'Collapse.svg')} alt="" />
      </button>
    </div>;

  const visibleSizes = sidebar ? [...brushSizes, {scale:1.5,label:"Medium wide"}, {scale:3.5,label:"Extra broad"}].sort((a,b)=>a.scale-b.scale) : brushSizes;
  const sizeChoices = visibleSizes.map(({ scale, label }) =>
          <button key={scale} type="button" className="bottom-size" aria-label={label} title={label} aria-pressed={size === scale} onClick={() => onSize(scale)}><svg viewBox="-7 -7 46 36" aria-hidden="true"><path d="M2 10 Q8 1 15 10 T30 8" fill="none" stroke="currentColor" strokeWidth={Math.max(1.5, scale * 2.5)} strokeLinecap="round"/></svg></button>);
  if (sidebar) return <aside className="drawing-tool-sidebar" aria-label="Drawing tools">
    <ColorPicker inline color={color} onColor={onColor}/>
    <section><h3>Brush type</h3><div className="sidebar-brushes">{brushes.filter(b=>b!=='Fill').map(brushOption)}{brushes.includes('Fill') && brushOption('Fill')}</div></section>
    <section><h3>Brush Size</h3><div className="sidebar-sizes">{sizeChoices}</div></section>
  </aside>;

  return <div className="bottom-tool-menu" aria-label="Drawing tools">
    {open && <div className={'bottom-tool-popup ' + open + (moreBrushes ? ' extra' : '')}>
      <div className="bottom-tool-choices">
        {open === 'brush' && <>
          {(moreBrushes ? extraBrushes : primaryBrushes).map(brushOption)}
          {extraBrushes.length > 0 && <button type="button" className="bottom-tool-choice" aria-label={moreBrushes ? 'Previous brushes' : 'More brushes'} onClick={() => setMoreBrushes(value => !value)}>{moreBrushes ? 'Back' : 'More'}</button>}
        </>}
        {open === 'color' && <>
          {colors.map(([label, value]) => <button key={value} type="button" className="bottom-color" aria-label={label + ' colour'} aria-pressed={color === value} style={{ backgroundColor: value }} onClick={() => onColor(value)}>{color === value && <span aria-hidden="true">✓</span>}</button>)}
          <ColorPicker color={color} onColor={onColor}/>
        </>}
        {open === 'size' && sizeChoices}
      </div>
    </div>}
    <div className="bottom-tool-sections">
      {section('brush', 'Brush Types', 'Brush Types/Brush.svg')}
      {section('color', 'Colors', 'Colors/Brush.svg')}
      {section('size', 'Brush Size', 'Brush Size/Brush Size.svg')}
    </div>
    {actions && <div className="bottom-tool-actions">{actions}</div>}
  </div>;
}
