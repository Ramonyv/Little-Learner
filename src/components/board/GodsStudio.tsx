import { readWork, saveWork } from '../../utils/localWork';
import { DownloadDrawing } from './DownloadDrawing';
import { BottomToolMenu, drawingBrushes } from './BottomToolMenu';
import { useEffect, useRef, useState } from 'react';
import { BoardIcon } from './BoardIcon';
import { Brush, InkCanvas, Stroke } from './InkCanvas';

import { portrait } from './deityPortrait';
const colours = [['Yellow','#ffc800'],['Orange','#ff911c'],['Pink','#ed519a'],['Blue','#4878ec'],['Green','#32a86c'],['Brown','#795548']] as const;
const names = ['Ganesha','Krishna','Shiva','Saraswati','Lakshmi','Hanuman','Rama','Vishnu','Durga','Parvati','Kartikeya','Surya'];
const imagePages = ['Ganesha','Krishna','Shiva','Hanuman'];
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
 // Tint only the antialiased edge pixels touching this region. The old
 // square expansion crossed black contours; leaving these pixels untouched
 // produced pale speckles around the fill.
 const edged=new Uint8Array(w*h);
 for(let p=0;p<accepted.length;p++)if(accepted[p]){
  const px=p%w,py=(p/w)|0;
  for(const n of [px>0?p-1:-1,px<w-1?p+1:-1,py>0?p-w:-1,py<h-1?p+w:-1]){
   if(n<0||accepted[n]||edged[n])continue;
   const at=n*4,shade=Math.min(data[at],data[at+1],data[at+2]);
   if(shade<120||shade>254)continue;
   edged[n]=1;
   data[at]=Math.round(rgb[0]*shade/255);
   data[at+1]=Math.round(rgb[1]*shade/255);
   data[at+2]=Math.round(rgb[2]*shade/255);
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
 return <><canvas ref={ref} width={1000} height={1000} className="board-guide" style={{objectFit:'contain'}} aria-label={`${name} colouring page`} onClick={e=>{const rect=e.currentTarget.getBoundingClientRect(),side=Math.min(rect.width,rect.height),left=rect.left+(rect.width-side)/2,top=rect.top+(rect.height-side)/2,x=Math.floor((e.clientX-left)*1000/side),y=Math.floor((e.clientY-top)*1000/side);if(x>=0&&x<1000&&y>=0&&y<1000)onFill(`pixel-${x}-${y}`)}}/></>;
}
export function GodsStudio(){
 const [name,select]=useState(() => new URLSearchParams(location.search).get('deity') || 'Ganesha'),[tool,setTool]=useState<Brush|'Fill'>('Fill'),[color,paint]=useState('#32a86c'),[size,resize]=useState(1);
 const [toolsOpen,setToolsOpen]=useState(false);
 const [cleared,setCleared]=useState(new Map<string,{sheet:Sheet;at:number}>());
 const sheets=useRef(new Map<string,Sheet>(readWork<[string,Sheet][]>('ll-coloring',[]))); const [,update]=useState(0);const redraw=()=>{saveWork('ll-coloring',[...sheets.current]);update(v=>v+1)};
 if(!sheets.current.has(name))sheets.current.set(name,{fills:{},strokes:[],undo:[]});
 const sheet=sheets.current.get(name)!;
 function fill(id:string){if(tool!=='Fill'||sheet.fills[id]===color)return;sheet.undo.push([id,sheet.fills[id]]);sheet.fills[id]=color;redraw()}
 function region([id,d]:[string,string]){return <path key={id} d={d} fill={sheet.fills[id]||'white'} onClick={()=>fill(id)} role={tool==='Fill'?'button':undefined} aria-label={id} tabIndex={tool==='Fill'?0:undefined} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fill(id)}}}/>}
 function undo(){const saved=cleared.get(name);if(saved && saved.at===sheet.undo.length){sheets.current.set(name,saved.sheet);setCleared(m=>{const next=new Map(m);next.delete(name);return next});redraw();return}const action=sheet.undo.pop();if(!action)return;const [id,previous]=action;if(!id)sheet.strokes=sheet.strokes.slice(0,-1);else if(previous)sheet.fills[id]=previous;else delete sheet.fills[id];redraw()}

 const actions = <div className="dock-actions"><span className="dock-label"><span aria-hidden="true">↶</span> Actions</span><button aria-label="Undo" disabled={!sheet.undo.length && !cleared.has(name)} onClick={undo}><BoardIcon name="Undo"/><span>Undo</span></button><button aria-label="Clear" disabled={!sheet.strokes.length && !Object.keys(sheet.fills).length} onClick={()=>{setCleared(m=>new Map(m).set(name,{sheet,at:0}));sheets.current.set(name,{fills:{},strokes:[],undo:[]});redraw()}}><BoardIcon name="Clear"/><span>Clear</span></button></div>;
 return <div className="board-frame"><div className="board-top"><label className="font-black">Colour a deity <span className="deity-picker"><select value={name} onChange={e=>select(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></span></label><span className="font-bold">{tool==='Fill'?'Tap a shape to colour it':'Draw on the page'}</span></div>
 <div className="board-paper"><DownloadDrawing/><div className="tablet-actions">{actions}</div>{imagePages.includes(name)?<DeityCanvas name={name} fills={{...sheet.fills}} onFill={fill}/>:<svg className="board-guide" viewBox="0 0 200 200" aria-label={name+' colouring page'} stroke="#243451" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 {portrait(name).map(region)}
 </svg>}<div className="absolute inset-0" style={{pointerEvents:tool==='Fill'?'none':'auto'}}><InkCanvas key={name} brush={tool==='Fill'?'Marker':tool} color={color} widthScale={size} strokes={sheet.strokes} onFinish={()=>{sheet.undo.push([]);redraw()}}/></div>{imagePages.includes(name)?<img src={`/${name}.svg`} alt="" aria-hidden="true" className="board-guide" draggable={false} style={{objectFit:'contain',mixBlendMode:'multiply',pointerEvents:'none'}}/>:<svg className="board-guide" viewBox="0 0 200 200" aria-hidden="true" style={{pointerEvents:'none'}} stroke="#243451" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
 {portrait(name).map(([id,d])=><path key={id} d={d}/>)}
 <g strokeWidth="2.8">
 <path d="M80 80q4-6 9 0m22 0q5-6 9 0"/>
 {name!=='Ganesha'&&<path d="M95 96q5 5 10 0"/>}
 <path d="M57 163q11 8 22 5m44 1q9 2 18-5"/>
 {name==='Shiva'?<path d="M94 64h12m-12 4h12m-12 4h12"/>:<path d="M100 65v4"/>}
 {name==='Durga'&&<path d="M137 151h1m19 0h1m-13 7q3 4 6 0m-3 3v2"/>}
 {name==='Krishna'&&<path d="M54 109l1 2m5-4 1 2"/>}
 </g>
 </svg>}</div>
 <div className="mobile-board-bar"><button aria-expanded={toolsOpen} aria-controls="gods-tools" onClick={()=>setToolsOpen(v=>!v)}><span className="mobile-colour-dot" style={{backgroundColor:color}}/> {tool} tools <span aria-hidden="true">{toolsOpen?'⌄':'⌃'}</span></button><button disabled={!sheet.undo.length && !cleared.has(name)} onClick={undo}>Undo</button></div>
 <BottomToolMenu brushes={['Fill',...drawingBrushes]} brush={tool} onBrush={value=>setTool(value)} colors={colours} color={color} onColor={paint} size={size} onSize={resize}/>
</div>
}
