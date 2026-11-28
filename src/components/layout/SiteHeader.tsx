import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../../context/SessionContext';
import { analytics } from '../../analytics';
import { BetaBadge } from './StudioModeTabs';
import './site-header.css';

interface MegaMenuItem {
  id: string;
  name: string;
  tagline: string;
  description: string;
  path: string;
  badge: string;
  isBeta?: boolean;
  icon: string;
  iconBg: string;
  appIcon?: string;
  previewImg: string;
  cardGradient: string;
  ctaLabel: string;
}

const JUGNU_GAMES: MegaMenuItem[] = [
  {
    id: 'sliding-puzzle',
    name: 'Sliding Puzzle',
    tagline: '12 pictures + custom photo upload',
    description:
      'Slide tiles into place across 3×3, 4×4, and 5×5 grids — or upload your own family photo to turn it into a playable puzzle!',
    path: '/games/sliding-puzzle',
    badge: 'PUZZLE · 3×3 TO 5×5',
    icon: 'solar:widget-4-bold',
    iconBg: 'bg-amber-100 text-amber-700',
    appIcon: '/Tools and Game Icons/Slide Puzzle App icon.webp',
    previewImg: '/Game Thumbnails/sliding-puzzle-thumb.webp',
    cardGradient: 'from-[#f59e0b] via-[#fb8500] to-[#ff4d6d]',
    ctaLabel: 'Play Sliding Puzzle',
  },
  {
    id: 'hanuman-runner',
    name: 'Hanuman Run',
    tagline: 'Leap obstacles & collect Ram Coins',
    description:
      'Dash through clouds and obstacles in Classic or 3D clay artwork with simple keyboard or one-tap touch controls.',
    path: '/games/hanuman-runner',
    badge: 'ADVENTURE RUNNER',
    icon: 'solar:bolt-bold',
    iconBg: 'bg-emerald-100 text-emerald-700',
    appIcon: '/Tools and Game Icons/Hanuman Run App icon.webp',
    previewImg: '/Game Thumbnails/hanuman-run-thumb.webp',
    cardGradient: 'from-[#10b981] via-[#059669] to-[#0ea5e9]',
    ctaLabel: 'Play Hanuman Run',
  },
  {
    id: 'all-games',
    name: 'All Kids Games',
    tagline: '100% ad-free brain games arcade',
    description:
      'Explore all calm, child-safe cognitive games designed to build spatial thinking, reflexes, and problem-solving.',
    path: '/games',
    badge: 'GAMES ARCADE',
    icon: 'solar:gamepad-bold',
    iconBg: 'bg-blue-100 text-[#1676ed]',
    previewImg: '/home/play-games.webp',
    cardGradient: 'from-[#1676ed] via-[#4361ee] to-[#7c3aed]',
    ctaLabel: 'Browse All Games',
  },
];

const JUGNU_TOOLS: MegaMenuItem[] = [
  {
    id: 'draw-animate',
    name: 'Draw & Animate',
    tagline: 'Draw it. Tap it. Watch it move!',
    description:
      'Draw any character with waxy crayons, pick a fun move like Wiggle, Bounce, Fly, or Dance, and bring your art to life on an animated stage!',
    path: '/tools/draw-animate',
    badge: 'BETA · ANIMATION STUDIO',
    isBeta: true,
    icon: 'solar:magic-stick-3-bold',
    iconBg: 'bg-purple-100 text-[#7c3aed]',
    appIcon: '/Tools and Game Icons/Draw and Animate App icon.webp',
    previewImg: '/Tools and Game Icons/Draw and Animate App icon.webp',
    cardGradient: 'from-[#22c55e] via-[#087CF7] to-[#7c3aed]',
    ctaLabel: 'Open Draw & Animate',
  },
  {
    id: 'pixel-art',
    name: 'Pixel Art Studio',
    tagline: 'Make tiny pictures, one square at a time',
    description:
      'Color, stamp, mirror, and trace pixel art in a golden frame — with Paint-by-Number, Flipbook animations, and Make it 3D!',
    path: '/tools/pixel-art',
    badge: 'BETA · PIXEL STUDIO',
    isBeta: true,
    icon: 'solar:palette-round-bold',
    iconBg: 'bg-sky-100 text-[#087CF7]',
    appIcon: '/Tools and Game Icons/Pixel Art Studio App icon.webp',
    previewImg: '/Tools and Game Icons/Pixel Art Studio App icon.webp',
    cardGradient: 'from-[#087CF7] via-[#38bdf8] to-[#22c55e]',
    ctaLabel: 'Open Pixel Art Studio',
  },
  {
    id: 'voxel-studio',
    name: '3D Voxel Studio',
    tagline: 'Build in 3D with candy-clay blocks',
    description:
      'Stack, paint, and mirror colorful 3D blocks to build houses, castles, cars, and robots — or follow step-by-step Build Together guides.',
    path: '/voxel-studio',
    badge: 'BETA · 3D STUDIO',
    isBeta: true,
    icon: 'solar:box-bold',
    iconBg: 'bg-blue-100 text-[#1676ed]',
    appIcon: '/Tools and Game Icons/3D Voxel Studio App icon.webp',
    previewImg: '/Tools and Game Icons/3D Voxel Studio App icon.webp',
    cardGradient: 'from-[#1676ed] via-[#4361ee] to-[#7c3aed]',
    ctaLabel: 'Open Voxel Studio',
  },
  {
    id: 'drawing-board',
    name: 'Drawing Board',
    tagline: 'Tracing, 13 brushes & coloring',
    description:
      'Practice 4-line English and 2-line Hindi handwriting, free-draw with 13 creative brushes, or color deity illustrations.',
    path: '/drawing-board',
    badge: '2D STUDIO',
    icon: 'solar:pen-new-square-bold',
    iconBg: 'bg-purple-100 text-purple-700',
    previewImg: '/home/draw-pencil.webp',
    cardGradient: 'from-[#7c3aed] via-[#9333ea] to-[#ec4899]',
    ctaLabel: 'Open Drawing Board',
  },
  {
    id: 'learning-tools',
    name: 'Printable Worksheets',
    tagline: 'Custom A4 sheets & mistake practice',
    description:
      'Generate custom printable tracing sheets for names, letters, words, and numbers, or retry missed Olympiad questions.',
    path: '/learning-tools',
    badge: 'PRINT & REVISE',
    icon: 'solar:printer-bold',
    iconBg: 'bg-amber-100 text-amber-700',
    previewImg: '/home/tales-book.webp',
    cardGradient: 'from-[#f59e0b] via-[#fb8500] to-[#ff4d6d]',
    ctaLabel: 'Open Worksheets',
  },
  {
    id: 'my-work',
    name: 'My Work',
    tagline: 'Saved drawings & 3D creations',
    description:
      'View, rename, or continue your saved drawings, coloring sheets, and 3D Voxel builds — stored safely on your device.',
    path: '/my-work',
    badge: 'PORTFOLIO',
    icon: 'solar:folder-with-files-bold',
    iconBg: 'bg-emerald-100 text-emerald-700',
    previewImg: '/3D Icons/Client Side Memory.webp',
    cardGradient: 'from-[#059669] via-[#10b981] to-[#0ea5e9]',
    ctaLabel: 'View Saved Work',
  },
];

const MOBILE_QUICK_LINKS = [
  { label: 'Home', path: '/', icon: 'solar:home-2-bold', iconBg: 'bg-sky-100 text-sky-600' },
  { label: 'Practice', path: '/topics/english', icon: 'solar:book-bookmark-bold', iconBg: 'bg-emerald-100 text-emerald-600' },
  { label: 'Progress', path: '/progress', icon: 'solar:chart-2-bold', iconBg: 'bg-indigo-100 text-indigo-600' },
  { label: "What's New", path: '/whats-new', icon: 'solar:stars-minimalistic-bold', iconBg: 'bg-amber-100 text-amber-600' },
  { label: 'About Jugnu', path: '/about', icon: 'solar:smile-circle-bold', iconBg: 'bg-pink-100 text-pink-600' },
] as const;

const compactNavigation = '(max-width: 980px), (max-width: 1024px) and (orientation: portrait)';

interface NavMegaDropdownProps {
  label: string;
  eyebrow: string;
  items: MegaMenuItem[];
  isOpen: boolean;
  isActive: boolean;
  onOpenChange: (open: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

function NavMegaDropdown({
  label,
  eyebrow,
  items,
  isOpen,
  isActive,
  onOpenChange,
  containerRef,
}: NavMegaDropdownProps) {
  const [hoveredId, setHoveredId] = useState<string>(items[0].id);
  const activePreview = items.find((item) => item.id === hoveredId) ?? items[0];

  return (
    <div
      ref={containerRef}
      className="site-tools-wrap"
      onMouseEnter={() => onOpenChange(true)}
      onMouseLeave={() => onOpenChange(false)}
    >
      <button
        type="button"
        className="site-tools-trigger"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-active={isActive || undefined}
        onClick={() => onOpenChange(!isOpen)}
      >
        <span>{label}</span>
        <Icon
          icon={isOpen ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
          className="w-3.5 h-3.5"
        />
      </button>

      {isOpen && (
        <div className="site-tools-bridge">
          <div className="site-tools-mega" role="region" aria-label={label}>
            <div className="site-tools-list">
              <div className="site-tools-eyebrow">{eyebrow}</div>
              {items.map((item) => {
                const selected = item.id === activePreview.id;
                return (
                  <Link
                    key={item.id}
                    to={item.path}
                    onMouseEnter={() => setHoveredId(item.id)}
                    onFocus={() => setHoveredId(item.id)}
                    onClick={() => onOpenChange(false)}
                    className={`site-tool-row ${selected ? 'is-selected' : ''}`}
                  >
                    <span className={`site-tool-icon ${item.appIcon ? 'overflow-hidden bg-transparent p-0' : item.iconBg}`}>
                      {item.appIcon ? (
                        <img src={item.appIcon} alt="" className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Icon icon={item.icon} className="w-5 h-5" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="site-tool-name inline-flex items-center gap-1.5">
                        <span>{item.name}</span>
                        {item.isBeta && <BetaBadge />}
                      </span>
                      <span className="site-tool-sub">{item.tagline}</span>
                    </span>
                  </Link>
                );
              })}
            </div>

            <div className={`site-tool-preview bg-gradient-to-br ${activePreview.cardGradient}`}>
              <div className="site-tool-preview-top">
                <span className="site-tool-badge">{activePreview.badge}</span>
                <img
                  src={activePreview.previewImg}
                  alt=""
                  className="site-tool-thumb rounded-xl"
                />
              </div>
              <h3 className="site-tool-preview-title">{activePreview.name}</h3>
              <p className="site-tool-preview-desc">{activePreview.description}</p>
              <Link
                to={activePreview.path}
                onClick={() => onOpenChange(false)}
                className="site-tool-cta"
              >
                <span>{activePreview.ctaLabel}</span>
                <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { pathname } = useLocation();
  const { puzzleWins, soundOn, setSoundOn, selectedClass } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<'games' | 'tools' | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const gamesRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setOpenDropdown(null);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen && !openDropdown) return;
    const previousOverflow = menuOpen ? document.body.style.overflow : '';
    if (menuOpen) document.body.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        setOpenDropdown(null);
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node) {
        if (menuOpen && !menuRef.current?.contains(event.target)) setMenuOpen(false);
        if (
          openDropdown &&
          !gamesRef.current?.contains(event.target) &&
          !toolsRef.current?.contains(event.target)
        ) {
          setOpenDropdown(null);
        }
      }
    };
    const media = window.matchMedia(compactNavigation);
    const closeOnWide = () => {
      if (!media.matches) setMenuOpen(false);
      else setOpenDropdown(null);
    };

    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    media.addEventListener('change', closeOnWide);
    return () => {
      if (menuOpen) document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
      media.removeEventListener('change', closeOnWide);
    };
  }, [menuOpen, openDropdown]);

  const isActive = (label: string, path: string) =>
    label === 'Practice'
      ? /^\/(topics|intro|exam)(\/|$)/.test(pathname)
      : pathname === path || pathname.startsWith(path + '/');

  const isGamesActive = pathname === '/games' || pathname.startsWith('/games/');
  const isToolsActive = ['/tools/draw-animate', '/tools/pixel-art', '/voxel-studio', '/learning-tools', '/my-work'].some(
    (p) => pathname === p || pathname.startsWith(p + '/'),
  );

  return (
    <header className="site-bar">
      <nav aria-label="Main navigation">
        <Link to="/" aria-label="Jugnu home">
          <img className="site-logo" src="/Logo/Jugnu Logo V1.svg" alt="Jugnu" />
        </Link>

        <div className="site-links">
          <Link to="/" aria-current={pathname === '/' ? 'page' : undefined}>
            Home
          </Link>

          <NavMegaDropdown
            label="Games"
            eyebrow="ARCADE & PUZZLES"
            items={JUGNU_GAMES}
            isOpen={openDropdown === 'games'}
            isActive={isGamesActive}
            onOpenChange={(open) => setOpenDropdown(open ? 'games' : null)}
            containerRef={gamesRef}
          />

          <Link to="/topics/english" aria-current={isActive('Practice', '/topics/english') ? 'page' : undefined}>
            Practice
          </Link>

          <Link to="/drawing-board" aria-current={isActive('Drawing Board', '/drawing-board') ? 'page' : undefined}>
            Drawing Board
          </Link>

          <NavMegaDropdown
            label="Jugnu Tools"
            eyebrow="CREATIVE & LEARNING TOOLS"
            items={JUGNU_TOOLS}
            isOpen={openDropdown === 'tools'}
            isActive={isToolsActive}
            onOpenChange={(open) => setOpenDropdown(open ? 'tools' : null)}
            containerRef={toolsRef}
          />

          <Link to="/progress" aria-current={isActive('Progress', '/progress') ? 'page' : undefined}>
            Progress
          </Link>

          <Link to="/about" aria-current={isActive('About', '/about') ? 'page' : undefined}>
            About
          </Link>
        </div>

        <div className="site-tablet-menu" ref={menuRef}>
          <button
            className="site-menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-controls="site-mobile-menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
          {menuOpen && (
            <>
              <button
                type="button"
                className="site-mobile-backdrop"
                aria-label="Close navigation menu"
                onClick={() => setMenuOpen(false)}
              />
              <div id="site-mobile-menu" className="site-mobile-sheet" role="dialog" aria-label="Navigation menu">
                <section className="site-mobile-section">
                  <div className="site-mobile-section-head">
                    <span>🎨 Jugnu Tools</span>
                    <span className="site-mobile-section-tag">Create &amp; Print</span>
                  </div>
                  <div className="site-mobile-tools-grid">
                    {JUGNU_TOOLS.map((tool) => {
                      const active = location.pathname === tool.path;
                      return (
                        <Link
                          key={tool.id}
                          to={tool.path}
                          className="site-mobile-tool-card"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          <div className="site-mobile-tool-top">
                            <span className={`site-mobile-tool-icon ${tool.appIcon ? 'overflow-hidden bg-transparent p-0' : tool.iconBg}`}>
                              {tool.appIcon ? (
                                <img src={tool.appIcon} alt="" className="w-full h-full object-cover rounded-xl" />
                              ) : (
                                <Icon icon={tool.icon} width={20} height={20} />
                              )}
                            </span>
                            {tool.isBeta && <BetaBadge />}
                          </div>
                          <span className="site-mobile-tool-title">{tool.name}</span>
                          <span className="site-mobile-tool-sub">{tool.tagline}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                <section className="site-mobile-section">
                  <div className="site-mobile-section-head">
                    <span>🎮 Games Arcade</span>
                    <Link
                      to="/games"
                      className="site-mobile-all-link"
                      onClick={() => setMenuOpen(false)}
                    >
                      All Games →
                    </Link>
                  </div>
                  <div className="site-mobile-games-grid">
                    {JUGNU_GAMES.slice(0, 2).map((game) => {
                      const active = location.pathname === game.path;
                      return (
                        <Link
                          key={game.id}
                          to={game.path}
                          className="site-mobile-game-card"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          <div className={`site-mobile-game-thumb bg-gradient-to-br ${game.cardGradient}`}>
                            <img src={game.previewImg} alt={game.name} />
                            <span className="site-mobile-game-badge">
                              {game.id === 'sliding-puzzle' ? 'Upload Photo' : '3D Runner'}
                            </span>
                          </div>
                          <div className="site-mobile-game-body">
                            <span className="site-mobile-game-title">{game.name}</span>
                            <span className="site-mobile-game-sub">{game.tagline}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>

                <section className="site-mobile-section">
                  <div className="site-mobile-section-head">
                    <span>📚 Explore &amp; Learn</span>
                  </div>
                  <div className="site-mobile-links-grid">
                    {MOBILE_QUICK_LINKS.map((item) => {
                      const active = isActive(item.label === 'About Jugnu' ? 'About' : item.label, item.path);
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          className="site-mobile-pill-link"
                          aria-current={active ? 'page' : undefined}
                          onClick={() => setMenuOpen(false)}
                        >
                          <span className={`site-mobile-pill-icon ${item.iconBg}`}>
                            <Icon icon={item.icon} width={17} height={17} />
                          </span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          )}
        </div>

        <Link className="site-trophy" to="/progress" aria-label={'Progress, ' + puzzleWins + ' puzzle wins'}>
          <img src="/puzzle-ui/imgGroup46.svg" alt="" />
          {puzzleWins}
        </Link>

        <details className="site-profile" key={pathname}>
          <summary aria-label="Learner menu">
            <img src="/puzzle-ui/imgUserProfile.svg" alt="" />
          </summary>
          <div>
            <strong>Class {selectedClass}</strong>
            <Link to="/my-work">My Work</Link>
            <Link to="/blog">Guides</Link>
            <Link to="/whats-new">What&apos;s New</Link>
            <button
              aria-pressed={soundOn}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                analytics.track('feature_used', { feature_id: next ? 'sound_on' : 'sound_off' });
              }}
            >
              Sound {soundOn ? 'on' : 'off'}
            </button>
          </div>
        </details>
      </nav>
    </header>
  );
}
