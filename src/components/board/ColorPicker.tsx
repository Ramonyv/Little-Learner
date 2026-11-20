import { useRecentColors } from './recentColors';
import {useId, useLayoutEffect, type CSSProperties, useRef, useState, type KeyboardEvent, type PointerEvent} from 'react';
import './color-picker.css';

const palette = [
  ['Red','db4c55'],['Orange','e16b39'],['Amber','f0a644'],['Yellow','f9de56'],
  ['Lime','a3ce41'],['Light green','92df68'],['Green','4b9f5e'],['Teal','67beb4'],
  ['Sky','76c2f4'],['Azure','4f85f4'],['Blue','3461ea'],['Indigo','403dde'],
  ['Violet','5b5aee'],['Lavender','896cf4'],['Purple','8040de'],['Orchid','812ed7'],
  ['Pink','e76cae'],['Rose','e3649e'],['Coral','e97075'],['Ochre','d08546'],
  ['Brown','8b613e'],['Grey','616060'],['Charcoal','2b2b2b'],['White','fefefe'],
].map(([name,hex])=>({name,hex:'#'+hex}));
const clamp = (n:number)=>Math.max(0,Math.min(1,n));
function rgb(hex:string) {
  const digits=hex.slice(1);
  const full=digits.length===3 ? [...digits].map(x=>x+x).join('') : digits;
  return [0,2,4].map(i=>parseInt(full.slice(i,i+2),16));
}
const hexColor=(channels:number[])=>'#'+channels.map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
export function colorShades(hex: string) {
  return [.85,.65,.43,.2,0,-.2,-.48].map(weight=>hexColor(rgb(hex).map(c=>weight>=0?c+(255-c)*weight:c*(1+weight))));
}
function hsv(hex:string) {
  const [r,g,b]=rgb(hex).map(x=>x/255);
  const v=Math.max(r,g,b), delta=v-Math.min(r,g,b);
  const sector=v===r?(g-b)/delta:v===g?2+(b-r)/delta:4+(r-g)/delta;
  return {h:delta?(sector*60+360)%360:0,s:v?delta/v:0,v};
}
function pigment(h:number,s:number,v:number) {
  return [5,3,1].map(n=>{
    const k=(n+h/60)%6;
    return 255*v*(1-s*Math.max(0,Math.min(k,4-k,1)));
  });
}
function nearest(hex:string) {
  const channels=rgb(hex);
  const distance=(color:string)=>rgb(color).reduce((sum,x,i)=>sum+(channels[i]-x)**2,0);
  return palette.reduce((best,p)=>distance(p.hex)<distance(best.hex)?p:best);
}
function diskValues(x:number,y:number) {
  const radius=Math.min(1,Math.hypot(x,y)), edge=Math.max(Math.abs(x),Math.abs(y)) || 1;
  return {s:clamp((1+x*radius/edge)/2),v:clamp((1-y*radius/edge)/2)};
}
function selectPointer(e:PointerEvent<HTMLElement>,pick:(x:number,y:number)=>void) {
  if(e.type==='pointerdown') e.currentTarget.setPointerCapture(e.pointerId);
  else if(!e.currentTarget.hasPointerCapture(e.pointerId)) return;
  const rect=e.currentTarget.getBoundingClientRect();
  pick(2*(e.clientX-rect.left)/rect.width-1,2*(e.clientY-rect.top)/rect.height-1);
}
export function ColorPicker({color,onColor,inline=false}:{inline?:boolean;color:string;onColor:(hex:string)=>void}) {
  const recent = useRecentColors();
  const id=useId();
  const panel=useRef<HTMLDivElement>(null), trigger=useRef<HTMLButtonElement>(null), disk=useRef<HTMLCanvasElement>(null);
  const [opened,setOpened]=useState(false),[wheel,setWheel]=useState(false);
  const [base,setBase]=useState(()=>nearest(color)),[rememberHue,setHue]=useState(()=>hsv(color).h);
  const {h:currentHue,s,v}=hsv(color);
  const h=s&&v?currentHue:rememberHue;
  function apply(hue:number,saturation:number,value:number) {
    const hex=hexColor(pigment(hue,saturation,value));
    setHue(hue);setBase(nearest(hex));onColor(hex);
  }
  useLayoutEffect(()=>{
    const el=panel.current!;
    const sync=()=>setOpened(el.matches(':popover-open'));
    el.addEventListener('toggle',sync);
    return ()=>el.removeEventListener('toggle',sync);
  },[]);
  useLayoutEffect(()=>{
    if(!opened)return;
    const el=panel.current!,button=trigger.current!;
    function position(){
      const rect=button.getBoundingClientRect(), gap=8;
      el.style.left=Math.max(gap,Math.min(innerWidth-el.offsetWidth-gap,rect.left+rect.width/2-el.offsetWidth/2))+'px';
      el.style.top=Math.max(gap,Math.min(innerHeight-el.offsetHeight-gap,rect.top-el.offsetHeight-gap))+'px';
    }
    position();
    const observer=new ResizeObserver(position);observer.observe(el);observer.observe(button);
    window.addEventListener('scroll',position,true);window.addEventListener('resize',position);
    return ()=>{observer.disconnect();window.removeEventListener('scroll',position,true);window.removeEventListener('resize',position)};
  },[opened]);
  useLayoutEffect(()=>{
    const canvas=disk.current;
    if(!canvas)return;
    const ctx=canvas.getContext('2d')!, n=canvas.width, bitmap=ctx.createImageData(n,n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const point=diskValues((2*x+1)/n-1,(2*y+1)/n-1);
      bitmap.data.set([...pigment(h,point.s,point.v),255],4*(y*n+x));
    }
    ctx.putImageData(bitmap,0,0);
  },[h,wheel,opened]);
  function ringPointer(e:PointerEvent<HTMLDivElement>){
    if(e.target!==e.currentTarget)return;
    selectPointer(e,(x,y)=>apply((540-Math.atan2(x,-y)*180/Math.PI)%360,s||1,v||1));
  }
  function diskPointer(e:PointerEvent<HTMLCanvasElement>){
    selectPointer(e,(x,y)=>{const pt=diskValues(x,y);apply(h,pt.s,pt.v)});
  }
  function keys(e:KeyboardEvent,ring:boolean){
    if(!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
    e.preventDefault();
    const step=e.key==='ArrowUp'||e.key==='ArrowRight'?1:-1;
    if(ring)apply((h+step*3+360)%360,s||1,v||1);
    else apply(h,clamp(s+(e.key==='ArrowRight'||e.key==='ArrowLeft'?step*.025:0)),clamp(v+(e.key==='ArrowUp'||e.key==='ArrowDown'?step*.025:0)));
  }
  const angle=(180-h)*Math.PI/180, x=2*s-1,y=1-2*v,ratio=Math.max(Math.abs(x),Math.abs(y))/(Math.hypot(x,y)||1);
  const shades=colorShades(base.hex);
  function swatch(hex:string,label:string,select:()=>void) {
    const chosen=hex.toLowerCase()===color.toLowerCase();
    return <button key={label} type="button" aria-label={label} aria-pressed={chosen} style={{background:hex,color:hsv(hex).v<.7||hsv(hex).s>.5?'white':'#16274a'}} onClick={select}>{chosen?'✓':''}</button>;
  }
  return <>
    {!inline && <button ref={trigger} type="button" className="bottom-color custom-color" style={{"--chosen-colour":color} as CSSProperties} aria-label="Custom drawing colour" aria-haspopup="dialog" aria-expanded={opened} {...{popovertarget:id}} onClick={()=>{if(!opened){setBase(nearest(color));setWheel(false)}}}/>}
    <div id={id} {...(inline ? {} : {popover:"auto"})} role={inline ? "group" : "dialog"} style={{"--chosen-colour":color} as CSSProperties} aria-label="Custom drawing colour" className="ll-picker" ref={panel}>
      <div className="ll-picker-tabs">{['Palette','Wheel'].map((name,i)=><button key={name} aria-label={name} aria-pressed={wheel===Boolean(i)} onClick={()=>setWheel(Boolean(i))}><img alt="" src={'/Bottom%20Toolbar/Colors/'+name+'.svg'}/></button>)}</div>
      {wheel ? <div className="ll-wheel" onPointerDown={ringPointer} onPointerMove={ringPointer} tabIndex={0} role="slider" aria-label="Hue" aria-valuemin={0} aria-valuemax={360} aria-valuenow={Math.round(h)} onKeyDown={e=>{if(e.target===e.currentTarget)keys(e,true)}}>
        <i style={{left:50+41*Math.sin(angle)+'%',top:50-41*Math.cos(angle)+'%',background:hexColor(pigment(h,1,1))}}/>
        <div className="ll-wheel-center"><canvas width={192} height={192} ref={disk} tabIndex={0} aria-label="Shade. Left and right change saturation, up and down change brightness" onKeyDown={e=>keys(e,false)} onPointerDown={diskPointer} onPointerMove={diskPointer}/><i style={{left:50+50*x*ratio+'%',top:50+50*y*ratio+'%',background:color}}/></div>
      </div> : <>
        <div className="ll-picker-current"><b style={{background:color}}/><strong>{nearest(color).name}</strong><code>{hexColor(rgb(color)).toUpperCase()}</code></div>
        <h3>Shades</h3><div className="ll-swatches shades">{shades.map((hex,i)=>swatch(hex,base.name+' shade '+(i+1),()=>onColor(hex)))}</div>
        <h3>All Colors</h3><div className="ll-swatches">{palette.map(p=>swatch(p.hex,p.name,()=>{setBase(p);onColor(p.hex)}))}</div>
        <h3>Custom</h3><input className="ll-hue" style={{"--picked":color} as CSSProperties} type="range" aria-label="Custom hue" min="0" max="359" value={Math.round(h)%360} onChange={e=>apply(+e.target.value,s||1,v||1)}/>
      </>}
      {recent.length > 0 && <>
        <h3>Recently used colours</h3>
        <div className="ll-swatches recent">
          {recent.map(hex => swatch(hex, 'Reuse ' + hex.toUpperCase(), () => {
            setBase(nearest(hex));
            onColor(hex);
          }))}
        </div>
      </>}
    </div>
  </>;
}
