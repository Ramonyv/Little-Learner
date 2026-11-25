import { playEffect } from '../utils/soundEffects';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { InkCanvas, Stroke } from '../components/board/InkCanvas';

const prompts = [
  'Trace around the seed and follow its first root down.',
  'Tap the roots of the bean plant.',
  'Which part takes in water from the soil?',
  'This is grass. Can you find its roots?',
];
const root = '#925125';
type Part = 'Roots' | 'Leaves' | 'Stem';
function Plant({grass, choose, highlight}: {grass:boolean; choose?:(part:Part)=>void; highlight:boolean}) {
  const parts: [Part, React.ReactNode][] = [
    ['Stem', <path d="M201 151 Q196 117 201 76" stroke="#408154" strokeWidth="11"/>],
    ['Leaves', grass ? <path fill="#56aa65" d="M200 148 Q175 90 126 58 Q180 77 198 115 Q184 64 189 32 Q207 65 207 115 Q225 61 258 50 Q226 94 214 148Z"/> : <path fill="#58ad60" d="M201 99 Q139 111 128 58 Q178 46 201 90 Q212 38 267 40 Q268 89 201 99Z"/>],
    ['Roots', <path d={grass?'M201 150 Q186 174 155 202 M201 150 Q193 186 178 219 M203 150 Q202 190 200 223 M205 150 Q214 191 224 214 M206 150 Q231 174 246 195':'M201 150 Q201 191 186 218 M198 179 Q177 182 165 196 M195 192 Q211 201 221 211'} fill="none" stroke={highlight?'#117546':root} strokeWidth="7" strokeLinecap="round"/>]
  ];
  return <svg viewBox="0 0 400 240" className="w-full" aria-label={grass?'Grass growing in soil':'Bean plant growing in soil'}>
    <rect width="400" height="240" rx="16" fill="#e9f6fd"/><path d="M0 145 Q90 137 200 145 T400 142 V240 H0Z" fill="#efcc9e"/>
    {parts.map(([name,art])=><g key={name} role={choose?'button':undefined} tabIndex={choose?0:undefined} aria-label={name} className={choose?'cursor-pointer focus:outline-brand-blue':''}
      onClick={()=>choose?.(name)} onKeyDown={e=>{if(choose && (e.key==='Enter'||e.key===' ')){e.preventDefault();choose(name)}}}>
      {choose && <rect x={name==='Roots'?145:name==='Leaves'?120:182} y={name==='Roots'?150:name==='Leaves'?30:103} width={name==='Stem'?38:145} height={name==='Stem'?45:85} fill="transparent"/>}{art}</g>)}
    {highlight && <g fill="#1976c5"><path d="M150 170q-9 14 0 14t0-14M236 184q-9 14 0 14t0-14"/></g>}
  </svg>;
}
export function SeedActivity(){
  const [step,setStep]=useState(0),[correct,setCorrect]=useState(false),[feedback,setFeedback]=useState(''),[voice,setVoice]=useState(false);
  const strokes=useRef<Stroke[]>([]);
  const available=typeof window!=='undefined' && typeof window.speechSynthesis!=='undefined';
  const message=feedback || prompts[step] || 'You found the roots of two different plants!';
  function speak(words:string){window.speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(words);speech.lang='en-IN';speech.rate=.85;window.speechSynthesis.speak(speech)}
  useEffect(()=>{if(voice && available)speak(message);return ()=>{if(available)window.speechSynthesis.cancel()}},[voice,message,available]);
  function advance(){if(step===3 && !voice)void playEffect("activity-complete");setStep(step+1);setCorrect(false);setFeedback('')}
  function answer(part:Part){
    if(correct)return;
    const right=part==='Roots';if(!voice)void playEffect(right?'answer-correct':'try-again');setCorrect(right);
    setFeedback(right?(step===2?'Yes! Roots take in water from the soil and the stem carries it up.':'You found the roots! See how they branch out in the soil.'):(step===3?'Look for the thin strands below the grass. Try again.':'Look below the soil. Try again.'));
  }
  const button='rounded-full px-5 py-3 font-black bg-brand-blue text-white';
  return <section className="max-w-2xl mx-auto px-4 pt-6 pb-28"><Link to="/" className="font-bold text-brand-blue">← Home</Link>
    <article className="mt-4 bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-8">
    <div className="flex justify-between items-center gap-3"><span className="font-black text-green-700">{step<4?'Explore · '+(step+1)+' of 4':'Activity complete'}</span>
    {available && <button className="rounded-full px-3 py-2 bg-blue-50 font-bold" aria-pressed={voice} onClick={()=>setVoice(!voice)}>{voice?'Mute voice':'Read aloud'}</button>}</div>
    <h1 className="text-3xl font-black my-3">Help a seed grow</h1>
    {step<4 && <p className="text-lg font-bold mb-4">{prompts[step]}</p>}
    {step===0?<div className="relative aspect-[5/3] bg-amber-50 rounded-2xl overflow-hidden"><svg viewBox="0 0 400 240" className="w-full" aria-label="Dotted seed outline with a curved root"><path d="M207 120 C145 145 118 86 153 65 C190 39 238 81 207 120 Q230 146 202 172 T205 211" fill="none" stroke="#ab875d" strokeWidth="5" strokeDasharray="5 6" strokeLinecap="round"/><circle cx="207" cy="120" r="6" fill="#249459"/><text x="223" y="119" fill="#177345" fontWeight="bold">Start</text></svg>
    <InkCanvas strokes={strokes.current} brush="Marker" color="#925125" onFinish={()=>setCorrect(true)}/></div>
    :<Plant grass={step>=3} choose={step===1||step===3?answer:undefined} highlight={correct||step===4}/>}
    {step===2 && <div className="flex gap-2 mt-4">{(['Leaves','Roots','Stem'] as Part[]).map(p=><button key={p} onClick={()=>answer(p)} disabled={correct} className="rounded-xl bg-blue-50 font-black px-4 py-3">{p}</button>)}</div>}
    <p aria-live="polite" className="font-bold my-3">{step===4?message:feedback}</p>
    {step===4?<Link className={button+' inline-block'} to="/">Back to home</Link>:<button className={button+' disabled:opacity-40'} disabled={!correct} onClick={advance}>{step===3?'Finish':'Next →'}</button>}
    </article></section>
}
