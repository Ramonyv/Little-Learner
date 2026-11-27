import { GameDetailHeader } from '../components/layout/GameDetailHeader';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './games.css';
import { useSession } from '../context/SessionContext';
import { playEffect } from '../utils/soundEffects';
import { useRef } from 'react';
import {
  analytics,
  toDurationBucket,
  toSafeSlug,
  type AchievementId,
  type BadgeId,
  type DifficultyId,
} from '../analytics';

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
    <Link className="catalog-card" to="/games/sliding-puzzle" aria-label="Play Sliding Puzzle" onClick={() => analytics.track('activity_selected', { activity_type: 'game', activity_id: 'sliding_puzzle', source_section: 'games' })}>
      <div className="catalog-tools"><span className="catalog-category catalog-category-puzzles">Puzzles <img src="/puzzle-ui/category-puzzles.svg" alt="" /></span><i><img src="/puzzle-ui/play.svg" alt="" /></i></div>
      <div className="catalog-preview">
        <img className="catalog-thumbnail" src="/Game Thumbnails/sliding-puzzle-thumb.webp" alt="Sliding Puzzle" width="320" height="180" />
      </div>
      <h2>Sliding Puzzle</h2><p>Slide the tiles to complete the picture!</p>
    </Link>
    <Link className="catalog-card catalog-runner" to="/games/hanuman-runner" aria-label="Play Hanuman Run" onClick={() => analytics.track('activity_selected', { activity_type: 'game', activity_id: 'hanuman_runner', source_section: 'games' })}>
      <div className="catalog-tools"><span className="catalog-category catalog-category-adventure">Adventure <img src="/puzzle-ui/category-adventure.svg" alt="" /></span><i><img src="/puzzle-ui/play.svg" alt="" /></i></div>
      <div className="catalog-preview"><img className="catalog-thumbnail" src="/Game Thumbnails/hanuman-run-thumb.webp" alt="Hanuman Run" width="320" height="180" /></div>
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

async function cropImageToSquareUrl(file: File): Promise<string> {
  const srcUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = srcUrl;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;
    const outSize = Math.min(720, Math.max(360, side));
    const canvas = document.createElement('canvas');
    canvas.width = outSize;
    canvas.height = outSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.drawImage(img, sx, sy, side, side, 0, 0, outSize, outSize);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/webp', 0.9));
    if (!blob) throw new Error('Export failed');
    return URL.createObjectURL(blob);
  } finally {
    URL.revokeObjectURL(srcUrl);
  }
}

export function Puzzle() {
  const [pictureIndex, setPictureIndex] = useState(0);
  const [customArt, setCustomArt] = useState<string | null>(null);
  const [useCustomArt, setUseCustomArt] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const name = useCustomArt && customArt ? 'My Photo' : pictures[pictureIndex].name;
  const art = useCustomArt && customArt ? customArt : pictures[pictureIndex].src;
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
  const exitStateRef = useRef({ started: 0, solved: false, size: 3 });
  exitStateRef.current = { started, solved, size };
  useEffect(() => () => {
    const state = exitStateRef.current;
    if (state.started > 0 && !state.solved) {
      analytics.track('game_exited', {
        game_id: 'sliding_puzzle',
        difficulty: `${state.size}x${state.size}` as DifficultyId,
        exit_reason: 'navigation',
      });
    }
  }, []);
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
    const difficulty = `${n}x${n}` as DifficultyId;
    if (n !== size) {
      analytics.track('difficulty_selected', { game_id: 'sliding_puzzle', difficulty });
    }
    if (cue === 'puzzle-shuffle') {
      if (started > 0 && !solved) {
        analytics.track('game_restarted', { game_id: 'sliding_puzzle', difficulty, reason: 'shuffle' });
      }
      analytics.track('game_started', {
        game_id: 'sliding_puzzle',
        difficulty,
        template_id: toSafeSlug(name),
        is_restart: started > 0,
      });
    } else if (started > 0 && !solved && n === size) {
      analytics.track('game_restarted', { game_id: 'sliding_puzzle', difficulty, reason: 'reset' });
    }
    setNudged(false);
    setShowNudge(false);
    setHints(3);
    setSlidingTile(null);
    setSize(n); setInitial(board); setTiles(board); setMoves(0);
    setStarted(0); setSeconds(0); setHint(false);
  }
  function move(slot: number) {
    if (hint || solved || !neighbors(empty, size).includes(slot)) return;
    const difficulty = `${size}x${size}` as DifficultyId;
    const templateId = toSafeSlug(name);
    if (!started) {
      analytics.track('game_started', {
        game_id: 'sliding_puzzle',
        difficulty,
        template_id: templateId,
      });
    }
    const next = [...tiles];
    [next[empty], next[slot]] = [next[slot], next[empty]];
    setSlidingTile(tiles[slot]);
    void playEffect("tile-slide");
    if (next.every((tile,i) => tile === i)) {
      recordPuzzleWin();
      const durationSec = started ? Math.max(1, Math.floor((Date.now() - started) / 1000)) : 1;
      analytics.track('game_completed', {
        game_id: 'sliding_puzzle',
        difficulty,
        template_id: templateId,
        duration_bucket: toDurationBucket(durationSec),
      });
      analytics.track('level_completed', {
        game_id: 'sliding_puzzle',
        level: size - 2,
      });
      const nextStars = Math.min(3, wins + 1);
      if (nextStars > wins) {
        analytics.track('badge_earned', {
          badge_id: `puzzle_star_${nextStars}` as BadgeId,
          source_activity: 'sliding_puzzle',
        });
        analytics.track('achievement_unlocked', {
          achievement_id: `puzzle_master_${nextStars}` as AchievementId,
          source_activity: 'sliding_puzzle',
        });
      }
      window.setTimeout(() => void playEffect("activity-complete"), 190);
    }
    setTiles(next); setMoves(moves + 1);
    if (!started) setStarted(Date.now());
  }
  useEffect(() => () => {
    if (customArt) URL.revokeObjectURL(customArt);
  }, [customArt]);

  function choosePicture(index: number) {
    analytics.track('template_selected', {
      template_category: 'puzzle_picture',
      template_id: toSafeSlug(pictures[index].name),
    });
    setUseCustomArt(false);
    setPictureIndex(index);
    restart(size, ordered(size));
  }

  async function handleCustomPhotoUpload(file?: File) {
    if (!file || !/^image\/(png|jpeg|webp|gif)$/i.test(file.type)) return;
    try {
      const nextUrl = await cropImageToSquareUrl(file);
      setCustomArt(nextUrl);
      setUseCustomArt(true);
      analytics.track('template_selected', {
        template_category: 'puzzle_picture',
        template_id: 'custom_upload',
      });
      restart(size, ordered(size));
    } catch {
      /* Ignore unreadable image files */
    }
  }
  const sizes = [3,4,5];
  const stars = Math.min(3,wins);
  return <section className="puzzle">
    <GameDetailHeader title="Sliding Puzzle" description="Slide the tiles into place to complete the picture" icon="/Tools and Game Icons/Slide Puzzle App icon.webp">
      <button
        type="button"
        className="game-sound-btn"
        aria-label={soundOn ? 'Sound on' : 'Sound off'}
        aria-pressed={soundOn}
        onClick={() => {
          const next = !soundOn;
          setSoundOn(next);
          analytics.track('feature_used', { feature_id: next ? 'sound_on' : 'sound_off', section_id: 'sliding_puzzle' });
        }}
      >
        <img src={soundOn ? '/Hanuman Run/Game HUD/Sound On-Ic.svg' : '/Hanuman Run/Game HUD/Sound Off-ic.svg'} alt="" />
      </button>
      <div className="p-status"><b>Level {size-2}</b><b aria-label={stars+' stars'}>{'★'.repeat(stars)}{'☆'.repeat(3-stars)}</b><b>{icon('Frame11')}{String(Math.floor(seconds/60)).padStart(2,'0')}:{String(seconds%60).padStart(2,'0')}</b></div></GameDetailHeader>
    <div className="p-stage"><div className="p-columns">
    <input
      ref={uploadInputRef}
      type="file"
      accept="image/png,image/jpeg,image/webp,image/gif"
      hidden
      onChange={(e) => {
        void handleCustomPhotoUpload(e.target.files?.[0]);
        e.target.value = '';
      }}
    />
    <section className="p-picker"><h2>Choose Picture</h2><div>
      <button type="button" className="p-upload-card" onClick={() => uploadInputRef.current?.click()}>
        <span className="p-upload-icon" aria-hidden="true">📷</span>
        <span>{customArt ? 'New Photo' : 'Upload Photo'}</span>
      </button>
      {customArt && (
        <button
          type="button"
          aria-pressed={useCustomArt}
          onClick={() => {
            setUseCustomArt(true);
            restart(size, ordered(size));
          }}
        >
          <img src={customArt} alt="My uploaded puzzle" />My Photo{useCustomArt && icon('Frame')}
        </button>
      )}
      {order.map((index,i)=><button key={index} aria-pressed={!useCustomArt && pictureIndex===index} onClick={()=>choosePicture(index)}>
      <img loading="lazy" src={i<4?'/puzzle-ui/imgChibiGaneshaOnAPinkLotus'+(i+1)+'.webp':pictures[index].src} alt=""/>{pictures[index].name}{!useCustomArt && pictureIndex===index && icon('Frame')}</button>)}</div></section>
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
      <label>Picture: <select value={useCustomArt ? 'custom' : pictureIndex} onChange={e=>{if(e.target.value==='custom'){setUseCustomArt(true);restart(size,ordered(size));}else{choosePicture(Number(e.target.value));}}}>{customArt && <option value="custom">My Photo</option>}{order.map(i=><option key={i} value={i}>{pictures[i].name}</option>)}</select></label>
      <button type="button" className="p-mobile-upload" onClick={() => uploadInputRef.current?.click()} aria-label="Upload your own photo">📷</button></div>
      <div className="p-actions"><button onClick={()=>restart(size,shuffle(size),"puzzle-shuffle")}>{icon('Frame4')}Shuffle</button>
      <button disabled={!hint && hints===0} onClick={()=>{void playEffect(hint?"ui-tap":"hint-reveal");if(!hint){setHints(hints-1);analytics.track('feature_used',{feature_id:'hint',section_id:'sliding_puzzle'});}setHint(!hint);}}>{icon('Frame5')}{hint?'Hide hint':'Hint ('+hints+')'}</button>
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
