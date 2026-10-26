import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { useSession } from '../context/SessionContext';
import { EmptyState } from '../components/common/EmptyState';
import { SUBJECTS } from '../data/questionRepository';
import { SubjectId } from '../types';

export const ProgressPage: React.FC = () => {
  const { completedSessions, selectedClass } = useSession();
  const [selectedSubjectTab, setSelectedSubjectTab] = useState<SubjectId>('english');
  const navigate = useNavigate();

  // Filter completed sessions by subject tab
  const filteredSessions = completedSessions.filter((s) => s.subjectId === selectedSubjectTab);

  // Compute aggregate totals in the current session
  const totalQuestionsAttempted = completedSessions.reduce(
    (acc, sess) => acc + sess.totalQuestions,
    0
  );

  const totalCorrectAnswers = completedSessions.reduce(
    (acc, sess) => acc + (sess.score || 0),
    0
  );

  const averagePercentage = completedSessions.length > 0
    ? Math.round((totalCorrectAnswers / totalQuestionsAttempted) * 100)
    : 0;

  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-24 sm:pb-12 animate-in fade-in duration-200">
      
      {/* Session Storage Notice Banner per product principles */}
      <div className="mb-6 p-4 rounded-2xl bg-blue-50/80 border-2 border-brand-blue/30 text-blue-950 flex items-start gap-3">
        <Icon icon="solar:info-circle-bold" className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm font-bold">
          <span className="font-black text-brand-blue block mb-0.5">Session Memory Only</span>
          This progress reflects practice completed during your current browser session. Little Learner respects children's privacy: no accounts, logins, or tracking cookies are used. Refreshing your browser will reset this session.
        </div>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-ink">My Progress</h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500">
            Class {selectedClass} • Current Session Summary
          </p>
        </div>

        {/* Start Practice CTA */}
        <Link
          to="/topics/english"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-brand-blue hover:bg-brand-blue-hover text-white font-extrabold text-sm shadow-chunky transition-all btn-chunky self-start sm:self-auto"
        >
          <Icon icon="solar:play-circle-bold" className="w-4 h-4" />
          <span>New Practice</span>
        </Link>
      </div>

      {/* Subject Filter Pills matching reference */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {SUBJECTS.map((sub) => {
          const isSelected = selectedSubjectTab === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectTab(sub.id)}
              className={`px-5 py-2 rounded-full font-black text-xs sm:text-sm transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{sub.title}</span>
              {!sub.isAvailable && (
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'
                }`}>
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Metrics Row matching reference */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8">
        
        {/* Total Questions Attempted */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:chart-square-bold" className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-brand-ink leading-tight">
              {totalQuestionsAttempted}
            </span>
            <span className="text-xs font-bold text-slate-400">Total Questions</span>
          </div>
        </div>

        {/* Practice Sets Completed */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-brand-green flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:medal-star-bold" className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-brand-ink leading-tight">
              {completedSessions.length}
            </span>
            <span className="text-xs font-bold text-slate-400">Sets Completed</span>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-100 text-brand-blue flex items-center justify-center flex-shrink-0">
            <Icon icon="solar:cup-star-bold" className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-2xl font-black text-brand-ink leading-tight">
              {completedSessions.length > 0 ? `${averagePercentage}%` : '—'}
            </span>
            <span className="text-xs font-bold text-slate-400">Average Accuracy</span>
          </div>
        </div>

      </div>

      {/* Recent Practice List matching mobile reference */}
      <div>
        <h2 className="text-lg font-black text-brand-ink mb-3.5">Recent Practice</h2>

        {filteredSessions.length === 0 ? (
          <EmptyState
            title="No practice sets yet"
            description="Start your first practice set or Olympiad test today and your session achievements will appear here!"
            actionText="Start English Practice"
            actionPath="/topics/english"
            icon="solar:book-bookmark-bold"
          />
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => {
              const minutes = Math.floor(session.durationSeconds / 60);
              const timeDisplay = minutes > 0 ? `${minutes} min` : `${session.durationSeconds}s`;
              const scorePct = Math.round(((session.score || 0) / session.totalQuestions) * 100);

              return (
                <div
                  key={session.sessionId}
                  className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-slate-200 hover:border-brand-blue/40 shadow-sm flex items-center justify-between gap-4 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Progress Ring / Icon */}
                    <div className="w-11 h-11 rounded-full bg-emerald-50 border-2 border-brand-green/30 flex items-center justify-center text-brand-green flex-shrink-0">
                      <Icon icon="solar:check-circle-bold" className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base text-brand-ink">
                        {session.topicTitle}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-0.5">
                        <span className="text-brand-ink font-black">
                          {session.score}/{session.totalQuestions} ({scorePct}%)
                        </span>
                        <span>•</span>
                        <span>{timeDisplay}</span>
                        <span>•</span>
                        <span className="uppercase text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {session.mode}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Restart set button */}
                  <button
                    onClick={() => navigate(`/intro/${session.subjectId}/${session.topicId}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 border-slate-200 hover:border-brand-blue hover:text-brand-blue text-xs font-black text-slate-600 transition-colors"
                    title="Retake this set"
                  >
                    <Icon icon="solar:restart-bold" className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Try Again</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
