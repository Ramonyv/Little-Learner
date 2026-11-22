import { Link } from 'react-router-dom';

export function GameBreadcrumb({ title }: { title: string }) {
  return (
    <nav className="crumb" aria-label="Breadcrumb">
      <Link to="/">Home</Link>
      <span aria-hidden="true">›</span>
      <Link to="/games">Games</Link>
      <span aria-hidden="true">›</span>
      <u aria-current="page">{title}</u>
    </nav>
  );
}
