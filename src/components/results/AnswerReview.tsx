import React, { useState } from 'react';
import { Icon } from '@iconify/react';
import { Question, ExamResultSummary, TopicMeta } from '../../types';
import { QuestionIllustration } from '../illustrations/Illustrations';

interface AnswerReviewProps {
  questions: Question[];
  userAnswers: Record<number, number>;
  summary: ExamResultSummary;
  topic: TopicMeta;
  onBackToResult: () => void;
  onRetake: () => void;
}

export const AnswerReview: React.FC<AnswerReviewProps> = ({
  questions,
  userAnswers,
  summary,
  topic,
  onBackToResult,
  onRetake,
}) => {
  const [filter, setFilter] = useState<'all' | 'correct' | 'wrong' | 'unanswered'>('all');
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);

  const letters = ['A', 'B', 'C', 'D'];

  // Filter questions
  const filteredIndices = questions
    .map((_, idx) => idx)
    .filter((idx) => {
      const ans = userAnswers[idx];
      const isAnswered = ans !== undefined;
      const isCorrect = isAnswered && ans === questions[idx].correctAnswer;

      if (filter === 'correct') return isCorrect;
      if (filter === 'wrong') return isAnswered && !isCorrect;
      if (filter === 'unanswered') return !isAnswered;
      return true;
    });

  const activeQuestion = questions[activeQuestionIndex];
  const activeAnswer = userAnswers[activeQuestionIndex];
  const isCurrentAnswered = activeAnswer !== undefined;
  const isCurrentCorrect = isCurrentAnswered && activeAnswer === activeQuestion.correctAnswer;

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 py-6 sm:py-8">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToResult}
            className="w-10 h-10 rounded-full bg-white border-2 border-slate-200 hover:border-brand-blue flex items-center justify-center text-slate-600 hover:text-brand-blue transition-colors shadow-sm"
            aria-label="Back to results"
          >
            <Icon icon="solar:arrow-left-bold" className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-ink">Review Answers</h1>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              {topic.title} • {summary.correctCount} of {summary.totalQuestions} correct ({summary.scorePercentage}%)
            </p>
          </div>
        </div>

        {/* Retake Button */}
        <button
          onClick={onRetake}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-blue text-white font-extrabold text-sm shadow-chunky transition-all hover:bg-brand-blue-hover btn-chunky"
        >
          <Icon icon="solar:restart-bold" className="w-4 h-4" />
          <span>Retake Test</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap ${
            filter === 'all'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({questions.length})
        </button>
        <button
          onClick={() => setFilter('correct')}
          className={`px-4 py-2 rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'correct'
              ? 'bg-brand-green text-white shadow-sm'
              : 'bg-white border-2 border-emerald-200 text-brand-green hover:bg-emerald-50'
          }`}
        >
          <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
          <span>Correct ({summary.correctCount})</span>
        </button>
        <button
          onClick={() => setFilter('wrong')}
          className={`px-4 py-2 rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
            filter === 'wrong'
              ? 'bg-brand-coral text-white shadow-sm'
              : 'bg-white border-2 border-rose-200 text-brand-coral hover:bg-rose-50'
          }`}
        >
          <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
          <span>Wrong ({summary.incorrectCount})</span>
        </button>
        {summary.unansweredCount > 0 && (
          <button
            onClick={() => setFilter('unanswered')}
            className={`px-4 py-2 rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
              filter === 'unanswered'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-white border-2 border-amber-200 text-amber-600 hover:bg-amber-50'
            }`}
          >
            <span>Unanswered ({summary.unansweredCount})</span>
          </button>
        )}
      </div>

      {/* Main Review Layout: Left question list pills + Right detail view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Question Navigation Pills Grid / List */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-4 sm:p-5 border-2 border-slate-200 shadow-sm max-h-[520px] overflow-y-auto">
          <div className="flex items-center justify-between mb-3 text-xs font-black uppercase text-slate-400">
            <span>Questions</span>
            <span>Answered: {summary.answeredCount}/{questions.length}</span>
          </div>

          <div className="space-y-2">
            {filteredIndices.map((qIdx) => {
              const ans = userAnswers[qIdx];
              const isAns = ans !== undefined;
              const isCorr = isAns && ans === questions[qIdx].correctAnswer;
              const isSelected = qIdx === activeQuestionIndex;

              return (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => setActiveQuestionIndex(qIdx)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 transition-all text-left ${
                    isSelected
                      ? 'border-brand-blue bg-brand-blue/5 shadow-sm'
                      : 'border-slate-100 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-brand-ink font-black text-xs flex items-center justify-center">
                      {qIdx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      Your answer: {isAns ? letters[ans] : 'None'}
                    </span>
                  </div>

                  {/* Status Icon */}
                  <div>
                    {isAns ? (
                      isCorr ? (
                        <div className="w-6 h-6 rounded-full bg-brand-green text-white flex items-center justify-center">
                          <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-brand-coral text-white flex items-center justify-center">
                          <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                        </div>
                      )
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Skipped
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Detailed Question Review View */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            
            {/* Header Badge */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                Question {activeQuestionIndex + 1} of {questions.length}
              </span>
              <div>
                {isCurrentAnswered ? (
                  isCurrentCorrect ? (
                    <span className="flex items-center gap-1 text-xs font-black text-brand-green bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
                      Correct (+1)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-black text-brand-coral bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
                      <Icon icon="solar:close-circle-bold" className="w-4 h-4" />
                      Incorrect
                    </span>
                  )
                ) : (
                  <span className="text-xs font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    Not Attempted
                  </span>
                )}
              </div>
            </div>

            {/* Passage if any */}
            {activeQuestion.passage && (
              <div className="mb-4 p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-200 text-amber-950 text-sm font-bold leading-relaxed">
                <span className="block text-xs font-black uppercase text-amber-800 mb-1">Story:</span>
                {activeQuestion.passage}
              </div>
            )}

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-black text-brand-ink mb-4">
              {activeQuestion.question}
            </h2>

            {/* Picture Illustration */}
            {activeQuestion.illustration && (
              <div className="mb-5 flex justify-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <QuestionIllustration name={activeQuestion.illustration} className="w-28 h-28 sm:w-32 sm:h-32" />
              </div>
            )}

            {/* All Options with Correctness Annotations */}
            <div className="space-y-2.5 mb-6">
              {activeQuestion.options.map((opt, oIdx) => {
                const optIndex = oIdx as 0 | 1 | 2 | 3;
                const isCorrectOption = optIndex === activeQuestion.correctAnswer;
                const isStudentChoice = activeAnswer === optIndex;

                let borderStyle = 'border-slate-200 bg-white text-slate-700';
                let tagText: string | null = null;

                if (isCorrectOption) {
                  borderStyle = 'border-brand-green bg-emerald-50 text-emerald-950 font-black';
                  tagText = 'Correct Answer';
                } else if (isStudentChoice && !isCorrectOption) {
                  borderStyle = 'border-brand-coral bg-rose-50 text-rose-950 font-black';
                  tagText = 'Your Answer';
                }

                return (
                  <div
                    key={oIdx}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 flex items-center justify-between text-sm sm:text-base ${borderStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm ${
                        isCorrectOption 
                          ? 'bg-brand-green text-white' 
                          : isStudentChoice 
                            ? 'bg-brand-coral text-white' 
                            : 'bg-slate-100 text-slate-600'
                      }`}>
                        {letters[oIdx]}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {tagText && (
                      <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full ${
                        isCorrectOption ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                      }`}>
                        {tagText}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation */}
            <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/80 border-2 border-brand-blue/30 text-blue-950">
              <div className="flex items-center gap-2 text-brand-blue font-black text-xs uppercase tracking-wider mb-1">
                <Icon icon="solar:lightbulb-bolt-bold" className="w-4 h-4" />
                <span>Explanation</span>
              </div>
              <p className="text-sm sm:text-base font-bold leading-relaxed">{activeQuestion.explanation}</p>
            </div>

          </div>

          {/* Bottom Question Switcher */}
          <div className="flex items-center justify-between mt-6 pt-5 border-t border-slate-100">
            <button
              onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={activeQuestionIndex === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm border ${
                activeQuestionIndex === 0
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
              <span>Previous Question</span>
            </button>

            <button
              onClick={() => setActiveQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={activeQuestionIndex === questions.length - 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm border ${
                activeQuestionIndex === questions.length - 1
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Next Question</span>
              <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
