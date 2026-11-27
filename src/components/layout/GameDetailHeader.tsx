import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GameBreadcrumb } from './GameBreadcrumb';

interface Props {
  title: string;
  description: string;
  icon: string;
  children?: ReactNode;
}

export function GameDetailHeader({ title, description, icon, children }: Props) {
  return <>
    <GameBreadcrumb title={title} />
    <header className="p-heading">
      <Link to="/games" aria-label="Back to Games"><img className="p-icon" src="/puzzle-ui/imgFrame8.svg" alt="" /></Link>
      <span className="p-symbol p-symbol-app"><img className="p-app-icon" src={icon} alt="" /></span>
      <div className="game-heading-copy"><h1>{title}</h1><p>{description}</p></div>
      {children && <div className="game-detail-actions">{children}</div>}
    </header>
  </>;
}
