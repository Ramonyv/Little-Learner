import { TracingFeedback } from '../components/board/TracingFeedback';
import { readWork, saveWork } from '../utils/localWork';
import { WorksheetGuide } from '../components/board/WorksheetGuide';
import { DownloadDrawing } from '../components/board/DownloadDrawing';
import { BrushPicker } from '../components/board/BrushPicker';
import { ToolbarTrack } from '../components/board/ToolbarTrack';
import { Link } from 'react-router-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import { brushSizes, InkCanvas, Brush, Stroke } from '../components/board/InkCanvas';
import { GodsStudio } from '../components/board/GodsStudio';
import { BoardIcon } from '../components/board/BoardIcon';
import { guides } from '../components/board/guides';
import './drawing-board.css';

const categories = Object.keys(guides);
const brushes: Brush[] = ['Chalk','Brush','Marker','Ink','Eraser'];
const palette = [['Blue','#2563eb'],['Pink','#ee376c'],['Green','#15965f'],['Black','#192439']];
function TextGuide({ text, size, ruled }: { text: string; size: number; ruled: boolean }) {
  const label = useRef<SVGTextElement>(null);
  const [bounds, setBounds] = useState({ x: 0, y: -80, width: 100, height: 100 });
  useLayoutEffect(() => {
    let active = true;
    function measure() {
      if (!active || !label.current) return;
      const context = document.createElement('canvas').getContext('2d');
      if (!context) return;
      context.font = '800 100px ' + getComputedStyle(label.current).fontFamily;
      const metrics = context.measureText(text);
      setBounds({
        x: -metrics.actualBoundingBoxLeft, y: -metrics.actualBoundingBoxAscent,
        width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
        height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
      });
    }
    measure();
    document.fonts.ready.then(measure);
    return () => { active = false; };
  }, [text]);
  const { x, y, width, height } = bounds;
  const margin = 3;
  return <svg aria-hidden="true" className="board-guide fitted-text"
    viewBox={`${x-margin} ${y-margin} ${width+2*margin} ${height+2*margin}`}>
    <g transform={`translate(${x+width/2} ${y+height/2}) scale(${size/100}) translate(${-x-width/2} ${-y-height/2})`}>
      {ruled && [y, y/2, 0, height+y].map((line,i)=><line key={i} x1={x-margin} x2={x+width+margin} y1={line} y2={line} stroke="currentColor" opacity=".35" vectorEffect="non-scaling-stroke"/>)}
      <text ref={label} fontSize="100" fontWeight="800" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" vectorEffect="non-scaling-stroke">{text}</text>
    </g>
  </svg>;
}
export function DrawingBoard() {
  const [category,setCategory] = useState(() => new URLSearchParams(location.search).get('category') || categories[0]), [index,setIndex] = useState(() => Number(new URLSearchParams(location.search).get('index')) || 0);
  const [mode,setMode] = useState(() => new URLSearchParams(location.search).get('mode') || 'Trace');
  const [toolsOpen,setToolsOpen] = useState(false);
  const [focus,setFocus]=useState(false);
  const custom=new URLSearchParams(location.search).get('custom')?.slice(0,30);
  const worksheet = mode === 'Worksheet';
  const trace = mode === 'Trace' || worksheet;
  const [dark,setDark] = useState(true);
  const [brush,setBrush] = useState<Brush>('Marker'), [color,setColor] = useState('#2563eb');
  const [size,setSize] = useState(1);
  const redo = useRef(new Map<string, Stroke[][]>());
  const history = useRef(new Map<string, Stroke[][]>());
  const [textSize,setTextSize] = useState(() => {
    try {
      const stored = Number(localStorage.getItem('drawing-board-letter-size'));
      return stored >= 20 && stored <= 100 ? stored : 85;
    } catch { return 85; }
  });
  function resizeText(value:number) {
    setTextSize(value);
    try { localStorage.setItem('drawing-board-letter-size',String(value)); } catch { /* Session setting still works. */ }
  }
  const drawings = useRef(new Map<string, Stroke[]>(readWork<[string,Stroke[]][]>('ll-drawings',[])));
  const [,refresh] = useState(0);
  const key = custom && worksheet ? 'WorksheetCustom:'+custom : trace ? mode+category+index : 'free';
  if (!drawings.current.has(key)) drawings.current.set(key,[]);
  const strokes = drawings.current.get(key)!;
  const back = history.current.get(key) ?? [];
  const forward = redo.current.get(key) ?? [];
  function change(next:Stroke[], undoStack:Stroke[][], redoStack:Stroke[][]) {
    drawings.current.set(key,next);
    history.current.set(key,undoStack);
    redo.current.set(key,redoStack);
    saveWork('ll-drawings',[...drawings.current]);
    refresh(v=>v+1);
  }
  const guide = custom && worksheet ? {title:'Trace '+custom,text:custom} : guides[category][index];
  const practised = guides[category].filter((_,i)=>drawings.current.get(mode+category+i)?.some(stroke=>stroke.brush!=="Eraser")).length;
  const wave = trace && category===categories[0] && index===0;
  function next() {
    if(index+1<guides[category].length) setIndex(index+1);
    else {setCategory(categories[(categories.indexOf(category)+1)%categories.length]);setIndex(0)}
  }
  const actions = <div className="dock-actions"><span className="dock-label"><span aria-hidden="true">↶</span> Actions</span><button aria-label="Undo" disabled={!back.length} onClick={()=>change(back[back.length-1],back.slice(0,-1),[...forward,strokes])}><BoardIcon name="Undo"/><span>Undo</span></button>
      <button aria-label="Redo" disabled={!forward.length} onClick={()=>change(forward[forward.length-1],[...back,strokes],forward.slice(0,-1))}><BoardIcon name="Redo"/><span>Redo</span></button>
      <button aria-label="Clear" disabled={!strokes.length} onClick={()=>change([], [...back,strokes],[])}><BoardIcon name="Clear"/><span>Clear</span></button></div>;
  const surface = <div className="board-switch surface-selector">{['Whiteboard','Chalkboard'].map((name,i)=><button key={name} aria-pressed={dark===(i===1)} onClick={()=>{setDark(i===1);if(i===1 || color==='#fff')setColor(i===1?'#fff':'#2563eb')}}>{name}</button>)}</div>;
  return <section className={'drawing-board'+(focus?' focus-mode':'')}>
    <header className="board-heading"><div className="flex items-center gap-3"><Link to="/" aria-label="Little Learner home" className="board-brand"><picture><source media="(min-width:601px) and (max-width:1366px)" srcSet="/SVG%20Icons/Home.svg"/><img src="/Logo.svg" alt="Little Learner"/></picture></Link><details className="board-nav"><summary><BoardIcon name="Board"/>Drawing Board</summary><nav>{[['Home','/'],['My Work','/my-work'],['Learning tools','/learning-tools'],['Practice','/topics/english'],['Drawing Board','/drawing-board'],['Progress','/progress'],['About','/about']].map(([label,path])=><Link key={path} to={path} onClick={e=>e.currentTarget.closest('details')?.removeAttribute('open')}><BoardIcon name={label}/>{label}</Link>)}</nav></details></div><div className="board-switch">{['Trace','Free Draw','Gods','Worksheet'].map((name)=><button key={name} aria-pressed={mode===name} onClick={()=>{setMode(name)}}><BoardIcon name={name === 'Worksheet' ? 'Practice' : name}/> {name}</button>)}</div>{mode!=='Gods' && <div className="tablet-surface">{surface}</div>}<span className="class-chip">Class 1</span></header>
    <div hidden={mode!=='Gods'}><GodsStudio/></div>
    <div hidden={mode==='Gods'}><div className={'board-layout '+(!trace?'free':'')}>
      {trace && <aside className="guide-list"><h2>Practice</h2>{categories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setIndex(0)}}><BoardIcon name={c}/>{c}</button>)}</aside>}
      <div className="board-frame"><div className="board-top">{trace && <span className="exercise-icon"><BoardIcon name={category}/></span>}<div><h2>{trace?guide.title:'Free Draw'}</h2><p>{wave?'Follow the dotted outline to complete the wave.':trace?'Follow the dotted outline.':'Draw anything you like!'}</p></div>{trace && <span className="guide-count">{index+1} of {guides[category].length} {guides[category].length<=6 && guides[category].map((_,i)=><i key={i} className={i===index?'current':''}/>)}</span>}{trace && <span className="star-count" title="Guides practised in this category" aria-label={practised+' guides practised'}>⭐ {practised} / {guides[category].length}</span>}{surface}</div>
      {trace && !worksheet && guide.text && <label className="letter-size-control">{category === 'Numbers' ? 'Number' : category === 'Words' ? 'Word' : 'Letter'} size
        <input type="range" min="20" max="100" value={textSize} onChange={e=>resizeText(Number(e.target.value))} />
        <output>{textSize}%</output>
      </label>}
      <div className={'board-paper '+(!worksheet && dark?'dark':'')}><DownloadDrawing/>{trace && !worksheet && guide.path && <TracingFeedback strokes={strokes}/>}<button className="focus-toggle" onClick={()=>setFocus(value=>!value)}>{focus?'Exit focus':'Focus'}</button>
        <div className="tablet-actions">{trace && <strong className="tablet-count">{index+1} of {guides[category].length}{guides[category].length <= 6 && guides[category].map((_, i) => <i key={i} aria-hidden="true" className={i === index ? "current" : ""}/>)}</strong>}{actions}{trace && <button className="tablet-next" aria-label="Next guide" onClick={next}>
          <svg aria-hidden="true" width="30" height="20" viewBox="0 0 32 20">
            <path fill="currentColor" d="M2 6h18V2a1.5 1.5 0 0 1 2.5-1.1l8 8a1.5 1.5 0 0 1 0 2.2l-8 8A1.5 1.5 0 0 1 20 18v-4H2a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/>
          </svg>
        </button>}</div>
        {wave && !worksheet && <span className="wave-tip">☝ Start at the green dot and trace along the dotted line.</span>}
        {worksheet && <WorksheetGuide guide={guide} category={category}/>}
        {trace && !worksheet && guide.text && <TextGuide text={guide.text} size={textSize} ruled={category==='Letters'}/>}
        {trace && !worksheet && !guide.text && <svg aria-hidden="true" viewBox="0 0 800 340" className="board-guide">{guide.path ? <><path d={guide.path} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="6 12" strokeLinecap="round"/>{wave && <g transform="translate(740 170)"><circle r="8" fill="white" stroke="#579ecc"/><rect x="-26" y="13" width="52" height="20" rx="10" fill="#e0f4ff"/><text y="28" textAnchor="middle" fontWeight="900" fontSize="13" fill="#152747">Finish</text></g>}{guide.start && <g transform={'translate('+guide.start.join(' ')+')'}><circle r="8" fill="#50cb72" stroke="#155f38" strokeWidth="2"/><text y="-15" textAnchor="middle" fill={dark?'#adf7bd':'#177446'} fontSize="17" fontWeight="900">Start</text></g>}</> : <text x="400" y="172" dominantBaseline="central" textAnchor="middle" fontSize={Math.min(300, 900 / guide.text!.length) * textSize / 100} vectorEffect="non-scaling-stroke" fontWeight="800" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6">{guide.text}</text>}</svg>}
        <InkCanvas key={key} strokes={strokes} color={color} brush={brush} widthScale={size} onFinish={()=>change(strokes.slice(),[...back,strokes.slice(0,-1)],[])}/>
      </div>
      <div className="mobile-board-bar"><button aria-expanded={toolsOpen} aria-controls="drawing-tools" onClick={()=>setToolsOpen(v=>!v)}><span className="mobile-colour-dot" style={{backgroundColor:color}}/> {brush} tools <span aria-hidden="true">{toolsOpen?'⌄':'⌃'}</span></button><button aria-label="Undo" disabled={!back.length} onClick={()=>change(back[back.length-1],back.slice(0,-1),[...forward,strokes])}>Undo</button>{trace&&<button className="board-next" onClick={next}>Next →</button>}</div>
      <ToolbarTrack><div id="drawing-tools" className={'board-tools drawing-dock standard-dock'+(toolsOpen?' mobile-expanded':'')} role="group" aria-label="Drawing tools"><div className="dock-brushes"><BrushPicker value={brush} onChange={setBrush}/><span className="dock-label"><span aria-hidden="true">✎</span> Tools</span>{brushes.map(b=><button className="tool" key={b} aria-pressed={brush===b} onClick={()=>setBrush(b)}><BoardIcon name={b}/>{b}</button>)}</div><div className="board-colors"><span className="dock-label"><span aria-hidden="true">🎨</span> Color</span><div className="swatch-tray">{palette.map(([name,value])=><button key={name} aria-label={name+' colour'} title={name} aria-pressed={color===value} style={{backgroundColor:value}} onClick={()=>{setColor(value);if(brush==='Eraser')setBrush('Marker')}}/>)}<label className="spectrum"><input aria-label="Custom drawing colour" type="color" value={color==='#fff'?'#ffffff':color} onChange={e=>{setColor(e.target.value);if(brush==='Eraser')setBrush('Marker')}}/></label></div></div>
      <div className="dock-field"><span className="dock-label"><span aria-hidden="true">〰</span> Brush</span><div className="dock-pill" role="group" aria-label="Brush size">{brushSizes.map(({scale:n,label})=><button key={n} aria-label={label} title={label} aria-pressed={size===n} onClick={()=>setSize(n)}><svg width="28" height="20" viewBox="-4 -3 32 22" aria-hidden="true"><path d="M2 10 Q6 0 12 8 T22 5" fill="none" stroke="currentColor" strokeWidth={1+n*2} strokeLinecap="round"/></svg></button>)}</div></div>
      {actions}{trace && <button className="board-next" onClick={next}>Next →</button>}</div></ToolbarTrack></div>
    </div></div></section>
}
