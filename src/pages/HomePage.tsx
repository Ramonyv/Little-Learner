import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { TopicCard } from '../components/cards/TopicCard';
import { SubjectCard } from '../components/cards/SubjectCard';
import { ENGLISH_TOPICS, SUBJECTS, getTopicQuestionCount, getAllSubjectQuestions } from '../data/questionRepository';
import { cardIcons } from '../data/cardIcons';
import { BLOG_POSTS } from '../data/blogPosts';
import { analytics } from '../analytics';

export const HomePage: React.FC = () => {
  const { selectedClass } = useSession();
  const englishQuestions = getAllSubjectQuestions(selectedClass, 'english');

  const faqs = [
    {
      q: 'Is Jugnu completely free? Are there any in-app ads or subscriptions?',
      a: 'Yes, Jugnu is 100% free forever. There are zero subscriptions, zero microtransactions, and strictly no advertisements, banner popups, or sponsored links. We believe early childhood learning should be peaceful, safe, and universally accessible.',
    },
    {
      q: 'What grade levels and curriculum does Jugnu cover?',
      a: 'Jugnu is tailored for children ages 4 to 8 (Nursery, LKG, UKG, and CBSE/ICSE Class 1). Content spans Mathematics, English Phonics & Grammar, General Science (EVS), and Logical Reasoning aligned with International Olympiad exams (IMO, IEO, NSO).',
    },
    {
      q: 'Do children need an account or login to play?',
      a: 'No account, email, or sign-up is required. Children can jump straight into drawing, games, or quiz practice with one click. We do not track, collect, or store any personal information or child identity.',
    },
    {
      q: 'Can kids use the Drawing Board for handwriting and pencil grip?',
      a: 'Yes! The Drawing Board includes specialized ruled guidelines: 4-line English handwriting grids, 2-line Hindi guidelines, and math squares. With 13 creative brushes and stroke stabilization, kids develop line control and motor confidence before or alongside pencil and paper.',
    },
    {
      q: 'Can I use Jugnu on iPad, tablets, or touchscreen laptops?',
      a: 'Absolutely. Jugnu is designed touch-first with responsive touch controls, stylus/Apple Pencil support, and instant browser access without needing to download anything from the App Store or Play Store.',
    },
  ];

  return (
    <div className="pb-24 sm:pb-16 animate-in fade-in duration-200">
      
      {/* 1. Hero Banner: Above-The-Fold Multi-Activity Value Proposition */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        <div className="relative rounded-3xl sm:rounded-4xl bg-[#3778f4] text-white p-6 sm:p-10 lg:p-12 shadow-xl border-4 border-slate-900/10 overflow-hidden flex flex-col lg:block items-center gap-6 lg:min-h-[460px]">
          
          {/* Decorative Clouds */}
          <div className="absolute top-4 left-10 opacity-30 pointer-events-none hidden lg:block">
            <Icon icon="solar:cloud-bold" className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
          <div className="absolute bottom-6 right-12 opacity-25 pointer-events-none hidden lg:block">
            <Icon icon="solar:cloud-bold" className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>

          {/* Left Text Content */}
          <div className="relative z-10 max-w-[500px] text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-black uppercase tracking-wider mb-3">
              <Icon icon="solar:shield-check-bold" className="w-4 h-4 text-brand-yellow" />
              <span>100% Free · Ad-Free · No Login Required</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-black tracking-tight leading-tight sm:leading-tight mb-3 sm:mb-4">
              Play, create, and learn.<br />
              <span className="text-brand-yellow drop-shadow-sm">All in one safe space.</span>
            </h1>

            <p className="text-white/95 font-bold text-base sm:text-lg mb-6 sm:mb-7 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Fun cognitive games, 4-line handwriting tracing, cultural deity coloring, and Class 1 math & reading — designed for curious young minds (Ages 4–8).
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3">
              <Link
                to="/topics/english"
                onClick={() => analytics.track('activity_selected', { activity_type: 'education', activity_id: 'english_catalog', source_section: 'home' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-brand-yellow hover:bg-brand-yellow-hover text-brand-ink font-black text-base sm:text-lg shadow-chunky transition-all btn-chunky active:scale-95"
              >
                <span>Explore Activities</span>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5" />
              </Link>

              <Link
                to="/drawing-board"
                onClick={() => analytics.track('activity_selected', { activity_type: 'drawing', activity_id: 'drawing_board', source_section: 'home' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-extrabold text-base transition-colors"
              >
                <span>🎨 Drawing Board</span>
              </Link>

              <Link
                to="/games"
                onClick={() => analytics.track('activity_selected', { activity_type: 'game', activity_id: 'games_catalog', source_section: 'home' })}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/90 font-bold text-sm sm:text-base transition-colors"
              >
                <span>🎮 Play Games</span>
              </Link>
            </div>

            {/* Quick Feature Pills */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-6 mt-6 border-t border-white/20 text-xs font-extrabold text-white/90">
              <span className="px-2.5 py-1 rounded-full bg-white/15">🎨 13 Creative Brushes</span>
              <span className="px-2.5 py-1 rounded-full bg-white/15">✏️ 4-Line Handwriting</span>
              <span className="px-2.5 py-1 rounded-full bg-white/15">🧩 Slide Puzzles</span>
              <span className="px-2.5 py-1 rounded-full bg-white/15">🏆 Olympiad Prep</span>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="relative z-10 w-full max-w-[440px] sm:max-w-[540px] lg:max-w-none mt-2 sm:mt-6 lg:mt-0 lg:absolute lg:w-[56%] lg:right-0 lg:bottom-0">
            <picture>
              <source media="(max-width: 1023px)" srcSet="/hero-illustration-mobile.svg" />
              <img
                src="/hero-illustration-v2.svg"
                alt="Child learning, drawing, and playing with books, blocks, and a rocket"
                className="block w-full h-auto object-contain"
              />
            </picture>
          </div>

        </div>
      </section>

      {/* 2. "Why Parents & Teachers Trust Jugnu" (E-E-A-T Safety & Quality Trust Bar) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-brand-blue font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
            Peace of Mind
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-ink mb-2">
            Why Parents & Educators Trust Jugnu
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Designed from the ground up for safe, wholesome, distraction-free early learning.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-blue-100/70 text-brand-blue flex items-center justify-center text-2xl mb-4">
              🛡️
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">Child-Safe & Private</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Strictly COPPA-compliant. Zero tracking cookies, no session recordings, and no personal account data stored.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-amber-100/70 text-amber-700 flex items-center justify-center text-2xl mb-4">
              🚫
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">100% Ad-Free</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Zero distracting video popups, banner ads, or accidental click traps. A calm, clean environment where kids can focus.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100/70 text-emerald-700 flex items-center justify-center text-2xl mb-4">
              📚
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">Curriculum-Aligned</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Structured around CBSE, ICSE, and international Class 1 learning standards for math, reading, and logic.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-2xl bg-purple-100/70 text-purple-700 flex items-center justify-center text-2xl mb-4">
              🖨️
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">Screen-to-Paper Ready</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Download and print free tracing worksheets, alphabet grids, and deity coloring pages for offline physical practice.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Interactive Learning Modes Showcase (Show, Don't Just Tell) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-brand-purple font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
            Learning Pathways
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-ink mb-2">
            3 Ways Kids Explore on Jugnu
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Balancing fine-motor creativity, academic confidence, and cognitive problem-solving.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pathway 1: Creative Studio */}
          <div className="bg-gradient-to-b from-purple-50/70 to-white rounded-3xl p-6 sm:p-7 border-2 border-purple-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2 rounded-2xl bg-white border border-purple-100 shadow-xs">🎨</span>
                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">Art & Tracing</span>
              </div>
              <h3 className="text-xl font-black text-brand-ink mb-2">The Creative Studio</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                13 realistic brushes (crayon, watercolor, glitter, rainbow), stroke stabilization, 4-line handwriting grids, and cultural coloring sheets of Ganesha, Krishna, and Hanuman.
              </p>
            </div>
            <Link
              to="/drawing-board"
              className="inline-flex items-center gap-1.5 text-sm font-extrabold text-purple-700 hover:text-purple-900 group"
            >
              <span>Open Drawing Board</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>
          </div>

          {/* Pathway 2: Olympiad Practice */}
          <div className="bg-gradient-to-b from-blue-50/70 to-white rounded-3xl p-6 sm:p-7 border-2 border-blue-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2 rounded-2xl bg-white border border-blue-100 shadow-xs">🏆</span>
                <span className="text-xs font-bold text-blue-700 bg-blue-100 px-3 py-1 rounded-full">Olympiad Prep</span>
              </div>
              <h3 className="text-xl font-black text-brand-ink mb-2">Olympiad Practice Tests</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Realistic timer-free and timed mock exams for English, Maths, Science, and GK. Cheerful audio feedback, question explanations, and zero-stress score celebrations.
              </p>
            </div>
            <Link
              to="/topics/english"
              className="inline-flex items-center gap-1.5 text-sm font-extrabold text-brand-blue hover:text-blue-900 group"
            >
              <span>Explore Practice Topics</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>
          </div>

          {/* Pathway 3: Cognitive Games */}
          <div className="bg-gradient-to-b from-amber-50/70 to-white rounded-3xl p-6 sm:p-7 border-2 border-amber-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl p-2 rounded-2xl bg-white border border-amber-100 shadow-xs">🎮</span>
                <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">Brain Games</span>
              </div>
              <h3 className="text-xl font-black text-brand-ink mb-2">Cognitive Mini-Games</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                12 sliding picture puzzles (3×3 to 5×5) and Hanuman Run obstacle adventures designed to build spatial logic, patience, and quick thinking without infinite autoplay loops.
              </p>
            </div>
            <Link
              to="/games"
              className="inline-flex items-center gap-1.5 text-sm font-extrabold text-amber-800 hover:text-amber-950 group"
            >
              <span>Play Kids Games</span>
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Explore Seed Interactive Banner */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-12">
        <Link to="/explore/seed" onClick={() => analytics.track('activity_selected', { activity_type: 'explore', activity_id: 'explore_seed', source_section: 'home' })} className="flex items-center gap-4 rounded-3xl bg-green-50 border-2 border-green-200 p-5 hover:border-green-500 transition-colors">
          <span aria-hidden="true" className="text-4xl">🌱</span>
          <span><strong className="block text-xl">Help a seed grow</strong><span>Trace a seed, water the soil, and discover plant roots · 5 min interactive science</span></span>
          <span aria-hidden="true" className="ml-auto text-xl">→</span>
        </Link>
      </section>

      {/* 4. Detailed Syllabus & Skills Grid (Semantic SEO Keywords for Search & AI) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-brand-green font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
            Curriculum Breadth
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-ink mb-2">
            Foundational Skills Covered
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Comprehensive early elementary milestones covering literacy, numeracy, science, and motor skills.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pillar 1: Mathematics */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">📐</span>
              <h3 className="font-black text-lg text-brand-ink">Mathematics & Logic</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-center gap-2"><span>•</span><span>Numbers 1 to 100 & Number Names</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Single & Double-Digit Addition</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Visual Subtraction within 20</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>2D & 3D Shapes & Spatial Sense</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Clocks, Reading Time & Calendar</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Indian Currency, Coins & Money</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Repeating Sequences & Patterns</span></li>
            </ul>
          </div>

          {/* Pillar 2: English Phonics */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔤</span>
              <h3 className="font-black text-lg text-brand-ink">English & Phonics</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-center gap-2"><span>•</span><span>A-Z Letter Phonic Sounds</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>3-Letter CVC Word Blends</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>High-Frequency Sight Words</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Naming Words (Nouns & Pronouns)</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Action Words (Verbs) & Tenses</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Rhyming Pairs & Opposites</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Picture Comprehension Stories</span></li>
            </ul>
          </div>

          {/* Pillar 3: Science & EVS */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🌿</span>
              <h3 className="font-black text-lg text-brand-ink">Science & Nature</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-center gap-2"><span>•</span><span>Living vs Non-Living Things</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Parts of Plants, Leaves & Seeds</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Animal Habitats, Sounds & Babies</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Human Body & The 5 Senses</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Seasons, Weather & The Sun</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Good Habits, Hygiene & Safety</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Our Planet, Water & Clean Air</span></li>
            </ul>
          </div>

          {/* Pillar 4: Fine Motor & Art */}
          <div className="bg-white rounded-3xl p-6 border-2 border-slate-200/80 shadow-sm flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">✍️</span>
              <h3 className="font-black text-lg text-brand-ink">Fine Motor & Art</h3>
            </div>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-center gap-2"><span>•</span><span>4-Line English Letter Tracing</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>2-Line Hindi Devanagari Tracing</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Pre-Writing Curves & Standing Lines</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Symmetry Picture Grid Matching</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Deity Outline Coloring Sheets</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Digital Canvas with 13 Brushes</span></li>
              <li className="flex items-center gap-2"><span>•</span><span>Printable Activity Worksheets</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Topic Cards Grid (English Olympiad Focus) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <div className="flex items-center gap-2 text-brand-blue font-black text-xs sm:text-sm uppercase tracking-wider mb-1">
              <Icon icon="solar:book-bookmark-bold" className="w-4 h-4" />
              <span>English Olympiad</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-ink">
              Choose What to Learn
            </h2>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-slate-500">
            Class {selectedClass} • {englishQuestions.length} Questions Ready
          </span>
        </div>

        {/* 4 columns on desktop, 2 on tablet, 2 on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-6">
          {ENGLISH_TOPICS.map((topic) => {
            const count = getTopicQuestionCount(selectedClass, 'english', topic.id);
            return (
              <TopicCard
                key={topic.id}
                topic={topic}
                questionCount={count}
                classNumber={selectedClass}
              />
            );
          })}

          {/* More Subjects Card */}
          <div className="flex flex-col items-center justify-center text-center p-5 sm:p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-3 sm:mb-4">
              <img src={cardIcons['more-subjects']} alt="" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-brand-ink mb-1">More Subjects</h3>
            <span className="text-xs sm:text-sm font-bold text-slate-400">Maths, Science & GK</span>
          </div>
        </div>
      </section>

      {/* 6. Subject Catalog Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
        <div className="mb-6 sm:mb-8">
          <span className="text-brand-purple font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
            Subject Catalog
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-ink">
            All Olympiad Subjects for Class {selectedClass}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {SUBJECTS.map((sub) => (
            <SubjectCard
              key={sub.id}
              subject={sub}
              iconSrc={cardIcons[sub.id]}
              questionCount={getAllSubjectQuestions(selectedClass, sub.id).length}
            />
          ))}
        </div>
      </section>

      {/* 7. How Practice Works Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
        <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 border-2 border-slate-200/80 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-brand-green font-black text-xs sm:text-sm uppercase tracking-wider block mb-1.5">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-ink mb-2">
              Simple. Free. No Stress.
            </h2>
            <p className="text-slate-500 font-bold text-sm sm:text-base">
              Designed specifically for young minds to build early confidence step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-black text-xl mb-4 border-2 border-brand-blue/20">
                1
              </div>
              <h3 className="font-black text-lg text-brand-ink mb-2">Pick Any Topic</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Choose from Vocabulary, Spelling, Grammar, Opposites, or a full Mixed Practice mock test.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-yellow/20 text-amber-700 flex items-center justify-center font-black text-xl mb-4 border-2 border-brand-yellow/40">
                2
              </div>
              <h3 className="font-black text-lg text-brand-ink mb-2">Choose Practice or Exam</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Practice mode teaches with instant explanations. Exam mode adds a friendly countdown timer.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-green/10 text-brand-green flex items-center justify-center font-black text-xl mb-4 border-2 border-brand-green/20">
                3
              </div>
              <h3 className="font-black text-lg text-brand-ink mb-2">Celebrate & Review</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Get an encouraging score celebration, review every answer, and retake anytime you want!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Parent & Educator Learning Guides (Blog Highlights) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8">
          <div>
            <span className="text-brand-blue font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
              Practical Insights
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-ink">
              Learning Guides & Parent Tips
            </h2>
          </div>
          <Link
            to="/blog"
            className="text-sm font-bold text-brand-blue hover:underline inline-flex items-center gap-1 shrink-0"
          >
            View all guides <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {BLOG_POSTS.slice(0, 3).map((post) => (
            <article
              key={post.slug}
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${post.categoryColor}`}>
                  {post.category}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {post.readTime}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-brand-ink group-hover:text-brand-blue transition-colors leading-snug mb-2 line-clamp-2">
                <Link to={`/blog/${post.slug}`}>{post.title}</Link>
              </h3>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-4 flex-1 line-clamp-2 font-medium">
                {post.excerpt}
              </p>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">{post.publishedDate}</span>
                <Link to={`/blog/${post.slug}`} className="font-bold text-brand-blue group-hover:underline">
                  Read guide &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 9. Interactive Parent & Teacher FAQ (The #1 AEO Superpower) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
        <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10">
          <span className="text-brand-purple font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
            Questions & Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-ink mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-slate-600 font-medium text-sm sm:text-base">
            Everything parents, teachers, and guardians need to know about Jugnu.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group bg-white rounded-2xl border-2 border-slate-200/80 p-5 shadow-xs transition-all [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-black text-base sm:text-lg text-brand-ink">
                <span>{faq.q}</span>
                <span className="shrink-0 text-slate-400 group-open:rotate-180 transition-transform duration-200">
                  <Icon icon="solar:alt-arrow-down-bold" className="w-5 h-5 text-brand-blue" />
                </span>
              </summary>
              <p className="mt-3.5 pt-3.5 border-t border-slate-100 text-slate-600 text-sm sm:text-base leading-relaxed font-medium">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 10. Educational Philosophy & Mission Footer (Rich SEO Footprint) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
        <div className="rounded-3xl sm:rounded-4xl bg-gradient-to-br from-slate-900 to-blue-950 text-white p-7 sm:p-10 lg:p-12 shadow-lg border border-slate-800">
          <div className="max-w-3xl">
            <span className="text-brand-yellow font-black text-xs sm:text-sm uppercase tracking-wider block mb-2">
              Our Educational Mission
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
              Joyful, pressure-free learning for every child.
            </h2>
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              <p>
                Jugnu was created with a simple conviction: early learning should spark genuine curiosity, not academic anxiety. Modern digital platforms often bombard young children with flashing advertisements, algorithmic video feeds, and addictive autoplay loops. Jugnu offers an intentional alternative — an ad-free, pressure-free digital playground that combines wholesome creative play with foundational education.
              </p>
              <p>
                Whether your child is tracing their first four-line letter, exploring seed biology, solving a sliding picture puzzle, or preparing for their first Math Olympiad, Jugnu meets them with encouraging feedback, playful audio, and zero barriers. Every activity is self-paced, celebratory, and built to nurture a lifelong love of discovery.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-400">
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="text-brand-green">●</span> Zero Data Collection
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="text-brand-green">●</span> Strictly No Ads
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="text-brand-green">●</span> 100% Free Forever
              </span>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};
