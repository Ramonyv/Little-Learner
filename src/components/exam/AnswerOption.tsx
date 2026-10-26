import React from 'react';
import { Icon } from '@iconify/react';
import { ExamMode } from '../../types';

interface AnswerOptionProps {
  index: 0 | 1 | 2 | 3;
  text: string;
  selected: boolean;
  onSelect: () => void;
  mode: ExamMode;
  showFeedback: boolean;
  isCorrect: boolean;
  disabled?: boolean;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({
  index,
  text,
  selected,
  onSelect,
  mode,
  showFeedback,
  isCorrect,
  disabled = false,
}) => {
  const letters = ['A', 'B', 'C', 'D'];
  const letter = letters[index];

  // Determine styling based on mode and feedback
  let containerStyle = 'bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/70';
  let badgeStyle = 'bg-slate-100 text-slate-600 border border-slate-200';
  let iconIndicator: React.ReactNode = null;

  if (mode === 'practice' && showFeedback) {
    if (isCorrect) {
      // Correct answer is always highlighted in green
      containerStyle = 'bg-emerald-50/80 border-2 border-brand-green text-emerald-950 font-extrabold shadow-sm';
      badgeStyle = 'bg-brand-green text-white border-transparent';
      iconIndicator = (
        <div className="w-7 h-7 rounded-full bg-brand-green text-white flex items-center justify-center flex-shrink-0 animate-in zoom-in-75 duration-150">
          <Icon icon="solar:check-circle-bold" className="w-5 h-5" />
        </div>
      );
    } else if (selected && !isCorrect) {
      // Selected wrong answer highlighted in red
      containerStyle = 'bg-rose-50/80 border-2 border-brand-coral text-rose-950 font-extrabold shadow-sm';
      badgeStyle = 'bg-brand-coral text-white border-transparent';
      iconIndicator = (
        <div className="w-7 h-7 rounded-full bg-brand-coral text-white flex items-center justify-center flex-shrink-0 animate-in zoom-in-75 duration-150">
          <Icon icon="solar:close-circle-bold" className="w-5 h-5" />
        </div>
      );
    } else {
      containerStyle = 'bg-white/60 border-2 border-slate-200 text-slate-400 opacity-60';
    }
  } else if (selected) {
    // Exam mode or selected before feedback
    containerStyle = 'bg-brand-blue/5 border-2 border-brand-blue text-brand-ink font-extrabold shadow-sm';
    badgeStyle = 'bg-brand-blue text-white border-transparent';
    iconIndicator = (
      <div className="w-6 h-6 rounded-full bg-brand-blue text-white flex items-center justify-center flex-shrink-0">
        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl transition-all duration-150 text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30 active:scale-[0.99] min-h-[58px] ${containerStyle}`}
      aria-label={`Option ${letter}: ${text}`}
    >
      <div className="flex items-center gap-3.5 sm:gap-4 flex-1">
        {/* Letter Badge */}
        <span
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-sm sm:text-base font-black flex-shrink-0 transition-colors ${badgeStyle}`}
        >
          {letter}
        </span>
        {/* Text */}
        <span className="text-base sm:text-lg leading-snug break-words">{text}</span>
      </div>

      {/* Right Indicator (Checkmark / Cross) */}
      {iconIndicator && <div className="ml-3">{iconIndicator}</div>}
    </button>
  );
};
