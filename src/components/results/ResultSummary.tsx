import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import confetti from 'canvas-confetti';
import { ExamResultSummary, TopicMeta } from '../../types';
import { ResultCelebrationIllustration } from '../illustrations/Illustrations';
import { playCelebrationFanfare } from '../../utils/soundEffects';

interface ResultSummaryProps {
  summary: ExamResultSummary;
  topic: TopicMeta;
  onReviewAnswers: () => void;
  onTryAgain: () => void;
  onGoHome: () => void;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({
  summary,
  topic,
  onReviewAnswers,
  onTryAgain,
  onGoHome,
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Trigger celebration effects on mount
  useEffect(() => {
    // Sound fanfare
    playCelebrationFanfare();

    // Fire lightweight confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#087CF7', '#FFD329', '#20C86B', '#FF6656', '#9256F5'],
      });
    } catch {
      // Confetti fallback
    }

    // Smooth count-up animation for score
    let start = 0;
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    const increment = summary.correctCount / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= summary.correctCount) {
        setAnimatedScore(summary.correctCount);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [summary.correctCount]);

  // Encouragement text
  const getEncouragement = (pct: number) => {
    if (pct >= 90) return { title: 'Awesome Champion!', desc: 'Outstanding score! You mastered this Olympiad set!' };
    if (pct >= 75) return { title: 'Super Work!', desc: 'You are doing fantastic! Keep shining bright!' };
    if (pct >= 50) return { title: 'Great Effort!', desc: 'Well done! A little more practice and you will score 100%!' };
    return { title: 'Good Try!', desc: 'Every attempt makes your brain stronger! Let’s practice again!' };
  };

  const encouragement = getEncouragement(summary.scorePercentage);

  // Circular ring calculations
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (summary.scorePercentage / 100) * circumference;

  // Format time taken
  const minutes = Math.floor(summary.timeSpentSeconds / 60);
  const seconds = summary.timeSpentSeconds % 60;
  const timeDisplay = minutes > 0 ? `${minutes} min ${seconds}s` : `${seconds}s`;

  return (
    <div className="w-full max-w-[800px] mx-auto px-4 py-6 sm:py-10 animate-in fade-in duration-300">
      
      {/* Blue Hero Celebration Card matching reference */}
      <div className="relative bg-gradient-to-b from-[#3B9CFF] to-[#087CF7] rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-white shadow-xl overflow-hidden mb-6 sm:mb-8 border-4 border-slate-900/10">
        
        {/* Decorative clouds */}
        <div className="absolute top-4 left-6 opacity-30 pointer-events-none">
          <Icon icon="solar:cloud-bold" className="w-16 h-16" />
        </div>
        <div className="absolute top-6 right-8 opacity-25 pointer-events-none">
          <Icon icon="solar:cloud-bold" className="w-20 h-20" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
          
          {/* Left Text & Illustration */}
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-32 h-32 sm:w-40 sm:h-40 flex-shrink-0">
              <ResultCelebrationIllustration className="w-full h-full drop-shadow-md" />
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black uppercase tracking-wider mb-2">
                {topic.title} Completed
              </span>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
                {encouragement.title}
              </h1>
              <p className="text-white/90 font-bold text-sm sm:text-base max-w-sm">
                {encouragement.desc}
              </p>
            </div>
          </div>

          {/* Right Circular Progress Ring matching reference */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center flex-shrink-0 bg-white rounded-3xl p-3 sm:p-4 shadow-lg border-2 border-slate-900/10">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#E2E8F0"
                strokeWidth="14"
                fill="none"
              />
              {/* Progress Ring */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#20C86B"
                strokeWidth="14"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            
            {/* Center score text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl sm:text-3xl font-black text-brand-ink leading-none">
                {animatedScore}
                <span className="text-slate-400 text-lg sm:text-xl font-bold">/{summary.totalQuestions}</span>
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mt-1">
                Score
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Summary Cards Row matching reference */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        
        {/* Correct Answers */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-100 text-brand-green flex items-center justify-center mb-2">
            <Icon icon="solar:check-circle-bold" className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-brand-ink">{summary.correctCount}</span>
          <span className="text-xs sm:text-sm font-bold text-slate-400">Correct</span>
        </div>

        {/* Wrong Answers */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-rose-100 text-brand-coral flex items-center justify-center mb-2">
            <Icon icon="solar:close-circle-bold" className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span className="text-2xl sm:text-3xl font-black text-brand-ink">{summary.incorrectCount}</span>
          <span className="text-xs sm:text-sm font-bold text-slate-400">Wrong</span>
        </div>

        {/* Time Taken */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-slate-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-100 text-brand-blue flex items-center justify-center mb-2">
            <Icon icon="solar:clock-circle-bold" className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <span className="text-xl sm:text-2xl font-black text-brand-ink">{timeDisplay}</span>
          <span className="text-xs sm:text-sm font-bold text-slate-400">Time Taken</span>
        </div>

      </div>

      {/* Action Buttons Row matching reference */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 no-print">
        
        {/* Review Answers Button */}
        <button
          type="button"
          onClick={onReviewAnswers}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-full bg-white border-2 border-slate-300 hover:border-brand-blue text-brand-ink font-extrabold text-base shadow-sm hover:bg-slate-50 transition-all btn-chunky"
        >
          <Icon icon="solar:document-text-bold" className="w-5 h-5 text-brand-blue" />
          <span>Review Answers</span>
        </button>

        {/* Try Again Button */}
        <button
          type="button"
          onClick={onTryAgain}
          className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3.5 sm:py-4 px-6 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-black text-base shadow-chunky transition-all btn-chunky"
        >
          <Icon icon="solar:restart-bold" className="w-5 h-5" />
          <span>Try Again</span>
        </button>

        {/* Print / Save Summary Button */}
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 sm:py-4 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
          title="Print or save as PDF"
        >
          <Icon icon="solar:printer-bold" className="w-5 h-5" />
          <span className="sm:hidden">Print Result</span>
        </button>

        {/* Back to Home Button */}
        <button
          type="button"
          onClick={onGoHome}
          className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 sm:py-4 px-5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
        >
          <span>All Topics</span>
        </button>

      </div>

    </div>
  );
};
