import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { SubjectMeta } from '../../types';

interface SubjectCardProps {
  subject: SubjectMeta;
  questionCount?: number;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, questionCount = 0 }) => {
  const badgeColorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-brand-blue/10', text: 'text-brand-blue', iconBg: 'bg-brand-blue text-white' },
    yellow: { bg: 'bg-brand-yellow/20', text: 'text-amber-700', iconBg: 'bg-brand-yellow text-slate-900' },
    green: { bg: 'bg-brand-green/10', text: 'text-brand-green', iconBg: 'bg-brand-green text-white' },
    purple: { bg: 'bg-brand-purple/10', text: 'text-brand-purple', iconBg: 'bg-brand-purple text-white' },
  };

  const style = badgeColorMap[subject.badgeColor] || badgeColorMap.blue;

  if (!subject.isAvailable) {
    return (
      <div className="relative p-6 bg-white rounded-3xl border-2 border-slate-200/80 opacity-75 overflow-hidden flex flex-col justify-between select-none">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
              <Icon icon={subject.icon} className="w-6 h-6" />
            </div>
            <span className="text-xs font-black uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
              Coming Soon
            </span>
          </div>
          <h3 className="font-black text-xl text-slate-500 mb-1.5">{subject.title}</h3>
          <p className="text-sm text-slate-400 font-semibold leading-relaxed">{subject.shortDesc}</p>
        </div>
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-slate-400">
          <Icon icon="solar:clock-circle-bold" className="w-4 h-4 mr-1.5" />
          {subject.comingSoonText || 'Questions in preparation'}
        </div>
      </div>
    );
  }

  return (
    <Link
      to={`/topics/${subject.id}`}
      className="p-6 bg-white rounded-3xl border-2 border-slate-200 hover:border-brand-blue hover:shadow-chunky transition-all flex flex-col justify-between group active:scale-[0.99]"
      aria-label={`Open ${subject.title} practice`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-2xl ${style.iconBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
            <Icon icon={subject.icon} className="w-6 h-6" />
          </div>
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${style.bg} ${style.text}`}>
            {questionCount} Questions Available
          </span>
        </div>
        <h3 className="font-black text-xl text-brand-ink mb-1.5 group-hover:text-brand-blue transition-colors">
          {subject.title}
        </h3>
        <p className="text-sm text-slate-500 font-bold leading-relaxed">{subject.shortDesc}</p>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-brand-blue font-extrabold text-sm">
        <span>Start Practising</span>
        <Icon icon="solar:arrow-right-bold" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
};
