import type { Brush } from './InkCanvas';

const choices: Brush[] = ['Rainbow','Pen','Monoline','Marker','Pencil','Crayon','Fountain Pen','Reed','Watercolor','Chalk','Brush','Ink','Eraser'];

export function BrushPicker({ value, onChange }: { value: string; onChange: (brush: Brush) => void }) {
  return <label className="brush-picker">
    <span>Brush type</span>
    <select value={value === 'Fill' ? '' : value} onChange={event => onChange(event.target.value as Brush)}>
      {value === 'Fill' && <option value="" disabled>Choose a brush</option>}
      {choices.map(brush => <option key={brush}>{brush}</option>)}
    </select>
  </label>;
}
