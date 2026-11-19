import { useEffect, useRef, useState } from 'react';
import type { Stroke } from './InkCanvas';

export function TracingFeedback({ strokes }: { strokes: Stroke[] }) {
  const ref=useRef<HTMLOutputElement>(null);
  const [coverage,setCoverage]=useState<number|null>(null);
  useEffect(()=>{
    const board=ref.current?.closest('.board-paper');
    const guide=board?.querySelector('svg.board-guide');
    const path=guide?.querySelector('path');
    if(!board || !path){setCoverage(null);return;}
    const matrix=path.getScreenCTM();
    if(!matrix)return;
    const bounds=board.getBoundingClientRect();
    const points=strokes.filter(stroke=>stroke.brush!=='Eraser').flatMap(stroke=>stroke.points);
    if(!points.length){setCoverage(0);return;}
    let matched=0;
    const length=path.getTotalLength();
    for(let index=0;index<100;index++){
      const point=path.getPointAtLength(length*index/99);
      const screen=new DOMPoint(point.x,point.y).matrixTransform(matrix);
      if(points.some(mark=>Math.hypot(mark.x*bounds.width-(screen.x-bounds.left),mark.y*bounds.height-(screen.y-bounds.top))<18))matched++;
    }
    setCoverage(matched);
  },[strokes]);
  return <output ref={ref} className="tracing-feedback" aria-live="polite">{coverage===null?'':coverage>=85?'Great tracing! Try the next guide.':coverage>0?coverage+'% of the guide explored':'Follow the dotted guide at your own pace.'}</output>;
}
