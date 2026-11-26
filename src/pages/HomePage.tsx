import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { TopicCard } from '../components/cards/TopicCard';
import { SubjectCard } from '../components/cards/SubjectCard';
import { ENGLISH_TOPICS, SUBJECTS, getTopicQuestionCount, getAllSubjectQuestions } from '../data/questionRepository';
import { cardIcons } from '../data/cardIcons';
import { BLOG_POSTS } from '../data/blogPosts';
import { FlyingBird } from '../components/common/FlyingBird';
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
    <div className="bg-[#e8f3fe] pb-16 sm:pb-20 animate-in fade-in duration-200 overflow-x-clip">
      
      {/* 1. Full-Bleed Sky-Blue Hero (Matched to Figma) */}
      <section className="relative max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8 sm:pb-10 text-center">
        
        {/* Floating 3D Cloud Accents (with Figma Overlay blend mode) */}
        <div className="absolute top-2 left-2 sm:left-6 lg:-left-6 pointer-events-none mix-blend-overlay animate-cloud-1 hidden sm:block">
          <img
            src="/home/cloud-large.webp"
            alt=""
            className="w-32 sm:w-44 lg:w-52 h-auto object-contain"
            aria-hidden="true"
          />
        </div>
        <div className="absolute top-12 right-2 sm:right-6 lg:-right-4 pointer-events-none mix-blend-overlay animate-cloud-2 hidden sm:block">
          <img
            src="/home/cloud-small.webp"
            alt=""
            className="w-28 sm:w-36 lg:w-44 h-auto object-contain"
            aria-hidden="true"
          />
        </div>

        {/* Top Eyebrow */}
        <p className="relative z-10 text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide mb-6 sm:mb-8">
          100% Free · Strictly Ad-Free · No Login Required
        </p>

        {/* Top 5 Squircle App Icons Ribbon (Center Drawing Pencil is prominent, subtle wave invite) */}
        <div className="relative z-10 flex items-center justify-center gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <Link
            to="/topics/english"
            title="Learn Phonics & Reading"
            onClick={() => analytics.track('activity_selected', { activity_type: 'education', activity_id: 'english_catalog', source_section: 'home' })}
            style={{ animationDelay: '0ms' }}
            className="group animate-hero-wave cursor-pointer"
          >
            <img
              src="/home/learn-abc.webp"
              alt="Learn ABC"
              className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.3] group-active:scale-95"
            />
          </Link>

          <Link
            to="/games"
            title="Cognitive Games"
            onClick={() => analytics.track('activity_selected', { activity_type: 'game', activity_id: 'games_catalog', source_section: 'home' })}
            style={{ animationDelay: '150ms' }}
            className="group animate-hero-wave cursor-pointer"
          >
            <img
              src="/home/play-games.webp"
              alt="Play Games"
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.3] group-active:scale-95"
            />
          </Link>

          <Link
            to="/drawing-board"
            title="Creative Drawing & Tracing"
            onClick={() => analytics.track('activity_selected', { activity_type: 'drawing', activity_id: 'drawing_board', source_section: 'home' })}
            style={{ animationDelay: '300ms' }}
            className="group animate-hero-wave mx-0.5 sm:mx-1 cursor-pointer"
          >
            <img
              src="/home/draw-pencil.webp"
              alt="Drawing Board"
              className="w-15 h-15 sm:w-20 sm:h-20 md:w-22 md:h-22 object-contain drop-shadow-md transition-transform duration-200 group-hover:scale-[1.3] group-active:scale-95"
            />
          </Link>

          <Link
            to="/topics/english/reading"
            title="Stories & Reading"
            onClick={() => analytics.track('activity_selected', { activity_type: 'education', activity_id: 'reading_stories', source_section: 'home' })}
            style={{ animationDelay: '450ms' }}
            className="group animate-hero-wave cursor-pointer"
          >
            <img
              src="/home/tales-book.webp"
              alt="Reading Tales"
              className="w-12 h-12 sm:w-16 sm:h-16 md:w-18 md:h-18 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.3] group-active:scale-95"
            />
          </Link>

          <Link
            to="/voxel-studio"
            title="3D Voxel Studio"
            style={{ animationDelay: '600ms' }}
            className="group animate-hero-wave cursor-pointer"
          >
            <img
              src="/home/discover-compass.webp"
              alt="Explore 3D Voxel Studio"
              className="w-11 h-11 sm:w-14 sm:h-14 md:w-16 md:h-16 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.3] group-active:scale-95"
            />
          </Link>
        </div>

        {/* Centered H1 & Subtitle */}
        <div className="relative z-10 max-w-2xl mx-auto">
          <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-black text-slate-950 tracking-tight leading-[1.06] mb-5">
            Play, create,<br />
            and learn.
          </h1>

          <p className="text-slate-800 font-bold text-sm sm:text-base lg:text-lg mb-7 sm:mb-8 leading-relaxed max-w-[540px] mx-auto">
            Fun brain games, handwriting tracing, creative drawing board, and Class 1 math &amp; reading — designed for curious little champions (Ages 4–8).
          </p>

          {/* Single 3D Glossy Golden Button from Figma + Small Flipped Bird */}
          <div className="flex justify-center">
            <div className="relative inline-flex">
              <a
                href="#choose-what-to-learn"
                onClick={() => analytics.track('activity_selected', { activity_type: 'education', activity_id: 'english_catalog', source_section: 'home' })}
                className="btn-glossy-yellow inline-flex items-center justify-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl text-slate-900 font-black text-base sm:text-lg tracking-tight select-none cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M6.5 4.8C6.5 3.6 7.8 2.9 8.8 3.5L19.5 10.2C20.5 10.8 20.5 12.2 19.5 12.8L8.8 19.5C7.8 20.1 6.5 19.4 6.5 18.2V4.8Z"
                    fill="#E0F2FE"
                    stroke="#0F172A"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Explore Activities</span>
              </a>
              <FlyingBird
                flip={true}
                startFrame={2}
                sizeClass="w-10 h-10 sm:w-12 sm:h-12"
                className="absolute -top-6 -right-8 sm:-top-7 sm:-right-12 z-20"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Choose What to Learn (English Topics Grid) */}
      <section id="choose-what-to-learn" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-8 sm:pt-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8">
          <div>
            <span className="text-brand-blue font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
              English Foundations
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-ink">
              Choose What to Learn
            </h2>
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-slate-500 shrink-0">
            Class {selectedClass} • {englishQuestions.length} Questions Ready
          </span>
        </div>

        {/* 2x4 grid with 7 topic cards + 8th "More Subjects" card */}
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

          {/* 8th Card: More Subjects (matches Figma highlighted blue card) */}
          <a
            href="#olympiad-subjects"
            className="flex flex-col items-center justify-center text-center p-5 sm:p-6 bg-[#d9ecfd] rounded-3xl border-2 border-dashed border-brand-blue/60 hover:border-brand-blue transition-all group hover:-translate-y-1 shadow-xs"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-105 transition-transform">
              <img src={cardIcons['more-subjects']} alt="" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            </div>
            <h3 className="font-black text-base sm:text-lg text-brand-blue mb-1">More Subjects</h3>
            <span className="text-xs sm:text-sm font-extrabold text-slate-500">Maths, Science & GK</span>
          </a>
        </div>
      </section>

      {/* 3. All Olympiad Subjects for Class 1 */}
      <section id="olympiad-subjects" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-12 sm:pt-16">
        <div className="mb-6 sm:mb-8">
          <span className="text-brand-purple font-black text-xs sm:text-sm uppercase tracking-wider block mb-1">
            Grade 1 Curriculum
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

      {/* 4. How It Works (Clean white container, no inner card borders so illustrations blend seamlessly) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
        <div className="relative bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 lg:p-12 border border-slate-200/70 shadow-xs overflow-hidden">
          <FlyingBird
            startFrame={1}
            sizeClass="w-14 h-14 sm:w-16 sm:h-16"
            className="hidden sm:block absolute top-6 left-6 lg:top-8 lg:left-12 z-10"
          />
          <div className="text-center max-w-xl mx-auto mb-8 sm:mb-10 relative z-10">
            <span className="text-brand-green font-black text-xs sm:text-sm uppercase tracking-wider block mb-1.5">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-brand-ink mb-2">
              Simple. Free. No Stress.
            </h2>
            <p className="text-slate-500 font-bold text-sm sm:text-base">
              Designed specifically for young minds to build early confidence step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1: Daksha with Tablet */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="h-44 sm:h-48 flex items-center justify-center mb-3">
                <img
                  src="/home/step-pick-topic.webp"
                  alt="Daksha picking a topic"
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <h3 className="font-black text-lg sm:text-xl text-brand-ink mb-2">Pick Any Topic</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs">
                Choose from Vocabulary, Spelling, Grammar, Opposites, or a full Mixed Practice mock test.
              </p>
            </div>

            {/* Step 2: Aayush Reading Book */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="h-44 sm:h-48 flex items-center justify-center mb-3">
                <img
                  src="/home/step-practice-exam.webp"
                  alt="Aayush choosing practice or exam"
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <h3 className="font-black text-lg sm:text-xl text-brand-ink mb-2">Choose Practice or Exam</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs">
                Practice mode teaches with instant explanations. Exam mode adds a friendly countdown timer.
              </p>
            </div>

            {/* Step 3: Jai Celebrating */}
            <div className="flex flex-col items-center text-center px-2">
              <div className="h-44 sm:h-48 flex items-center justify-center mb-3">
                <img
                  src="/home/step-celebrate.webp"
                  alt="Jai celebrating"
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <h3 className="font-black text-lg sm:text-xl text-brand-ink mb-2">Celebrate & Review</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed max-w-xs">
                Get an encouraging score celebration, review every answer, and retake anytime you want!
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 5. Why Parents & Educators Trust Jugnu */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-18">
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
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-11 h-11 mb-4">
              <img
                src="/home/trust-child-safe.webp"
                alt=""
                className="w-11 h-11 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">Child-Safe & Private</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Strictly COPPA-compliant. Zero tracking cookies, no session recordings, and no personal account data stored.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-11 h-11 mb-4">
              <img
                src="/home/trust-ad-free.webp"
                alt=""
                className="w-11 h-11 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">100% Ad-Free</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Zero distracting video popups, banner ads, or accidental click traps. A calm, clean environment where kids can focus.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-11 h-11 mb-4">
              <img
                src="/home/trust-curriculum.webp"
                alt=""
                className="w-11 h-11 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">Curriculum-Aligned</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Structured around CBSE, ICSE, and international Class 1 learning standards for math, reading, and logic.
            </p>
          </div>

          {/* Card 4 */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-11 h-11 mb-4">
              <img
                src="/home/trust-paper-ready.webp"
                alt=""
                className="w-11 h-11 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-1.5">Screen-to-Paper Ready</h3>
            <p className="text-slate-600 text-sm leading-relaxed font-medium">
              Download and print free tracing worksheets, alphabet grids, and deity coloring pages for offline physical practice.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Foundational Skills Covered (Icon stacked ABOVE Title so titles never wrap unevenly) */}
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
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 mb-3">
              <img
                src="/home/pillar-math.webp"
                alt=""
                className="w-10 h-10 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-3">Mathematics & Logic</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-start gap-2"><span>•</span><span>Numbers 1 to 100 & Number Names</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Single & Double-Digit Addition</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Visual Subtraction within 20</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>2D & 3D Shapes & Spatial Sense</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Clocks, Reading Time & Calendar</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Indian Currency, Coins & Money</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Repeating Sequences & Patterns</span></li>
            </ul>
          </div>

          {/* Pillar 2: English Phonics */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 mb-3">
              <img
                src="/home/pillar-english.webp"
                alt=""
                className="w-10 h-10 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-3">English & Phonics</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-start gap-2"><span>•</span><span>A-Z Letter Phonic Sounds</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>3-Letter CVC Word Blends</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>High-Frequency Sight Words</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Naming Words (Nouns & Pronouns)</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Action Words (Verbs) & Tenses</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Rhyming Pairs & Opposites</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Picture Comprehension Stories</span></li>
            </ul>
          </div>

          {/* Pillar 3: Science & Nature */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 mb-3">
              <img
                src="/home/pillar-science.webp"
                alt=""
                className="w-10 h-10 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-3">Science & Nature</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-start gap-2"><span>•</span><span>Living vs Non-Living Things</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Parts of Plants, Leaves & Seeds</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Animal Habitats, Sounds & Babies</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Human Body & The 5 Senses</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Seasons, Weather & The Sun</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Good Habits, Hygiene & Safety</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Our Planet, Water & Clean Air</span></li>
            </ul>
          </div>

          {/* Pillar 4: Fine Motor & Art */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col">
            <div className="w-10 h-10 mb-3">
              <img
                src="/home/pillar-art.webp"
                alt=""
                className="w-10 h-10 object-contain"
              />
            </div>
            <h3 className="font-black text-lg text-brand-ink mb-3">Fine Motor & Art</h3>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
              <li className="flex items-start gap-2"><span>•</span><span>4-Line English Letter Tracing</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>2-Line Hindi Devanagari Tracing</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Pre-Writing Curves & Standing Lines</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Symmetry Picture Grid Matching</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Deity Outline Coloring Sheets</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Digital Canvas with 13 Brushes</span></li>
              <li className="flex items-start gap-2"><span>•</span><span>Printable Activity Worksheets</span></li>
            </ul>
          </div>
        </div>
      </section>

      {/* 7. Learning Guides & Parent Tips (Blog Highlights) */}
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
              className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition-all flex flex-col hover:-translate-y-1 group"
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

      {/* 8. Frequently Asked Questions (Collapsible Accordion with Schema.org) */}
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
              className="group bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs transition-all [&_summary::-webkit-details-marker]:hidden"
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

      {/* 9. Educational Philosophy & Mission Card (from Figma) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
        <div className="max-w-3xl mx-auto rounded-3xl sm:rounded-4xl bg-gradient-to-br from-slate-900 to-blue-950 text-white p-7 sm:p-10 lg:p-12 shadow-lg border border-slate-800">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-brand-yellow font-black text-xs sm:text-sm uppercase tracking-wider block mb-2">
              Our Educational Mission
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 leading-tight">
              Joyful, pressure-free learning for every child.
            </h2>
            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed font-normal text-center">
              <p>
                Jugnu was created with a simple conviction: early learning should spark genuine curiosity, not academic anxiety. Modern digital platforms often bombard young children with flashing advertisements, algorithmic video feeds, and addictive autoplay loops. Jugnu offers an intentional alternative — an ad-free, pressure-free digital playground that combines wholesome creative play with foundational education.
              </p>
              <p>
                Whether your child is tracing their first four-line letter, exploring seed biology, solving a sliding picture puzzle, or preparing for their first Math Olympiad, Jugnu meets them with encouraging feedback, playful audio, and zero barriers. Every activity is self-paced, celebratory, and built to nurture a lifelong love of discovery.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-slate-400">
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
