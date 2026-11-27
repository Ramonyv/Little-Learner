import React, { useEffect, useRef, useState } from 'react';
import { DEFAULT_PIXEL_PALETTE } from '../data/palettes';
import { PIXEL_TEMPLATES, TEMPLATE_CATEGORIES, type PixelTemplate, type TemplateCategory } from '../data/templates';

function TemplateThumb({ template }: { template: PixelTemplate }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cell = canvas.width / template.size;
    for (let y = 0; y < template.size; y++) {
      for (let x = 0; x < template.size; x++) {
        const idx = template.pixels[y * template.size + x];
        if (idx > 0 && idx <= DEFAULT_PIXEL_PALETTE.length) {
          ctx.fillStyle = DEFAULT_PIXEL_PALETTE[idx - 1].hex;
          ctx.fillRect(x * cell, y * cell, Math.ceil(cell), Math.ceil(cell));
        }
      }
    }
  }, [template]);

  return (
    <canvas
      ref={ref}
      width={64}
      height={64}
      style={{ imageRendering: 'pixelated' }}
      className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200"
    />
  );
}

interface TemplatePanelProps {
  activeTemplateId: string | null;
  onSelectTemplate: (template: PixelTemplate) => void;
}

export const TemplatePanel: React.FC<TemplatePanelProps> = ({
  activeTemplateId,
  onSelectTemplate,
}) => {
  const [category, setCategory] = useState<'All' | TemplateCategory>('All');

  const filtered =
    category === 'All'
      ? PIXEL_TEMPLATES
      : PIXEL_TEMPLATES.filter((t) => t.category === category);

  return (
    <div className="space-y-2.5">
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {(['All', ...TEMPLATE_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-black whitespace-nowrap border ${
              category === cat
                ? 'bg-[#087CF7] text-white border-[#087CF7]'
                : 'bg-[#f4f8ff] text-[#516587] border-[#dbe7f6]'
            }`}
          >
            {cat === 'Letters & Numbers' ? 'ABC / 123' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[360px] overflow-y-auto pr-0.5">
        {filtered.map((tpl) => {
          const active = tpl.id === activeTemplateId;
          return (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onSelectTemplate(tpl)}
              className={`p-2 rounded-2xl border-2 flex flex-col items-center text-center gap-1 transition-all ${
                active
                  ? 'border-[#FFC300] bg-amber-50/70'
                  : 'border-[#eef3fb] bg-[#f9fbff] hover:border-[#cfe0f5]'
              }`}
            >
              <TemplateThumb template={tpl} />
              <span className="text-[11px] font-black text-[#172951] leading-tight">
                {tpl.name}
              </span>
              <span className="text-[10px] font-bold text-[#516587]">
                {tpl.size === 8 ? 'Small (8)' : 'Medium (16)'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
