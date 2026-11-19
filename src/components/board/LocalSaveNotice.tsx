import { useEffect, useState } from 'react';
export function LocalSaveNotice() {
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const handle=()=>setFailed(true);
    window.addEventListener('work-save-error',handle);
    return ()=>window.removeEventListener('work-save-error',handle);
  },[]);
  return failed ? <div role="alert" className="fixed bottom-4 left-4 right-4 z-50 rounded-xl border bg-white p-4 shadow-lg">Device storage is full or unavailable. Download your drawing before leaving.<button className="ml-4 underline" onClick={()=>setFailed(false)}>Dismiss</button></div> : null;
}
