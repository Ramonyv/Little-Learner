export type Difficulty = 'easy' | 'medium' | 'hard';

export type SubjectId = 'english' | 'mathematics' | 'science' | 'general-knowledge' | 'logical-reasoning';

export type TopicId = 
  | 'mixed-practice'
  | 'vocabulary'
  | 'grammar'
  | 'spelling'
  | 'reading-comprehension'
  | 'sentence-formation'
  | 'opposites'
  | 'community'
  | 'world'
  | 'india-and-festivals'
  | 'space-and-seasons'
  | 'numbers'
  | 'shapes'
  | 'addition-subtraction'
  | 'time-and-money'
  | 'measurement'
  | 'odd-one-out'
  | 'patterns'
  | 'analogies'
  | 'directions-and-order'
  | 'living-things'
  | 'our-body'
  | 'plants'
  | 'animals'
  | 'health-and-hygiene'
  | 'earth-and-sky'
  | 'air-and-water'
  | 'materials-and-safety';

export type Question3DSceneId =
  | 'cube'
  | 'sphere'
  | 'cone'
  | 'cylinder'
  | 'triangle'
  | 'square'
  | 'rectangle'
  | 'circle'
  | 'beads-9-6'
  | 'beads-7-5'
  | 'clock-4'
  | 'clock-3'
  | 'coins'
  | 'ruler'
  | 'balance'
  | 'saturn'
  | 'earth'
  | 'sun'
  | 'moon'
  | 'rainbow'
  | 'cloud-rain'
  | 'tree'
  | 'flower'
  | 'apple'
  | 'house'
  | 'car'
  | 'book'
  | 'pencil'
  | 'flag-india'
  | 'robot'
  | 'pattern-blocks'
  | 'pattern-shapes';

export interface Question {
  id: string;
  classNumber: number; // e.g. 1
  subjectId: SubjectId;
  topicId: TopicId;
  difficulty: Difficulty;
  question: string;
  passage?: string; // For reading comprehension
  illustration?: string; // e.g. 'cat' | 'apple' | 'dog' | 'sun' | 'pencil' | 'tree' | 'car' | 'elephant'
  scene3d?: Question3DSceneId;
  options: [string, string, string, string]; // Exactly 4 options A, B, C, D
  correctAnswer: 0 | 1 | 2 | 3; // Index 0-3 (A=0, B=1, C=2, D=3)
  explanation: string;
}

export type ExamMode = 'practice' | 'exam';

export type PracticeSetId = 'all' | 'paper-1' | 'paper-2' | 'paper-3' | 'paper-4';

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
