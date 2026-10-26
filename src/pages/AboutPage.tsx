import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-12 animate-in fade-in duration-200">
      
      {/* Title */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-brand-yellow/20 text-amber-700 flex items-center justify-center mb-4 border-2 border-brand-yellow/40">
          <Icon icon="solar:star-fall-bold" className="w-8 h-8" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-ink mb-2">
          About Little Learner
        </h1>
        <p className="text-slate-500 font-bold text-base sm:text-lg">
          Thoughtfully built for young minds taking their very first Olympiad steps.
        </p>
      </div>

      {/* Core Principles */}
      <div className="bg-white rounded-3xl sm:rounded-4xl p-6 sm:p-9 border-2 border-slate-200/90 shadow-sm mb-8 space-y-6">
        <h2 className="text-2xl font-black text-brand-ink">Product Principles</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 font-black text-brand-blue mb-1">
              <Icon icon="solar:shield-check-bold" className="w-5 h-5" />
              <span>Zero Data Collection</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              No logins, accounts, cookies, or backend servers. 100% private and child-safe.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 font-black text-brand-green mb-1">
              <Icon icon="solar:lightning-bold" className="w-5 h-5" />
              <span>Instant Access</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Open the web app on any mobile, tablet, or laptop and begin learning right away.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 font-black text-amber-600 mb-1">
              <Icon icon="solar:laptop-minimalistic-bold" className="w-5 h-5" />
              <span>Client-Side Memory</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              All questions, timers, and scores live locally in your browser session.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <div className="flex items-center gap-2 font-black text-brand-purple mb-1">
              <Icon icon="solar:palette-round-bold" className="w-5 h-5" />
              <span>Children's Book Design</span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-500">
              Crisp outlines, friendly rounded typography, flat vibrant colors, and custom artwork.
            </p>
          </div>
        </div>
      </div>

      {/* How to Expand */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200/90 shadow-sm mb-8">
        <h2 className="text-xl font-black text-brand-ink mb-3">Expanding the Question Bank</h2>
        <p className="text-sm font-bold text-slate-600 leading-relaxed mb-4">
          Little Learner uses a structured question architecture. Adding new classes (Class 2, 3...) or new subjects (Maths, Science, GK) is as simple as adding JSON question files without altering the interface code.
        </p>
        <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
          <code>
            src/data/questions/class1/english.json<br />
            src/data/questions/class1/mathematics.json<br />
            src/data/questions/class2/english.json
          </code>
        </div>
      </div>

      {/* CTA Button */}
      <div className="text-center">
        <Link
          to="/topics/english"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-black text-lg shadow-chunky transition-all btn-chunky"
        >
          <span>Start Practising Now</span>
          <Icon icon="solar:arrow-right-bold" className="w-5 h-5" />
        </Link>
      </div>

    </div>
  );
};
