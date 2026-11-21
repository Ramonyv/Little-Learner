import { Link, useLocation } from 'react-router-dom';
import { useSession } from '../../context/SessionContext';
import './site-header.css';

const links = [
  ['Home', '/'], ['Games', '/games'], ['Practice', '/topics/english'],
  ['Drawing Board', '/drawing-board'], ['Progress', '/progress'], ['About', '/about'],
];

export function SiteHeader() {
  const { pathname } = useLocation();
  const { puzzleWins, soundOn, setSoundOn, selectedClass } = useSession();
  return <header className="site-bar"><nav aria-label="Main navigation">
    <Link to="/" aria-label="Little Learner home"><img className="site-logo" src="/Logo.svg" alt="Little Learner" /></Link>
    <div className="site-links">{links.map(([label, path]) => {
      const active = label === 'Practice' ? /^\/(topics|intro|exam)(\/|$)/.test(pathname)
        : pathname === path || pathname.startsWith(path + '/');
      return <Link key={path} to={path} aria-current={active ? 'page' : undefined}>{label}</Link>;
    })}</div>
    <Link className="site-trophy" to="/progress" aria-label={'Progress, '+puzzleWins+' puzzle wins'}><img src="/puzzle-ui/imgGroup46.svg" alt="" />{puzzleWins}</Link>
    <details className="site-profile" key={pathname}><summary aria-label="Learner menu"><img src="/puzzle-ui/imgUserProfile.svg" alt="" /></summary>
      <div><strong>Class {selectedClass}</strong><Link to="/my-work">My Work</Link><button aria-pressed={soundOn} onClick={()=>setSoundOn(!soundOn)}>Sound {soundOn?'on':'off'}</button></div>
    </details>
  </nav></header>;
}
