import React from 'react';
import type { SavedPixelWork } from '../storage/myWork';

interface MyArtPanelProps {
  works: SavedPixelWork[];
  onLoadWork: (work: SavedPixelWork) => void;
  onDeleteWork: (id: string) => void;
}

export const MyArtPanel: React.FC<MyArtPanelProps> = ({
  works,
  onLoadWork,
  onDeleteWork,
}) => {
  if (works.length === 0) {
    return (
      <div className="rounded-2xl bg-[#f8fbff] border border-[#dbe7f6] p-4 text-center space-y-1">
        <p className="text-xs font-black text-[#172951]">No saved pixel art yet</p>
        <p className="text-[11px] font-bold text-[#516587]">
          Tap the yellow Save button to keep your favorites here!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-0.5">
      {works.map((work) => (
        <div
          key={work.id}
          className="rounded-2xl border border-[#dbe7f6] bg-[#f9fbff] p-2 flex flex-col items-center gap-1.5"
        >
          <img
            src={work.thumbnail}
            alt={work.title}
            style={{ imageRendering: 'pixelated' }}
            className="w-16 h-16 rounded-xl border border-slate-200 bg-white object-contain"
          />
          <span className="text-[11px] font-black text-[#172951] truncate w-full text-center">
            {work.title}
          </span>
          <div className="flex gap-1 w-full">
            <button
              type="button"
              onClick={() => onLoadWork(work)}
              className="flex-1 py-1 rounded-lg bg-[#087CF7] text-white text-[10px] font-black"
            >
              Open
            </button>
            <button
              type="button"
              onClick={() => onDeleteWork(work.id)}
              aria-label={`Delete ${work.title}`}
              className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-black"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
