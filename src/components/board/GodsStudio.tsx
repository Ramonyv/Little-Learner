import { useRef, useState } from 'react';
import { BoardIcon } from './BoardIcon';
import { Brush, InkCanvas, Stroke } from './InkCanvas';

import { portrait } from './deityPortrait';
const names = ['Ganesha','Krishna','Shiva','Saraswati','Lakshmi','Hanuman','Rama','Vishnu','Durga','Parvati','Kartikeya','Surya'];
type Sheet={fills:Record<string,string>;strokes:Stroke[];undo:(string|undefined)[][]};
export function GodsStudio(){
 const [name,select]=useState('Ganesha'),[tool,setTool]=useState<Brush|'Fill'>('Fill'),[color,paint]=useState('#f2ad32'),[size,resize]=useState(1);
 const [cleared,setCleared]=useState(new Map<string,{sheet:Sheet;at:number}>());
 const sheets=useRef(new Map<string,Sheet>()); const [,update]=useState(0);const redraw=()=>update(v=>v+1);
 if(!sheets.current.has(name))sheets.current.set(name,{fills:{},strokes:[],undo:[]});
 const sheet=sheets.current.get(name)!;
 function fill(id:string){if(tool!=='Fill'||sheet.fills[id]===color)return;sheet.undo.push([id,sheet.fills[id]]);sheet.fills[id]=color;redraw()}
 function region([id,d]:[string,string]){return <path key={id} d={d} fill={sheet.fills[id]||'white'} onClick={()=>fill(id)} role={tool==='Fill'?'button':undefined} aria-label={id} tabIndex={tool==='Fill'?0:undefined} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fill(id)}}}/>}
 function undo(){const saved=cleared.get(name);if(saved && saved.at===sheet.undo.length){sheets.current.set(name,saved.sheet);setCleared(m=>{const next=new Map(m);next.delete(name);return next});return}const action=sheet.undo.pop();if(!action)return;const [id,previous]=action;if(!id)sheet.strokes=sheet.strokes.slice(0,-1);else if(previous)sheet.fills[id]=previous;else delete sheet.fills[id];redraw()}

 return <div className="board-frame"><div className="board-top"><label className="font-black">Colour a deity <select className="rounded-xl border-2 p-2 ml-1" value={name} onChange={e=>select(e.target.value)}>{names.map(n=><option key={n}>{n}</option>)}</select></label><span className="font-bold">{tool==='Fill'?'Tap a shape to colour it':'Draw on the page'}</span></div>
 <div className="board-paper"><svg className="board-guide" viewBox="0 0 200 200" aria-label={name+' colouring page'} stroke="#243451" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
 {portrait(name).map(region)}
 <g fill="none" pointerEvents="none" strokeWidth="2.8">
 <path d="M80 80q4-6 9 0m22 0q5-6 9 0"/>
 {name!=='Ganesha'&&<path d="M95 96q5 5 10 0"/>}
 <path d="M57 163q11 8 22 5m44 1q9 2 18-5"/>
 {name==='Shiva'?<path d="M94 64h12m-12 4h12m-12 4h12"/>:<path d="M100 65v4"/>}
 {name==='Durga'&&<path d="M137 151h1m19 0h1m-13 7q3 4 6 0m-3 3v2"/>}
 {name==='Krishna'&&<path d="M54 109l1 2m5-4 1 2"/>}
 </g>
 </svg><div className="absolute inset-0" style={{pointerEvents:tool==='Fill'?'none':'auto'}}><InkCanvas key={name} brush={tool==='Fill'?'Marker':tool} color={color} widthScale={size} strokes={sheet.strokes} onFinish={()=>{sheet.undo.push([]);redraw()}}/></div></div>
 <div className="board-tools">{(['Fill','Chalk','Marker','Ink','Eraser'] as const).map(t=><button className="tool" key={t} aria-pressed={t===tool} onClick={()=>setTool(t)}>{t==='Fill'?<svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true"><path d="M18 3Q5 18 7 23a11 11 0 0 0 22 0Q31 18 18 3Z" fill={color} stroke="#243451" strokeWidth="2"/></svg>:<BoardIcon name={t}/ >}{t}</button>)}
 <div className="board-colors">{['#f2ad32','#f57343','#de477d','#8557cd','#347bd3','#40a777','#795548'].map(c=><button key={c} aria-label={'Choose '+c} aria-pressed={c===color} style={{backgroundColor:c}} onClick={()=>paint(c)}/>)}</div>
 <label>Colour <input type="color" aria-label="Custom colour" value={color} onChange={e=>paint(e.target.value)}/></label>
 {tool!=='Fill'&&<label>Size <select value={size} onChange={e=>resize(Number(e.target.value))}><option value=".5">Fine</option><option value="1">Medium</option><option value="2">Wide</option></select></label>}
 <button disabled={!sheet.undo.length && !cleared.has(name)} onClick={undo}>↶ Undo</button><button disabled={!sheet.strokes.length && !Object.keys(sheet.fills).length} onClick={()=>{setCleared(m=>new Map(m).set(name,{sheet,at:0}));sheets.current.set(name,{fills:{},strokes:[],undo:[]});redraw()}}>Clear</button></div></div>
}
