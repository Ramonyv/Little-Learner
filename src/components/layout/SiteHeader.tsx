import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import './site-header.css';

const links = [
  ['Home', '/'], ['Games', '/games'], ['Practice', '/topics/english'],
  ['Drawing Board', '/drawing-board'], ['Progress', '/progress'], ['About', '/about'],
];
const mobileIcons: Record<string,string> = {
  Home: '/drawing-board%20page%20assets/Nav-Home-ic.svg',
  Games: '/drawing-board%20page%20assets/Nav-Games-ic.svg',
  Practice: '/drawing-board%20page%20assets/Nav-Practice-ic.svg',
  'Drawing Board': '/drawing-board%20page%20assets/Nav-Drawing-Board-ic.svg',
  Progress: '/drawing-board%20page%20assets/Nav-Progress-ic.svg',
  About: '/drawing-board%20page%20assets/Nav-About-ic.svg',
};
const compactNavigation = '(max-width: 980px), (max-width: 1024px) and (orientation: portrait)';

export function SiteHeader() {
  const { pathname } = useLocation();
  const { puzzleWins, soundOn, setSoundOn, selectedClass } = useSession();
  const [menuOpen,setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(()=>setMenuOpen(false),[pathname]);
  useEffect(()=>{
    if(!menuOpen)return;
    const previousOverflow=document.body.style.overflow;
    document.body.style.overflow='hidden';
    const closeOnEscape=(event:KeyboardEvent)=>{if(event.key==='Escape')setMenuOpen(false)};
    const closeOutside=(event:PointerEvent)=>{if(event.target instanceof Node&&!menuRef.current?.contains(event.target))setMenuOpen(false)};
    const media=window.matchMedia(compactNavigation);
    const closeOnWide=()=>{if(!media.matches)setMenuOpen(false)};
    document.addEventListener('keydown',closeOnEscape);
    document.addEventListener('pointerdown',closeOutside);
    media.addEventListener('change',closeOnWide);
    return ()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',closeOnEscape);document.removeEventListener('pointerdown',closeOutside);media.removeEventListener('change',closeOnWide)};
  },[menuOpen]);
  const isActive=(label:string,path:string)=>label==='Practice' ? /^\/(topics|intro|exam)(\/|$)/.test(pathname) : pathname===path || pathname.startsWith(path+'/');
  return <header className="site-bar"><nav aria-label="Main navigation">
    <Link to="/" aria-label="Jugnu home"><img className="site-logo" src="/Logo/Jugnu Logo V1.svg" alt="Jugnu" /></Link>
    <div className="site-links">{links.map(([label, path]) => {
      return <Link key={path} to={path} aria-current={isActive(label,path) ? 'page' : undefined}>{label}</Link>;
    })}</div>
    <div className="site-tablet-menu" ref={menuRef}><button className="site-menu-toggle" type="button" aria-label={menuOpen?'Close navigation menu':'Open navigation menu'} aria-controls="site-mobile-menu" aria-expanded={menuOpen} onClick={()=>setMenuOpen(open=>!open)}><span/><span/><span/></button>{menuOpen && <div id="site-mobile-menu" className="site-mobile-menu">{links.map(([label,path])=><Link key={label} to={path} aria-current={isActive(label,path)?'page':undefined} onClick={()=>setMenuOpen(false)}>{mobileIcons[label] && <img src={mobileIcons[label]} alt=""/>}<span>{label === 'About' ? 'About LL' : label}</span></Link>)}</div>}</div>
    <Link className="site-trophy" to="/progress" aria-label={'Progress, '+puzzleWins+' puzzle wins'}><img src="/puzzle-ui/imgGroup46.svg" alt="" />{puzzleWins}</Link>
    <details className="site-profile" key={pathname}><summary aria-label="Learner menu"><img src="/puzzle-ui/imgUserProfile.svg" alt="" /></summary>
      <div><strong>Class {selectedClass}</strong><Link to="/my-work">My Work</Link><button aria-pressed={soundOn} onClick={()=>setSoundOn(!soundOn)}>Sound {soundOn?'on':'off'}</button></div>
    </details>
  </nav></header>;
}
