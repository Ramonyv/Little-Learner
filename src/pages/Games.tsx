import { GameDetailHeader } from '../components/layout/GameDetailHeader';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './games.css';
import { useSession } from '../context/SessionContext';
import { playEffect } from '../utils/soundEffects';

const pictures = [
  {
    "name": "Ganesha",
    "src": "/ganesha-puzzle.webp"
  },
  {
    "name": "Pumpkin Party",
    "src": "/Slide Puzzle Game/Chibi Halloween Pumpkin Party.webp"
  },
  {
    "name": "Hanuman",
    "src": "/Slide Puzzle Game/Chibi Hanuman with Golden Gada.webp"
  },
  {
    "name": "Krishna",
    "src": "/Slide Puzzle Game/Chibi Krishna and Happy Calf.webp"
  },
  {
    "name": "Shri Ram",
    "src": "/Slide Puzzle Game/Chibi Lord Ram with Golden Bow.webp"
  },
  {
    "name": "Namaste",
    "src": "/Slide Puzzle Game/Chibi Monk Politician in Namaste.webp"
  },
  {
    "name": "Neem Karoli Baba and Hanuman",
    "src": "/Slide Puzzle Game/Chibi Neem Karoli Baba with Hanuman Companion.webp"
  },
  {
    "name": "Ram and Sita’s Wedding",
    "src": "/Slide Puzzle Game/Chibi Ram and Sita Wedding Mandap.webp"
  },
  {
    "name": "Santa and Reindeer",
    "src": "/Slide Puzzle Game/Chibi Santa and Reindeer Christmas Cheer.webp"
  },
  {
    "name": "Ram Mandir",
    "src": "/Slide Puzzle Game/Colourful Ram Mandir-Style Temple Illustration.webp"
  },
  {
    "name": "Under the Flowering Tree",
    "src": "/Slide Puzzle Game/Joyful Deities Beneath the Flowering Tree.webp"
  },
  {
    "name": "Shiva",
    "src": "/Slide Puzzle Game/Kawaii Shiva with Nandi and Lingam.webp"
  }
];

export function Games() {
  return <section className="games-catalog">
    <nav className="catalog-crumb" aria-label="Breadcrumb"><Link to="/">Home</Link><span aria-hidden="true">❯</span><b aria-current="page">Games</b></nav>
    <h1 className="catalog-title">Games for kids</h1>
    <div className="catalog-list">
    <Link className="catalog-card" to="/games/sliding-puzzle" aria-label="Play Sliding Puzzle">
      <div className="catalog-tools"><span className="catalog-category catalog-category-puzzles">Puzzles <img src="/puzzle-ui/category-puzzles.svg" alt="" /></span><i><img src="/puzzle-ui/play.svg" alt="" /></i></div>
      <div className="catalog-preview">
        <img className="catalog-thumbnail" src="/Slide Puzzle Game/Ganesha Card Thumnail.svg" alt="Ganesha sliding puzzle" width="178" height="197" />
      </div>
      <h2>Sliding Puzzle</h2><p>Slide the tiles to complete the picture!</p>
    </Link>
    <Link className="catalog-card catalog-runner" to="/games/hanuman-runner" aria-label="Play Hanuman Runner">
      <div className="catalog-tools"><span className="catalog-category catalog-category-adventure">Adventure <img src="/puzzle-ui/category-adventure.svg" alt="" /></span><i><img src="/puzzle-ui/play.svg" alt="" /></i></div>
      <div className="catalog-preview"><img className="catalog-thumbnail" src="/Hanuman Run/Hanuman Run Thumbnail.svg" alt="" width="296" height="226" /></div>
      <h2>Hanuman Run</h2><p>Leap over obstacles and collect Ram Coins!</p>
    </Link>
    </div>
  </section>;
}

function neighbors(slot: number, size: number) {
  return Array.from({ length: size * size }, (_, i) => i).filter(i =>
    Math.abs(i % size - slot % size) + Math.abs(Math.floor(i / size) - Math.floor(slot / size)) === 1);
}

function shuffle(size: number) {
  const tiles = Array.from({ length: size * size }, (_, i) => i);
  let blank = tiles.length - 1;
  let previous = -1;
  for (let step = 0; step < (size === 3 ? 9 : 35); step++) {
    const choices = neighbors(blank, size).filter(i => i !== previous);
    const next = choices[Math.floor(Math.random() * choices.length)];
    [tiles[blank], tiles[next]] = [tiles[next], tiles[blank]];
    previous = blank;
    blank = next;
  }
  return tiles;
}

const order = [0, 3, 4, 11, 2, 6, 7, 9, 10, 5, 1, 8];
const ordered = (n: number) => Array.from({length:n*n}, (_, i) => i);
function icon(asset: string) {
  return <img className="p-icon" alt="" src={'/puzzle-ui/img' + asset + '.svg'} />;
}

export function Puzzle() {
  const [pictureIndex, setPictureIndex] = useState(0);
  const { name, src: art } = pictures[pictureIndex];
  const [size, setSize] = useState(3);
  const [initial, setInitial] = useState(() => ordered(3));
  const [tiles, setTiles] = useState(initial);
  const [slidingTile, setSlidingTile] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hint, setHint] = useState(false);
  const {soundOn, setSoundOn} = useSession();
  const [hints,setHints] = useState(3);
  const { puzzleWins: wins, recordPuzzleWin } = useSession();
  const solved = moves > 0 && tiles.every((tile, i) => tile === i);
  const empty = tiles.indexOf(tiles.length - 1);
  const last = tiles.length - 1;
  const oneMoveAway = neighbors(empty, size).includes(last) && tiles[last] === empty &&
    tiles.every((tile, slot) => slot === last || slot === empty || tile === slot);
  const [showNudge, setShowNudge] = useState(false);
  const [nudged, setNudged] = useState(false);
  useEffect(() => {
    if (oneMoveAway && !nudged && moves > 0) {
      setNudged(true);
      setShowNudge(true);
    }
  }, [oneMoveAway, nudged, moves]);
  useEffect(() => {
    if (!showNudge) return;
    const timeout = window.setTimeout(() => setShowNudge(false), 2400);
    return () => window.clearTimeout(timeout);
  }, [showNudge]);
  useEffect(() => {
    if (!started || solved) return;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [started, solved]);
  function restart(n: number, board: number[], cue: "ui-tap" | "puzzle-shuffle" = "ui-tap") {
    void playEffect(cue);
    setNudged(false);
    setShowNudge(false);
    setHints(3);
    setSlidingTile(null);
    setSize(n); setInitial(board); setTiles(board); setMoves(0);
    setStarted(0); setSeconds(0); setHint(false);
  }
  function move(slot: number) {
    if (hint || solved || !neighbors(empty, size).includes(slot)) return;
    const next = [...tiles];
    [next[empty], next[slot]] = [next[slot], next[empty]];
    setSlidingTile(tiles[slot]);
    void playEffect("tile-slide");
    if (next.every((tile,i) => tile === i)) {
      recordPuzzleWin();
      window.setTimeout(() => void playEffect("activity-complete"), 190);
    }
    setTiles(next); setMoves(moves + 1);
    if (!started) setStarted(Date.now());
  }
  function choosePicture(index: number) {
    setPictureIndex(index);
    restart(size, ordered(size));
  }
  const sizes = [3,4,5];
  const stars = Math.min(3,wins);
  return <section className="puzzle">
    <GameDetailHeader title="Sliding Puzzle" description="Slide the tiles into place to complete the picture" icon="/puzzle-ui/imgSlidingPuzzle.svg">
      {[false,true].map((on,i)=><button key={i} className="p-sound" aria-label={on?'Enable sound':'Mute sound'} aria-pressed={soundOn===on} onClick={()=>setSoundOn(on)}>{icon('Frame'+(9+i))}</button>)}
      <div className="p-status"><b>Level {size-2}</b><b aria-label={stars+' stars'}>{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</b><b>{icon('Frame11')}{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</b></div></GameDetailHeader>
    <div className="p-stage"><div className="p-columns">
    <section className="p-picker"><h2>Choose Picture</h2><div>{order.map((index,i)=><button key={index} aria-pressed={pictureIndex===index} onClick={()=>choosePicture(index)}>
      <img loading="lazy" src={i<4?'/puzzle-ui/imgChibiGaneshaOnAPinkLotus'+(i+1)+'.webp':pictures[index].src} alt=""/>{pictures[index].name}{pictureIndex===index && icon('Frame')}</button>)}</div></section>
    <div className="p-frame">
      {showNudge && oneMoveAway && !hint && <div className="p-nudge" role="status">{icon('RewardBadge')} One more slide!</div>}    <div className="puzzle-board" aria-label={name + ' sliding puzzle'}>
      {!solved && <span className="p-empty" aria-hidden="true" style={{left:(empty%size)*100/size+'%',top:Math.floor(empty/size)*100/size+'%',width:100/size+'%',height:100/size+'%'}} />}
      {/* Keep each tile mounted in image order while its position changes. */}
      {Array.from({ length: tiles.length }, (_, id) => {
        const slot = tiles.indexOf(id);
        if (id === tiles.length - 1 && !solved) return null;
        return (
        <button key={id} className={slidingTile === id ? "sliding-tile" : undefined} aria-label={'Tile ' + (id + 1)} disabled={hint || solved || !neighbors(empty,size).includes(slot)} onClick={() => move(slot)}
          style={{ width: 100/size+'%', height: 100/size+'%', transform: 'translate('+slot%size*100+'%, '+Math.floor(slot/size)*100+'%)', backgroundImage: 'url("'+art+'")', backgroundSize: size*100+'% '+size*100+'%', backgroundPosition: id%size/(size-1)*100+'% '+Math.floor(id/size)/(size-1)*100+'%' }} />
        );
      })}
      {hint && <img src={art} alt={'Completed picture of ' + name} />}
    </div>
</div>
    <aside className="p-panel"><div className="p-desktop-level"><h2>Difficulty</h2><div>{sizes.map(n=><button key={n} aria-pressed={size===n} onClick={()=>restart(n,ordered(n))}>{icon('Frame'+(n-2))}{n}×{n}</button>)}</div></div>
      <div className="p-mobile-select"><label>Difficulty: <select value={size} onChange={e=>{const n=Number(e.target.value);restart(n,ordered(n));}}>{sizes.map(n=><option value={n} key={n}>{n}×{n}</option>)}</select></label>
      <label>Picture: <select value={pictureIndex} onChange={e=>choosePicture(Number(e.target.value))}>{order.map(i=><option key={i} value={i}>{pictures[i].name}</option>)}</select></label></div>
      <div className="p-actions"><button onClick={()=>restart(size,shuffle(size),"puzzle-shuffle")}>{icon('Frame4')}Shuffle</button>
      <button disabled={!hint && hints===0} onClick={()=>{void playEffect(hint?"ui-tap":"hint-reveal");if(!hint)setHints(hints-1);setHint(!hint);}}>{icon('Frame5')}{hint?'Hide hint':'Hint ('+hints+')'}</button>
      <button onClick={()=>restart(size,initial)}>{icon('Frame6')}Reset</button></div>
      <div className="p-moves">{icon('Frame7')}{solved?'Puzzle complete!':'Moves: '+moves}</div>
    </aside></div></div>
    <section className="p-guide" aria-labelledby="play-guide-title">
      <h2 id="play-guide-title">How to play</h2>
      <div className="p-guide-answers">
        <div>
          <h3>How do you play the sliding picture puzzle?</h3>
          <p>Choose a picture and tap Shuffle. Tap a tile beside the empty space to slide it in. Keep going until the picture is complete. Tap Hint for a peek.</p>
        </div>
        <div>
          <h3>Which puzzle size should my child start with?</h3>
          <p>Start with 3×3. It has eight movable tiles and one empty space. When that feels easy, try 4×4 or 5×5.</p>
        </div>
      </div>
    </section>
  </section>;
}
