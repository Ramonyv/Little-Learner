import { SubjectMeta, TopicMeta, Question, SubjectId, TopicId, PracticeSetId, PracticeSetMeta } from '../types';
import class1EnglishData from './questions/class1/english.json';
import class1EnglishPracticePaper2Data from './questions/class1/english-practice-paper-2.json';
import { scienceQuestions } from './questions/class1/science';

import mathData from './questions/class1/mathematics.json';
import gkData from './questions/class1/general-knowledge.json';

// Static metadata for all subjects
export const SUBJECTS: SubjectMeta[] = [
  {
    id: 'english',
    title: 'English',
    shortDesc: 'Practice grammar, vocabulary, reading, and spelling for English Olympiad.',
    icon: 'solar:book-bookmark-bold',
    badgeColor: 'blue',
    isAvailable: true,
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    shortDesc: 'Master numbers, shapes, addition, and playful word puzzles.',
    icon: 'solar:calculator-minimalistic-bold',
    badgeColor: 'yellow',
    isAvailable: true,
  },
  {
    id: 'science',
    title: 'Science',
    shortDesc: 'Explore living things, plants, animals, our body, and the earth.',
    icon: 'solar:atom-bold',
    badgeColor: 'green',
    isAvailable: true,
  },
  {
    id: 'general-knowledge',
    title: 'General Knowledge',
    shortDesc: 'Discover the world, flags, festivals, seasons, and fun facts.',
    icon: 'solar:globus-bold',
    badgeColor: 'purple',
    isAvailable: true,
  },
];

// Topics for Class 1 English
export const ENGLISH_TOPICS: TopicMeta[] = [
  {
    id: 'mixed-practice',
    subjectId: 'english',
    title: 'Mixed Practice',
    icon: 'solar:notebook-bookmark-bold',
    iconBgColor: '#EBF4FE',
    iconColor: '#087CF7',
    description: 'Comprehensive mock test with questions across all English topics.',
    estimatedMinutes: 20,
  },
  {
    id: 'vocabulary',
    subjectId: 'english',
    title: 'Vocabulary',
    icon: 'solar:text-bold',
    iconBgColor: '#FEEFEB',
    iconColor: '#FF6656',
    description: 'Naming words, animals, sounds, homes, fruits, and colors.',
    estimatedMinutes: 10,
  },
  {
    id: 'grammar',
    subjectId: 'english',
    title: 'Grammar',
    icon: 'solar:pen-new-square-bold',
    iconBgColor: '#E8F9F0',
    iconColor: '#20C86B',
    description: 'Nouns, verbs, pronouns, singular/plural, and articles (a/an).',
    estimatedMinutes: 10,
  },
  {
    id: 'spelling',
    subjectId: 'english',
    title: 'Spelling',
    icon: 'solar:star-bold',
    iconBgColor: '#FFF9E5',
    iconColor: '#FFD329',
    description: 'Identify correct spellings with colorful picture clues.',
    estimatedMinutes: 10,
  },
  {
    id: 'reading-comprehension',
    subjectId: 'english',
    title: 'Reading Comprehension',
    icon: 'solar:book-2-bold',
    iconBgColor: '#F4EFFF',
    iconColor: '#9256F5',
    description: 'Read sweet short stories and answer fun questions.',
    estimatedMinutes: 12,
  },
  {
    id: 'sentence-formation',
    subjectId: 'english',
    title: 'Sentence Formation',
    icon: 'solar:chat-round-dots-bold',
    iconBgColor: '#EBF4FE',
    iconColor: '#087CF7',
    description: 'Jumbled words, punctuation, and capital letters.',
    estimatedMinutes: 10,
  },
  {
    id: 'opposites',
    subjectId: 'english',
    title: 'Opposites',
    icon: 'solar:heart-bold',
    iconBgColor: '#FDF2F8',
    iconColor: '#EC4899',
    description: 'Learn antonyms and contrasting words with examples.',
    estimatedMinutes: 10,
  },
];

export const SCIENCE_TOPICS: TopicMeta[] = [
  { id: 'mixed-practice', subjectId: 'science', title: 'Mixed Practice', icon: 'solar:shuffle-bold', iconBgColor: '#E8F9F0', iconColor: '#20C86B', description: 'All 100 science questions together.', estimatedMinutes: 100 },
  { id: 'living-things', subjectId: 'science', title: 'Living Things', icon: 'solar:leaf-bold', iconBgColor: '#E8F9F0', iconColor: '#20C86B', description: 'Living and nonliving things.', estimatedMinutes: 10 },
  { id: 'plants', subjectId: 'science', title: 'Plants', icon: 'solar:leaf-bold', iconBgColor: '#E8F9F0', iconColor: '#20C86B', description: 'Plant parts, seeds and growth.', estimatedMinutes: 10 },
  { id: 'animals', subjectId: 'science', title: 'Animals', icon: 'solar:paw-bold', iconBgColor: '#FFF2E8', iconColor: '#F97316', description: 'Animals, homes and young ones.', estimatedMinutes: 20 },
  { id: 'our-body', subjectId: 'science', title: 'Our Body', icon: 'solar:heart-bold', iconBgColor: '#FDF2F8', iconColor: '#EC4899', description: 'Body parts and five senses.', estimatedMinutes: 10 },
  { id: 'health-and-hygiene', subjectId: 'science', title: 'Health & Hygiene', icon: 'solar:health-bold', iconBgColor: '#EBF4FE', iconColor: '#087CF7', description: 'Healthy habits, food and cleanliness.', estimatedMinutes: 10 },
  { id: 'earth-and-sky', subjectId: 'science', title: 'Earth & Sky', icon: 'solar:sun-bold', iconBgColor: '#FFF9E5', iconColor: '#D69E00', description: 'Sun, Moon, weather and seasons.', estimatedMinutes: 10 },
  { id: 'air-and-water', subjectId: 'science', title: 'Air & Water', icon: 'solar:waterdrops-bold', iconBgColor: '#EBF4FE', iconColor: '#087CF7', description: 'Air, water and simple changes.', estimatedMinutes: 10 },
  { id: 'materials-and-safety', subjectId: 'science', title: 'Materials & Safety', icon: 'solar:shield-check-bold', iconBgColor: '#F4EFFF', iconColor: '#9256F5', description: 'Everyday materials and safety.', estimatedMinutes: 20 },
];

export const SCIENCE_PRACTICE_SETS: PracticeSetMeta[] = [
  ...([1, 2, 3, 4] as const).map((number) => ({ id: `paper-${number}` as PracticeSetId, title: `Practice Paper ${number}`, description: '25 Class 1 Science Olympiad questions.', icon: 'solar:document-text-bold', iconBgColor: '#E8F9F0', iconColor: '#20C86B' })),
  { id: 'all', title: 'All 100 Questions', description: 'Every science question in one practice set.', icon: 'solar:shuffle-bold', iconBgColor: '#F4EFFF', iconColor: '#9256F5' },
];

function topic(subjectId: SubjectId, id: TopicId, title: string, description: string, icon: string): TopicMeta {
  return { subjectId, id, title, description, icon, estimatedMinutes: 6, iconBgColor: '#EBF4FE', iconColor: '#087CF7' };
}

const mathTopics = [
  topic('mathematics', 'mixed-practice', 'Mixed Practice', 'Practise numbers and shapes together.', 'solar:shuffle-bold'),
  topic('mathematics', 'numbers', 'Numbers', 'Count, compare and solve number stories.', 'solar:calculator-minimalistic-bold'),
  topic('mathematics', 'shapes', 'Shapes & Patterns', 'Explore shapes, corners and repeating patterns.', 'solar:square-bold'),
];
const gkTopics = [
  topic('general-knowledge', 'mixed-practice', 'Mixed Practice', 'Explore your community and the world.', 'solar:shuffle-bold'),
  topic('general-knowledge', 'community', 'Our Community', 'Discover helpers, places and transport.', 'solar:home-bold'),
  topic('general-knowledge', 'world', 'Around the World', 'Explore festivals, symbols, music and sport.', 'solar:globus-bold'),
];

const starterPapers: PracticeSetMeta[] = [1, 2].map(number => ({
  id: `paper-${number}` as PracticeSetId, title: `Practice Paper ${number}`,
  description: 'Six questions across both topics.', icon: 'solar:document-text-bold',
  iconBgColor: '#EBF4FE', iconColor: '#087CF7',
}));
starterPapers.push({ ...starterPapers[0], id: 'all', title: 'Mixed Practice', description: 'Try both papers together.', icon: 'solar:shuffle-bold' });

export function getTopics(subjectId: SubjectId): TopicMeta[] {
  if (subjectId === 'mathematics') return mathTopics;
  if (subjectId === 'general-knowledge') return gkTopics;
  return subjectId === 'science' ? SCIENCE_TOPICS : ENGLISH_TOPICS;
}

export function getPracticeSets(subjectId: SubjectId): PracticeSetMeta[] {
  if (subjectId === 'mathematics' || subjectId === 'general-knowledge') return starterPapers;
  return subjectId === 'science' ? SCIENCE_PRACTICE_SETS : ENGLISH_PRACTICE_SETS;
}

export const ENGLISH_PRACTICE_SETS: PracticeSetMeta[] = [
  {
    id: 'paper-1',
    title: 'Practice Paper 1',
    description: 'The original 60-question English Olympiad paper.',
    icon: 'solar:document-text-bold',
    iconBgColor: '#EBF4FE',
    iconColor: '#087CF7',
  },
  {
    id: 'paper-2',
    title: 'Practice Paper 2',
    description: 'The newest 60-question English Olympiad paper.',
    icon: 'solar:document-add-bold',
    iconBgColor: '#E8F9F0',
    iconColor: '#20C86B',
  },
  {
    id: 'all',
    title: 'Mixed Practice',
    description: 'Questions from every practice paper in one challenge.',
    icon: 'solar:shuffle-bold',
    iconBgColor: '#F4EFFF',
    iconColor: '#9256F5',
  },
];

// In-memory typed question store
const rawQuestions: Question[] = [
  ...(class1EnglishData as Question[]),
  ...(class1EnglishPracticePaper2Data as Question[]),
  ...scienceQuestions,
  ...(mathData as Question[]),
  ...(gkData as Question[]),
];

const questionsBySet: Record<Exclude<PracticeSetId, 'all'>, Question[]> = {
  'paper-1': class1EnglishData as Question[],
  'paper-2': class1EnglishPracticePaper2Data as Question[],
  'paper-3': [],
  'paper-4': [],
};

export function getPracticeSet(setId: PracticeSetId, subjectId: SubjectId = 'english'): PracticeSetMeta {
  const sets = getPracticeSets(subjectId);
  return sets.find((set) => set.id === setId) || sets[sets.length - 1];
}

export function getPracticeSetQuestionCount(setId: PracticeSetId, subjectId: SubjectId = 'english'): number {
  return getQuestionsForTest(1, subjectId, 'mixed-practice', false, setId).length;
}

/**
 * Get all questions for a subject and class
 */
export function getAllSubjectQuestions(classNumber: number, subjectId: SubjectId): Question[] {
  return rawQuestions.filter(
    (q) => q.classNumber === classNumber && q.subjectId === subjectId
  );
}

/**
 * Get question count dynamically for a specific topic
 */
export function getTopicQuestionCount(classNumber: number, subjectId: SubjectId, topicId: TopicId): number {
  if (topicId === 'mixed-practice') {
    return getAllSubjectQuestions(classNumber, subjectId).length;
  }
  return rawQuestions.filter(
    (q) => q.classNumber === classNumber && q.subjectId === subjectId && q.topicId === topicId
  ).length;
}

/**
 * Get questions for a specific topic
 * If topicId is 'mixed-practice', returns all questions for that subject.
 * Can shuffle questions if requested.
 */
export function getQuestionsForTest(
  classNumber: number,
  subjectId: SubjectId,
  topicId: TopicId,
  shuffle = false,
  practiceSetId: PracticeSetId = 'all'
): Question[] {
  let list: Question[] = [];
  if (topicId === 'mixed-practice') {
    list = getAllSubjectQuestions(classNumber, subjectId);
    if (practiceSetId !== 'all') {
      if (subjectId === 'english') {
        list = questionsBySet[practiceSetId].filter(q => q.classNumber === classNumber);
      } else {
        const paperSize = subjectId === 'science' ? 25 : 6;
        const start = (Number(practiceSetId.slice(-1)) - 1) * paperSize;
        list = list.slice(start, start + paperSize);
      }
    }
  } else {
    list = rawQuestions.filter(
      (q) => q.classNumber === classNumber && q.subjectId === subjectId && q.topicId === topicId
    );
  }

  if (shuffle) {
    // Fisher-Yates shuffle
    const shuffled = [...list];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  return list;
}

/**
 * Total question count across all available subjects
 */
export function getTotalAvailableQuestions(): number {
  return rawQuestions.length;
}
