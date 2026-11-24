import { Link } from 'react-router-dom';
import { GameDetailHeader } from '../components/layout/GameDetailHeader';
import { useEffect, useReducer, useRef, useState } from 'react';
import { useSession } from '../context/SessionContext';
import { RunnerAudio } from './audio';
import { Game, scenes } from './engine';
import { draw, loadArt } from './art';
import './runner.css';

const root = '/Hanuman Run/';
const hud = (name: string) => root + 'Game HUD/' + name + '.svg';
const hero = (name: string) =>
  root + 'Hanuman Ji - 5 Movement Steps/' + name + '.svg';
const bestKey = 'little-learner.hanuman-runner.best';
function readBest() {
  try {
    return Number(localStorage.getItem(bestKey)) || 0;
  } catch {
    return 0;
  }
}
export default function Runner() {
  const [audio] = useState(() => new RunnerAudio());
  const newGame = () => new Game((cue) => void audio.play(cue));
  const canvas = useRef<HTMLCanvasElement>(null);
  const game = useRef<Game>(null!);
  if (!game.current) game.current = newGame();
  const [, refresh] = useReducer((n) => n + 1, 0);
  const [ready, setReady] = useState(false),
    [failed, setFailed] = useState(false),
    [attempt, retry] = useReducer((n) => n + 1, 0);
  const [best, setBest] = useState(readBest);
  const { soundOn, setSoundOn } = useSession();
  useEffect(() => {
    if (soundOn) audio.preload();
    return () => audio.stop();
  }, [audio, soundOn]);
  useEffect(() => {
    const el = canvas.current!,
      ctx = el.getContext('2d');
    if (!ctx) {
      setFailed(true);
      return;
    }
    let active = true,
      id = 0,
      last = 0,
      carry = 0,
      reported = 0,
      slow = 0;
    let width = 0,
      height = 0,
      scale = 1;
    function resize() {
      const box = el.getBoundingClientRect(),
        ratio = Math.min(devicePixelRatio || 1, 2);
      scale = Math.min(box.height / 360, box.width / 490);
      width = box.width / scale;
      height = box.height / scale;
      el.width = Math.round(box.width * ratio);
      el.height = Math.round(box.height * ratio);
      ctx!.setTransform(el.width / width, 0, 0, el.height / height, 0, 0);
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    loadArt()
      .then((images) => {
        if (!active) return;
        setReady(true);
        const tick = (now: number) => {
          const g = game.current,
            elapsed = last ? (now - last) / 1000 : 0;
          last = now;
          if (elapsed > 0.026) slow = Math.min(60, slow + 1);
          else slow = Math.max(0, slow - 0.2);
          g.lowEffects = slow > 15 || reducedMotion.matches;
          carry += Math.min(0.1, elapsed);
          const before = g.mode;
          while (carry >= 1 / 120) {
            g.step(1 / 120, Math.min(130, width * 0.2));
            carry -= 1 / 120;
          }
          if (before === 'running' && g.mode !== before) {
            setBest((previous) => {
              const value = Math.max(previous, g.score);
              try {
                localStorage.setItem(bestKey, String(value));
              } catch {
                /* Storage is optional. */
              }
              return value;
            });
          }
          draw(ctx, width, height, g, images, g.lowEffects);
          if (
            (g.mode === 'running' && now - reported > 75) ||
            before !== g.mode
          ) {
            refresh();
            reported = now;
          }
          id = requestAnimationFrame(tick);
        };
        id = requestAnimationFrame(tick);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    const pause = () => {
      if (game.current.mode === 'running') {
        audio.stop();
        game.current.pause();
        refresh();
      }
    };
    const key = (e: KeyboardEvent) => {
      const g = game.current;
      if (e.code === 'KeyP' && !e.repeat) {
        audio.stop();
        g.pause();
        refresh();
        return;
      }
      if (
        g.mode === 'running' &&
        (e.code === 'Space' || e.code === 'ArrowUp')
      ) {
        e.preventDefault();
        if (!e.repeat) g.press();
      }
    };
    const release = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') game.current.held = false;
    };
    const visibility = () => {
      if (document.hidden) pause();
    };
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', release);
    window.addEventListener('blur', pause);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      active = false;
      cancelAnimationFrame(id);
      observer.disconnect();
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', release);
      window.removeEventListener('blur', pause);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [attempt]);
  const g = game.current;
  function start() {
    audio.stop();
    game.current = newGame();
    game.current.mode = 'running';
    canvas.current?.focus();
    refresh();
  }
  function toggle() {
    audio.stop();
    g.pause();
    refresh();
    if (g.mode === 'running') canvas.current?.focus();
  }
  const title =
    g.mode === 'ready'
      ? 'Ready to run?'
      : g.mode === 'paused'
        ? 'Game paused'
        : 'Game over';
  return (
    <main className="runner">
      <GameDetailHeader title="Hanuman Runner" description="Jump over traps and collect Ram Coins as you run." icon={hud('Hanuma Run Game Icon')}>
        <button className="run-sound" onClick={() => setSoundOn(!soundOn)} aria-label={soundOn ? 'Sound on' : 'Sound off'} aria-pressed={soundOn}>
          <img src={hud(soundOn ? 'Sound On-Ic' : 'Sound Off-ic')} alt="" />
        </button>
      </GameDetailHeader>
      <section className="run-stage" aria-label={scenes[g.scene]}>
        <div className="run-hud">
          <div className="run-health" aria-label={g.hearts + ' hearts'}>
            <img src={hud('PlayerAvatar')} alt="" />
            {[1, 2, 3].map((i) => (
              <img
                key={i}
                src={hud(
                  i <= g.hearts ? 'HealthHeartFilled' : 'HealthHeartEmpty',
                )}
                alt=""
              />
            ))}
          </div>
          <div className="run-brand">
            <img className="run-logo" src={hud('Hanuman Run Logo')} alt="Hanuman Runner" />
            <span>A Product of <strong>Yogicxx</strong> by raman</span>
          </div>
          <div className="run-stats">
            <b><img src={hud('Scene')} alt=""/><span><small>Mode</small>{scenes[g.scene]}</span></b>
            <b><img src={hud('Distance')} alt=""/><span><small>Distance</small>{Math.floor(g.x / 10)}m</span></b>
            <b><img src={hud('Best')} alt=""/><span><small>Best</small>{best}</span></b>
          </div>
          <span className="run-counter">
            <img
              src={root + 'Collectibles : Coins (Pickups)/Coin_Basic.svg'}
              alt="Coins"
            />
            <span>{g.total}</span>
          </span>

          <button
            aria-label="Pause game"
            disabled={g.mode !== 'running'}
            onClick={toggle}
          >
            <img src={hud(g.mode === 'paused' ? 'Play-ic' : 'Puase-ic')} alt="" />
          </button>
        </div>
        <div className="run-arena">
        <canvas
          tabIndex={0}
          aria-label="Hanuman Runner play area"
          ref={canvas}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            g.press();
          }}
          onPointerUp={() => {
            g.held = false;
          }}
          onPointerCancel={() => {
            g.held = false;
          }}
        />
        {g.mode === 'running' && (
          <div className="run-powers">
            {[
              [g.flight, 'Flight'],
              [g.double, '2× coins'],
              [g.magnet, 'Magnet'],
            ].map(
              ([n, label]) =>
                Number(n) > 0 && (
                  <span key={label}>
                    {label} {Math.ceil(Number(n))}s
                  </span>
                ),
            )}
            {g.shield && <span>Shield</span>}
          </div>
        )}
        {g.mode !== 'running' && (
          <div className="run-overlay">
            <section
              className="run-modal"
              data-mode={g.mode}
              aria-label={title}
            >
              <div className="run-popup-art" aria-hidden="true">
                <img className="help-cloud left" src={hud('HelpCloud')} alt=""/>
                <img className="help-cloud right" src={hud('HelpCloudSmall')} alt=""/>
                <img className="run-illustration" src={g.mode === 'over' ? hud('ResultHanuman') : hero(g.mode === 'ready' ? '08 FLy GLide' : '02 Idle-Neautral')} alt=""/>
                {[0,1].map(i=><img key={i} className={'help-coin coin-'+i} src={root+'Collectibles : Coins (Pickups)/Coin_Basic.svg'} alt=""/>)}
              </div>
              {g.mode === 'paused' && (
                <Link className="run-close" aria-label="Back to games" to="/games"><img src={hud('CloseMark')} alt="" /></Link>
              )}
              <h2>{title}</h2>
              {g.mode === 'over' ? (
                <div className="run-results">
                  <div><img src={hud('ResultScore')} alt="" /><strong>{g.score}</strong>Score</div>
                  <div><img src={hud('ResultCoin')} alt="" /><strong>{g.total}</strong>Coins</div>
                </div>
              ) : <p>
                {g.mode === 'ready'
                  ? 'Help Hanuman collect Ram Coins and avoid traps!'
                  : scenes[g.scene] +
                    ' · Score ' +
                    g.score +
                    ' · ' +
                    g.total +
                    ' coins'}
              </p>}
              {failed ? (
                <button
                  onClick={() => {
                    setFailed(false);
                    retry();
                  }}
                >
                  Retry loading artwork
                </button>
              ) : (
                <button
                  className="run-primary"
                  disabled={!ready}
                  onClick={g.mode === 'paused' ? toggle : start}
                >
                  {ready && (
                    <img
                      src={hud('Play')}
                      alt=""
                      style={{ width: 22, display: 'inline', marginRight: 6 }}
                    />
                  )}
                  {!ready
                    ? 'Loading artwork…'
                    : g.mode === 'paused'
                      ? 'Resume'
                      : 'Start running'}
                </button>
              )}
              {g.mode === 'paused' && <button onClick={start}>Restart run</button>}
              {g.mode === 'ready' && <>
                <h3 className="run-guide-title">How to play?</h3>
                <div className="run-guide">
                  <div className="run-keys"><div><kbd>↑</kbd><kbd>Space</kbd><kbd>P</kbd></div><p>Tap, Space or ↑ to jump. Hold to rise during flight. Release
                    to descend. Press P to pause.
                  </p></div>
                  <ul>
                    {[
                      ['Basic', '1 coin'],
                      ['Golden', '5 coins'],
                      ['Star', '10 coins'],
                      ['Shield', 'Block one hit'],
                      ['Glow', 'Double coins for 8s'],
                      ['Winged', 'Attract coins for 6s'],
                      ['Flying (Fly_Powerup)', 'Fly for 6s'],
                    ].map(([name, description]) => (
                      <li key={name}>
                        <img
                          alt={name.split(' ')[0]}
                          src={
                            root +
                            'Collectibles : Coins (Pickups)/Coin_' +
                            name +
                            '.svg'
                          }
                        />
                        {description}
                      </li>
                    ))}
                  </ul>
                </div>
              </>}
            </section>
          </div>
        )}
        </div>
      </section>
      <section className="p-guide" aria-labelledby="runner-guide-title">
        <h2 id="runner-guide-title">How to play</h2>
        <div className="p-guide-answers">
          <div>
            <h3>How do I play Hanuman Runner?</h3>
            <p>
              Choose Start running. Hanuman runs on his own. Tap the game, press
              Space, or press ↑ to jump over traps. Catch a Flying Coin, then
              hold to rise and release to glide down. Tap Pause or press P for a
              break.
            </p>
          </div>
          <div>
            <h3>How far can I run?</h3>
            <p>
              Endless run takes you through all three scenes and keeps going
              while you have hearts. You start with three. A hit costs one
              heart, and a Shield Coin protects you from one hit. Collect Ram
              Coins along the way to beat your best score.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
