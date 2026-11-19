import { useEffect, useRef, useState } from 'react';
import { BoardIcon } from './BoardIcon';
import { Brush, InkCanvas, Stroke } from './InkCanvas';

import { portrait } from './deityPortrait';
const colours = [['Yellow','#ffc800'],['Orange','#ff911c'],['Pink','#ed519a'],['Blue','#4878ec'],['Green','#32a86c'],['Brown','#795548']];
const names = ['Ganesha','Krishna','Shiva','Saraswati','Lakshmi','Hanuman','Rama','Vishnu','Durga','Parvati','Kartikeya','Surya'];
type Sheet={fills:Record<string,string>;strokes:Stroke[];undo:(string|undefined)[][]};
function flood(canvas:HTMLCanvasElement,x:number,y:number,color:string){
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;
 const w=canvas.width,h=canvas.height,frame=ctx.getImageData(0,0,w,h),data=frame.data;
 const start=(y*w+x)*4,old=[data[start],data[start+1],data[start+2]];
 if(old.every(v=>v<120))return;
 const rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 if(old.every((v,i)=>Math.abs(v-rgb[i])<10))return;
 const seen=new Uint8Array(w*h),accepted=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
 queue[tail++]=y*w+x;seen[y*w+x]=1;
 while(head<tail){const p=queue[head++],at=p*4;
  if(Math.max(Math.abs(data[at]-old[0]),Math.abs(data[at+1]-old[1]),Math.abs(data[at+2]-old[2]))>45)continue;
  accepted[p]=1;
  data[at]=rgb[0];data[at+1]=rgb[1];data[at+2]=rgb[2];data[at+3]=255;
  const px=p%w,py=(p/w)|0;
  for(const n of [px>0?p-1:-1,px<w-1?p+1:-1,py>0?p-w:-1,py<h-1?p+w:-1])if(n>=0&&!seen[n]){seen[n]=1;queue[tail++]=n}
 }
 // Cover antialiased white pixels under the 10 px SVG outline. The vector
 // artwork above the canvas supplies the final, sharp black edge.
 for(let p=0;p<accepted.length;p++)if(accepted[p]){
  const px=p%w,py=(p/w)|0;
  for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){
   const nx=px+dx,ny=py+dy;if(nx<0||ny<0||nx>=w||ny>=h)continue;
   const at=(ny*w+nx)*4;
   data[at]=rgb[0];data[at+1]=rgb[1];data[at+2]=rgb[2];data[at+3]=255;
  }
 }
 ctx.putImageData(frame,0,0);
}
function DeityCanvas({name,fills,onFill}:{name:string;fills:Record<string,string>;onFill:(id:string)=>void}){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  const image=new Image();image.onload=()=>{ctx.clearRect(0,0,1000,1000);ctx.drawImage(image,0,0,1000,1000);Object.entries(fills).forEach(([id,color])=>{const match=/^pixel-(\d+)-(\d+)$/.exec(id);if(match)flood(canvas,+match[1],+match[2],color)})};
  image.src=`/${name}.svg`;
 },[name,fills]);
 return <><canvas ref={ref} width={1000} height={1000} className="board-guide" style={{objectFit:'contain'}} aria-label={`${name} colouring page`} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect(),side=Math.min(rect.width,rect.height),left=rect.left+(rect.width-side)/2,top=rect.top+(rect.height-side)/2,x=Math.floor((e.clientX-left)*1000/side),y=Math.floor((e.clientY-top)*1000/side);if(x>=0&&x<1000&&y>=0&&y<1000)onFill(`pixel-${x}-${y}`)}}/><img src={`/${name}.svg`} alt="" aria-hidden="true" className="board-guide" draggable={false} style={{objectFit:'contain',mixBlendMode:'multiply',pointerEvents:'none'}}/></>;
}
export function GodsStudio(){
 const [name,select]=useState('Ganesha'),[tool,setTool]=useState<Brush|'Fill'>('Fill'),[color,paint]=useState('#32a86c'),[size,resize]=useState(1);
 const [toolsOpen,setToolsOpen]=useState(false);
 const [cleared,setCleared]=useState(new Map<string,{sheet:Sheet;at:number}>());
 const sheets=useRef(new Map<string,Sheet>()); const [,update]=useState(0);const redraw=()=>update(v=>v+1);
 if(!sheets.current.has(name))sheets.current.set(name,{fills:{},strokes:[],undo:[]});
 const sheet=sheets.current.get(name)!;
 function fill(id:string){if(tool!=='Fill'||sheet.fills[id]===color)return;sheet.undo.push([id,sheet.fills[id]]);sheet.fills[id]=color;redraw()}
 function region([id,d]:[string,string]){return <path key={id} d={d} fill={sheet.fills[id]||'white'} onClick={()=>fill(id)} role={tool==='Fill'?'button':undefined} aria-label={id} tabIndex={tool==='Fill'?0:undefined} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fill(id)}}}/>}
 function undo(){const saved=cleared.get(name);if(saved && saved.at===sheet.undo.length){sheets.current.set(name,saved.sheet);setCleared(m=>{const next=new Map(m);next.delete(name);return next});return}const action=sheet.undo.pop();if(!action)return;const [id,previous]=action;if(!id)sheet.strokes=sheet.strokes.slice(0,-1);else if(previous)sheet.fills[id]=previous;else delete sheet.fills[id];redraw()}

 return <div className="board-frame"><div className="board-top"><label className="font-black">Colour a deity <select className="rounded-xl border-2 p-2 ml-1" value={name} onChange={e=>select(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></label><span className="font-bold">{tool==='Fill'?'Tap a shape to colour it':'Draw on the page'}</span></div>
 <div className="board-paper">{(name==='Ganesha'||name==='Krishna')?<DeityCanvas name={name} fills={{...sheet.fills}} onFill={fill}/>:<svg className="board-guide" viewBox="0 0 200 200" aria-label={name+' colouring page'} stroke="#243451" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 {portrait(name).map(region)}
 <g fill="none" pointerEvents="none" strokeWidth="2.8">
 <path d="M80 80q4-6 9 0m22 0q5-6 9 0"/>
 {name!=='Ganesha'&&<path d="M95 96q5 5 10 0"/>}
 <path d="M57 163q11 8 22 5m44 1q9 2 18-5"/>
 {name==='Shiva'?<path d="M94 64h12m-12 4h12m-12 4h12"/>:<path d="M100 65v4"/>}
 {name==='Durga'&&<path d="M137 151h1m19 0h1m-13 7q3 4 6 0m-3 3v2"/>}
 {name==='Krishna'&&<path d="M54 109l1 2m5-4 1 2"/>}
 </g>
 </svg>}<div className="absolute inset-0" style={{pointerEvents:tool==='Fill'?'none':'auto'}}><InkCanvas key={name} brush={tool==='Fill'?'Marker':tool} color={color} widthScale={size} strokes={sheet.strokes} onFinish={()=>{sheet.undo.push([]);redraw()}}/></div></div>
 <div className="mobile-board-bar"><button aria-expanded={toolsOpen} aria-controls="gods-tools" onClick={()=>setToolsOpen(v=>!v)}><span className="mobile-colour-dot" style={{backgroundColor:color}}/> {tool} tools <span aria-hidden="true">{toolsOpen?'⌄':'⌃'}</span></button><button disabled={!sheet.undo.length && !cleared.has(name)} onClick={undo}>Undo</button></div>
 <div id="gods-tools" className={'board-tools drawing-dock standard-dock gods-dock'+(toolsOpen?' mobile-expanded':'')} role="group" aria-label="Colouring tools"><div className="dock-brushes"><span className="dock-label"><span aria-hidden="true">✎</span> Tools</span>{(['Fill','Chalk','Marker','Ink','Eraser'] as const).map(t=><button className="tool" key={t} aria-pressed={t===tool} onClick={()=>setTool(t)}>{t==='Fill'?<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3Q5 18 7 23a11 11 0 0 0 22 0Q31 18 18 3Z" fill={color} stroke="#243451" strokeWidth="2"/></svg>:<BoardIcon name={t}/ >}{t}</button>)}
 </div><div className="board-colors"><span className="dock-label"><span aria-hidden="true">🎨</span> Colour</span>{colours.map(([label,c])=><button key={c} aria-label={label+' colour'} title={label} aria-pressed={c===color} style={{backgroundColor:c}} onClick={()=>paint(c)}/>)}<label className="custom-colour" title="Choose custom colour" aria-label="Choose custom colour" style={{backgroundColor:color}}><input type="color" aria-label="Choose custom colour" value={color} onChange={e=>paint(e.target.value)}/></label></div>
 <div className="dock-field"><span className="dock-label"><span aria-hidden="true">〰</span> Brush Size</span><div className="dock-pill" role="group" aria-label="Brush size">{[.5,1,2].map(n=><button key={n} aria-label={n===1?'Medium':n<1?'Fine':'Wide'} aria-pressed={size===n} onClick={()=>resize(n)}><svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true"><path d="M2 10 Q6 0 12 8 T22 5" fill="none" stroke="currentColor" strokeWidth={1+n*2} strokeLinecap="round"/></svg></button>)}</div></div>
 <div className="dock-actions"><span className="dock-label"><span aria-hidden="true">↶</span> Actions</span><button disabled={!sheet.undo.length && !cleared.has(name)} onClick={undo}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m12 4-7 7 7 6M6 11h12a8 8 0 0 1 0 16"/></svg>Undo</button><button disabled={!sheet.strokes.length && !Object.keys(sheet.fills).length} onClick={()=>{setCleared(m=>new Map(m).set(name,{sheet,at:0}));sheets.current.set(name,{fills:{},strokes:[],undo:[]});redraw()}}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 9h24M12 9V5h8v4M8 9l1 18h14l1-18M13 13v10m6-10v10"/></svg>Clear</button></div></div></div>
}
