import React, { useState } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { ENGLISH_TOPICS, SUBJECTS, getPracticeSet, getPracticeSetQuestionCount, getTopicQuestionCount } from '../data/questionRepository';
import { ExamMode, PracticeSetId, SubjectId, TopicId } from '../types';

export const ExamIntroPage: React.FC = () => {
  const { subjectId = 'english', topicId = 'mixed-practice' } = useParams<{
    subjectId: SubjectId;
    topicId: TopicId;
  }>();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedClass } = useSession();

  const [mode, setMode] = useState<ExamMode>('practice');
  const [shuffleQuestions, setShuffleQuestions] = useState<boolean>(true);

  const currentSubject = SUBJECTS.find((s) => s.id === subjectId) || SUBJECTS[0];
  const currentTopic = ENGLISH_TOPICS.find((t) => t.id === topicId) || ENGLISH_TOPICS[0];
  const requestedSet = searchParams.get('set');
  const practiceSetId: PracticeSetId = requestedSet === 'paper-1' || requestedSet === 'paper-2' ? requestedSet : 'all';
  const practiceSet = getPracticeSet(practiceSetId);
  const isPracticePaper = topicId === 'mixed-practice';
  const displayTitle = isPracticePaper ? practiceSet.title : currentTopic.title;
  const displayDescription = isPracticePaper ? practiceSet.description : currentTopic.description;
  const totalQuestions = isPracticePaper
    ? getPracticeSetQuestionCount(practiceSetId)
    : getTopicQuestionCount(selectedClass, subjectId as SubjectId, topicId as TopicId);

  // Suggested time: ~1 minute per question for Exam Mode
  const estimatedMinutes = currentTopic.estimatedMinutes || Math.max(5, Math.ceil(totalQuestions * 1.2));

  const handleStart = () => {
    const setParam = isPracticePaper ? `&set=${practiceSetId}` : '';
    navigate(`/exam/${subjectId}/${topicId}?mode=${mode}&shuffle=${shuffleQuestions}${setParam}`);
  };

  return (
    <div className="max-w-[700px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-12 animate-in fade-in duration-200">
      
      {/* Back Button */}
      <div className="mb-6">
        <Link
          to={`/topics/${subjectId}`}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-black text-slate-500 hover:text-brand-ink px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm transition-colors"
        >
          <Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
          <span>Back to Topics</span>
        </Link>
      </div>

      {/* Main Intro Card */}
      <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-9 border-2 border-slate-200/90 shadow-sm">
        
        {/* Topic Badge & Title */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
              backgroundColor: isPracticePaper ? practiceSet.iconBgColor : currentTopic.iconBgColor,
              color: isPracticePaper ? practiceSet.iconColor : currentTopic.iconColor,
            }}
          >
            <Icon icon={isPracticePaper ? practiceSet.icon : currentTopic.icon} className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-brand-blue">
              {currentSubject.title} • Class {selectedClass}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-ink">
              {displayTitle}
            </h1>
            <p className="text-slate-500 font-bold text-xs sm:text-sm mt-0.5">
              {displayDescription}
            </p>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-brand-blue flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:question-circle-bold" className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xl font-black text-brand-ink leading-tight">
                {totalQuestions}
              </span>
              <span className="text-xs font-bold text-slate-400">Total Questions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
              <Icon icon="solar:clock-circle-bold" className="w-6 h-6" />
            </div>
            <div>
              <span className="block text-xl font-black text-brand-ink leading-tight">
                ~{estimatedMinutes} min
              </span>
              <span className="text-xs font-bold text-slate-400">Estimated Time</span>
            </div>
          </div>
        </div>

        {/* Mode Selector (Practice Mode vs Exam Mode) */}
        <div className="mb-8">
          <label className="block text-xs font-black uppercase text-slate-400 mb-3 tracking-wider">
            Choose Learning Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Practice Mode Option */}
            <button
              type="button"
              onClick={() => setMode('practice')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                mode === 'practice'
                  ? 'border-brand-blue bg-brand-blue/5 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-brand-green/10 text-brand-green flex items-center justify-center">
                  <Icon icon="solar:star-bold" className="w-5 h-5" />
                </div>
                {mode === 'practice' && (
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-brand-blue" />
                )}
              </div>
              <h3 className="font-black text-base text-brand-ink mb-1">Practice Mode</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                No timer pressure. See instant answers and explanations after each question.
              </p>
            </button>

            {/* Exam Mode Option */}
            <button
              type="button"
              onClick={() => setMode('exam')}
              className={`p-4 rounded-2xl border-2 text-left transition-all relative ${
                mode === 'exam'
                  ? 'border-brand-blue bg-brand-blue/5 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-9 h-9 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                  <Icon icon="solar:alarm-bold" className="w-5 h-5" />
                </div>
                {mode === 'exam' && (
                  <Icon icon="solar:check-circle-bold" className="w-5 h-5 text-brand-blue" />
                )}
              </div>
              <h3 className="font-black text-base text-brand-ink mb-1">Exam Mode</h3>
              <p className="text-xs font-bold text-slate-500 leading-relaxed">
                Countdown timer. Results and explanations are revealed after you submit.
              </p>
            </button>

          </div>
        </div>

        {/* Options: Shuffle Questions */}
        <div className="mb-8 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Icon icon="solar:shuffle-bold" className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-extrabold text-brand-ink">Shuffle question order</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={shuffleQuestions}
            onClick={() => setShuffleQuestions(!shuffleQuestions)}
            className={`w-12 h-7 rounded-full p-1 transition-colors ${
              shuffleQuestions ? 'bg-brand-blue' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                shuffleQuestions ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Friendly Instructions Box */}
        <div className="mb-8 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950">
          <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-amber-800 mb-1.5">
            <Icon icon="solar:info-circle-bold" className="w-4 h-4" />
            <span>Helpful Tips</span>
          </div>
          <ul className="text-xs sm:text-sm font-bold space-y-1.5 list-disc list-inside text-amber-900/90">
            <li>You can move backwards and change your answers anytime before submitting.</li>
            <li>Use keyboard numbers 1–4 or keys A–D to pick answers quickly.</li>
            <li>Take your time, read questions carefully, and have fun!</li>
          </ul>
        </div>

        {/* Big Start Button */}
        <button
          type="button"
          onClick={handleStart}
          className="w-full py-4 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-black text-lg shadow-chunky transition-all btn-chunky flex items-center justify-center gap-2.5"
        >
          <span>Start {mode === 'exam' ? 'Exam' : 'Practice'}</span>
          <Icon icon="solar:arrow-right-bold" className="w-5 h-5" />
        </button>

      </div>

    </div>
  );
};
