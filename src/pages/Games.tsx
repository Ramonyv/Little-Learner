import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './games.css';

const pictures = [
  {
    "name": "Lord Ganesha",
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
    "name": "Krishna and the Calf",
    "src": "/Slide Puzzle Game/Chibi Krishna and Happy Calf.webp"
  },
  {
    "name": "Lord Ram",
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
    "name": "Shiva and Nandi",
    "src": "/Slide Puzzle Game/Kawaii Shiva with Nandi and Lingam.webp"
  }
];

export function Games() {
  return <section className="games-library"><h1>Games</h1>
    <Link className="game-cover" to="/games/sliding-puzzle"><img src={pictures[0].src} alt="Ganesha sitting on a pink lotus" /><strong>Sliding Puzzle <span aria-hidden="true">↗</span></strong></Link>
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

export function Puzzle() {
  const [pictureIndex, setPictureIndex] = useState(0);
  const { name, src: art } = pictures[pictureIndex];
  const [size, setSize] = useState(3);
  const [initial, setInitial] = useState(() => shuffle(3));
  const [tiles, setTiles] = useState(initial);
  const [slidingTile, setSlidingTile] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [started, setStarted] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [hint, setHint] = useState(false);
  const solved = tiles.every((tile, i) => tile === i);
  const empty = tiles.indexOf(tiles.length - 1);
  useEffect(() => {
    if (!started || solved) return;
    const timer = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [started, solved]);
  function restart(n: number, board: number[]) {
    setSlidingTile(null);
    setSize(n); setInitial(board); setTiles(board); setMoves(0);
    setStarted(0); setSeconds(0); setHint(false);
  }
  function move(slot: number) {
    if (hint || solved || !neighbors(empty, size).includes(slot)) return;
    const next = [...tiles];
    [next[empty], next[slot]] = [next[slot], next[empty]];
    setSlidingTile(tiles[slot]);
    setTiles(next); setMoves(moves + 1);
    if (!started) setStarted(Date.now());
  }
  return <section className="puzzle"><Link to="/games">← Games</Link><div className="puzzle-layout">
    <header><h1>Sliding Puzzle</h1><p>Tap a tile beside the empty space to complete the picture.</p></header>
    <div className="puzzle-board" aria-label={name + ' sliding puzzle'}>
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
    <aside>
      {solved && <h2 role="status">★ You did it!</h2>}
      <label className="puzzle-picture">Picture
        <select value={pictureIndex} onChange={event => {
          setPictureIndex(Number(event.target.value));
          restart(size, shuffle(size));
        }}>
          {pictures.map((picture, index) => <option key={picture.src} value={index}>{picture.name}</option>)}
        </select>
      </label>
      <label>Difficulty <select value={size} onChange={e => {const n=Number(e.target.value); restart(n,shuffle(n));}}><option value="3">3 × 3</option><option value="4">4 × 4</option></select></label>
      <p>{moves} moves · {Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</p>
      <button onClick={() => restart(size,shuffle(size))}>Shuffle</button>
      <button aria-pressed={hint} onClick={() => setHint(!hint)}>{hint ? 'Back to tiles' : 'Picture hint'}</button>
      <button onClick={() => restart(size,initial)}>Reset</button>
    </aside></div></section>;
}
