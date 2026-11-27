import React, { useState } from 'react';

interface ParentGateProps {
  open: boolean;
  actionLabel: string;
  onCancel: () => void;
  onPass: () => void;
}

export const ParentGate: React.FC<ParentGateProps> = ({
  open,
  actionLabel,
  onCancel,
  onPass,
}) => {
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-xs">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (answer.trim() === '13') {
            setAnswer('');
            setError(false);
            onPass();
          } else {
            setError(true);
          }
        }}
        className="w-full max-w-xs rounded-3xl bg-white border-2 border-[#dbe7f6] shadow-2xl p-5 space-y-3 text-center"
      >
        <h2 className="text-base font-black text-[#172951]">Parent Check</h2>
        <p className="text-xs font-bold text-[#516587]">
          Solve to {actionLabel}: <strong>What is 6 + 7?</strong>
        </p>
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setError(false);
          }}
          placeholder="Answer"
          className="w-full min-h-[44px] px-3 py-2 rounded-xl border-2 border-[#dbe7f6] text-center text-sm font-black text-[#172951]"
        />
        {error && <p className="text-xs font-bold text-rose-600">Try again!</p>}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => {
              setAnswer('');
              setError(false);
              onCancel();
            }}
            className="flex-1 min-h-[44px] rounded-xl bg-slate-100 text-xs font-extrabold text-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 min-h-[44px] rounded-xl bg-[#087CF7] text-xs font-black text-white"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};
