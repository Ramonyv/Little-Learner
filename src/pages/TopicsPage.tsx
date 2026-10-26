import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { ENGLISH_PRACTICE_SETS, ENGLISH_TOPICS, SUBJECTS, getPracticeSetQuestionCount, getTopicQuestionCount } from '../data/questionRepository';
import { TopicCard } from '../components/cards/TopicCard';
import { SubjectId } from '../types';

export const TopicsPage: React.FC = () => {
  const { subjectId = 'english' } = useParams<{ subjectId: SubjectId }>();
  const { selectedClass } = useSession();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentSubject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  const topicPractice = ENGLISH_TOPICS.filter((topic) => topic.id !== 'mixed-practice');

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-12 animate-in fade-in duration-200">
      
      {/* Top Header matching mobile reference "← Choose a Topic" */}
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 hover:border-brand-blue flex items-center justify-center text-slate-600 hover:text-brand-blue transition-colors shadow-sm"
            aria-label="Back to home"
          >
            <Icon icon="solar:arrow-left-bold" className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-ink">
              Choose a Topic
            </h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              {currentSubject.title} Olympiad • Class {selectedClass}
            </p>
          </div>
        </div>

        {/* View mode toggle (hidden on very small screens) */}
        <div className="hidden sm:flex items-center bg-white border-2 border-slate-200 rounded-full p-1 shadow-sm">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'grid' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:text-brand-ink'
            }`}
            title="Grid view"
            aria-label="Grid view"
          >
            <Icon icon="solar:widget-bold" className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-full transition-colors ${
              viewMode === 'list' ? 'bg-brand-blue text-white' : 'text-slate-500 hover:text-brand-ink'
            }`}
            title="List view"
            aria-label="List view"
          >
            <Icon icon="solar:list-bold" className="w-4 h-4" />
          </button>
        </div>
      </div>

      <section className="mb-9 sm:mb-12" aria-labelledby="practice-sets-heading">
        <div className="mb-4">
          <h2 id="practice-sets-heading" className="text-lg sm:text-xl font-black text-brand-ink">
            Practice Papers
          </h2>
          <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">
            Pick one paper, or mix every paper together.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {ENGLISH_PRACTICE_SETS.map((set) => {
            const count = getPracticeSetQuestionCount(set.id);
            return (
              <Link
                key={set.id}
                to={`/intro/${subjectId}/mixed-practice?set=${set.id}`}
                className="group flex sm:flex-col items-center sm:items-start gap-3.5 sm:gap-0 p-4 sm:p-5 bg-white rounded-2xl sm:rounded-3xl border-2 border-slate-100 hover:border-brand-blue/40 hover:shadow-chunky transition-all active:scale-[0.99]"
              >
                <div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 sm:mb-4 transition-transform group-hover:scale-105"
                  style={{ backgroundColor: set.iconBgColor, color: set.iconColor }}
                >
                  <Icon icon={set.icon} className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-black text-brand-ink group-hover:text-brand-blue transition-colors">
                      {set.title}
                    </h3>
                    <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4 text-slate-300 group-hover:text-brand-blue sm:hidden" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 mt-0.5">{count} questions</p>
                  <p className="hidden sm:block text-xs font-semibold text-slate-500 leading-relaxed mt-2">
                    {set.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mb-4">
        <h2 className="text-lg sm:text-xl font-black text-brand-ink">Practice by Topic</h2>
        <p className="text-xs sm:text-sm font-bold text-slate-500 mt-1">Review one English skill at a time.</p>
      </div>

      {/* Topics Rendering: List view on mobile by default or based on toggle */}
      <div className="block sm:hidden space-y-3">
        {topicPractice.map((topic) => {
          const count = getTopicQuestionCount(selectedClass, 'english', topic.id);
          return (
            <TopicCard
              key={topic.id}
              topic={topic}
              questionCount={count}
              classNumber={selectedClass}
              variant="list"
            />
          );
        })}
      </div>

      {/* Desktop/Tablet: Grid or List */}
      <div className="hidden sm:block">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {topicPractice.map((topic) => {
              const count = getTopicQuestionCount(selectedClass, 'english', topic.id);
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  questionCount={count}
                  classNumber={selectedClass}
                  variant="grid"
                />
              );
            })}
          </div>
        ) : (
          <div className="space-y-3 max-w-2xl mx-auto">
            {topicPractice.map((topic) => {
              const count = getTopicQuestionCount(selectedClass, 'english', topic.id);
              return (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  questionCount={count}
                  classNumber={selectedClass}
                  variant="list"
                />
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
