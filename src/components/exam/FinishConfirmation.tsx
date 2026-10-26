import React, { useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';

interface FinishConfirmationProps {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  onConfirmFinish: () => void;
  onReturnToExam: () => void;
  onJumpToQuestion?: (questionIndex: number) => void;
  unansweredIndices?: number[];
}

export const FinishConfirmation: React.FC<FinishConfirmationProps> = ({
  isOpen,
  totalQuestions,
  answeredCount,
  unansweredCount,
  onConfirmFinish,
  onReturnToExam,
  onJumpToQuestion,
  unansweredIndices = [],
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  // Sync open state with native dialog showModal() / close()
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Fallback for browsers that do not support closedby="any"
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      const isContentClick = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isContentClick) {
        onReturnToExam();
      }
    };

    const handleCancel = (e: Event) => {
      e.preventDefault();
      onReturnToExam();
    };

    dialog.addEventListener('click', handleBackdropClick);
    dialog.addEventListener('cancel', handleCancel);

    return () => {
      dialog.removeEventListener('click', handleBackdropClick);
      dialog.removeEventListener('cancel', handleCancel);
    };
  }, [onReturnToExam]);

  return (
    <dialog
      ref={dialogRef}
      {...({ closedby: 'any' } as any)}
      aria-labelledby="finish-dialog-title"
      className="p-0 rounded-3xl bg-white max-w-md w-[92vw] shadow-2xl border-2 border-slate-900 m-auto focus:outline-none"
    >
      <div className="p-6 sm:p-7 text-center">
        
        {/* Header Icon */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4 border-2 border-amber-300">
          <Icon icon={unansweredCount > 0 ? "solar:danger-triangle-bold" : "solar:cup-star-bold"} className="w-8 h-8" />
        </div>

        <h3 id="finish-dialog-title" className="text-2xl font-black text-brand-ink mb-2">
          {unansweredCount > 0 ? 'Ready to Finish?' : 'All Done!'}
        </h3>

        <p className="text-slate-500 font-bold text-sm sm:text-base mb-6 leading-relaxed">
          {unansweredCount > 0
            ? `You have answered ${answeredCount} of ${totalQuestions} questions. You still have ${unansweredCount} unanswered questions.`
            : `Awesome! You have answered all ${totalQuestions} questions.`}
        </p>

        {/* Stats Chips */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-200">
            <span className="block text-2xl font-black text-brand-green">{answeredCount}</span>
            <span className="text-xs font-black uppercase text-emerald-800">Answered</span>
          </div>
          <div className={`p-3.5 rounded-2xl border-2 ${
            unansweredCount > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <span className={`block text-2xl font-black ${
              unansweredCount > 0 ? 'text-amber-600' : 'text-slate-400'
            }`}>
              {unansweredCount}
            </span>
            <span className={`text-xs font-black uppercase ${
              unansweredCount > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Unanswered
            </span>
          </div>
        </div>

        {/* Unanswered quick-jump pills if any */}
        {unansweredCount > 0 && onJumpToQuestion && unansweredIndices.length > 0 && (
          <div className="mb-6 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left">
            <span className="block text-xs font-black text-slate-500 uppercase mb-2">
              Unanswered Questions:
            </span>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {unansweredIndices.map((qIdx) => (
                <button
                  key={qIdx}
                  type="button"
                  onClick={() => {
                    onJumpToQuestion(qIdx);
                  }}
                  className="w-8 h-8 rounded-xl bg-white border-2 border-amber-300 hover:border-brand-blue text-amber-900 font-black text-xs hover:bg-brand-blue hover:text-white transition-colors"
                  title={`Jump to Question ${qIdx + 1}`}
                >
                  {qIdx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onReturnToExam}
            className="flex-1 py-3 px-5 rounded-full border-2 border-slate-300 text-slate-700 font-extrabold text-sm hover:bg-slate-100 transition-colors btn-chunky"
          >
            Keep Practising
          </button>
          <button
            type="button"
            onClick={onConfirmFinish}
            className="flex-1 py-3 px-5 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-sm shadow-chunky transition-colors btn-chunky"
          >
            Submit & View Results
          </button>
        </div>

      </div>
    </dialog>
  );
};
