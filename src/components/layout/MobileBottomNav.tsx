import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';

export const MobileBottomNav: React.FC = () => {
  const location = useLocation();

  const tabs = [
    { label: 'Home', path: '/', icon: 'solar:home-smile-bold' },
    { label: 'Practice', path: '/topics/english', icon: 'solar:book-bookmark-bold' },
    { label: 'Progress', path: '/progress', icon: 'solar:chart-square-bold' },
  ];

  // Don't show bottom bar during active exam/test
  if (location.pathname.startsWith('/exam/')) {
    return null;
  }

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t-2 border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg"
      aria-label="Mobile bottom navigation"
    >
      {tabs.map((tab) => {
        const active = tab.path === '/' 
          ? location.pathname === '/' 
          : location.pathname.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all ${
              active
                ? 'text-brand-blue font-black'
                : 'text-slate-500 font-bold hover:text-slate-700'
            }`}
          >
            <Icon icon={tab.icon} className={`w-6 h-6 ${active ? 'scale-110' : ''}`} />
            <span className="text-xs">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
