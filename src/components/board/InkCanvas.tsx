import { rememberColor } from './recentColors';
import { useLayoutEffect, useRef } from 'react';

export const brushSizes = [
  { scale: 0.5, label: 'Fine' },
  { scale: 1, label: 'Medium' },
  { scale: 2, label: 'Wide' },
  { scale: 3, label: 'Extra wide' },
  { scale: 4, label: 'Jumbo' },
];

import { renderStroke, strokeRenderer, type Brush, type Stroke } from './brushEngine';
export type { Brush, Stroke } from './brushEngine';

export function InkCanvas({strokes,brush,color,widthScale=1,onFinish,afterStroke,disabled=false}:{strokes:Stroke[];brush:Brush;color:string;widthScale?:number;onFinish:()=>void;afterStroke?:(ctx:CanvasRenderingContext2D,index:number,w:number,h:number)=>void;disabled?:boolean}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const active = useRef<{id: number; stroke: Stroke; renderer: ReturnType<typeof strokeRenderer>} | null>(null);
  const lastOverlay=useRef(afterStroke);
  const painted = useRef<Stroke[]>([]);
  const size = useRef({w:0,h:0});
  const backing = useRef<HTMLCanvasElement | null>(null);
  function snapshot(canvas: HTMLCanvasElement, brush: Brush) {
    if (!['Pen','Brush','Fountain Pen'].includes(brush)) return;
    const copy = backing.current ?? document.createElement('canvas');
    backing.current = copy;
    copy.width = canvas.width;
    copy.height = canvas.height;
    copy.getContext('2d')!.drawImage(canvas,0,0);
  }
  useLayoutEffect(() => {
    const canvas = ref.current!;
    function render() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const pixels = [Math.round(w * ratio), Math.round(h * ratio)];
      const resized = canvas.width !== pixels[0] || canvas.height !== pixels[1] || size.current.w !== w || size.current.h !== h;
      if (!resized && lastOverlay.current===afterStroke && painted.current.length === strokes.length && strokes.every((s,i) => s === painted.current[i])) return;
      if (resized) {
        canvas.width = pixels[0];
        canvas.height = pixels[1];
      }
      size.current = {w,h};
      const ctx = canvas.getContext('2d')!;
      ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
      ctx.clearRect(0,0,w,h);
      strokes.forEach((stroke,i) => {renderStroke(ctx,stroke,w,h);afterStroke?.(ctx,i,w,h)});
      lastOverlay.current=afterStroke;
      painted.current = strokes.slice();
      if (active.current) {
        const current = active.current;
        snapshot(canvas,current.stroke.brush);
        current.renderer = strokeRenderer(ctx,current.stroke,w,h);
        current.stroke.points.forEach(current.renderer.add);
      }
    }
    render();
    const observer = new ResizeObserver(render);
    observer.observe(canvas);
    return () => observer.disconnect();
  },[strokes,afterStroke]);

  function draw(event: PointerEvent) {
    const current = active.current;
    if (current?.id !== event.pointerId || !current) return;
    const rect = ref.current!.getBoundingClientRect();
    const samples = event.getCoalescedEvents?.() ?? [];
    for (const sample of samples.length ? samples : [event]) {
      const points = current.stroke.points;
      const previous = points[points.length-1];
      const x = (sample.clientX-rect.left)/rect.width, y = (sample.clientY-rect.top)/rect.height;
      if (previous && previous.x === x && previous.y === y) continue;
      const elapsed = Math.max(1,sample.timeStamp-(previous?.time ?? sample.timeStamp));
      const speed = previous ? Math.hypot((x-previous.x)*rect.width,(y-previous.y)*rect.height)/elapsed : 0;
      const raw = sample.pointerType === 'pen' && sample.pressure > 0 ? sample.pressure : Math.max(.22,.82-speed*.11);
      const pressure = previous ? previous.pressure*.55+raw*.45 : raw;
      const point = {x,y,pressure,time:sample.timeStamp};
      points.push(point);
      current.renderer.add(point);
    }
  }

  function finish(id: number) {
    const current = active.current;
    if (!current || current.id !== id) return;
    current.renderer.finish();
    active.current = null;
    strokes.push(current.stroke);
    if (current.stroke.brush !== 'Eraser' && current.stroke.brush !== 'Rainbow') {
      rememberColor(current.stroke.color);
    }
    // The final pass resolves end tapers. Other materials are already complete.
    if (['Pen','Brush','Fountain Pen'].includes(current.stroke.brush)) {
      const ctx = ref.current!.getContext('2d')!;
      const {w,h} = size.current;
      ctx.save();
      ctx.clearRect(0,0,w,h);
      ctx.drawImage(backing.current!,0,0,w,h);
      renderStroke(ctx,current.stroke,w,h);
      ctx.restore();
    }
    painted.current = strokes.slice();
    onFinish();
  }
  return <canvas ref={ref} aria-label="Drawing surface" aria-disabled={disabled} style={{position:'absolute',inset:0,width:'100%',height:'100%',touchAction:'none',cursor:disabled?'not-allowed':'crosshair',pointerEvents:disabled?'none':'auto'}}
    onPointerDown={e=>{
      if(active.current || e.button!==0) return;
      const stroke: Stroke = {brush,color,widthScale,points:[]};
      snapshot(e.currentTarget,brush);
      active.current = {id:e.pointerId,stroke,renderer:strokeRenderer(e.currentTarget.getContext('2d')!,stroke,size.current.w,size.current.h)};
      e.currentTarget.setPointerCapture(e.pointerId);
      draw(e.nativeEvent);
    }}
    onPointerMove={e=>draw(e.nativeEvent)}
    onPointerUp={e=>{draw(e.nativeEvent);finish(e.pointerId)}}
    onLostPointerCapture={e=>finish(e.pointerId)} />;
}
