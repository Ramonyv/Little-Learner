import { useState } from 'react';
import { Link } from 'react-router-dom';
import { readWork, saveWork, workKeys } from '../utils/localWork';
import type { Stroke } from '../components/board/InkCanvas';
import { guides } from '../components/board/guides';

export function MyWorkPage() {
  const [, refresh] = useState(0);
  const [message, setMessage] = useState('');
  const drawings = readWork<[string,Stroke[]][]>('ll-drawings',[]);
  const coloring = readWork<[string,{strokes:Stroke[];fills:Record<string,string>}][]>('ll-coloring',[]);
  const items = drawings.filter(([,strokes])=>strokes.length).map(([key])=>{
    if(key.startsWith('WorksheetCustom:')) return {key,title:key.slice(16),url:'/drawing-board?'+new URLSearchParams({mode:'Worksheet',custom:key.slice(16)}),store:'ll-drawings'};
    if(key==='free') return {key,title:'Free drawing',url:'/drawing-board?mode=Free%20Draw',store:'ll-drawings'};
    for(const mode of ['Trace','Worksheet']) for(const category of Object.keys(guides)) {
      const prefix=mode+category;
      if(key.startsWith(prefix)) {
        const index=Number(key.slice(prefix.length));
        return {key,title:mode+' · '+category+' · '+(guides[category][index]?.text || (index+1)),url:'/drawing-board?'+new URLSearchParams({mode,category,index:String(index)}),store:'ll-drawings'};
      }
    }
    return {key,title:key,url:'/drawing-board',store:'ll-drawings'};
  }).concat(coloring.filter(([,sheet])=>sheet.strokes.length || Object.keys(sheet.fills).length).map(([key])=>({key,title:'Coloring · '+key,url:'/drawing-board?mode=Gods&deity='+encodeURIComponent(key),store:'ll-coloring'})));
  function backup() {
    const data=Object.fromEntries(workKeys.map(key=>[key,readWork(key,[])]));
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,data})],{type:'application/json'}));
    const link=document.createElement('a');link.href=url;link.download='little-learner-backup.json';link.click();
    setTimeout(()=>URL.revokeObjectURL(url),10000);
  }
  async function restore(file?:File) {
    if(!file)return;
    try {
      if(file.size>15_000_000)throw new Error();
      const backup=JSON.parse(await file.text());
      if(backup.version!==1 || !backup.data || !workKeys.every(key=>Array.isArray(backup.data[key])))throw new Error();
      for(const key of workKeys) {
        const incoming=backup.data[key];
        if(key!=='ll-results' && !incoming.every((entry:unknown)=>Array.isArray(entry)&&typeof entry[0]==='string'&&entry.length===2))throw new Error();
      }
      const validStrokes = (strokes: unknown): boolean => Array.isArray(strokes) && strokes.every(stroke =>
        stroke && typeof stroke.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(stroke.color) &&
        ['Rainbow','Pen','Monoline','Pencil','Crayon','Fountain Pen','Reed','Watercolor','Brush','Chalk','Marker','Ink','Eraser'].includes(stroke.brush) &&
        Array.isArray(stroke.points) && stroke.points.every((point: {x:number;y:number;pressure:number}) =>
          Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.pressure)));
      if (!backup.data['ll-drawings'].every((entry: [string,unknown]) => validStrokes(entry[1]))) throw new Error();
      if (!backup.data['ll-coloring'].every((entry: [string,any]) => entry[1] && validStrokes(entry[1].strokes) &&
        entry[1].fills && Object.values(entry[1].fills).every(color=>typeof color==='string' && /^#[0-9a-f]{3,8}$/i.test(color)) &&
        Array.isArray(entry[1].undo))) throw new Error();
      if (!backup.data['ll-results'].every((session:any)=>session && typeof session.sessionId==='string' &&
        Array.isArray(session.questions) && session.userAnswers && typeof session.totalQuestions==='number')) throw new Error();
      if(!window.confirm('Restore this backup? Items with matching names will be replaced.'))return;
      for(const key of workKeys) {
        const current=readWork<any[]>(key,[]);
        const incoming=backup.data[key];
        saveWork(key,key==='ll-results' ? [...new Map([...current,...incoming].map(item=>[item.sessionId,item])).values()] : [...new Map([...current,...incoming])]);
      }
      setMessage('Backup restored. Reloading saved work…');
      window.location.reload();
    } catch { setMessage('This file could not be restored. Choose a Little Learner backup.'); }
  }
  return <article className="max-w-5xl mx-auto p-5 sm:p-10">
    <Link className="underline block mb-4" to="/learning-tools">Worksheet builder, printable packs & mistake practice</Link><h1 className="text-3xl font-black mb-3">My Work</h1>
    <p className="text-slate-600 mb-5">Saved on this browser and device. Clearing website data can remove your work. Download a backup to keep a copy or move it to another device.</p>
    <div className="flex flex-wrap gap-4 mb-6">
      <button className="rounded-xl bg-brand-yellow px-4 py-3 font-bold" onClick={backup}>Download backup</button>
      <label className="rounded-xl border px-4 py-3 cursor-pointer font-bold">Restore backup<input className="block text-sm mt-2 max-w-full" type="file" accept=".json,application/json" onChange={event=>restore(event.target.files?.[0])}/></label>
      <Link className="underline p-3" to="/progress">Saved practice results</Link>
    </div>
    <p role="status">{message}</p>
    {!items.length && <p className="py-8">Your drawings and coloring pages will appear here after you draw. <Link className="underline" to="/drawing-board">Open Drawing Board</Link></p>}
    <div className="grid sm:grid-cols-2 gap-4">{items.map(item=><section key={item.store+item.key} className="rounded-2xl border bg-white p-5">
      <h2 className="font-extrabold mb-4">{readWork<Record<string,string>>('ll-work-names',{})[item.key] || item.title}</h2>
      <button className="underline mr-4" onClick={()=>{const name=window.prompt('Drawing name',item.title);if(name?.trim()){saveWork('ll-work-names',{...readWork('ll-work-names',{}),[item.key]:name.trim().slice(0,80)});refresh(value=>value+1)}}}>Rename</button>
      <Link className="text-brand-blue underline mr-5" to={item.url}>Continue drawing</Link>
      <button className="text-red-700 underline" onClick={()=>{if(window.confirm('Delete this saved drawing?')){saveWork(item.store,readWork<[string,unknown][]>(item.store,[]).filter(([key])=>key!==item.key));refresh(value=>value+1)}}}>Delete</button>
    </section>)}</div>
  </article>;
}
