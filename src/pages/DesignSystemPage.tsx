import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { CANDY_PALETTE } from '../voxel/palette';
import { FlyingBird } from '../components/common/FlyingBird';

type SectionKey =
  | 'overview'
  | 'colors'
  | 'typography'
  | 'spacing'
  | 'motion'
  | 'illustrations'
  | 'voxel-dna'
  | 'components'
  | 'content';

const NAV_GROUPS: {
  title: string;
  items: { id: SectionKey; label: string; icon: string }[];
}[] = [
  {
    title: 'Get Started',
    items: [{ id: 'overview', label: 'About Jugnu Design', icon: 'solar:stars-bold' }],
  },
  {
    title: 'Foundations',
    items: [
      { id: 'colors', label: 'Color & Tokens', icon: 'solar:palette-bold' },
      { id: 'typography', label: 'Typography', icon: 'solar:text-bold' },
      { id: 'spacing', label: 'Spacing, Grid & Radius', icon: 'solar:ruler-bold' },
      { id: 'motion', label: 'Motion', icon: 'solar:play-circle-bold' },
      { id: 'illustrations', label: 'Logos & Illustrations', icon: 'solar:gallery-bold' },
      { id: 'voxel-dna', label: '3D Visual DNA', icon: 'solar:box-bold' },
    ],
  },
  {
    title: 'Components & Content',
    items: [
      { id: 'components', label: 'UI Components', icon: 'solar:widget-4-bold' },
      { id: 'content', label: 'Content & Accessibility', icon: 'solar:shield-check-bold' },
    ],
  },
];

const BRAND_TOKENS = [
  { name: 'Sky Canvas', token: '#e8f3fe', role: 'Primary page & studio backdrop' },
  { name: 'Electric Blue', token: '#1676ed', role: 'Active nav pills, links, primary accents' },
  { name: 'Firefly Yellow', token: '#FFC300', role: '3D glossy CTAs & rewards' },
  { name: 'Navy Ink', token: '#172951', role: 'Primary headings & high-contrast text' },
  { name: 'Playful Purple', token: '#7c3aed', role: 'Creative studio & mirror symmetry' },
  { name: 'Meadow Green', token: '#22C55E', role: 'Success, completion & nature' },
];

export const DesignSystemPage: React.FC = () => {
  const [active, setActive] = useState<SectionKey>('overview');
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Get Started': true,
    Foundations: true,
    'Components & Content': true,
  });
  const [demoTab, setDemoTab] = useState<'canvas' | 'customize' | 'pages'>('canvas');

  const copyToken = (hex: string) => {
    void navigator.clipboard?.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1400);
  };

  return (
    <div className="min-h-screen bg-[#f5f9ff] text-[#172951]">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6 items-start">
        
        {/* Left Sidebar Navigation */}
        <aside className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-4 lg:sticky lg:top-24">
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
            <img src="/home/jugnu-logo-footer.webp" alt="Jugnu" className="h-7 w-auto" />
            <span className="text-xs font-black uppercase tracking-wider text-[#1676ed] bg-blue-50 px-2.5 py-1 rounded-full">
              Design System
            </span>
          </div>

          <nav aria-label="Design system sections" className="space-y-3">
            {NAV_GROUPS.map((group) => {
              const isOpen = openGroups[group.title] ?? true;
              return (
                <div key={group.title}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() =>
                      setOpenGroups((prev) => ({ ...prev, [group.title]: !isOpen }))
                    }
                    className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-[#172951]"
                  >
                    <span>{group.title}</span>
                    <Icon
                      icon={isOpen ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                      className="w-3.5 h-3.5"
                    />
                  </button>
                  {isOpen && (
                    <div className="mt-1 space-y-1">
                      {group.items.map((item) => {
                        const selected = active === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setActive(item.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-extrabold transition-colors text-left ${
                              selected
                                ? 'bg-[#1676ed] text-white shadow-xs'
                                : 'text-[#172951] hover:bg-[#eef5ff]'
                            }`}
                          >
                            <Icon icon={item.icon} className="w-4 h-4 shrink-0" />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <main className="bg-white rounded-3xl border border-[#dbe7f6] shadow-xs p-6 sm:p-10 space-y-8">
          
          {active === 'overview' && (
            <section className="space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-[#1676ed]">
                  Jugnu Design System · v1.0
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-[#172951] mt-1 mb-3">
                  Playful, Calm &amp; Kid-First
                </h1>
                <p className="text-slate-600 font-medium leading-relaxed max-w-2xl">
                  Jugnu&apos;s design language balances tactile 3D toy-like joy with clean, distraction-free clarity for children ages 4–8 across Homepage, Olympiad Quizzes, Drawing Board, Voxel Studio, and Games.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  ['🧸 Toy-First Tactility', 'Rounded corners, matte candy-clay 3D blocks, and physical 3D button press feedback.'],
                  ['🌤️ Calm Sky Surfaces', 'Soft sky-blue (#e8f3fe) backdrops keep focus on white learning cards without eye strain.'],
                  ['👆 Generous Touch Targets', 'Every kid-facing button, swatch, and tab targets 44px+ for effortless finger & stylus input.'],
                  ['🔒 Zero-Clutter & Safe', 'No ads, no dark patterns, COPPA-safe zero-PII, and automatic reduced-motion support.'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-[#f8fbff] border border-[#e2ecf8] p-5">
                    <h2 className="font-black text-base mb-1.5">{title}</h2>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'colors' && (
            <section className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">Color &amp; Tokens</h1>
                <p className="text-sm text-slate-600 font-medium">
                  Click any swatch to copy its hex token.
                  {copiedHex && <span className="ml-2 text-brand-green font-black">Copied {copiedHex}!</span>}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {BRAND_TOKENS.map((t) => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => copyToken(t.token)}
                    className="text-left rounded-2xl border border-[#e2ecf8] p-3 hover:border-[#1676ed] transition-colors flex items-center gap-3.5"
                  >
                    <span
                      className="w-12 h-12 rounded-xl border border-slate-200 shrink-0 shadow-xs"
                      style={{ backgroundColor: t.token }}
                    />
                    <div>
                      <div className="font-black text-sm">{t.name}</div>
                      <div className="text-xs font-mono text-[#1676ed]">{t.token}</div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">{t.role}</div>
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <h2 className="font-black text-lg mb-3">3D Candy Palette (Voxel Studio)</h2>
                <div className="flex flex-wrap gap-3">
                  {CANDY_PALETTE.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => copyToken(c.hex)}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#e2ecf8] hover:border-[#1676ed]"
                    >
                      <span className="w-5 h-5 rounded-md" style={{ backgroundColor: c.hex }} />
                      <span className="text-xs font-bold">{c.name}</span>
                      <span className="text-[11px] font-mono text-slate-400">{c.hex}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          {active === 'typography' && (
            <section className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">Typography (`Nunito`)</h1>
                <p className="text-sm text-slate-600 font-medium">
                  Rounded, friendly geometric terminals keep letterforms legible for early readers.
                </p>
              </div>
              <div className="space-y-4 divide-y divide-slate-100">
                <div className="pt-2">
                  <span className="text-xs font-mono text-slate-400">H1 Hero · 60–72px · font-black</span>
                  <p className="text-4xl sm:text-5xl font-black tracking-tight mt-1">Play, create, and learn.</p>
                </div>
                <div className="pt-4">
                  <span className="text-xs font-mono text-slate-400">H2 Section · 24–36px · font-black</span>
                  <p className="text-2xl sm:text-3xl font-black mt-1">Simple. Free. No Stress.</p>
                </div>
                <div className="pt-4">
                  <span className="text-xs font-mono text-slate-400">Body · 14–18px · font-bold / font-medium</span>
                  <p className="text-base font-bold text-slate-600 mt-1">
                    Designed around early childhood cognitive development. No timers, no penalties, just joy.
                  </p>
                </div>
              </div>
            </section>
          )}

          {active === 'spacing' && (
            <section className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-black">Spacing, Grid &amp; Radius</h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl border-2 border-[#dbe7f6] bg-[#f8fbff]">
                  <div className="text-xs font-mono text-[#1676ed] mb-1">rounded-2xl (16px)</div>
                  <div className="font-black">Buttons &amp; Inputs</div>
                </div>
                <div className="p-5 rounded-3xl border-2 border-[#dbe7f6] bg-[#f8fbff]">
                  <div className="text-xs font-mono text-[#1676ed] mb-1">rounded-3xl (24px)</div>
                  <div className="font-black">Topic, Quiz &amp; Studio Cards</div>
                </div>
                <div className="p-5 rounded-4xl border-2 border-[#dbe7f6] bg-[#f8fbff]">
                  <div className="text-xs font-mono text-[#1676ed] mb-1">max-w-[1200px]</div>
                  <div className="font-black">Standard Page Container</div>
                </div>
              </div>
            </section>
          )}

          {active === 'motion' && (
            <section className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black mb-2">Motion &amp; Micro-Interactions</h1>
                <p className="text-sm text-slate-600 font-medium">
                  Gentle, joyful motion that pauses automatically when `prefers-reduced-motion: reduce` is enabled.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="rounded-3xl bg-[#e8f3fe] p-6 flex flex-col items-center justify-center gap-3 border border-white">
                  <FlyingBird sizeClass="w-16 h-16" />
                  <span className="text-xs font-black text-slate-700">6-Frame Turnaround Sprite (`FlyingBird`)</span>
                </div>
                <div className="rounded-3xl bg-[#e8f3fe] p-6 flex flex-col items-center justify-center gap-4 border border-white">
                  <div className="flex gap-3">
                    {['/home/learn-abc.webp', '/home/play-games.webp', '/home/draw-pencil.webp'].map((src, i) => (
                      <div key={src} style={{ animationDelay: `${i * 150}ms` }} className="animate-hero-wave">
                        <img src={src} alt="" className="w-12 h-12 object-contain" />
                      </div>
                    ))}
                  </div>
                  <span className="text-xs font-black text-slate-700">Staggered Hero Wave (`animate-hero-wave`)</span>
                </div>
              </div>
            </section>
          )}

          {active === 'illustrations' && (
            <section className="space-y-6">
              <h1 className="text-2xl sm:text-3xl font-black">Logos &amp; Characters</h1>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  ['Daksha', '/home/step-pick-topic.webp', 'Explorer & Tablet Guide'],
                  ['Aayush', '/home/step-practice-exam.webp', 'Reader & Learner'],
                  ['Jai', '/home/step-celebrate.webp', 'Celebration Champion'],
                ].map(([name, src, role]) => (
                  <div key={name} className="rounded-3xl border border-[#e2ecf8] p-4 text-center bg-[#f8fbff]">
                    <img src={src} alt={name} className="h-32 mx-auto object-contain mb-2" />
                    <div className="font-black">{name}</div>
                    <div className="text-xs font-bold text-slate-500">{role}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'voxel-dna' && (
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black mb-1">Jugnu 3D Visual DNA</h1>
                  <p className="text-sm text-slate-600 font-medium">
                    Centralized Three.js tokens shared across Voxel Studio, 3D Question Visuals, and thumbnails.
                  </p>
                </div>
                <Link
                  to="/voxel-studio"
                  className="px-4 py-2 rounded-xl bg-[#1676ed] text-white text-xs font-black"
                >
                  Open Voxel Studio &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
                {[
                  ['Material', 'MeshStandardMaterial · roughness: 0.78 · metalness: 0.0 (matte candy-clay)'],
                  ['Color & Tone', 'THREE.SRGBColorSpace · THREE.NoToneMapping (true-to-swatch vibrant colors)'],
                  ['Geometry', 'RoundedBoxGeometry(0.955, 0.955, 0.955, 2, 0.105) · 300 tris/block'],
                  ['Camera & Shadows', 'OrthographicCamera (isometric) + radial soft floor contact shadow'],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-2xl border border-[#e2ecf8] bg-[#f8fbff] p-4">
                    <div className="text-[#1676ed] font-black mb-1">{k}</div>
                    <div className="text-slate-700">{v}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'components' && (
            <section className="space-y-8">
              <h1 className="text-2xl sm:text-3xl font-black">UI Components</h1>

              <div>
                <h2 className="font-black text-sm text-slate-500 uppercase tracking-wider mb-3">
                  Primary 3D Toy CTA (`btn-glossy-yellow`)
                </h2>
                <button type="button" className="btn-glossy-yellow px-8 py-3.5 rounded-2xl font-black text-slate-900">
                  Explore Activities
                </button>
              </div>

              <div>
                <h2 className="font-black text-sm text-slate-500 uppercase tracking-wider mb-3">
                  Mobile Folder Tabs
                </h2>
                <div className="bg-[#e8f3fe] p-4 rounded-2xl max-w-sm">
                  <div className="flex gap-1.5">
                    {(['canvas', 'customize', 'pages'] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setDemoTab(tab)}
                        className={`px-4 py-2 rounded-t-2xl text-xs font-black capitalize ${
                          demoTab === tab ? 'bg-white text-[#172951]' : 'bg-[#d3e7fb] text-[#425b87]'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  <div className="bg-white rounded-b-2xl rounded-tr-2xl p-4 text-xs font-bold text-slate-600">
                    Active panel: <span className="text-[#1676ed] capitalize">{demoTab}</span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {active === 'content' && (
            <section className="space-y-5">
              <h1 className="text-2xl sm:text-3xl font-black">Content &amp; Accessibility</h1>
              <ul className="space-y-3 text-sm font-medium text-slate-700">
                <li><strong>Voice &amp; Tone:</strong> Encouraging, warm, stress-free (&ldquo;Let&apos;s learn!&rdquo; instead of harsh error messages).</li>
                <li><strong>Reading Level:</strong> Short, clear sentences written for ages 4–8 and parents.</li>
                <li><strong>Privacy:</strong> Strictly zero personal data collection, zero login, and zero third-party ad trackers.</li>
                <li><strong>Accessibility:</strong> Semantic headings, `aria-pressed`/`aria-selected` states, keyboard navigation, and `prefers-reduced-motion` support.</li>
              </ul>
            </section>
          )}

        </main>
      </div>
    </div>
  );
};
