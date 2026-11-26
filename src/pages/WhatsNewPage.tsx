import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

interface ReleaseEntry {
  date: string;
  tag: string;
  tagClass: string;
  title: string;
  summary: string;
  highlights: string[];
  ctaLabel: string;
  ctaTo: string;
}

const RELEASES: ReleaseEntry[] = [
  {
    date: 'November 27, 2026',
    tag: 'Curriculum & 3D',
    tagClass: 'bg-purple-50 text-purple-700 border-purple-200',
    title: 'Interactive 3D Quiz Visuals & Logical Reasoning',
    summary:
      'Class 1 Practice and Exam cards now display interactive 3D candy-clay objects kids can drag and spin, alongside 156 new Olympiad questions.',
    highlights: [
      'Added Logical Reasoning as a 5th subject (60 questions across Odd One Out, Patterns, Analogies, and Logic).',
      'Expanded Class 1 Mathematics and General Knowledge from 12 to 60 questions each.',
      'Added 30+ procedural 3D toys (shapes, counting beads, clocks, Earth, Sun, Saturn, and more) inside QuestionCard.',
    ],
    ctaLabel: 'Try Logical Reasoning',
    ctaTo: '/topics/logical-reasoning',
  },
  {
    date: 'November 27, 2026',
    tag: 'New Studio',
    tagClass: 'bg-blue-50 text-brand-blue border-blue-200',
    title: 'Jugnu Voxel Studio — 3D Block Builder',
    summary:
      'A kid-friendly 3D construction toy powered by Three.js with matte candy-clay blocks, orthographic isometric camera, and guided templates.',
    highlights: [
      'Build with Add, Paint, Erase, 3D Flood Fill, 2-Way / 4-Way Mirror Symmetry, and Select tools.',
      'Switch between Classic, Rounded, and Soft block styles and Isometric, Front, Side, or Top views.',
      'Build Together guided mode with 3D-rendered thumbnails for House, Castle, Tree, Car, Animal, and Robot.',
    ],
    ctaLabel: 'Open Voxel Studio',
    ctaTo: '/voxel-studio',
  },
  {
    date: 'November 27, 2026',
    tag: 'Mobile UX',
    tagClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    title: 'Canvas-First Mobile Drawing Board',
    summary:
      'Redesigned phone portrait mode on Drawing Board with folder-style tabs so kids get maximum drawing space with zero vertical scrolling.',
    highlights: [
      'Added Canvas | Customize | Pages folder tabs on mobile phones.',
      'Moved Undo/Redo/Board controls cleanly to the bottom of the paper.',
      'Arranged Trace category selection in a roomy 3×2 touch grid.',
    ],
    ctaLabel: 'Open Drawing Board',
    ctaTo: '/drawing-board',
  },
  {
    date: 'November 26, 2026',
    tag: 'Design & Guides',
    tagClass: 'bg-amber-50 text-amber-800 border-amber-200',
    title: 'Jugnu.fun Rebrand, Parallax Footer & Learning Guides',
    summary:
      'Launched our refreshed sky-blue homepage featuring Daksha, Aayush, and Jai, an animated multi-layer parallax footer, and parent learning guides.',
    highlights: [
      'New centered hero with wavy app icons, 3D glossy CTA, and How It Works character illustrations.',
      'Multi-layer parallax landscape footer with 6-frame flying bird animation.',
      'Added zero-storage Learning Guides (/blog) for parents and teachers.',
    ],
    ctaLabel: 'Read Learning Guides',
    ctaTo: '/blog',
  },
];

export const WhatsNewPage: React.FC = () => {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <div className="mb-10 text-center sm:text-left">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-black text-brand-blue uppercase tracking-wider mb-3">
          <Icon icon="solar:stars-bold" className="w-3.5 h-3.5" />
          <span>Product Updates</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-ink tracking-tight mb-3">
          What&apos;s New on Jugnu
        </h1>
        <p className="text-slate-600 font-medium text-sm sm:text-base max-w-2xl">
          Follow every new 3D learning tool, subject expansion, and kid-friendly improvement as we grow Jugnu.fun — always free and ad-free.
        </p>
      </div>

      <div className="space-y-6">
        {RELEASES.map((item) => (
          <section
            key={item.title}
            className="bg-white rounded-3xl border-2 border-slate-200/80 p-6 sm:p-8 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-black border ${item.tagClass}`}>
                {item.tag}
              </span>
              <time className="text-xs font-bold text-slate-500">{item.date}</time>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-brand-ink mb-2">
              {item.title}
            </h2>
            <p className="text-slate-600 text-sm sm:text-base font-medium leading-relaxed mb-4">
              {item.summary}
            </p>

            <ul className="space-y-1.5 text-sm text-slate-700 font-medium mb-5">
              {item.highlights.map((hl) => (
                <li key={hl} className="flex items-start gap-2">
                  <span className="text-brand-green font-black mt-0.5">●</span>
                  <span>{hl}</span>
                </li>
              ))}
            </ul>

            <Link
              to={item.ctaTo}
              className="inline-flex items-center gap-1.5 text-sm font-black text-brand-blue hover:underline"
            >
              <span>{item.ctaLabel}</span>
              <span aria-hidden="true">&rarr;</span>
            </Link>
          </section>
        ))}
      </div>
    </article>
  );
};
