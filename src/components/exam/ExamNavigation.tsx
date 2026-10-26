import React from 'react';
import { Icon } from '@iconify/react';

interface ExamNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  hasAnsweredCurrent: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onOpenFinishModal: () => void;
  isLastQuestion: boolean;
}

export const ExamNavigation: React.FC<ExamNavigationProps> = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onOpenFinishModal,
  isLastQuestion,
}) => {
  return (
    <div className="w-full bg-white/95 backdrop-blur-sm border-t border-slate-200/80 px-4 py-3.5 sticky bottom-0 z-20">
      <div className="max-w-[700px] mx-auto flex items-center justify-between gap-3">
        
        {/* Previous Button */}
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className={`flex items-center gap-1.5 px-5 py-3 rounded-full font-black text-sm sm:text-base border-2 transition-all btn-chunky focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-300 ${
            currentIndex === 0
              ? 'opacity-40 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400'
              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 shadow-sm'
          }`}
          aria-label="Go to previous question"
        >
          <Icon icon="solar:arrow-left-bold" className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Previous</span>
        </button>

        {/* Finish Early button for middle of exam */}
        <button
          type="button"
          onClick={onOpenFinishModal}
          className="hidden sm:flex items-center gap-1 px-3.5 py-2 rounded-full text-xs font-black text-slate-500 hover:text-brand-ink hover:bg-slate-100 transition-colors"
          title="Review and finish test"
        >
          <Icon icon="solar:flag-bold" className="w-4 h-4 text-amber-500" />
          <span>Finish Test</span>
        </button>

        {/* Next / Finish Button */}
        {isLastQuestion ? (
          <button
            type="button"
            onClick={onOpenFinishModal}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm sm:text-base bg-brand-green hover:bg-brand-green-hover text-white shadow-chunky transition-all btn-chunky focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-green/30"
          >
            <span>Finish Test</span>
            <Icon icon="solar:check-circle-bold" className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-6 sm:px-8 py-3 rounded-full font-black text-sm sm:text-base bg-brand-blue hover:bg-brand-blue-hover text-white shadow-chunky transition-all btn-chunky focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30"
            aria-label={`Go to question ${currentIndex + 2} of ${totalQuestions}`}
          >
            <span>Next Question</span>
            <Icon icon="solar:arrow-right-bold" className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

      </div>
    </div>
  );
};
