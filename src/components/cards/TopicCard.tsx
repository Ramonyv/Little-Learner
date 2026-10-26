import React from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { TopicMeta } from '../../types';

interface TopicCardProps {
  topic: TopicMeta;
  questionCount: number;
  classNumber: number;
  variant?: 'grid' | 'list';
}

export const TopicCard: React.FC<TopicCardProps> = ({
  topic,
  questionCount,
  classNumber,
  variant = 'grid',
}) => {
  const linkTo = `/intro/${topic.subjectId}/${topic.id}`;

  if (variant === 'list') {
    // Mobile list style matching UI reference (Choose a Topic)
    return (
      <Link
        to={linkTo}
        className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-brand-blue/50 shadow-sm active:scale-[0.99] transition-all group"
      >
        <div className="flex items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
            style={{ backgroundColor: topic.iconBgColor, color: topic.iconColor }}
          >
            <Icon icon={topic.icon} className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-brand-ink group-hover:text-brand-blue transition-colors">
              {topic.title}
            </h3>
            <p className="text-xs font-bold text-slate-400">
              {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
            </p>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-brand-blue group-hover:bg-brand-blue/10 transition-colors">
          <Icon icon="solar:alt-arrow-right-bold" className="w-4 h-4" />
        </div>
      </Link>
    );
  }

  // Desktop/Tablet grid card matching UI reference
  return (
    <Link
      to={linkTo}
      className="flex flex-col items-center text-center p-5 sm:p-6 bg-white rounded-3xl border-2 border-slate-100 hover:border-brand-blue/40 hover:shadow-chunky transition-all duration-200 group active:scale-[0.98]"
      aria-label={`${topic.title}, ${questionCount} questions for Class ${classNumber}`}
    >
      {/* Icon Bubble */}
      <div
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-3xl flex items-center justify-center mb-3 sm:mb-4 transition-transform group-hover:scale-110 shadow-sm"
        style={{ backgroundColor: topic.iconBgColor, color: topic.iconColor }}
      >
        <Icon icon={topic.icon} className="w-7 h-7 sm:w-8 sm:h-8" />
      </div>

      {/* Topic Title */}
      <h3 className="font-extrabold text-base sm:text-lg text-brand-ink mb-1 group-hover:text-brand-blue transition-colors">
        {topic.title}
      </h3>

      {/* Actual Question Count */}
      <span className="text-xs sm:text-sm font-bold text-slate-400">
        {questionCount} {questionCount === 1 ? 'Question' : 'Questions'}
      </span>
    </Link>
  );
};
