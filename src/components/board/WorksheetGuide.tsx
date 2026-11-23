import type { Guide } from './guides';

export function WorksheetGuide({ guide, category, dark = false }: { guide: Guide; category: string; dark?: boolean }) {
  const columns = guide.text ? (guide.text.length > 3 ? 3 : guide.text.length > 1 ? 4 : 6) : 4;
  const rows = 8;
  const cellWidth = 720 / columns;
  const lineColor = dark ? '#a9d3c6' : '#9bb2c5';
  const modelColor = dark ? '#f5f3e7' : '#182954';
  const traceColor = dark ? '#c7ddd3' : '#9aaccb';
  return <svg className="board-guide worksheet-guide" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet" aria-label={category + ' tracing worksheet'}>
    {Array.from({ length: rows }, (_, row) => {
      const top = 20 + row * 120;
      return <g key={row}>
        {[top + 10, top + 40, top + 70].map((y, line) =>
          <line key={line} x1="25" x2="775" y1={y} y2={y} stroke={lineColor} strokeOpacity="0.5" strokeWidth="1.5" strokeDasharray={line === 1 ? '9 8' : undefined}/>)}
        {Array.from({ length: columns }, (_, column) => {
          const center = 40 + cellWidth * (column + .5);
          const example = column === 0;
          return guide.text ? <text key={column} x={center} y={top + 70} textAnchor="middle"
            fontSize={Math.min(82, cellWidth / (guide.text.length * .68))} fontWeight="800"
            fill={example ? modelColor : 'none'} stroke={traceColor} strokeWidth={example ? 0 : 1.4}
            strokeDasharray={example ? undefined : '2 3'}>{guide.text}</text>
            : <g key={column} transform={`translate(${center-cellWidth*.43} ${top+8}) scale(${cellWidth*.86/800} .33)`}>
              <path d={guide.path} fill="none" stroke={example ? modelColor : dark ? traceColor : '#52667c'}
                strokeWidth={example ? 3 : 2} strokeDasharray={example ? undefined : '3 4'}
                vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
            </g>;
        })}
      </g>;
    })}
  </svg>;
}
