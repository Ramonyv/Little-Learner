import React from 'react';
import { Icon } from '@iconify/react';
import { ExamMode } from '../../types';

interface ExamProgressProps {
  currentIndex: number;
  totalQuestions: number;
  mode: ExamMode;
  timeLeftSeconds?: number;
  onQuit?: () => void;
}

export const ExamProgress: React.FC<ExamProgressProps> = ({
  currentIndex,
  totalQuestions,
  mode,
  timeLeftSeconds,
  onQuit,
}) => {
  const percentage = Math.round(((currentIndex + 1) / totalQuestions) * 100);

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isTimeLow = timeLeftSeconds !== undefined && timeLeftSeconds < 120; // Under 2 mins

  return (
    <div className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 py-3 sm:py-3.5">
      <div className="max-w-[800px] mx-auto flex flex-col gap-2.5">
        
        {/* Top line: Quit, Question count, Timer */}
        <div className="flex items-center justify-between text-sm sm:text-base font-extrabold text-slate-600">
          
          {/* Back/Quit */}
          {onQuit && (
            <button
              onClick={onQuit}
              className="flex items-center gap-1 text-slate-500 hover:text-brand-ink text-xs sm:text-sm font-bold px-2 py-1 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Exit exam"
            >
              <Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
              <span>Exit</span>
            </button>
          )}

          {/* Question Number indicator */}
          <div className="flex items-center gap-2">
            <span className="text-brand-blue font-black">{currentIndex + 1}</span>
            <span className="text-slate-400 font-bold">of {totalQuestions}</span>
          </div>

          {/* Mode Badge or Timer */}
          <div>
            {mode === 'exam' && timeLeftSeconds !== undefined ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs sm:text-sm font-black border transition-colors ${
                  isTimeLow
                    ? 'bg-rose-50 border-rose-300 text-rose-600 animate-pulse'
                    : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}
                title="Time remaining"
              >
                <Icon icon="solar:clock-circle-bold" className="w-4 h-4" />
                <span>{formatTime(timeLeftSeconds)}</span>
              </div>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-brand-green border border-emerald-200 text-xs font-black uppercase tracking-wider">
                Practice Mode
              </span>
            )}
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-2.5 sm:h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
          <div
            className="h-full bg-brand-blue rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progress: ${percentage}%`}
          />
        </div>

      </div>
    </div>
  );
};
