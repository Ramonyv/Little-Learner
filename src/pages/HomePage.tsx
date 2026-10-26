import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { HeroIllustration } from '../components/illustrations/Illustrations';
import { TopicCard } from '../components/cards/TopicCard';
import { SubjectCard } from '../components/cards/SubjectCard';
import { ENGLISH_TOPICS, SUBJECTS, getTopicQuestionCount, getAllSubjectQuestions } from '../data/questionRepository';

export const HomePage: React.FC = () => {
  const { selectedClass } = useSession();
  const englishQuestions = getAllSubjectQuestions(selectedClass, 'english');

  return (
    <div className="pb-24 sm:pb-16 animate-in fade-in duration-200">
      
      {/* 1. Hero Banner matching Desktop UI Reference */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-4 sm:pt-8">
        <div className="relative rounded-3xl sm:rounded-4xl bg-gradient-to-b from-[#6EB3FC] to-[#087CF7] text-white p-6 sm:p-10 lg:p-12 shadow-xl border-4 border-slate-900/10 overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-10">
          
          {/* Decorative Clouds */}
          <div className="absolute top-4 left-10 opacity-30 pointer-events-none">
            <Icon icon="solar:cloud-bold" className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
          <div className="absolute bottom-6 right-12 opacity-25 pointer-events-none">
            <Icon icon="solar:cloud-bold" className="w-14 h-14 sm:w-16 sm:h-16" />
          </div>

          {/* Left Text Content */}
          <div className="relative z-10 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-xs sm:text-sm font-black uppercase tracking-wider mb-3">
              <Icon icon="solar:star-fall-bold" className="w-4 h-4 text-brand-yellow" />
              <span>CBSE Class {selectedClass} Olympiad Prep</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight sm:leading-tight mb-3 sm:mb-4">
              Little steps.<br />
              <span className="text-brand-yellow drop-shadow-sm">Big dreams.</span>
            </h1>

            <p className="text-white/95 font-bold text-base sm:text-xl mb-6 sm:mb-8 leading-relaxed max-w-md mx-auto lg:mx-0">
              Practice, learn, and become a little champion with fun Olympiad questions!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link
                to="/intro/english/mixed-practice"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-brand-yellow hover:bg-brand-yellow-hover text-brand-ink font-black text-lg shadow-chunky transition-all btn-chunky active:scale-95"
              >
                <span>Start Practice</span>
                <Icon icon="solar:arrow-right-bold" className="w-5 h-5" />
              </Link>

              <Link
                to="/topics/english"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-extrabold text-base transition-colors"
              >
                <span>Choose Topic</span>
              </Link>
            </div>
          </div>

          {/* Right Hero Illustration */}
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[460px] flex-shrink-0">
            <HeroIllustration className="w-full h-auto drop-shadow-lg" />
          </div>

        </div>
      </section>

      {/* 2. Topic Cards Grid matching Desktop Reference (Mixed Practice, Vocabulary, etc.) */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14">
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
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 sm:mb-4">
              <Icon icon="solar:widget-add-bold" className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-extrabold text-base sm:text-lg text-brand-ink mb-1">More Subjects</h3>
            <span className="text-xs sm:text-sm font-bold text-slate-400">Maths, Science & GK</span>
          </div>
        </div>
      </section>

      {/* 3. Subject Overview Section (Honest Coming Soon for other subjects) */}
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
              questionCount={sub.id === 'english' ? englishQuestions.length : 0}
            />
          ))}
        </div>
      </section>

      {/* 4. How Practice Works Section */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-14 sm:pt-20">
        <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-10 border-2 border-slate-200/80 shadow-sm">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-brand-green font-black text-xs sm:text-sm uppercase tracking-wider block mb-1.5">
              How It Works
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-ink mb-2">
              Simple. Free. No Stress.
            </h2>
            <p className="text-slate-500 font-bold text-sm sm:text-base">
              Designed specifically for young minds to build Olympiad confidence step-by-step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-blue/10 text-brand-blue flex items-center justify-center font-black text-xl mb-4 border-2 border-brand-blue/20">
                1
              </div>
              <h3 className="font-black text-lg text-brand-ink mb-2">Pick Any Topic</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Choose from Vocabulary, Spelling, Grammar, Opposites, or a full Mixed Practice mock test.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-14 h-14 rounded-2xl bg-brand-yellow/20 text-amber-700 flex items-center justify-center font-black text-xl mb-4 border-2 border-brand-yellow/40">
                2
              </div>
              <h3 className="font-black text-lg text-brand-ink mb-2">Choose Practice or Exam</h3>
              <p className="text-sm font-bold text-slate-500 leading-relaxed">
                Practice mode teaches with instant explanations. Exam mode adds a friendly countdown timer.
              </p>
            </div>

            {/* Step 3 */}
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

    </div>
  );
};
