import React from 'react';
import { Icon } from '@iconify/react';
import { Question, ExamMode } from '../../types';
import { AnswerOption } from './AnswerOption';
import { QuestionIllustration } from '../illustrations/Illustrations';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  selectedOptionIndex?: number;
  onSelectOption: (optionIndex: 0 | 1 | 2 | 3) => void;
  mode: ExamMode;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  selectedOptionIndex,
  onSelectOption,
  mode,
}) => {
  const isAnswered = selectedOptionIndex !== undefined;
  const isCorrect = isAnswered && selectedOptionIndex === question.correctAnswer;

  return (
    <div className="w-full max-w-[700px] mx-auto bg-white rounded-3xl p-5 sm:p-8 border-2 border-slate-100 shadow-sm transition-all">
      
      {/* Reading Comprehension Story Passage (if applicable) */}
      {question.passage && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50/70 border-2 border-amber-200/80 text-amber-950">
          <div className="flex items-center gap-2 mb-2 text-amber-800 font-black text-xs uppercase tracking-wider">
            <Icon icon="solar:book-bookmark-bold" className="w-4 h-4" />
            <span>Read the Story</span>
          </div>
          <p className="font-bold text-base sm:text-lg leading-relaxed">{question.passage}</p>
        </div>
      )}

      {/* Question Heading */}
      <h2 className="text-xl sm:text-2xl font-black text-brand-ink leading-snug mb-5">
        <span className="text-brand-blue mr-2">{questionNumber}.</span>
        {question.question}
      </h2>

      {/* Picture Clue Illustration (if present) */}
      {question.illustration && (
        <div className="my-5 flex flex-col items-center justify-center p-3 sm:p-4 rounded-3xl bg-slate-50 border-2 border-slate-100">
          <QuestionIllustration name={question.illustration} className="w-32 h-32 sm:w-40 sm:h-40" />
        </div>
      )}

      {/* Four Answer Options */}
      <div className="space-y-3 sm:space-y-3.5 my-6">
        {question.options.map((optText, idx) => {
          const optIndex = idx as 0 | 1 | 2 | 3;
          return (
            <AnswerOption
              key={idx}
              index={optIndex}
              text={optText}
              selected={selectedOptionIndex === optIndex}
              onSelect={() => onSelectOption(optIndex)}
              mode={mode}
              showFeedback={isAnswered}
              isCorrect={optIndex === question.correctAnswer}
            />
          );
        })}
      </div>

      {/* Practice Mode Instant Explanation Box */}
      {mode === 'practice' && isAnswered && (
        <div
          className={`mt-6 p-4 sm:p-5 rounded-2xl border-2 transition-all animate-in fade-in slide-in-from-top-2 ${
            isCorrect
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-amber-50/90 border-amber-300 text-amber-950'
          }`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2 font-black text-sm mb-1.5">
            <Icon
              icon={isCorrect ? 'solar:cup-star-bold' : 'solar:lightbulb-bolt-bold'}
              className={`w-5 h-5 ${isCorrect ? 'text-brand-green' : 'text-amber-600'}`}
            />
            <span>{isCorrect ? 'Great job! Correct!' : 'Let\'s learn!'}</span>
          </div>
          <p className="text-sm sm:text-base font-bold leading-relaxed">{question.explanation}</p>
        </div>
      )}

    </div>
  );
};
