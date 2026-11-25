import { playEffect } from '../../utils/soundEffects';
import { rememberColor } from './recentColors';
import { readWork, saveWork } from '../../utils/localWork';
import { DownloadDrawing } from './DownloadDrawing';
import { BottomToolMenu, drawingBrushes } from './BottomToolMenu';
import { type ReactNode, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BoardIcon } from './BoardIcon';
import { Brush, InkCanvas, Stroke } from './InkCanvas';

import { portrait } from './deityPortrait';
const colours = [['Yellow','#ffc800'],['Orange','#ff911c'],['Pink','#ed519a'],['Blue','#4878ec'],['Green','#32a86c'],['Brown','#795548']] as const;
export const deityNames = ['Ganesha','Krishna','Shiva','Saraswati','Lakshmi','Hanuman','Rama','Vishnu','Durga','Parvati','Kartikeya','Surya'];
const names = deityNames;
const originalImagePages = ['Ganesha','Krishna','Shiva','Hanuman'];
const toolbarIcon = (name:string) => <img src={'/drawing-board%20page%20assets/'+name+'.svg'} alt="" />;
const addedArtwork: Record<string, string | undefined> = { Saraswati: 'Saraswati', Lakshmi: 'Laxmi', Rama: 'Ram', Durga: 'Durga' };
export type Sheet={artwork?: "svg";fills:Record<string,string>;strokes:Stroke[];undo:(string|undefined)[][]};
type Mask = {canvas:HTMLCanvasElement;x:number;y:number};
const extent=1000;
function surface(width=extent,height=width){
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;return canvas;
}

// Label connected interiors on the original outlines, independent of paint colour.
function rasterRegions(image:HTMLImageElement){
 const page=surface(),ctx=page.getContext('2d')!;
 ctx.fillStyle='white';ctx.fillRect(0,0,extent,extent);ctx.drawImage(image,0,0,extent,extent);
 const pixels=ctx.getImageData(0,0,extent,extent).data;
 const labels=new Int32Array(extent*extent);
 const queue=new Int32Array(labels.length);
 const masks=new Map<number,Mask>();
 function regionAt(seed:number){
  if(seed<0||seed>=labels.length||pixels[seed*4]<128)return;
  if(labels[seed])return labels[seed];
  let head=0,tail=1,minX=extent,minY=extent,maxX=0,maxY=0;
  queue[0]=seed;
  const label=seed+1;labels[seed]=label;
  function visit(n:number){if(!labels[n]&&pixels[n*4]>=128){labels[n]=label;queue[tail++]=n}}
  while(head<tail){
   const n=queue[head++],x=n%extent,y=Math.floor(n/extent);
   minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   if(x)visit(n-1);if(x+1<extent)visit(n+1);if(y)visit(n-extent);if(y+1<extent)visit(n+extent);
  }
  const canvas=surface(maxX-minX+1,maxY-minY+1),context=canvas.getContext('2d')!;
  const frame=context.createImageData(canvas.width,canvas.height);
  for(let i=0;i<tail;i++){
   const n=queue[i],offset=(Math.floor(n/extent)-minY)*canvas.width+n%extent-minX;
   frame.data[offset*4+3]=255;
  }
  context.putImageData(frame,0,0);masks.set(label,{canvas,x:minX,y:minY});return label;
 }
 return {page,mask(id:string){
  const match=/^pixel-(\d+)-(\d+)$/.exec(id);
  if(!match)return;
  const label=regionAt(+match[2]*extent + +match[1]);
  return label ? masks.get(label):undefined;
 }};
}
function vectorMask(name:string,id:string){
 const layers=portrait(name),index=layers.findIndex(([key])=>key===id);
 if(index<0)return;
 const canvas=surface(),ctx=canvas.getContext('2d')!;
 ctx.scale(extent/200,extent/200);ctx.fill(new Path2D(layers[index][1]));
 ctx.globalCompositeOperation='destination-out';
 for(const [,path] of layers.slice(index+1))ctx.fill(new Path2D(path));
 return {canvas,x:0,y:0};
}
function DeityCanvas({name,page,fills,onFill}:{name:string;page?:ReturnType<typeof rasterRegions>;fills:Record<string,string>;onFill:(id:string)=>void}){
 const ref=useRef<HTMLCanvasElement>(null);
 useLayoutEffect(()=>{
  const ctx=ref.current!.getContext('2d')!;ctx.clearRect(0,0,extent,extent);if(!page)return;
  ctx.drawImage(page.page,0,0);
  for(const [id,color] of Object.entries(fills)){
   const mask=page.mask(id);if(!mask)continue;
   const tile=surface(mask.canvas.width,mask.canvas.height),t=tile.getContext('2d')!;
   t.drawImage(mask.canvas,0,0);t.globalCompositeOperation='source-in';t.fillStyle=color;t.fillRect(0,0,tile.width,tile.height);
   ctx.drawImage(tile,mask.x,mask.y);
  }
 },[page,fills]);
 return <canvas ref={ref} width={extent} height={extent} className="board-guide" style={{objectFit:'contain'}} aria-label={name+' colouring page'} onClick={e=>{
  const rect=e.currentTarget.getBoundingClientRect(),side=Math.min(rect.width,rect.height);
  const x=Math.floor((e.clientX-rect.left-(rect.width-side)/2)*extent/side),y=Math.floor((e.clientY-rect.top-(rect.height-side)/2)*extent/side);
  if(x>=0&&x<extent&&y>=0&&y<extent){
   const id='pixel-'+x+'-'+y;if(page?.mask(id))onFill(id);
  }
 }}/>;
}
export function GodsStudio({focusControl,rail,settings,modernToolbar=false,locked=false,pageId,deity,onDeityChange}: {focusControl: ReactNode;rail?: ReactNode;settings?:{color:string;brush:Brush|'Fill';size:number;onBrush:(value:Brush|'Fill')=>void;onColor:(value:string)=>void;onSize:(value:number)=>void};modernToolbar?:boolean;locked?:boolean;pageId?:string;deity?:string;onDeityChange?:(name:string)=>void}){
 const [internalName,setInternalName]=useState(() => new URLSearchParams(typeof location!=='undefined'?location.search:'').get('deity') || 'Ganesha'),[internalTool,setInternalTool]=useState<Brush|'Fill'>('Fill'),[internalColor,paint]=useState('#32a86c'),[internalSize,resize]=useState(1);
 const name=deity??internalName,select=onDeityChange??setInternalName,sheetKey=pageId??name;
 const tool=settings?.brush??internalTool,color=settings?.color??internalColor,size=settings?.size??internalSize;
 const setTool=settings?.onBrush??setInternalTool,setColor=settings?.onColor??paint,setSize=settings?.onSize??resize;
 const [toolsOpen,setToolsOpen]=useState(false);
 const redoStack=useRef(new Map<string,Sheet[]>());
 const [cleared,setCleared]=useState(new Map<string,{sheet:Sheet;at:number}>());
 const sheets=useRef(new Map<string,Sheet>(readWork<[string,Sheet][]>('ll-coloring',[]))); const [,update]=useState(0);const redraw=()=>{saveWork('ll-coloring',[...sheets.current]);update(v=>v+1)};
 if(!sheets.current.has(sheetKey))sheets.current.set(sheetKey,{artwork:"svg",fills:{},strokes:[],undo:[]});
 const sheet=sheets.current.get(sheetKey)!;
 const addedImage = addedArtwork[name];
 const hasMarks = sheet.strokes.length > 0 || sheet.undo.length > 0 || Object.keys(sheet.fills).length > 0;
 const useImagePage = originalImagePages.includes(name) || Boolean(addedImage && (sheet.artwork || !hasMarks));
 const imageUrl = '/' + (addedImage ?? name) + '.svg';
 if (addedImage && useImagePage) sheet.artwork = "svg";
 const [art,setArt]=useState<{name:string;page:ReturnType<typeof rasterRegions>}>();
 useEffect(()=>{
  if(!useImagePage)return;
  const image=new Image();image.onload=()=>setArt({name,page:rasterRegions(image)});image.src=imageUrl;
  return ()=>{image.onload=null};
 },[name,useImagePage,imageUrl]);
 const page=art?.name===name?art.page:undefined;
 // Each fill clears only older ink within its visible region. Replay the same
 // masks between strokes after undo, reload or a canvas resize.
 const afterStroke=useMemo(()=>{
  const masks=new Map<number,Mask[]>(),vectors=new Map<string,Mask>();
  let count=0;
  for(const [id] of sheet.undo){
   if(!id){count++;continue}
   if(!count)continue;
   const mask=useImagePage?page?.mask(id):vectors.get(id)??vectorMask(name,id);
   if(!mask)continue;
   if(!useImagePage)vectors.set(id,mask);
   const list=masks.get(count)??[];list.push(mask);masks.set(count,list);
  }
  return (ctx:CanvasRenderingContext2D,index:number,w:number,h:number)=>{
   const list=masks.get(index+1);if(!list)return;
   const side=Math.min(w,h);ctx.save();ctx.translate((w-side)/2,(h-side)/2);ctx.scale(side/extent,side/extent);
   ctx.globalCompositeOperation='destination-out';
   for(const mask of list)ctx.drawImage(mask.canvas,mask.x,mask.y);
   ctx.restore();
  };
 },[sheet.fills,name,page,useImagePage]);
 function fill(id:string){
  if(locked)return;
  if(tool!=='Fill')return;
  // Different taps in one raster region share one fill entry.
  if(page){const mask=page.mask(id);id=Object.keys(sheet.fills).reverse().find(key=>page.mask(key)===mask)??id}
  rememberColor(color);
  redoStack.current.delete(sheetKey);
  sheet.undo.push([id,sheet.fills[id]]);
  sheet.fills={...sheet.fills,[id]:color};redraw();
 }
 function region([id,d]:[string,string]){return <path key={id} d={d} fill={sheet.fills[id]||'white'} onClick={()=>fill(id)} role={tool==='Fill'?'button':undefined} aria-label={id} tabIndex={tool==='Fill'?0:undefined} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fill(id)}}}/>}
 function undo(){if(locked)return;const saved=cleared.get(sheetKey);if(!sheet.undo.length && !saved)return;redoStack.current.set(sheetKey,[...(redoStack.current.get(sheetKey)||[]),structuredClone(sheet)]);if(saved && saved.at===sheet.undo.length){sheets.current.set(sheetKey,saved.sheet);setCleared(m=>{const next=new Map(m);next.delete(sheetKey);return next});redraw();return}const action=sheet.undo.pop();if(!action)return;const [id,previous]=action;if(!id)sheet.strokes=sheet.strokes.slice(0,-1);else {sheet.fills={...sheet.fills};if(previous)sheet.fills[id]=previous;else delete sheet.fills[id]}redraw()}
 function redo(){if(locked)return;const stack=redoStack.current.get(sheetKey)||[];if(!stack.length)return;sheets.current.set(sheetKey,stack[stack.length-1]);redoStack.current.set(sheetKey,stack.slice(0,-1));redraw()}
 function clear(){if(locked||!sheet.strokes.length && !Object.keys(sheet.fills).length)return;redoStack.current.delete(sheetKey);setCleared(m=>new Map(m).set(sheetKey,{sheet,at:0}));sheets.current.set(sheetKey,{artwork:"svg",fills:{},strokes:[],undo:[]});redraw()}

 const actions = <div className="dock-actions"><span className="dock-label"><span aria-hidden="true">↶</span> Actions</span><button aria-label="Undo" disabled={!sheet.undo.length && !cleared.has(sheetKey)} onClick={undo}><BoardIcon name="Undo"/><span>Undo</span></button><button aria-label="Clear" disabled={!sheet.strokes.length && !Object.keys(sheet.fills).length} onClick={clear}><BoardIcon name="Clear"/><span>Clear</span></button></div>;
 const modernActions=<div className="db2-canvas-tools"><button aria-label="Undo" disabled={locked||!sheet.undo.length && !cleared.has(sheetKey)} onClick={undo}>{toolbarIcon('Undo ic')}</button><button aria-label="Redo" disabled={locked||!(redoStack.current.get(sheetKey)||[]).length} onClick={redo}>{toolbarIcon('Redo ic')}</button><button aria-label="Clear" disabled={locked} onClick={clear}>{toolbarIcon('Delete ic')}</button></div>;
 return <div className="board-frame"><div className="board-top"><label className="font-black">Colour a deity <span className="deity-picker"><select value={name} onChange={e=>select(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></span></label><span className="font-bold">{tool==='Fill'?'Tap a shape to colour it':'Draw on the page'}</span>{modernToolbar && focusControl}</div>
 <div className="board-paper">{!modernToolbar && focusControl}<DownloadDrawing/>{modernToolbar?modernActions:<div className="tablet-actions">{actions}</div>}{rail}{useImagePage?<DeityCanvas name={name} page={page} fills={sheet.fills} onFill={fill}/>:<svg className="board-guide" viewBox="0 0 200 200" aria-label={name+' colouring page'} stroke="#243451" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 {portrait(name).map(region)}
 </svg>}<div className="absolute inset-0" style={{pointerEvents:tool==='Fill'||locked?'none':'auto'}}><InkCanvas key={sheetKey} disabled={tool==='Fill'||locked} afterStroke={afterStroke} brush={tool==='Fill'?'Marker':tool} color={color} widthScale={size} strokes={sheet.strokes} onFinish={()=>{redoStack.current.delete(sheetKey);sheet.undo.push([]);redraw()}}/></div>{useImagePage?<img src={imageUrl} alt="" aria-hidden="true" className="board-guide" draggable={false} style={{objectFit:'contain',mixBlendMode:'multiply',pointerEvents:'none'}}/>:<svg className="board-guide" viewBox="0 0 200 200" aria-hidden="true" style={{pointerEvents:'none'}} stroke="#243451" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
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
 <div className="mobile-board-bar"><button aria-expanded={toolsOpen} aria-controls="gods-tools" onClick={()=>setToolsOpen(v=>!v)}><span className="mobile-colour-dot" style={{backgroundColor:color}}/> {tool} tools <span aria-hidden="true">{toolsOpen?'⌄':'⌃'}</span></button><button disabled={!sheet.undo.length && !cleared.has(sheetKey)} onClick={undo}>Undo</button></div>
 <BottomToolMenu brushes={['Fill',...drawingBrushes]} brush={tool} onBrush={value=>{void playEffect("ui-tap");setTool(value)}} colors={colours} color={color} onColor={value=>{void playEffect("ui-tap");setColor(value)}} size={size} onSize={setSize}/>
</div>
}
