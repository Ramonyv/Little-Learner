import { useRef, useState } from 'react';
import { InkCanvas, Brush, Stroke } from '../components/board/InkCanvas';
import { GodsStudio } from '../components/board/GodsStudio';
import { BoardIcon } from '../components/board/BoardIcon';
import { guides } from '../components/board/guides';
import './drawing-board.css';

const categories = Object.keys(guides);
const brushes: Brush[] = ['Chalk','Marker','Ink','Eraser'];
const palette = [['Blue','#2563eb'],['Pink','#ee376c'],['Green','#15965f'],['Black','#192439'],['White','#fff']];
export function DrawingBoard() {
  const [category,setCategory] = useState(categories[0]), [index,setIndex] = useState(0);
  const [mode,setMode] = useState('Trace');
  const trace = mode === 'Trace';
  const [dark,setDark] = useState(true);
  const [brush,setBrush] = useState<Brush>('Marker'), [color,setColor] = useState('#2563eb');
  const [size,setSize] = useState(1);
  const redo = useRef(new Map<string, Stroke[][]>());
  const history = useRef(new Map<string, Stroke[][]>());
  const drawings = useRef(new Map<string, Stroke[]>());
  const [,refresh] = useState(0);
  const key = trace ? category+index : 'free';
  if (!drawings.current.has(key)) drawings.current.set(key,[]);
  const strokes = drawings.current.get(key)!;
  const back = history.current.get(key) ?? [];
  const forward = redo.current.get(key) ?? [];
  function change(next:Stroke[], undoStack:Stroke[][], redoStack:Stroke[][]) {
    drawings.current.set(key,next);
    history.current.set(key,undoStack);
    redo.current.set(key,redoStack);
    refresh(v=>v+1);
  }
  const guide = guides[category][index];
  function next() {
    if(index+1<guides[category].length) setIndex(index+1);
    else {setCategory(categories[(categories.indexOf(category)+1)%categories.length]);setIndex(0)}
  }
  return <section className="drawing-board">
    <header className="board-heading"><h1><BoardIcon name="Board"/>Drawing Board</h1><div className="board-switch">{['Trace','Free Draw','Gods'].map((name)=><button key={name} aria-pressed={mode===name} onClick={()=>setMode(name)}><span aria-hidden="true">{['〰','✎','🪷'][['Trace','Free Draw','Gods'].indexOf(name)]}</span> {name}</button>)}</div></header>
    <div hidden={mode!=='Gods'}><GodsStudio/></div>
    <div hidden={mode==='Gods'}><div className={'board-layout '+(!trace?'free':'')}>
      {trace && <aside className="guide-list"><h2>Guides</h2>{categories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setIndex(0)}}><BoardIcon name={c}/>{c}</button>)}</aside>}
      <div className="board-frame"><div className="board-top"><div><h2>{trace?guide.title:'Free Draw'}</h2><p>{trace?'Follow the dotted outline.':'Draw anything you like!'}</p></div>{trace && <span className="guide-count">{index+1} of {guides[category].length}</span>}<div className="board-switch">{['Whiteboard','Chalkboard'].map((name,i)=><button key={name} aria-pressed={dark===(i===1)} onClick={()=>{setDark(i===1);if(i===1 || color==='#fff')setColor(i===1?'#fff':'#2563eb')}}>{name}</button>)}</div></div>
      <div className={'board-paper '+(dark?'dark':'')}>
        {trace && <svg aria-hidden="true" viewBox="0 0 800 340" className="board-guide">{guide.path ? <><path d={guide.path} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="6 12" strokeLinecap="round"/>{guide.start && <g transform={'translate('+guide.start.join(' ')+')'}><circle r="8" fill="#50cb72" stroke="#155f38" strokeWidth="2"/><text y="-15" textAnchor="middle" fill={dark?'#adf7bd':'#177446'} fontSize="17" fontWeight="900">Start</text></g>}</> : <text x="400" y="172" dominantBaseline="central" textAnchor="middle" fontSize={guide.text!.length>3?120:175} fontWeight="800" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6">{guide.text}</text>}</svg>}
        <InkCanvas key={key} strokes={strokes} color={color} brush={brush} widthScale={size} onFinish={()=>change(strokes.slice(),[...back,strokes.slice(0,-1)],[])}/>
      </div>
      <div className="board-tools">{brushes.map(b=><button className="tool" key={b} aria-pressed={brush===b} onClick={()=>setBrush(b)}><BoardIcon name={b}/>{b}</button>)}<div className="board-colors">{palette.map(([name,value])=><button key={name} aria-label={name+' colour'} title={name} aria-pressed={color===value} style={{backgroundColor:value}} onClick={()=>{setColor(value);if(brush==='Eraser')setBrush('Marker')}}/>)}</div>
      <div className="board-size" aria-label="Brush size"><span>Size</span>{[.5,1,2].map(n=><button key={n} aria-label={n===1?'Medium':n<1?'Fine':'Wide'} aria-pressed={size===n} onClick={()=>setSize(n)}><i style={{width:6+n*4,height:6+n*4}}/></button>)}</div>
      <button disabled={!back.length} onClick={()=>change(back[back.length-1],back.slice(0,-1),[...forward,strokes])}>↶ Undo</button>
      <button disabled={!forward.length} onClick={()=>change(forward[forward.length-1],[...back,strokes],forward.slice(0,-1))}>↷ Redo</button>
      <button disabled={!strokes.length} onClick={()=>change([], [...back,strokes],[])}>Clear</button>{trace && <button className="board-next" onClick={next}>Next →</button>}</div></div>
    </div></div></section>
}
