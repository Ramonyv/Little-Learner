import { useLayoutEffect, useRef } from 'react';

export const brushSizes = [
  { scale: 0.5, label: 'Fine' },
  { scale: 1, label: 'Medium' },
  { scale: 2, label: 'Wide' },
  { scale: 3, label: 'Extra wide' },
  { scale: 4, label: 'Jumbo' },
];

export type Brush = 'Rainbow' | 'Pen' | 'Monoline' | 'Pencil' | 'Crayon' | 'Fountain Pen' | 'Reed' | 'Watercolor' | 'Brush' | 'Chalk' | 'Marker' | 'Ink' | 'Eraser';
type Point = { x: number; y: number; pressure: number };
export interface Stroke { widthScale?: number; brush: Brush; color: string; points: Point[] }

const textureCache = new Map<string, HTMLCanvasElement>();
function texture(brush: string, color: string) {
  const key = brush + color;
  const cached = textureCache.get(key);
  if (cached) return cached;
  const stamp = document.createElement('canvas');
  stamp.width = stamp.height = 96;
  const context = stamp.getContext('2d')!;
  context.fillStyle = color;
  for (let grain = 0; grain < 1100; grain++) {
    const seed = Math.sin(grain * 71.9 + 3.7) * 43758.5453;
    const random = seed - Math.floor(seed);
    const angle = grain * 2.39996;
    const spread = Math.sqrt(random) * 45;
    context.globalAlpha = 0.3 + random * 0.35;
    context.beginPath();
    context.ellipse(48 + Math.cos(angle)*spread,48 + Math.sin(angle)*spread,
      0.6 + random*1.3,0.5 + random*0.7,angle,0,Math.PI*2);
    context.fill();
  }
  if (textureCache.size >= 32) textureCache.delete(textureCache.keys().next().value!);
  textureCache.set(key, stamp);
  return stamp;
}

function segment(ctx: CanvasRenderingContext2D, stroke: Stroke, a: Point, b: Point, w: number, h: number, travel = 0) {
  const {brush,color} = stroke;
  ctx.globalCompositeOperation = brush === 'Eraser' ? 'destination-out' : 'source-over';
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  const width = (stroke.widthScale ?? 1) * Math.max(0.65,w/800)
    * ({Rainbow:7, Pen:2+b.pressure*5, Monoline:4, Pencil:2, Crayon:9, 'Fountain Pen':2+b.pressure*10, Reed:8, Watercolor:18, Brush:4 + b.pressure*12, Marker:7, Chalk:7, Ink:2 + b.pressure*6, Eraser:28}[brush]);
  if (brush === 'Rainbow') {
    const distance = Math.hypot((b.x-a.x)*w,(b.y-a.y)*h);
    const steps = Math.max(1,Math.ceil(distance));
    ctx.globalAlpha=1;
    for (let step=0;step<=steps;step++) {
      const t=step/steps;
      ctx.fillStyle=`hsl(${270+(travel+distance*t)*0.65} 95% 48%)`;
      ctx.beginPath();
      ctx.arc((a.x+(b.x-a.x)*t)*w,(a.y+(b.y-a.y)*t)*h,width/2,0,Math.PI*2);
      ctx.fill();
    }
    return;
  }
  if (brush === 'Ink') {
    const scale = (stroke.widthScale ?? 1) * Math.max(0.65,w/800);
    const steps = Math.max(1,Math.ceil(Math.hypot((b.x-a.x)*w,(b.y-a.y)*h)/0.8));
    ctx.fillStyle=color;
    ctx.globalAlpha=1;
    // Interpolate pressure across the segment to avoid abrupt width changes.
    for (let step=0;step<=steps;step++) {
      const t=step/steps;
      const pressure=a.pressure+(b.pressure-a.pressure)*t;
      const radius=scale*(0.45+5*Math.pow(pressure,1.5));
      ctx.beginPath();
      ctx.arc((a.x+(b.x-a.x)*t)*w,(a.y+(b.y-a.y)*t)*h,radius,0,Math.PI*2);
      ctx.fill();
    }
    return;
  }
  ctx.lineWidth = width;
  ctx.globalAlpha = 1;
  const startX = a.x*w, startY = a.y*h;
  const endX = b.x*w, endY = b.y*h;
  const distance = Math.hypot(endX-startX,endY-startY);

  if (brush === 'Chalk' || brush === 'Brush' || brush === 'Crayon' || brush === 'Pencil') {
    const stamp = texture(brush, color);
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, width * 0.14)));
    ctx.globalAlpha = 1;
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const x = startX + (endX-startX)*t;
      const y = startY + (endY-startY)*t;
      ctx.drawImage(stamp, x-width/2, y-width/2, width, width);
    }
    return;
  }
  if (brush === 'Watercolor') {
    const steps = Math.max(1, Math.ceil(distance / Math.max(1, width * 0.12)));
    const coverage = distance === 0 ? 0.35 : distance / steps / width;
    const tint = (opacity: number) => {
      const hex = color.replace('#', '');
      const expanded = hex.length === 3 ? hex.split('').map(value => value + value).join('') : hex;
      return `rgba(${parseInt(expanded.slice(0,2),16)},${parseInt(expanded.slice(2,4),16)},${parseInt(expanded.slice(4,6),16)},${opacity})`;
    };
    ctx.save();
    for (let step = 1; step <= steps; step++) {
      const t = step / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const pressure = a.pressure + (b.pressure - a.pressure) * t;
      const radius = width * (0.45 + pressure * 0.35);
      const wash = ctx.createRadialGradient(x, y, 0, x, y, radius);
      // A pale centre and pigment near the wet edge create a pooled wash.
      wash.addColorStop(0, tint(0.29));
      wash.addColorStop(0.65, tint(0.4));
      wash.addColorStop(0.84, tint(0.5));
      wash.addColorStop(1, tint(0));
      ctx.globalAlpha = coverage;
      ctx.fillStyle = wash;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      // Repeatable pigment deposits keep redraw and undo visually consistent.
      for (let grain = 0; grain < 8; grain++) {
        const seed = Math.sin(x * 12.9898 + y * 78.233 + grain * 31.7) * 43758.5453;
        const random = seed - Math.floor(seed);
        const angle = grain * 2.39996;
        const spread = Math.sqrt(random) * radius * 0.85;
        ctx.globalAlpha = coverage * 0.13;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle) * spread, y + Math.sin(angle) * spread,
          Math.max(0.4, radius * 0.025), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    return;
  }
  if (brush === 'Reed') {
    ctx.lineCap='square';
    ctx.lineWidth=width*(0.3+0.7*Math.abs(Math.sin(Math.atan2(endY-startY,endX-startX)-0.6)));
  }
  ctx.beginPath();
  ctx.moveTo(startX,startY);
  ctx.lineTo(endX+0.01,endY+0.01);
  ctx.stroke();
}

export function InkCanvas({strokes,brush,color,widthScale=1,onFinish}:{strokes:Stroke[];brush:Brush;color:string;widthScale?:number;onFinish:()=>void}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<number | null>(null);
  const travel = useRef(0);
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
      for (const stroke of strokes) {
        let distance = 0;
        stroke.points.forEach((point,index) => {
          const previous = stroke.points[Math.max(0,index-1)];
          segment(ctx,stroke,previous,point,w,h,distance);
          distance += Math.hypot((point.x-previous.x)*w,(point.y-previous.y)*h);
        });
      }
    }
    render();
    const observer = new ResizeObserver(render); observer.observe(canvas);
    return () => observer.disconnect();
  },[strokes]);
  function draw(event: PointerEvent, stroke: Stroke) {
    const canvas = ref.current!, rect = canvas.getBoundingClientRect(), ctx = canvas.getContext('2d')!;
    const samples = event.getCoalescedEvents?.() || [];
    for (const e of samples.length ? samples : [event]) {
      const previous=stroke.points[stroke.points.length-1];
      const rawPressure=e.pointerType==='pen' ? Math.max(0.03,e.pressure) : 0.5;
      const pressure=previous ? previous.pressure*0.65+rawPressure*0.35 : rawPressure;
      const point = {x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height,pressure};
      const start = previous || point;
      segment(ctx,stroke,start,point,size.current.w,size.current.h,travel.current);
      travel.current += Math.hypot((point.x-start.x)*size.current.w,(point.y-start.y)*size.current.h);
      stroke.points.push(point);
    }
  }
  return <canvas ref={ref} aria-label="Drawing surface" style={{position:'absolute',inset:0,width:'100%',height:'100%',touchAction:'none',cursor:'crosshair'}}
    onPointerDown={e=>{if(pointer.current!==null || e.button!==0)return; pointer.current=e.pointerId; travel.current=0; e.currentTarget.setPointerCapture(e.pointerId); const stroke:Stroke={brush,color,widthScale,points:[]}; strokes.push(stroke); draw(e.nativeEvent,stroke)}}
    onPointerMove={e=>{if(pointer.current===e.pointerId)draw(e.nativeEvent,strokes[strokes.length-1])}}
    onLostPointerCapture={()=>{pointer.current=null;onFinish()}} />;
}
