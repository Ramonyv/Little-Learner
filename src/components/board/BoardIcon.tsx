const files: Record<string, string> = {
  Board: 'Drawing Board', Chalk: 'Chawk', 'Lines & curves': 'Lines & Curve',
};
export function BoardIcon({ name }: { name: string }) {
  return <img className="board-symbol" alt="" draggable={false}
    src={name === 'About' ? '/favicon.svg' : '/SVG Icons/' + (files[name] ?? name) + '.svg'} />;
}
