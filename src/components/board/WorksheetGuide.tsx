import type { Guide } from './guides';

export function WorksheetGuide({ guide, category }: { guide: Guide; category: string }) {
  const columns = guide.text ? (guide.text.length > 3 ? 3 : guide.text.length > 1 ? 4 : 6) : 4;
  const rows = 6;
  const cellWidth = 720 / columns;
  return <svg className="board-guide worksheet-guide" viewBox="0 0 800 1000" preserveAspectRatio="xMidYMid meet" aria-label={category + ' tracing worksheet'}>
    {Array.from({ length: rows }, (_, row) => {
      const top = 25 + row * 160;
      return <g key={row}>
        {[top + 15, top + 65, top + 115].map((y, line) =>
          <line key={line} x1="25" x2="775" y1={y} y2={y} stroke="#9bb2c5" strokeWidth="1.5" strokeDasharray={line === 1 ? '9 8' : undefined}/>)}
        {Array.from({ length: columns }, (_, column) => {
          const center = 40 + cellWidth * (column + .5);
          const example = column === 0;
          return guide.text ? <text key={column} x={center} y={top + 112} textAnchor="middle"
            fontSize={Math.min(124, cellWidth / (guide.text.length * .68))} fontWeight="800"
            fill={example ? '#182954' : 'none'} stroke="#52667c" strokeWidth={example ? 0 : 1.4}
            strokeDasharray={example ? undefined : '2 3'}>{guide.text}</text>
            : <g key={column} transform={`translate(${center-cellWidth*.43} ${top+8}) scale(${cellWidth*.86/800} .33)`}>
              <path d={guide.path} fill="none" stroke={example ? '#182954' : '#52667c'}
                strokeWidth={example ? 3 : 2} strokeDasharray={example ? undefined : '3 4'}
                vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
            </g>;
        })}
      </g>;
    })}
  </svg>;
}
