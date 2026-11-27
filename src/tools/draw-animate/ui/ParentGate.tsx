import React, { useMemo, useState } from 'react';

interface ParentGateProps {
  actionLabel: string;
  onPass: () => void;
  onCancel: () => void;
}

export const ParentGate: React.FC<ParentGateProps> = ({ actionLabel, onPass, onCancel }) => {
  const { a, b } = useMemo(
    () => ({
      a: 4 + Math.floor(Math.random() * 6),
      b: 3 + Math.floor(Math.random() * 6),
    }),
    [],
  );
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Number(answer.trim()) === a + b) {
      onPass();
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="parent-gate-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-3xl border-2 border-[#dbe7f6] shadow-2xl p-5 space-y-4 text-center"
      >
        <div className="text-3xl" aria-hidden="true">🔒</div>
        <h2 id="parent-gate-title" className="text-lg font-black text-[#172951]">
          Grown-Up Check
        </h2>
        <p className="text-sm font-bold text-[#516587]">
          Solve this quick math question to {actionLabel}:
        </p>
        <div className="text-2xl font-black text-[#087CF7]">
          {a} + {b} = ?
        </div>
        <input
          type="number"
          inputMode="numeric"
          autoFocus
          value={answer}
          onChange={(e) => {
            setAnswer(e.target.value);
            setError(false);
          }}
          aria-label="Answer"
          className="w-32 mx-auto text-center text-xl font-black px-3 py-2 rounded-2xl border-2 border-[#dbe7f6] focus:border-[#087CF7] outline-none"
        />
        {error && (
          <p className="text-xs font-extrabold text-rose-600">Try again!</p>
        )}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] px-4 rounded-full bg-slate-100 text-[#172951] text-sm font-black"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="min-h-[48px] px-5 rounded-full bg-[#087CF7] text-white text-sm font-black"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};
