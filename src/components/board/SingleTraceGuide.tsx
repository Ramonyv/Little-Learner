import type { Guide } from './guides';

export function SingleTraceGuide({ guide, category, dark = false }: { guide: Guide; category: string; dark?: boolean }) {
  const traceColor = dark ? '#c7ddd3' : '#9aaccb';
  const text = guide.text || '';
  const fontSize = text.length > 4 ? 200 : text.length > 1 ? 350 : 760;
  return <svg className="board-guide single-trace-guide" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid meet" aria-label={category + ' single tracing guide'}>
    {text ? <text x="400" y="630" textAnchor="middle" fontFamily="Nunito, sans-serif" fontSize={fontSize} fontWeight="900" fill="none" stroke={traceColor} strokeWidth="3" strokeDasharray="6 8" paintOrder="stroke">{text}</text>
      : <g transform="translate(0 230)"><path d={guide.path} fill="none" stroke={traceColor} strokeWidth="6" strokeDasharray="9 12" strokeLinecap="round" strokeLinejoin="round" /></g>}
  </svg>;
}
