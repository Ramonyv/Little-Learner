export type Difficulty = 'easy' | 'medium' | 'hard';

export type SubjectId = 'english' | 'mathematics' | 'science' | 'general-knowledge';

export type TopicId = 
  | 'mixed-practice'
  | 'vocabulary'
  | 'grammar'
  | 'spelling'
  | 'reading-comprehension'
  | 'sentence-formation'
  | 'opposites'
  | 'numbers'
  | 'shapes'
  | 'living-things'
  | 'our-body';

export interface Question {
  id: string;
  classNumber: number; // e.g. 1
  subjectId: SubjectId;
  topicId: TopicId;
  difficulty: Difficulty;
  question: string;
  passage?: string; // For reading comprehension
  illustration?: string; // e.g. 'cat' | 'apple' | 'dog' | 'sun' | 'pencil' | 'tree' | 'car' | 'elephant'
  options: [string, string, string, string]; // Exactly 4 options A, B, C, D
  correctAnswer: 0 | 1 | 2 | 3; // Index 0-3 (A=0, B=1, C=2, D=3)
  explanation: string;
}

export type ExamMode = 'practice' | 'exam';

export type PracticeSetId = 'all' | 'paper-1' | 'paper-2';

export interface PracticeSetMeta {
  id: PracticeSetId;
  title: string;
  description: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

export interface SubjectMeta {
  id: SubjectId;
  title: string;
  shortDesc: string;
  icon: string; // Iconify icon string
  badgeColor: string; // e.g. 'blue' | 'yellow' | 'green' | 'coral' | 'purple'
  isAvailable: boolean;
  comingSoonText?: string;
}

export interface TopicMeta {
  id: TopicId;
  subjectId: SubjectId;
  title: string;
  icon: string;
  iconBgColor: string; // Tailwind color class or hex
  iconColor: string;
  description: string;
  estimatedMinutes?: number;
}

export interface UserExamSession {
  sessionId: string;
  subjectId: SubjectId;
  topicId: TopicId;
  topicTitle: string;
  mode: ExamMode;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  totalQuestions: number;
  questions: Question[];
  userAnswers: Record<number, number>; // questionIndex -> selectedOptionIndex (0-3)
  completed: boolean;
  score?: number;
}

export interface ExamResultSummary {
  totalQuestions: number;
  answeredCount: number;
  unansweredCount: number;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  timeSpentSeconds: number;
  passed: boolean;
}
