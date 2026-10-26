import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../../context/SessionContext';

export const SiteHeader: React.FC = () => {
  const location = useLocation();
  const { selectedClass, setSelectedClass, soundOn, setSoundOn } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Practice', path: '/topics/english' },
    { label: 'Progress', path: '/progress' },
    { label: 'About', path: '/about' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link 
          to="/" 
          className="flex items-center gap-2.5 sm:gap-3 group focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30 rounded-2xl"
          aria-label="Little Learner Home"
        >
          {/* Logo Star SVG */}
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0 transition-transform group-hover:scale-105 active:scale-95">
            <svg viewBox="0 0 48 48" className="w-full h-full drop-shadow-sm">
              <polygon points="24,3 30.5,16.5 45,18.5 34.5,28.8 37,43.2 24,36.4 11,43.2 13.5,28.8 3,18.5 17.5,16.5" 
                fill="#FFD329" stroke="#111827" strokeWidth="3.5" strokeLinejoin="round"/>
              <ellipse cx="19" cy="24" rx="2" ry="2.6" fill="#111827"/>
              <ellipse cx="29" cy="24" rx="2" ry="2.6" fill="#111827"/>
              <circle cx="19.7" cy="23.2" r="0.7" fill="#FFFFFF"/>
              <circle cx="29.7" cy="23.2" r="0.7" fill="#FFFFFF"/>
              <path d="M 21 28 Q 24 32 27 28" fill="none" stroke="#111827" strokeWidth="2.5" strokeLinecap="round"/>
              <circle cx="15.5" cy="27" r="1.8" fill="#FF8A7A"/>
              <circle cx="32.5" cy="27" r="1.8" fill="#FF8A7A"/>
            </svg>
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-brand-ink">
            Little <span className="text-brand-blue">Learner</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-full font-bold text-base transition-colors relative ${
                  active
                    ? 'text-brand-blue bg-brand-blue/10'
                    : 'text-slate-600 hover:text-brand-ink hover:bg-slate-100'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 bg-brand-blue rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Controls: Sound & Class Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Sound Effect Toggle */}
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2.5 rounded-full border-2 transition-all flex items-center justify-center ${
              soundOn 
                ? 'bg-brand-yellow/20 border-brand-yellow text-slate-900 shadow-sm' 
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title={soundOn ? 'Sound effects enabled' : 'Sound effects disabled (Click to enable)'}
            aria-label={soundOn ? 'Turn sound effects off' : 'Turn sound effects on'}
          >
            <Icon 
              icon={soundOn ? 'solar:volume-loud-bold' : 'solar:volume-cross-bold'} 
              className="w-5 h-5" 
            />
          </button>

          {/* Class Dropdown */}
          <div className="relative">
            <button
              onClick={() => setClassDropdownOpen(!classDropdownOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 font-extrabold text-xs sm:text-sm text-brand-ink transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/30"
              aria-expanded={classDropdownOpen}
              aria-label="Select class"
            >
              <span>Class {selectedClass}</span>
              <Icon icon="solar:alt-arrow-down-bold" className="w-4 h-4 text-slate-600" />
            </button>

            {classDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setClassDropdownOpen(false)} 
                />
                <div className="absolute right-0 mt-2 w-44 bg-white border-2 border-slate-900 rounded-2xl shadow-chunky z-40 p-1.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-xs font-black text-slate-400 uppercase tracking-wider">
                    Choose Class
                  </div>
                  <button
                    onClick={() => {
                      setSelectedClass(1);
                      setClassDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-between ${
                      selectedClass === 1
                        ? 'bg-brand-blue text-white'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>Class 1</span>
                    {selectedClass === 1 && <Icon icon="solar:check-circle-bold" className="w-4 h-4" />}
                  </button>
                  <div className="px-3 py-2 rounded-xl text-sm font-bold text-slate-400 flex items-center justify-between cursor-not-allowed">
                    <span>Class 2</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-semibold">Soon</span>
                  </div>
                  <div className="px-3 py-2 rounded-xl text-sm font-bold text-slate-400 flex items-center justify-between cursor-not-allowed">
                    <span>Class 3</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 font-semibold">Soon</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-full hover:bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
          >
            <Icon icon={mobileMenuOpen ? 'solar:close-square-bold' : 'solar:hamburger-menu-bold'} className="w-6 h-6" />
          </button>
        </div>

      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b-2 border-slate-900 px-4 pt-2 pb-5 space-y-1 shadow-lg animate-in slide-in-from-top-2">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-3 rounded-xl font-extrabold text-base transition-colors ${
                  active
                    ? 'bg-brand-blue text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};
