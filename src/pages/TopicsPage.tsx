import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { ENGLISH_TOPICS, SUBJECTS, getTopicQuestionCount } from '../data/questionRepository';
import { TopicCard } from '../components/cards/TopicCard';
import { SubjectId } from '../types';

export const TopicsPage: React.FC = () => {
  const { subjectId = 'english' } = useParams<{ subjectId: SubjectId }>();
  const { selectedClass } = useSession();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const currentSubject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];

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

      {/* Topics Rendering: List view on mobile by default or based on toggle */}
      <div className="block sm:hidden space-y-3">
        {ENGLISH_TOPICS.map((topic) => {
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
            {ENGLISH_TOPICS.map((topic) => {
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
            {ENGLISH_TOPICS.map((topic) => {
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
