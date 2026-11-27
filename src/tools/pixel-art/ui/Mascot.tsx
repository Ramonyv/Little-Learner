import React from 'react';

interface MascotProps {
  message: string | null;
  onDismiss: () => void;
  onDisable: () => void;
}

export const Mascot: React.FC<MascotProps> = ({ message, onDismiss, onDisable }) => {
  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2.5 bg-white/95 backdrop-blur-xs border-2 border-amber-300 rounded-2xl px-3.5 py-2 shadow-sm max-w-md"
    >
      <span className="text-xl shrink-0" aria-hidden="true">
        🐝
      </span>
      <p className="text-xs font-extrabold text-[#172951] leading-snug flex-1 m-0">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss tip"
        className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-[11px] font-black text-amber-900 shrink-0"
      >
        Got it
      </button>
      <button
        type="button"
        onClick={onDisable}
        aria-label="Turn off bee tips"
        title="Turn off tips"
        className="p-1 text-slate-400 hover:text-slate-600 text-xs font-black shrink-0"
      >
        ✕
      </button>
    </div>
  );
};
