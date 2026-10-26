import { SubjectMeta, TopicMeta, Question, SubjectId, TopicId } from '../types';
import class1EnglishData from './questions/class1/english.json';

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
    isAvailable: false,
    comingSoonText: 'Coming soon for Class 1',
  },
  {
    id: 'science',
    title: 'Science',
    shortDesc: 'Explore living things, plants, animals, our body, and the earth.',
    icon: 'solar:atom-bold',
    badgeColor: 'green',
    isAvailable: false,
    comingSoonText: 'Coming soon for Class 1',
  },
  {
    id: 'general-knowledge',
    title: 'General Knowledge',
    shortDesc: 'Discover the world, flags, festivals, seasons, and fun facts.',
    icon: 'solar:globus-bold',
    badgeColor: 'purple',
    isAvailable: false,
    comingSoonText: 'Coming soon for Class 1',
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

// In-memory typed question store
const rawQuestions: Question[] = class1EnglishData as Question[];

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
  shuffle = false
): Question[] {
  let list: Question[] = [];
  if (topicId === 'mixed-practice') {
    list = [...getAllSubjectQuestions(classNumber, subjectId)];
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
