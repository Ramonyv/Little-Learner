import { useLayoutEffect, useRef } from 'react';
import { renderStroke, type Brush } from '../components/board/brushEngine';
import { BrushIcon, drawingBrushes } from '../components/board/BottomToolMenu';

const colors: Partial<Record<Brush,string>> = {
  Chalk:'#273457', Pen:'#2184fc', Marker:'#ffc500', Monoline:'#1884fa',
  Crayon:'#ef4169', 'Fountain Pen':'#203396', Watercolor:'#26a7c3',
  Pencil:'#55555d', Brush:'#a73c79', Ink:'#202638', Reed:'#73513a',
};
const points = Array.from({length:81}, (_, i) => {
  const t = i / 80;
  return { x:.09+.82*t, y:.53-.24*Math.sin(2*Math.PI*t-.55), pressure:.45+.35*Math.sin(Math.PI*t), time:i*8 };
});
function Sample({brush}: {brush: Brush}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useLayoutEffect(()=>{
    const canvas = ref.current!;
    function paint() {
      const w = 320, h = 110;
      const scale = canvas.clientWidth/w * Math.min(devicePixelRatio,2);
      canvas.width = Math.round(w*scale);
      canvas.height = Math.round(h*scale);
      const ctx = canvas.getContext('2d')!;
      ctx.scale(canvas.width/w,canvas.height/h);
      renderStroke(ctx,{brush,color:colors[brush] ?? '#2581ee',widthScale:2.4,points},w,h);
    }
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(canvas);
    return ()=>observer.disconnect();
  },[brush]);
  return <canvas ref={ref} aria-label={brush+' sample stroke'} style={{width:'100%',aspectRatio:'320 / 110'}}/>;
}
export default function BrushGallery() {
  return <main style={{padding:'clamp(16px,3vw,48px)',background:'#e7f3ff',minHeight:'100vh'}}>
    <h1 className="mb-5 text-3xl font-black">Brush comparison</h1>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,250px),1fr))',gap:16}}>
      {drawingBrushes.filter(b=>b!=='Eraser').map(brush=><article key={brush} className="rounded-3xl border border-blue-100 bg-white p-4 text-center shadow-sm">
        <div className="mx-auto h-10 w-10 [&_img]:h-full [&_img]:w-full"><BrushIcon brush={brush}/></div>
        <h2 className="text-xl font-black">{brush}</h2><Sample brush={brush}/>
      </article>)}
    </div>
  </main>;
}
