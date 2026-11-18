import { useLayoutEffect, useRef } from 'react';

export type Brush = 'Chalk' | 'Marker' | 'Ink' | 'Eraser';
type Point = { x: number; y: number; pressure: number };
export interface Stroke { widthScale?: number; brush: Brush; color: string; points: Point[] }

function segment(ctx: CanvasRenderingContext2D, stroke: Stroke, a: Point, b: Point, w: number, h: number) {
  const {brush,color} = stroke;
  ctx.globalCompositeOperation = brush === 'Eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.globalAlpha = brush === 'Chalk' ? 0.64 : 1;
  ctx.lineWidth = (stroke.widthScale ?? 1) * Math.max(0.65,w/800) * ({Marker:7, Chalk:5, Ink:2 + b.pressure*6, Eraser:28}[brush]);
  ctx.beginPath();
  ctx.moveTo(a.x*w,a.y*h);
  ctx.lineTo(b.x*w+0.01,b.y*h+0.01);
  ctx.stroke();
  if (brush === 'Chalk') {
    ctx.globalAlpha = 0.32;
    ctx.lineWidth = 1;
    for (const offset of [-3,3]) {
      ctx.beginPath(); ctx.moveTo(a.x*w+offset,a.y*h); ctx.lineTo(b.x*w+offset,b.y*h); ctx.stroke();
    }
  }
}

export function InkCanvas({strokes,brush,color,widthScale=1,onFinish}:{strokes:Stroke[];brush:Brush;color:string;widthScale?:number;onFinish:()=>void}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);
  const size = useRef({w:1,h:1});
  useLayoutEffect(() => {
    const canvas = ref.current!;
    function render() {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      if (!w || !h) return;
      const ratio = Math.min(window.devicePixelRatio || 1,2);
      canvas.width = Math.round(w*ratio); canvas.height = Math.round(h*ratio);
      size.current = {w,h};
      const ctx = canvas.getContext('2d')!;
      ctx.scale(canvas.width/w,canvas.height/h);
      for (const stroke of strokes) stroke.points.forEach((p,i) => segment(ctx,stroke,stroke.points[Math.max(0,i-1)],p,w,h));
    }
    render();
    const observer = new ResizeObserver(render); observer.observe(canvas);
    return () => observer.disconnect();
  },[strokes]);
  function draw(event: PointerEvent, stroke: Stroke) {
    const canvas = ref.current!, rect = canvas.getBoundingClientRect(), ctx = canvas.getContext('2d')!;
    const samples = event.getCoalescedEvents?.() || [];
    for (const e of samples.length ? samples : [event]) {
      const point = {x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height,pressure:e.pressure || 0.5};
      segment(ctx,stroke,stroke.points[stroke.points.length-1] || point,point,size.current.w,size.current.h);
      stroke.points.push(point);
    }
  }
  return <canvas ref={ref} aria-label="Drawing surface" style={{position:'absolute',inset:0,width:'100%',height:'100%',touchAction:'none',cursor:'crosshair'}}
    onPointerDown={e=>{if(pointer.current!==null || e.button!==0)return; pointer.current=e.pointerId; e.currentTarget.setPointerCapture(e.pointerId); const stroke:Stroke={brush,color,widthScale,points:[]}; strokes.push(stroke); draw(e.nativeEvent,stroke)}}
    onPointerMove={e=>{if(pointer.current===e.pointerId)draw(e.nativeEvent,strokes[strokes.length-1])}}
    onLostPointerCapture={()=>{pointer.current=null;onFinish()}} />;
}
