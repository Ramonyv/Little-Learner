import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { InkCanvas, type Brush, type Stroke } from '../components/board/InkCanvas';
import { renderStroke } from '../components/board/brushEngine';
import { WorksheetGuide } from '../components/board/WorksheetGuide';
import { SingleTraceGuide } from '../components/board/SingleTraceGuide';
import { GodsStudio, deityNames, type Sheet } from '../components/board/GodsStudio';
import { DownloadDrawing } from '../components/board/DownloadDrawing';
import { guides, type Guide } from '../components/board/guides';
import { useRecentColors } from '../components/board/recentColors';
import { readWork, saveWork } from '../utils/localWork';
import './drawing-board.css';
import './drawing-board-v2.css';

const root = '/drawing-board%20page%20assets/';
const icon = (name: string, className = '') => <img className={className} src={root + name + '.svg'} alt="" />;
const modes = [['Trace','Image'],['Free Draw','Image-1'],['Gods','Image-2'],['Worksheet','Image-3']] as const;
const categoryNames = ['Letters','Numbers','Words','Shapes','Pictures','Lines & curves'] as const;
const categoryIcons: Record<string,string> = {Letters:'Letters',Numbers:'Numbers',Words:'Words',Shapes:'Shapes',Pictures:'Pictures','Lines & curves':'Lines & Curve'};
const writeTools: [Brush,string][] = [['Pencil','Pencil'],['Pen','Pen'],['Fountain Pen','Fountain Pain'],['Monoline','Monoline'],['Chalk','Chawk'],['Reed','Reed']];
const paintTools: [Brush,string][] = [['Marker','Marker'],['Crayon','Crayon'],['Ink','Ink'],['Brush','Brush'],['Watercolor','Brush-1'],['Eraser','Eraser'],['Rainbow','Rainbow']];
const godPaintTools: [Brush|'Fill',string][] = [['Fill','Color & Paint-Fill'],...paintTools];
const pickerLabel = (item:Guide) => item.text || item.title.replace(/^Trace (?:the )?/i,'');
const colors = ['#e04754','#e96d3b','#f5a439','#f4de52','#9bc941','#8cd866','#4aa166','#72bced','#4a83ed','#355fea','#403ee5','#6057ec','#8b61ea','#e365ad','#d88746','#8b6444','#8230d7','#666666','#303030','#ffffff'];
function colorHue(hex:string){
  if(hex.startsWith('hsl('))return Number(hex.match(/hsl\((\d+)/)?.[1]||0);
  const [r,g,b]=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
  const max=Math.max(r,g,b),min=Math.min(r,g,b),delta=max-min;
  if(!delta)return 0;
  const hue=max===r?(g-b)/delta+(g<b?6:0):max===g?(b-r)/delta+2:(r-g)/delta+4;
  return Math.round(hue*60);
}
type Page = { id: string; category: string; index: number; title?: string; custom?: string; locked?: boolean };
type TraceImage = { url:string; pageId:string; x:number; y:number; size:number; rotation:number; opacity:number };
const initialPage = (): Page => { const params=new URLSearchParams(location.search); return {id:'first',category:params.get('category')||'Letters',index:Number(params.get('index'))||0,custom:params.get('custom')||undefined}; };
function readPages(): Page[] { const pages=readWork<Page[]>('ll-board-pages',[]); return pages.length ? pages : [initialPage(),...['B','C','D'].map((_,i)=>({id:'seed-'+i,category:'Letters',index:i+1}))]; }
function readFreePages(): Page[] { const pages=readWork<Page[]>('ll-free-draw-pages',[]); return pages.length ? pages : [{id:'first',category:'Free Draw',index:0,title:'Drawing 1'}]; }
function readGodPages(): Page[] { const pages=readWork<Page[]>('ll-gods-pages',[]); if(pages.length)return pages;const deity=new URLSearchParams(location.search).get('deity')||'Ganesha';return [{id:deity,category:'Gods',index:Math.max(0,deityNames.indexOf(deity)),title:deity}]; }
function FreeDrawPreview({strokes}:{strokes:Stroke[]}) {
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{const canvas=ref.current;if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.clearRect(0,0,canvas.width,canvas.height);strokes.forEach(stroke=>renderStroke(ctx,stroke,canvas.width,canvas.height));},[strokes,strokes.length]);
  return <canvas className="db2-free-preview" ref={ref} width="88" height="54" aria-hidden="true"/>;
}
function GuidePreview({guide}:{guide:Guide}) {
  return <span className="db2-thumb db2-guide-thumb"><svg viewBox="0 0 800 340" aria-hidden="true"><path d={guide.path} fill="none" stroke="currentColor" strokeWidth="24" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;
}
const godImages:Record<string,string>={Saraswati:'Saraswati',Lakshmi:'Laxmi',Rama:'Ram',Durga:'Durga'};
function GodPreview({name}:{name:string}) {
  return <span className="db2-thumb db2-god-thumb"><img src={'/'+(godImages[name]||name)+'.svg'} alt="" onError={event=>{event.currentTarget.src='/drawing-board%20page%20assets/Image-2.svg'}}/></span>;
}
function SettingsSection({title,asset,children}:{title:string;asset:string;children:React.ReactNode}) {
  const [open,setOpen]=useState(true);
  return <section className="db2-setting"><button className="db2-setting-head" aria-expanded={open} onClick={()=>setOpen(!open)}>{icon(asset)}<span>{title}</span>{icon(open?'chevron up':'chevron down','db2-chevron')}</button>{open && <div className="db2-setting-body">{children}</div>}</section>;
}

export function DrawingBoardV2() {
  const settingsRef=useRef<HTMLElement>(null);
  const scrollTrackRef=useRef<HTMLDivElement>(null);
  const scrollDrag=useRef<{y:number;top:number}|null>(null);
  const [settingsScroll,setSettingsScroll]=useState({top:0,max:0});
  useEffect(()=>{
    const panel=settingsRef.current;
    if(!panel)return;
    const update=()=>setSettingsScroll({top:panel.scrollTop,max:Math.max(0,panel.scrollHeight-panel.clientHeight)});
    const resize=new ResizeObserver(update);
    const mutation=new MutationObserver(update);
    resize.observe(panel);
    mutation.observe(panel,{childList:true,subtree:true,attributes:true});
    update();
    return()=>{resize.disconnect();mutation.disconnect()};
  },[]);
  const scrollSettings=(distance:number)=>settingsRef.current?.scrollBy({top:distance,behavior:'smooth'});
  const dragSettings=(event:React.PointerEvent<HTMLButtonElement>)=>{
    if(!scrollDrag.current || !settingsRef.current || !scrollTrackRef.current)return;
    const travel=scrollTrackRef.current.clientHeight-74;
    if(travel>0)settingsRef.current.scrollTop=scrollDrag.current.top+(event.clientY-scrollDrag.current.y)*settingsScroll.max/travel;
  };
  const params = new URLSearchParams(location.search);
  const [mode,setMode] = useState(params.get('mode') || 'Trace');
  const [tracePages,setTracePages] = useState<Page[]>(readPages);
  const [freePages,setFreePages] = useState<Page[]>(readFreePages);
  const [godPages,setGodPages] = useState<Page[]>(readGodPages);
  const [selectedId,setSelectedId] = useState(()=>params.get('mode')==='Free Draw'?readFreePages()[0].id:params.get('mode')==='Gods'?readGodPages()[0].id:readPages()[0].id);
  const [category,setCategory] = useState(params.get('category') || 'Letters');
  const [index,setIndex] = useState(Number(params.get('index')) || 0);
  const [traceIndex,setTraceIndex] = useState(Number(params.get('index')) || 0);
  const [traceSize,setTraceSize] = useState(100);
  const [menu,setMenu] = useState(false);
  const [letterMenu,setLetterMenu]=useState(false);
  const [letterMenuPosition,setLetterMenuPosition]=useState({top:0,left:0});
  const [highlightedIndex,setHighlightedIndex]=useState(0);
  const letterButton=useRef<HTMLButtonElement>(null);
  const letterList=useRef<HTMLDivElement>(null);
  const [pageMenu,setPageMenu] = useState<string|null>(null);
  const [pageMenuPosition,setPageMenuPosition]=useState({top:0,right:0});
  const [editingId,setEditingId]=useState<string|null>(null);
  const [draftTitle,setDraftTitle]=useState('');
  const cancelRename=useRef(false);
  useEffect(()=>{
    if(!pageMenu)return;
    const closeOutside=(event:PointerEvent)=>{
      if(!(event.target instanceof Element) || !event.target.closest('.db2-page-menu, .db2-options'))setPageMenu(null);
    };
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setPageMenu(null)};
    document.addEventListener('pointerdown',closeOutside);
    document.addEventListener('keydown',closeOnEscape);
    const closeOnScroll=()=>setPageMenu(null);
    document.addEventListener('scroll',closeOnScroll,true);
    return ()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeOnEscape);document.removeEventListener('scroll',closeOnScroll,true)};
  },[pageMenu]);
  useEffect(()=>{
    if(!letterMenu)return;
    const closeOutside=(event:PointerEvent)=>{
      if(!(event.target instanceof Element)||!event.target.closest('.db2-letter-picker, .db2-letter-list'))setLetterMenu(false);
    };
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape'){setLetterMenu(false);letterButton.current?.focus()}};
    document.addEventListener('pointerdown',closeOutside);
    document.addEventListener('keydown',closeOnEscape);
    requestAnimationFrame(()=>{
      letterList.current?.focus();
      letterList.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});
    });
    return ()=>{document.removeEventListener('pointerdown',closeOutside);document.removeEventListener('keydown',closeOnEscape)};
  },[letterMenu]);
  useEffect(()=>{
    if(letterMenu)letterList.current?.querySelector('#db2-letter-option-'+highlightedIndex)?.scrollIntoView({block:'nearest'});
  },[highlightedIndex,letterMenu]);
  const [lower,setLower] = useState(false);
  const [color,setColor] = useState('#3a5be4');
  const shades=[94,84,74,64,55,47,40,33,26].map(lightness=>`hsl(${colorHue(color)} 72% ${lightness}%)`);
  const [brush,setBrush] = useState<Brush>('Fountain Pen');
  const [godBrush,setGodBrush] = useState<Brush|'Fill'>('Fill');
  const [size,setSize] = useState(1.5);
  const [dark,setDark] = useState(false);
  const [focus,setFocus] = useState(false);
  const [traceImage,setTraceImage] = useState<TraceImage|null>(null);
  const [positioningImage,setPositioningImage] = useState(false);
  const imageInput=useRef<HTMLInputElement>(null);
  useEffect(()=>()=>{if(traceImage)URL.revokeObjectURL(traceImage.url)},[traceImage?.url]);
  const uploadTraceImage=(file?:File)=>{
    if(!file || !['image/png','image/jpeg','image/webp','image/gif'].includes(file.type))return;
    setTraceImage({url:URL.createObjectURL(file),pageId:selectedId,x:50,y:50,size:50,rotation:0,opacity:100});
    setPositioningImage(true);
  };
  const recent=useRecentColors();
  const drawings=useRef(new Map<string,Stroke[]>(readWork<[string,Stroke[]][]>('ll-drawings',[])));
  const history=useRef(new Map<string,Stroke[][]>()), future=useRef(new Map<string,Stroke[][]>());
  const [,refresh]=useState(0);
  const pages=mode==='Free Draw'?freePages:mode==='Gods'?godPages:tracePages;
  const selected=pages.find(p=>p.id===selectedId) || pages[0];
  const activeCategory=mode==='Trace'||mode==='Worksheet' ? selected.category : category;
  const activeIndex=mode==='Trace' ? traceIndex : mode==='Worksheet' ? selected.index : index;
  const visiblePages=mode==='Trace'||mode==='Worksheet'?pages.filter(page=>page.category===activeCategory):pages;
  const itemType=activeCategory==='Lines & curves'?'Line':activeCategory.slice(0,-1);
  const hasTextFormat=activeCategory==='Letters'||activeCategory==='Words';
  const list=guides[activeCategory] || guides.Letters;
  const guide:Guide=mode==='Worksheet' && selected.custom ? {title:'Trace '+selected.custom,text:selected.custom} : list[Math.min(activeIndex,list.length-1)];
  const key=mode==='Free Draw' ? 'free'+(selected.id==='first'?'':':'+selected.id) : mode==='Worksheet' && selected.custom ? 'WorksheetCustom:'+selected.custom : mode+activeCategory+activeIndex+(selected.id==='first'?'':':'+selected.id);
  if(!drawings.current.has(key))drawings.current.set(key,[]);
  const strokes=drawings.current.get(key)!;
  const undo=history.current.get(key)||[],redo=future.current.get(key)||[];
  const savePages=(value:Page[])=>{if(mode==='Free Draw'){setFreePages(value);saveWork('ll-free-draw-pages',value)}else if(mode==='Gods'){setGodPages(value);saveWork('ll-gods-pages',value)}else{setTracePages(value);saveWork('ll-board-pages',value)}};
  const change=(value:Stroke[],back:Stroke[][],forward:Stroke[][])=>{drawings.current.set(key,value);history.current.set(key,back);future.current.set(key,forward);saveWork('ll-drawings',[...drawings.current]);refresh(v=>v+1)};
  const chooseCategory=(value:string)=>{setCategory(value);if(mode==='Trace')setTraceIndex(0);const existing=pages.find(page=>page.category===value);if(existing){setSelectedId(existing.id);setIndex(existing.index)}else{const created=(guides[value]||guides.Letters).map((_,i)=>({id:crypto.randomUUID(),category:value,index:i}));savePages([...pages,...created]);setSelectedId(created[0].id);setIndex(0)}setMenu(false)};
  const chooseIndex=(value:number)=>{if(selected.locked)return;setIndex(value);if(mode==='Trace'){setTraceIndex(value);return}savePages(pages.map(p=>p.id===selectedId?{...p,index:value,custom:undefined,title:undefined}:p))};
  const nextTrace=()=>{if(!selected.locked)setTraceIndex(current=>Math.min(current+1,list.length-1))};
  const previousTrace=()=>{if(!selected.locked)setTraceIndex(current=>Math.max(current-1,0))};
  const toggleLetterMenu=()=>{if(letterMenu){setLetterMenu(false);return}const bounds=letterButton.current?.getBoundingClientRect();if(!bounds)return;setLetterMenuPosition({top:Math.max(8,Math.min(bounds.bottom+6,window.innerHeight-290)),left:bounds.left});setHighlightedIndex(Math.min(activeIndex,list.length-1));setLetterMenu(true)};
  const addGodPage=(deityIndex:number)=>{const id=crypto.randomUUID();savePages([...pages,{id,category:'Gods',index:deityIndex,title:deityNames[deityIndex]}]);setSelectedId(id)};
  const chooseGod=(name:string)=>{const deityIndex=deityNames.indexOf(name);if(deityIndex<0)return;const existing=godPages.find(page=>page.index===deityIndex);if(existing)setSelectedId(existing.id);else addGodPage(deityIndex)};
  const addPage=()=>{if(mode==='Gods'){addGodPage((selected.index+1)%deityNames.length);return}const id=crypto.randomUUID();const next=mode==='Free Draw'?{id,category:'Free Draw',index:0,title:'Drawing '+(pages.length+1)}:{id,category:activeCategory,index:(activeIndex+1)%list.length};savePages([...pages,next]);setSelectedId(id)};
  const duplicate=(page:Page)=>{const id=crypto.randomUUID();const at=pages.findIndex(p=>p.id===page.id);const next=[...pages];next.splice(at+1,0,{...page,id});savePages(next);if(mode==='Gods'){const sheets=new Map(readWork<[string,Sheet][]>('ll-coloring',[]));const original=sheets.get(page.id);if(original){sheets.set(id,structuredClone(original));saveWork('ll-coloring',[...sheets])}}else{const source=mode==='Free Draw'?'free'+(page.id==='first'?'':':'+page.id):mode+page.category+page.index+(page.id==='first'?'':':'+page.id);const target=mode==='Free Draw'?'free:'+id:mode+page.category+page.index+':'+id;drawings.current.set(target,(drawings.current.get(source)||[]).map(s=>({...s,points:s.points.map(p=>({...p}))})));saveWork('ll-drawings',[...drawings.current])}setSelectedId(id);setPageMenu(null)};
  const rename=(page:Page)=>{if(page.locked)return;setDraftTitle(page.title||guides[page.category]?.[page.index]?.title||'Drawing');setEditingId(page.id);setPageMenu(null)};
  const commitRename=(page:Page)=>{if(cancelRename.current){cancelRename.current=false;return}const title=draftTitle.trim();if(title)savePages(pages.map(p=>p.id===page.id?{...p,title}:p));setEditingId(null)};
  const toggleLock=(page:Page)=>{savePages(pages.map(p=>p.id===page.id?{...p,locked:!p.locked}:p));setPageMenu(null)};
  const remove=(page:Page)=>{if(visiblePages.length===1||page.locked)return;setPageMenu(null);if(!confirm('Delete this page?'))return;const next=pages.filter(p=>p.id!==page.id);savePages(next);if(selectedId===page.id)setSelectedId(next.find(p=>p.category===page.category)?.id||next[0].id)};
  const clear=()=>{if(selected.locked)return;if(mode==='Gods'){document.querySelector<HTMLButtonElement>('.db2-center .db2-canvas-tools button[aria-label="Clear"]')?.click();return}if(strokes.length && confirm('Clear this canvas?'))change([], [...undo,strokes],[])};
  const exportPage=(format:'pdf'|'jpg')=>{const btn=document.querySelector<HTMLButtonElement>(`.db2-center .drawing-download button:nth-child(${format==='jpg'?1:2})`);btn?.click()};
  const title=mode==='Trace' ? guide.title : mode==='Worksheet' ? (selected.title||guide.title) : mode==='Free Draw'?(selected.title||'Free Draw'):'Gods';
  const progress=mode==='Free Draw'?pages.findIndex(p=>p.id===selectedId)+1:activeIndex+1;
  return <section className={'db2'+(focus?' db2-focus':'')} data-mode={mode}>
    <header className="db2-header"><h1>{icon('Drawing Board')} Drawing Board</h1><div className="db2-modes">{modes.map(([name,asset])=><button key={name} aria-pressed={mode===name} aria-expanded={(name==='Trace'||name==='Worksheet')?menu:undefined} onClick={()=>{setMode(name);setSelectedId(name==='Free Draw'?freePages[0].id:name==='Gods'?godPages[0].id:tracePages[0].id);setPageMenu(null);setMenu(name==='Trace'||name==='Worksheet' ? mode===name?!menu:true : false)}}>{icon(asset)}{name}</button>)}{menu && (mode==='Trace'||mode==='Worksheet') && <div className="db2-mode-menu">{categoryNames.map(name=><button key={name} aria-pressed={activeCategory===name} onClick={()=>chooseCategory(name)}>{icon(categoryIcons[name])}<span>{name==='Lines & curves'?'Lines':name}</span></button>)}</div>}</div></header>
    <div className="db2-grid">
      <div className="db2-settings-wrap">
      <aside id="db2-settings-panel" ref={settingsRef} className="db2-settings" tabIndex={0} aria-label="Drawing settings" onScroll={event=>setSettingsScroll({top:event.currentTarget.scrollTop,max:Math.max(0,event.currentTarget.scrollHeight-event.currentTarget.clientHeight)})}><h2>{icon('Customize Workseet Ic')} {mode==='Gods'?'Customize Coloring':mode==='Free Draw'?'Customize Drawing':mode==='Trace'?'Customize Trace':'Customize Worksheet'}</h2>
        {(mode==='Trace'||mode==='Worksheet') && <SettingsSection title={itemType+' Style'} asset={activeCategory==='Letters'?'Letter Style':categoryIcons[activeCategory]||'Letter Style'}><div className="db2-form-row"><span>Choose {itemType}</span><button ref={letterButton} type="button" className="db2-letter-picker" disabled={Boolean(selected.locked)} aria-haspopup="listbox" aria-expanded={letterMenu} aria-label={'Choose '+activeCategory} onClick={toggleLetterMenu}><span>{pickerLabel(list[Math.min(activeIndex,list.length-1)])}</span>{icon('choose letter dropdpwn arrow icon')}</button></div>{hasTextFormat && mode==='Worksheet' && <div className="db2-form-row">Format <div className="db2-segment"><button aria-pressed={!lower} onClick={()=>setLower(false)}>A</button><button aria-pressed={lower} onClick={()=>setLower(true)}>a</button></div></div>}</SettingsSection>}
        <SettingsSection title="Colors" asset="Colors"><label className="db2-custom-color">Custom<input type="range" min="0" max="359" value={colorHue(color)} aria-label="Custom color hue" style={{'--db2-picker-color':color} as React.CSSProperties} onChange={e=>setColor(`hsl(${e.target.value} 72% 55%)`)}/></label><p>Shades</p><div className="db2-swatches">{shades.map(c=><button key={c} style={{backgroundColor:c}} aria-label={'Color '+c} aria-pressed={color===c} onClick={()=>setColor(c)}/>)}</div><p>All colors</p><div className="db2-swatches">{colors.map(c=><button key={c} style={{backgroundColor:c}} aria-label={'Color '+c} aria-pressed={color===c} onClick={()=>setColor(c)}/>)}</div><p>Recent Colors</p><div className="db2-swatches">{recent.map(c=><button key={c} style={{backgroundColor:c}} aria-label={'Recent color '+c} onClick={()=>setColor(c)}/>)}</div></SettingsSection>
        <SettingsSection title="Drawing Tools" asset="Drawing Tools"><p>Draw &amp; Write</p><div className="db2-tool-grid">{writeTools.map(([value,asset])=><button key={value} title={value} aria-label={value} aria-pressed={(mode==='Gods'?godBrush:brush)===value} onClick={()=>mode==='Gods'?setGodBrush(value):setBrush(value)}>{icon('Draw & Write/'+asset)}</button>)}</div><p>Color &amp; Paint</p><div className="db2-tool-grid">{(mode==='Gods'?godPaintTools:paintTools).map(([value,asset])=><button key={value} title={value} aria-label={value} aria-pressed={(mode==='Gods'?godBrush:brush)===value} onClick={()=>mode==='Gods'?setGodBrush(value):setBrush(value as Brush)}>{icon('Color & Paint/'+asset)}</button>)}</div></SettingsSection>
        <SettingsSection title="Brush Size" asset="Brush Size"><div className="db2-sizes">{[.5,1,1.5,2,3,4,5].map((n,i)=><button key={n} aria-label={'Brush size '+n} aria-pressed={size===n} onClick={()=>setSize(n)}>{icon(`Brush Stroke ${i+1}`)}</button>)}</div></SettingsSection>
      </aside>
      {settingsScroll.max>1 && <div className="db2-scrollbar" aria-label="Settings scroll controls" onWheel={event=>settingsRef.current?.scrollBy({top:event.deltaY})}>
        <button type="button" className="db2-scroll-arrow" aria-label="Scroll settings up" disabled={settingsScroll.top<=0} onClick={()=>scrollSettings(-180)}><img src="/Scrollbar/Scrollbar/Scroll%20Up.svg" alt="" /></button>
        <div ref={scrollTrackRef} className="db2-scroll-track" onPointerDown={event=>{if(event.target!==event.currentTarget || !settingsRef.current)return;const rect=event.currentTarget.getBoundingClientRect();settingsRef.current.scrollTop=((event.clientY-rect.top-37)/(rect.height-74))*settingsScroll.max}}>
          <button type="button" className="db2-scroll-thumb" role="scrollbar" aria-controls="db2-settings-panel" aria-orientation="vertical" aria-label="Drag to scroll settings" aria-valuemin={0} aria-valuemax={Math.round(settingsScroll.max)} aria-valuenow={Math.round(settingsScroll.top)} style={{top:(settingsScroll.top/settingsScroll.max*100)+'%',transform:`translateY(-${settingsScroll.top/settingsScroll.max*100}%)`}} onPointerDown={event=>{scrollDrag.current={y:event.clientY,top:settingsRef.current?.scrollTop||0};event.currentTarget.setPointerCapture(event.pointerId)}} onPointerMove={dragSettings} onPointerUp={()=>{scrollDrag.current=null}} onPointerCancel={()=>{scrollDrag.current=null}} onKeyDown={event=>{if(event.key==='ArrowDown'){event.preventDefault();scrollSettings(70)}else if(event.key==='ArrowUp'){event.preventDefault();scrollSettings(-70)}}}><img src="/Scrollbar/Scrollbar/Thumb.svg" alt="" /></button>
        </div>
        <button type="button" className="db2-scroll-arrow" aria-label="Scroll settings down" disabled={settingsScroll.top>=settingsScroll.max-1} onClick={()=>scrollSettings(180)}><img src="/Scrollbar/Scrollbar/Scroll%20Down.svg" alt="" /></button>
      </div>}
      </div>
      <div className="db2-center">{mode==='Gods' ? <div className="drawing-board db2-gods"><GodsStudio key={selected.id} pageId={selected.id} deity={deityNames[selected.index]||'Ganesha'} onDeityChange={chooseGod} modernToolbar locked={Boolean(selected.locked)} settings={{color,brush:godBrush,size,onBrush:setGodBrush,onColor:setColor,onSize:setSize}} focusControl={<div className="db2-gods-actions"><button aria-label="Print current page" onClick={()=>window.print()}>{icon('Print Ic')}</button><button aria-label={focus?'Exit fullscreen':'Fullscreen'} onClick={()=>setFocus(!focus)}>{icon('Fullscreen ic')}</button></div>}/></div> : <div className="db2-canvas-panel"><div className="db2-canvas-head"><div className="db2-activity">{icon(mode==='Free Draw'?'Drawing Board':categoryIcons[activeCategory])}<div><h2>{title}</h2><p>{mode==='Free Draw'?'Draw anything you like!':'Follow the dotted outline'}</p></div></div><div className="db2-badges">{mode==='Trace' && activeIndex>0 && <button className="db2-prev" onClick={previousTrace} disabled={Boolean(selected.locked)}>← Previous</button>}{mode==='Trace' && <button className="db2-next" onClick={nextTrace} disabled={activeIndex>=list.length-1 || Boolean(selected.locked)}>Next →</button>}<span>{progress} of {mode==='Free Draw'?pages.length:list.length}</span><span>{icon('Star Ic')} {mode==='Free Draw'?pages.filter(p=>drawings.current.get('free'+(p.id==='first'?'':':'+p.id))?.length).length:list.filter((_,i)=>drawings.current.get(mode+activeCategory+i)?.length).length}/{mode==='Free Draw'?pages.length:list.length}</span><button aria-label="Print current page" onClick={()=>window.print()}>{icon('Print Ic')}</button><button className="db2-tablet-action" aria-label={mode==='Trace'?'Save trace':'Save worksheet'} onClick={()=>{saveWork('ll-drawings',[...drawings.current]);savePages(pages)}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 3h14l3 3v15H3V3h1zm2 0v7h11V3M7 21v-8h10v8" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg></button><button className="db2-tablet-action" aria-label="Download PDF" onClick={()=>exportPage('pdf')}>{icon('Download PDF ic')}</button><button aria-label={focus?'Exit fullscreen':'Fullscreen'} onClick={()=>setFocus(!focus)}>{icon('Fullscreen ic')}</button></div></div><div className={'db2-paper board-paper'+(dark?' dark':'')}><DownloadDrawing/><div className="db2-canvas-tools"><button aria-label="Undo" disabled={!undo.length||Boolean(selected.locked)} onClick={()=>change(undo[undo.length-1],undo.slice(0,-1),[...redo,strokes])}>{icon('Undo ic')}</button><button aria-label="Redo" disabled={!redo.length||Boolean(selected.locked)} onClick={()=>change(redo[redo.length-1],[...undo,strokes],redo.slice(0,-1))}>{icon('Redo ic')}</button><button aria-label="Clear" onClick={clear}>{icon('Delete ic')}</button><span><button aria-label="Whiteboard" aria-pressed={!dark} onClick={()=>setDark(false)}>{icon('Whiteboard')}</button><button aria-label="Chalkboard" aria-pressed={dark} onClick={()=>setDark(true)}>{icon('Chawlkboard')}</button></span></div>{mode==='Trace' ? <div className="db2-trace-stage" style={{transform:`translate(-50%, -50%) scale(${traceSize/100})`}}><SingleTraceGuide guide={guide} category={activeCategory} dark={dark}/></div> : <>{mode==='Worksheet' && <WorksheetGuide guide={{...guide,text:guide.text && lower?guide.text.toLowerCase():guide.text}} category={activeCategory} dark={dark}/>}<InkCanvas key={key} disabled={Boolean(selected.locked)} strokes={strokes} color={color} brush={brush} widthScale={size} onFinish={()=>change(strokes.slice(),[...undo,strokes.slice(0,-1)],[])}/></>}{mode==='Trace' && <InkCanvas key={key} disabled={Boolean(selected.locked)} strokes={strokes} color={color} brush={brush} widthScale={size} onFinish={()=>change(strokes.slice(),[...undo,strokes.slice(0,-1)],[])}/>}{mode==='Free Draw' && traceImage?.pageId===selected.id && <img className={'db2-trace-image'+(positioningImage?' is-positioning':'')} src={traceImage.url} alt="Temporary image to trace" draggable={false} style={{left:traceImage.x+'%',top:traceImage.y+'%',width:traceImage.size+'%',opacity:traceImage.opacity/100,transform:`translate(-50%, -50%) rotate(${traceImage.rotation}deg)`}} onPointerDown={event=>{if(!positioningImage)return;const image=event.currentTarget;image.setPointerCapture(event.pointerId);const board=image.closest('.db2-paper')!.getBoundingClientRect();const startX=event.clientX,startY=event.clientY,originX=traceImage.x,originY=traceImage.y;const move=(e:PointerEvent)=>setTraceImage(current=>current?.url===traceImage.url?{...current,x:Math.max(0,Math.min(100,originX+(e.clientX-startX)/board.width*100)),y:Math.max(0,Math.min(100,originY+(e.clientY-startY)/board.height*100))}:current);const stop=()=>{image.removeEventListener('pointermove',move);image.removeEventListener('pointerup',stop);image.removeEventListener('pointercancel',stop)};image.addEventListener('pointermove',move);image.addEventListener('pointerup',stop);image.addEventListener('pointercancel',stop)}}/>}</div></div>}
      </div>
      <aside className="db2-pages"><h2>{icon('Quick Actions')} {mode==='Free Draw'?'Drawing Pages':mode==='Gods'?'Coloring Pages':'Worksheet Pages'}</h2><div className="db2-pages-box"><div className="db2-page-list">{visiblePages.map((page,i)=>{const item=guides[page.category]?.[page.index]||guides.Letters[0];const label=page.custom||item.text||item.title;return <div className="db2-page-row" key={page.id} data-selected={page.id===selectedId}>{editingId===page.id ? <div className="db2-page-select db2-editing">{mode==='Free Draw'?<span className="db2-thumb db2-free-thumb"><FreeDrawPreview strokes={drawings.current.get('free'+(page.id==='first'?'':':'+page.id))||[]}/></span>:mode==='Gods'?<GodPreview name={deityNames[page.index]||'Ganesha'}/>:item.path?<GuidePreview guide={item}/>:<span className="db2-thumb"><b>{String(label).slice(0,1).toUpperCase()}</b><i>{String(label).slice(0,1).toUpperCase()}</i><i>{String(label).slice(0,1).toUpperCase()}</i></span>}<input autoFocus aria-label={'Rename page '+(i+1)} value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} onBlur={()=>commitRename(page)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur();if(e.key==='Escape'){cancelRename.current=true;setEditingId(null)}}}/></div> : <button className="db2-page-select" onClick={()=>{setSelectedId(page.id);if(mode==='Trace'||mode==='Worksheet'){setCategory(page.category);setIndex(page.index)}}}>{mode==='Free Draw'?<span className="db2-thumb db2-free-thumb"><FreeDrawPreview strokes={drawings.current.get('free'+(page.id==='first'?'':':'+page.id))||[]}/></span>:mode==='Gods'?<GodPreview name={deityNames[page.index]||'Ganesha'}/>:item.path?<GuidePreview guide={item}/>:<span className="db2-thumb"><b>{String(label).slice(0,1).toUpperCase()}</b><i>{String(label).slice(0,1).toUpperCase()}</i><i>{String(label).slice(0,1).toUpperCase()}</i></span>}<span>{i+1}. {mode==='Free Draw'?(page.title||'Drawing '+(i+1)):(mode==='Gods'?(page.title||deityNames[page.index]):(page.title||item.title))}{page.locked?' 🔒':''}</span></button>}<button className="db2-options" aria-label={'Options for page '+(i+1)} aria-expanded={pageMenu===page.id} onClick={e=>{if(pageMenu===page.id){setPageMenu(null);return}const rect=e.currentTarget.getBoundingClientRect();setPageMenuPosition({top:rect.bottom+6,right:window.innerWidth-rect.right});setPageMenu(page.id)}}>{icon('Options')}</button></div>})}</div><button className="db2-add" onClick={addPage}>＋ Add Page</button></div><div className="db2-divider"/><h2>{icon('Frame')} Quick Actions</h2><div className="db2-actions">{mode==='Free Draw' && <><input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={e=>{uploadTraceImage(e.target.files?.[0]);e.target.value=''}}/><button onClick={()=>imageInput.current?.click()}>Upload image for trace</button>{traceImage?.pageId===selected.id && <div className="db2-trace-controls"><button onClick={()=>setPositioningImage(value=>!value)}>{positioningImage?'Done positioning':'Move image'}</button><label>Size <input type="range" min="10" max="100" value={traceImage.size} onChange={e=>setTraceImage(current=>current?{...current,size:Number(e.target.value)}:current)}/></label><label>Rotate <input type="range" min="-180" max="180" value={traceImage.rotation} onChange={e=>setTraceImage(current=>current?{...current,rotation:Number(e.target.value)}:current)}/></label><label><span className="db2-trace-label"><span>Opacity</span><span>{traceImage.opacity}%</span></span><input type="range" min="1" max="100" value={traceImage.opacity} onChange={e=>setTraceImage(current=>current?{...current,opacity:Number(e.target.value)}:current)}/></label><button onClick={()=>{setTraceImage(null);setPositioningImage(false)}}>Remove image</button><small>Temporary guide. It will not be saved, printed, or downloaded.</small></div>}</>}<button onClick={()=>exportPage('pdf')}>{icon('Download PDF ic')} Download PDF</button><button onClick={()=>window.print()}>{icon('Print Worksheet ic')} {mode==='Gods'?'Print Coloring Page':mode==='Free Draw'?'Print Drawing':mode==='Trace'?'Print Trace':'Print Worksheet'}</button><button className="db2-danger" onClick={clear}>{icon('Clear Canvas ic')} Clear Canvas</button><button className="db2-save" onClick={()=>{saveWork('ll-drawings',[...drawings.current]);savePages(pages)}}>✓ Save {mode==='Gods'?'Coloring':mode==='Free Draw'?'Drawing':mode==='Trace'?'Trace':'Worksheet'}</button></div>{mode==='Trace' && <div className="db2-letter-size"><label htmlFor="db2-letter-size">Letter Size <output htmlFor="db2-letter-size">{traceSize}%</output></label><input id="db2-letter-size" aria-label="Letter Size" type="range" min="60" max="140" step="5" value={traceSize} onChange={event=>setTraceSize(Number(event.target.value))}/><div aria-hidden="true"><span>Smaller</span><span>Larger</span></div></div>}</aside>
    </div>
    {letterMenu && createPortal(<div ref={letterList} className="db2-letter-list" role="listbox" tabIndex={-1} aria-label={'Choose '+activeCategory} aria-activedescendant={'db2-letter-option-'+highlightedIndex} style={{top:letterMenuPosition.top,left:letterMenuPosition.left}} onKeyDown={e=>{
      if(e.key==='Escape'){setLetterMenu(false);letterButton.current?.focus()}
      if(e.key==='ArrowDown'){e.preventDefault();setHighlightedIndex(i=>Math.min(i+1,list.length-1))}
      if(e.key==='ArrowUp'){e.preventDefault();setHighlightedIndex(i=>Math.max(i-1,0))}
      if(e.key==='Enter'||e.key===' '){e.preventDefault();chooseIndex(highlightedIndex);setLetterMenu(false);letterButton.current?.focus()}
    }}>{list.map((item,i)=><button key={i} id={'db2-letter-option-'+i} type="button" role="option" aria-selected={i===activeIndex} data-highlighted={i===highlightedIndex} onMouseEnter={()=>setHighlightedIndex(i)} onClick={()=>{chooseIndex(i);setLetterMenu(false);letterButton.current?.focus()}}>{pickerLabel(item)}</button>)}</div>,document.body)}
    {pageMenu && createPortal(<div className="db2-page-menu" role="menu" style={{top:pageMenuPosition.top,right:pageMenuPosition.right}}>
      {(() => { const page=pages.find(p=>p.id===pageMenu); if(!page)return null; return <>
        <button role="menuitem" disabled={Boolean(page.locked)} onClick={()=>rename(page)}>{icon('Options -Rename ic')} Rename</button>
        <button role="menuitem" onClick={()=>duplicate(page)}>{icon('Options -Duplicate ic')} Duplicate</button>
        <button role="menuitem" onClick={()=>toggleLock(page)}>{icon('Options -Lock - Unlock ic')} {page.locked?'Unlock':'Lock'}</button>
        <button role="menuitem" disabled={visiblePages.length===1||Boolean(page.locked)} onClick={()=>remove(page)}>{icon('Options -Delete ic')} Delete</button>
      </>})()}
    </div>,document.body)}
  </section>;
}
