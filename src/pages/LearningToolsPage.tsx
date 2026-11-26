/// <reference lib="es2022.intl" />
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { readWork } from '../utils/localWork';
import type { UserExamSession } from '../types';
import { analytics } from '../analytics';

export function LearningToolsPage() {
  const [words,setWords]=useState('cat, sun, apple');
  const [error,setError]=useState('');
  function printPack() {
    const entries=words.split(/[,\n]/).map(word=>word.trim()).filter(Boolean).slice(0,30);
    if(!entries.length){setError('Enter at least one word or letter.');return;}
    const segmenter=new Intl.Segmenter(undefined,{granularity:'grapheme'});
    const letters=entries.flatMap(entry=>Array.from(segmenter.segment(entry),part=>part.segment).filter(letter=>letter.trim()));
    setError('');
    const page=window.open('','_blank');
    if(!page){setError('Allow a new tab to open the printable pack.');return;}
    page.document.title='Little Learner activity pack';
    const style=page.document.createElement('style');
    style.textContent=`
      @page{size:A4 portrait;margin:0}
      *{box-sizing:border-box}
      body{margin:0;background:#edf1f5;font-family:sans-serif}
      section{width:210mm;height:297mm;margin:12px auto;padding:16mm;background:white;display:grid;grid-template-rows:auto repeat(6,1fr);gap:7mm}
      h1{font-size:20pt;margin:0}
      .row{border-block:1px solid #9bb2c5;display:flex;align-items:center;justify-content:space-around;font-size:44pt}
      .trace{color:white;-webkit-text-stroke:1px #777}
      @media print{button{display:none}body{background:white}section{margin:0;break-inside:avoid}section+section{break-before:page}}
    `;
    page.document.head.append(style);
    letters.forEach(letter=>{
      const section=page.document.createElement('section');
      const heading=page.document.createElement('h1');heading.textContent='Trace '+letter;section.append(heading);
      for(let row=0;row<6;row++){
        const line=page.document.createElement('div');line.className='row';
        for(let col=0;col<3;col++){const text=page.document.createElement('span');text.textContent=letter;text.className=col?'trace':'';line.append(text);}
        section.append(line);
      }
      page.document.body.append(section);
    });
    const button=page.document.createElement('button');button.textContent='Print / Save as PDF';button.onclick=()=>page.print();page.document.body.prepend(button);
    analytics.track('worksheet_printed',{board_mode:'worksheet',template_category:'custom_worksheet',entry_count:letters.length});
  }
  const sessions=readWork<UserExamSession[]>('ll-results',[]);
  const mistakes=sessions.filter(session=>session.questions.some((question,index)=>session.userAnswers[index]!==undefined && session.userAnswers[index]!==question.correctAnswer));
  return <article className="max-w-4xl mx-auto p-6">
    <h1 className="text-3xl font-black mb-6">Learning tools</h1>
    <h2 className="text-xl font-bold mb-3">Build a worksheet or printable pack</h2>
    <label className="block">Enter a name, words, letters, or numbers, separated by commas
      <textarea className="block w-full border rounded-xl p-3 my-3" value={words} maxLength={500} onChange={event=>setWords(event.target.value)}/>
    </label>
    <div className="flex flex-wrap gap-4">
      <Link className="rounded-xl bg-brand-yellow p-3 font-bold" to={'/drawing-board?'+new URLSearchParams({mode:'Worksheet',custom:words.split(/[,\n]/)[0].trim().slice(0,30) || 'cat'})} onClick={()=>analytics.track('activity_selected',{activity_type:'education',activity_id:'custom_worksheet',source_section:'learning_tools'})}>Draw custom worksheet</Link>
      <button className="rounded-xl border p-3 font-bold" onClick={printPack}>Create printable pack</button>
    </div>
    <p role="alert">{error}</p>
    <p className="mt-3 text-slate-600">The drawing worksheet uses the first entry. Printable packs use up to 30 entries and give each letter or digit its own A4 practice page. Use the print dialog to print or save as PDF.</p>
    <h2 className="text-xl font-bold mt-10 mb-4">Practice mistakes again</h2>
    {!mistakes.length && <p>Complete a quiz to build a revision session from incorrect answers.</p>}
    {mistakes.map(session=><Link key={session.sessionId} className="block border rounded-xl p-4 mb-3" to={'/exam/'+session.subjectId+'/'+session.topicId+'?mode=practice&mistakes='+encodeURIComponent(session.sessionId)} onClick={()=>analytics.track('feature_used',{feature_id:'retry_mistakes',section_id:'learning_tools'})}>Retry mistakes · {session.topicTitle}</Link>)}
  </article>;
}
