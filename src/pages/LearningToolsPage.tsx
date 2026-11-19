import { useState } from 'react';
import { Link } from 'react-router-dom';
import { readWork } from '../utils/localWork';
import type { UserExamSession } from '../types';

export function LearningToolsPage() {
  const [words,setWords]=useState('cat, sun, apple');
  const [error,setError]=useState('');
  function printPack() {
    const entries=words.split(/[,\n]/).map(word=>word.trim()).filter(Boolean).slice(0,30);
    if(!entries.length){setError('Enter at least one word or letter.');return;}
    const page=window.open('','_blank');
    if(!page){setError('Allow a new tab to open the printable pack.');return;}
    page.document.title='Little Learner activity pack';
    const style=page.document.createElement('style');
    style.textContent='body{font-family:sans-serif}section{break-after:page;padding:20px}h1{font-size:24px}.row{border-top:1px solid #9bb2c5;border-bottom:1px solid #9bb2c5;margin:30px 0;padding:10px;display:flex;justify-content:space-around;font-size:48px}.trace{color:white;-webkit-text-stroke:1px #777}@media print{button{display:none}}';
    page.document.head.append(style);
    entries.forEach(word=>{
      const section=page.document.createElement('section');
      const heading=page.document.createElement('h1');heading.textContent='Trace '+word;section.append(heading);
      for(let row=0;row<6;row++){
        const line=page.document.createElement('div');line.className='row';
        for(let col=0;col<(word.length>5?2:3);col++){const text=page.document.createElement('span');text.textContent=word;text.className=col?'trace':'';line.append(text);}
        section.append(line);
      }
      page.document.body.append(section);
    });
    const button=page.document.createElement('button');button.textContent='Print / Save as PDF';button.onclick=()=>page.print();page.document.body.prepend(button);
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
      <Link className="rounded-xl bg-brand-yellow p-3 font-bold" to={'/drawing-board?'+new URLSearchParams({mode:'Worksheet',custom:words.split(/[,\n]/)[0].trim().slice(0,30) || 'cat'})}>Draw custom worksheet</Link>
      <button className="rounded-xl border p-3 font-bold" onClick={printPack}>Create printable pack</button>
    </div>
    <p role="alert">{error}</p>
    <p className="mt-3 text-slate-600">The drawing worksheet uses the first entry. Printable packs include up to 30 entries, one practice page each. Use the print dialog to print or save as PDF.</p>
    <h2 className="text-xl font-bold mt-10 mb-4">Practice mistakes again</h2>
    {!mistakes.length && <p>Complete a quiz to build a revision session from incorrect answers.</p>}
    {mistakes.map(session=><Link key={session.sessionId} className="block border rounded-xl p-4 mb-3" to={'/exam/'+session.subjectId+'/'+session.topicId+'?mode=practice&mistakes='+encodeURIComponent(session.sessionId)}>Retry mistakes · {session.topicTitle}</Link>)}
  </article>;
}
