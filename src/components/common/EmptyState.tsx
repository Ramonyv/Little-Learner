import React from 'react';
import { Icon } from '@iconify/react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionText?: string;
  actionPath?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'solar:book-bookmark-bold',
  actionText,
  actionPath,
  onAction,
}) => {
  return (
    <div className="w-full max-w-md mx-auto text-center p-8 bg-white rounded-3xl border-2 border-slate-200/80 shadow-sm flex flex-col items-center">
      <div className="w-16 h-16 rounded-3xl bg-brand-blue/10 text-brand-blue flex items-center justify-center mb-4 border-2 border-brand-blue/20">
        <Icon icon={icon} className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-black text-brand-ink mb-2">{title}</h3>
      <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">{description}</p>
      
      {actionText && actionPath && (
        <Link
          to={actionPath}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-sm shadow-chunky transition-all btn-chunky"
        >
          <span>{actionText}</span>
          <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
        </Link>
      )}

      {actionText && onAction && !actionPath && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-sm shadow-chunky transition-all btn-chunky"
        >
          <span>{actionText}</span>
          <Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
