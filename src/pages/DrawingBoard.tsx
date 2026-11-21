import { playEffect } from '../utils/soundEffects';
import { TracingFeedback } from '../components/board/TracingFeedback';
import { readWork, saveWork } from '../utils/localWork';
import { WorksheetGuide } from '../components/board/WorksheetGuide';
import { DownloadDrawing } from '../components/board/DownloadDrawing';
import { BottomToolMenu, drawingBrushes } from '../components/board/BottomToolMenu';
import { useLayoutEffect, useRef, useState } from 'react';
import { InkCanvas, Brush, Stroke } from '../components/board/InkCanvas';
import { GodsStudio } from '../components/board/GodsStudio';
import { BoardIcon } from '../components/board/BoardIcon';
import { guides } from '../components/board/guides';
import './drawing-board.css';

const categories = Object.keys(guides);
const palette = [['Blue','#2563eb'],['Pink','#ee376c'],['Green','#15965f'],['Black','#192439']] as const;
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
  const surface = <div className="board-switch surface-selector">{['Whiteboard','Chalkboard'].map((name,i)=><button key={name} aria-pressed={dark===(i===1)} onClick={()=>{setDark(i===1);if(i===1 || color==='#fff')setColor(i===1?'#fff':'#2563eb')}} aria-label={name} title={name}><BoardIcon name={name}/></button>)}</div>;
  const focusControl = <button type="button" className="focus-toggle" onClick={()=>setFocus(value=>!value)}>{focus?'Exit focus':'Focus'}</button>;
  return <section className={'drawing-board'+(focus?' focus-mode':'')}>
    <header className="board-heading"><h1 className="board-page-title"><BoardIcon name="Board"/>Drawing Board</h1><div className="board-switch">{['Trace','Free Draw','Gods','Worksheet'].map((name)=><button key={name} aria-pressed={mode===name} onClick={()=>{setMode(name)}}><BoardIcon name={name === 'Worksheet' ? 'Practice' : name}/> {name}</button>)}</div>{mode!=='Gods' && <div className="tablet-surface">{surface}</div>}<span className="class-chip">Class 1</span></header>
    <div hidden={mode!=='Gods'}><GodsStudio focusControl={focusControl}/></div>
    <div hidden={mode==='Gods'}><div className={'board-layout '+(!trace?'free':'')}>
      {trace && <aside className="guide-list"><h2>Practice</h2>{categories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setIndex(0)}}><BoardIcon name={c}/>{c}</button>)}</aside>}
      <div className="board-frame"><div className="board-top"><span className="exercise-icon"><BoardIcon name={trace ? "Trace" : "Free Draw"}/></span><div><h2>{trace?guide.title:'Free Draw'}</h2><p>{wave?'Follow the dotted outline to complete the wave.':trace?'Follow the dotted outline.':'Draw anything you like!'}</p></div>{trace && <span className="guide-count">{index+1} of {guides[category].length} {guides[category].length<=6 && guides[category].map((_,i)=><i key={i} className={i===index?'current':''}/>)}</span>}{trace && <span className="star-count" title="Guides practised in this category" aria-label={practised+' guides practised'}>⭐ {practised} / {guides[category].length}</span>}{surface}</div>
      {trace && !worksheet && guide.text && <label className="letter-size-control">{category === 'Numbers' ? 'Number' : category === 'Words' ? 'Word' : 'Letter'} size
        <input type="range" min="20" max="100" value={textSize} onChange={e=>resizeText(Number(e.target.value))} />
        <output>{textSize}%</output>
      </label>}
      <div className={'board-paper '+(!worksheet && dark?'dark':'')}><DownloadDrawing/>{trace && !worksheet && guide.path && <TracingFeedback strokes={strokes}/>}{focusControl}
        <div className="tablet-actions">{actions}{trace && <button className="tablet-next" aria-label="Next guide" onClick={next}>
          <img src="/SVG%20Icons/Next%20Guide.svg" width="30" height="20" alt="" />
        </button>}</div>
        {wave && !worksheet && <span className="wave-tip">☝ Start at the green dot and trace along the dotted line.</span>}
        {worksheet && <WorksheetGuide guide={guide} category={category}/>}
        {trace && !worksheet && guide.text && <TextGuide text={guide.text} size={textSize} ruled={category==='Letters'}/>}
        {trace && !worksheet && !guide.text && <svg aria-hidden="true" viewBox="0 0 800 340" className="board-guide">{guide.path ? <><path d={guide.path} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="6 12" strokeLinecap="round"/>{wave && <g transform="translate(740 170)"><circle r="8" fill="white" stroke="#579ecc"/><rect x="-26" y="13" width="52" height="20" rx="10" fill="#e0f4ff"/><text y="28" textAnchor="middle" fontWeight="900" fontSize="13" fill="#152747">Finish</text></g>}{guide.start && <g transform={'translate('+guide.start.join(' ')+')'}><circle r="8" fill="#50cb72" stroke="#155f38" strokeWidth="2"/><text y="-15" textAnchor="middle" fill={dark?'#adf7bd':'#177446'} fontSize="17" fontWeight="900">Start</text></g>}</> : <text x="400" y="172" dominantBaseline="central" textAnchor="middle" fontSize={Math.min(300, 900 / guide.text!.length) * textSize / 100} vectorEffect="non-scaling-stroke" fontWeight="800" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6">{guide.text}</text>}</svg>}
        <InkCanvas key={key} strokes={strokes} color={color} brush={brush} widthScale={size} onFinish={()=>change(strokes.slice(),[...back,strokes.slice(0,-1)],[])}/>
      </div>
      <BottomToolMenu brushes={drawingBrushes} brush={brush} onBrush={value=>{void playEffect("ui-tap");setBrush(value as Brush)}} colors={palette} color={color} onColor={value=>{void playEffect("ui-tap");setColor(value);if(brush==='Eraser')setBrush('Marker')}} size={size} onSize={setSize}/>
</div>
    </div></div></section>
}
