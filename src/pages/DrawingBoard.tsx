import { Link } from 'react-router-dom';
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
  const [toolsOpen,setToolsOpen] = useState(false);
  const trace = mode === 'Trace';
  const [dark,setDark] = useState(true);
  const [brush,setBrush] = useState<Brush>('Marker'), [color,setColor] = useState('#2563eb');
  const [size,setSize] = useState(1);
  const redo = useRef(new Map<string, Stroke[][]>());
  const history = useRef(new Map<string, Stroke[][]>());
  const [letterSize,setLetterSize] = useState(() => {
    try {
      const stored = Number(localStorage.getItem('drawing-board-letter-size'));
      return stored >= 20 && stored <= 100 ? stored : 85;
    } catch { return 85; }
  });
  function resizeLetters(value:number) {
    setLetterSize(value);
    try { localStorage.setItem('drawing-board-letter-size',String(value)); } catch { /* Session setting still works. */ }
  }
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
  const practised = guides[category].filter((_,i)=>drawings.current.get(category+i)?.some(stroke=>stroke.brush!=="Eraser")).length;
  const wave = trace && category===categories[0] && index===0;
  function next() {
    if(index+1<guides[category].length) setIndex(index+1);
    else {setCategory(categories[(categories.indexOf(category)+1)%categories.length]);setIndex(0)}
  }
  return <section className="drawing-board">
    <header className="board-heading"><div className="flex items-center gap-3"><Link to="/" aria-label="Little Learner home" className="board-brand"><img src="/Logo.svg" alt="Little Learner"/></Link><h1><BoardIcon name="Board"/>Drawing Board</h1></div><div className="board-switch">{['Trace','Free Draw','Gods'].map((name)=><button key={name} aria-pressed={mode===name} onClick={()=>{setMode(name)}}><span aria-hidden="true">{['〰','✎','🪷'][['Trace','Free Draw','Gods'].indexOf(name)]}</span> {name}</button>)}</div><span className="class-chip">Class 1</span></header>
    <div hidden={mode!=='Gods'}><GodsStudio/></div>
    <div hidden={mode==='Gods'}><div className={'board-layout '+(!trace?'free':'')}>
      {trace && <aside className="guide-list"><h2>📖 Practice</h2>{categories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>{setCategory(c);setIndex(0)}}><BoardIcon name={c}/>{c}</button>)}<img className="practice-art" src="/hero-illustration-v2.svg" alt=""/></aside>}
      <div className="board-frame"><div className="board-top">{trace && <span className="exercise-icon"><BoardIcon name={category}/></span>}<div><h2>{trace?guide.title:'Free Draw'}</h2><p>{wave?'Follow the dotted outline to complete the wave.':trace?'Follow the dotted outline.':'Draw anything you like!'}</p></div>{trace && <span className="guide-count">{index+1} of {guides[category].length} {guides[category].length<=6 && guides[category].map((_,i)=><i key={i} className={i===index?'current':''}/>)}</span>}{trace && <span className="star-count" title="Guides practised in this category" aria-label={practised+' guides practised'}>⭐ {practised} / {guides[category].length}</span>}<div className="board-switch surface-selector">{['Whiteboard','Chalkboard'].map((name,i)=><button key={name} aria-pressed={dark===(i===1)} onClick={()=>{setDark(i===1);if(i===1 || color==='#fff')setColor(i===1?'#fff':'#2563eb')}}>{name}</button>)}</div></div>
      {trace && category==='Letters' && <label className="letter-size-control">Letter size
        <input type="range" min="20" max="100" value={letterSize} onChange={e=>resizeLetters(Number(e.target.value))} />
        <output>{letterSize}%</output>
      </label>}
      <div className={'board-paper '+(dark?'dark':'')}>
        {wave && <span className="wave-tip">☝ Start at the green dot and trace along the dotted line.</span>}
        {trace && category==='Letters' && <svg aria-hidden="true" viewBox="0 0 400 400" className="board-guide">
          <g transform={`translate(200 200) scale(${letterSize/100})`}>
            {[-114,-35,100,165].map((y,i)=><line key={y} x1="-182" x2="182" y1={y} y2={y} stroke="currentColor" opacity={i===2?.5:.3} strokeDasharray={i===1?'6 8':undefined} vectorEffect="non-scaling-stroke"/>)}
            <text x="0" y="100" textAnchor="middle" fontSize="294" fontWeight="800" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" vectorEffect="non-scaling-stroke">{guide.text}</text>
          </g>
        </svg>}
        {trace && category!=='Letters' && <svg aria-hidden="true" viewBox="0 0 800 340" className="board-guide">{guide.path ? <><path d={guide.path} fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="6 12" strokeLinecap="round"/>{wave && <g transform="translate(740 170)"><circle r="8" fill="white" stroke="#579ecc"/><rect x="-26" y="13" width="52" height="20" rx="10" fill="#e0f4ff"/><text y="28" textAnchor="middle" fontWeight="900" fontSize="13" fill="#152747">Finish</text></g>}{guide.start && <g transform={'translate('+guide.start.join(' ')+')'}><circle r="8" fill="#50cb72" stroke="#155f38" strokeWidth="2"/><text y="-15" textAnchor="middle" fill={dark?'#adf7bd':'#177446'} fontSize="17" fontWeight="900">Start</text></g>}</> : <text x="400" y="172" dominantBaseline="central" textAnchor="middle" fontSize={guide.text!.length>3?120:175} fontWeight="800" fill="none" stroke="currentColor" strokeWidth="2.5" strokeDasharray="5 6">{guide.text}</text>}</svg>}
        <InkCanvas key={key} strokes={strokes} color={color} brush={brush} widthScale={size} onFinish={()=>change(strokes.slice(),[...back,strokes.slice(0,-1)],[])}/>
      </div>
      <div className="mobile-board-bar"><button aria-expanded={toolsOpen} aria-controls="drawing-tools" onClick={()=>setToolsOpen(v=>!v)}><span className="mobile-colour-dot" style={{backgroundColor:color}}/> {brush} tools <span aria-hidden="true">{toolsOpen?'⌄':'⌃'}</span></button><button disabled={!back.length} onClick={()=>change(back[back.length-1],back.slice(0,-1),[...forward,strokes])}>Undo</button>{trace&&<button className="board-next" onClick={next}>Next →</button>}</div>
      <div id="drawing-tools" className={'board-tools drawing-dock standard-dock'+(toolsOpen?' mobile-expanded':'')} role="group" aria-label="Drawing tools"><div className="dock-brushes"><span className="dock-label"><span aria-hidden="true">✎</span> Tools</span>{brushes.map(b=><button className="tool" key={b} aria-pressed={brush===b} onClick={()=>setBrush(b)}><BoardIcon name={b}/>{b}</button>)}</div><div className="board-colors"><span className="dock-label"><span aria-hidden="true">🎨</span> Colour</span>{palette.map(([name,value])=><button key={name} aria-label={name+' colour'} title={name} aria-pressed={color===value} style={{backgroundColor:value}} onClick={()=>{setColor(value);if(brush==='Eraser')setBrush('Marker')}}/>)}</div>
      <div className="dock-field"><span className="dock-label"><span aria-hidden="true">〰</span> Brush Size</span><div className="dock-pill" role="group" aria-label="Brush size">{[.5,1,2].map(n=><button key={n} aria-label={n===1?'Medium':n<1?'Fine':'Wide'} aria-pressed={size===n} onClick={()=>setSize(n)}><svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true"><path d="M2 10 Q6 0 12 8 T22 5" fill="none" stroke="currentColor" strokeWidth={1+n*2} strokeLinecap="round"/></svg></button>)}</div></div>
      <div className="dock-actions"><span className="dock-label"><span aria-hidden="true">↶</span> Actions</span><button disabled={!back.length} onClick={()=>change(back[back.length-1],back.slice(0,-1),[...forward,strokes])}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m12 4-7 7 7 6M6 11h12a8 8 0 0 1 0 16"/></svg>Undo</button>
      <button disabled={!forward.length} onClick={()=>change(forward[forward.length-1],[...back,strokes],forward.slice(0,-1))}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="m20 4 7 7-7 6m6-6H14a8 8 0 0 0 0 16"/></svg>Redo</button>
      <button disabled={!strokes.length} onClick={()=>change([], [...back,strokes],[])}><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M4 9h24M12 9V5h8v4M8 9l1 18h14l1-18M13 13v10m6-10v10"/></svg>Clear</button></div>{trace && <button className="board-next" onClick={next}>Next →</button>}</div></div>
    </div></div></section>
}
