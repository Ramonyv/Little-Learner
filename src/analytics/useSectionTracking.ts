import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toSafeSlug, type SectionId, type SubjectSlug } from './events';
import { analytics } from './service';

const SUBJECT_SET = new Set<string>(['english', 'mathematics', 'science', 'general-knowledge']);

export function resolveSectionFromPathname(pathname: string): {
  sectionId: SectionId | 'insights';
  subjectId?: SubjectSlug;
} {
  const normalized = pathname.replace(/\/+$/, '') || '/';

  if (normalized === '/insights') return { sectionId: 'insights' };
  if (normalized === '/') return { sectionId: 'home' };
  if (normalized === '/games') return { sectionId: 'games' };
  if (normalized === '/games/sliding-puzzle') return { sectionId: 'sliding_puzzle' };
  if (normalized === '/games/hanuman-runner') return { sectionId: 'hanuman_runner' };
  if (normalized === '/drawing-board') return { sectionId: 'drawing_board' };
  if (normalized === '/explore/seed') return { sectionId: 'explore_seed', subjectId: 'science' };
  if (normalized === '/progress') return { sectionId: 'progress' };
  if (normalized === '/learning-tools') return { sectionId: 'learning_tools' };
  if (normalized === '/my-work') return { sectionId: 'my_work' };
  if (normalized === '/contact') return { sectionId: 'contact' };
  if (normalized === '/about') return { sectionId: 'about' };
  if (normalized.startsWith('/information/')) return { sectionId: 'information' };

  const match = /^\/(topics|intro|exam)\/([^/]+)/.exec(normalized);
  if (match) {
    const [, area, rawSubject] = match;
    const candidate = toSafeSlug(rawSubject, '');
    const subjectId = SUBJECT_SET.has(candidate) ? (candidate as SubjectSlug) : undefined;
    const sectionId: SectionId =
      area === 'topics' ? 'topics' : area === 'intro' ? 'exam_intro' : 'exam_session';
    return { sectionId, subjectId };
  }

  return { sectionId: 'home' };
}

/**
 * Tracks route/section transitions safely using only canonical section IDs
 * (query strings and hashes are never inspected or transmitted).
 */
export function useSectionTracking(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    const { sectionId, subjectId } = resolveSectionFromPathname(pathname);
    if (sectionId === 'insights') return;
    analytics.track(
      'section_viewed',
      subjectId ? { section_id: sectionId, subject_id: subjectId } : { section_id: sectionId },
      { dedupeKey: `section_viewed:${pathname}`, dedupeWindowMs: 500 },
    );
  }, [pathname]);
}

