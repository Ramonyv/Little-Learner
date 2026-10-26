import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { ENGLISH_TOPICS, getPracticeSet, getQuestionsForTest } from '../data/questionRepository';
import { Question, ExamMode, PracticeSetId, SubjectId, TopicId, ExamResultSummary, UserExamSession } from '../types';
import { ExamProgress } from '../components/exam/ExamProgress';
import { QuestionCard } from '../components/exam/QuestionCard';
import { ExamNavigation } from '../components/exam/ExamNavigation';
import { FinishConfirmation } from '../components/exam/FinishConfirmation';
import { ResultSummary } from '../components/results/ResultSummary';
import { AnswerReview } from '../components/results/AnswerReview';
import { playClickSound, playCorrectSound, playIncorrectSound } from '../utils/soundEffects';

export const ExamPage: React.FC = () => {
  const { subjectId = 'english', topicId = 'mixed-practice' } = useParams<{
    subjectId: SubjectId;
    topicId: TopicId;
  }>();

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedClass, saveCompletedSession } = useSession();

  const mode = (searchParams.get('mode') as ExamMode) || 'practice';
  const shuffleParam = searchParams.get('shuffle') !== 'false';
  const requestedSet = searchParams.get('set');
  const practiceSetId: PracticeSetId = requestedSet === 'paper-1' || requestedSet === 'paper-2' ? requestedSet : 'all';

  // Topic Metadata
  const topic = ENGLISH_TOPICS.find((t) => t.id === topicId) || ENGLISH_TOPICS[0];
  const practiceSet = getPracticeSet(practiceSetId);
  const displayTopic = topicId === 'mixed-practice'
    ? {
        ...topic,
        title: practiceSet.title,
        description: practiceSet.description,
        icon: practiceSet.icon,
        iconBgColor: practiceSet.iconBgColor,
        iconColor: practiceSet.iconColor,
      }
    : topic;

  // Load questions
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isFinishModalOpen, setIsFinishModalOpen] = useState<boolean>(false);
  
  // Status states
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isReviewing, setIsReviewing] = useState<boolean>(false);
  const [startTime] = useState<number>(Date.now());
  const [endTime, setEndTime] = useState<number | null>(null);

  // Exam mode countdown timer (in seconds)
  // ~70 seconds per question for Class 1 Exam Mode
  const initialTimeSeconds = useMemo(() => {
    return Math.max(180, (questions.length || 10) * 75);
  }, [questions.length]);

  const [timeLeft, setTimeLeft] = useState<number>(initialTimeSeconds);

  // Initialize questions
  const initializeTest = useCallback(() => {
    const loaded = getQuestionsForTest(selectedClass, subjectId as SubjectId, topicId as TopicId, shuffleParam, practiceSetId);
    setQuestions(loaded);
    setCurrentIndex(0);
    setUserAnswers({});
    setIsSubmitted(false);
    setIsReviewing(false);
    setTimeLeft(Math.max(180, loaded.length * 75));
  }, [selectedClass, subjectId, topicId, shuffleParam, practiceSetId]);

  useEffect(() => {
    initializeTest();
  }, [initializeTest]);

  // Countdown timer for Exam Mode
  useEffect(() => {
    if (mode !== 'exam' || isSubmitted || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit when time runs out
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, isSubmitted, questions.length]);

  // Prevent accidental navigation away if questions answered
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitted && Object.keys(userAnswers).length > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubmitted, userAnswers]);

  // Select an answer option
  const handleSelectOption = (optionIndex: 0 | 1 | 2 | 3) => {
    const currentQuestion = questions[currentIndex];

    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: optionIndex,
    }));

    // Play appropriate sound
    if (mode === 'practice') {
      if (optionIndex === currentQuestion.correctAnswer) {
        playCorrectSound();
      } else {
        playIncorrectSound();
      }
    } else {
      playClickSound();
    }
  };

  // Navigation handlers
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setIsFinishModalOpen(true);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Keyboard navigation & answer selection
  useEffect(() => {
    if (isSubmitted || isFinishModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Numbers 1-4
      if (['1', '2', '3', '4'].includes(e.key)) {
        const optIdx = (parseInt(e.key, 10) - 1) as 0 | 1 | 2 | 3;
        handleSelectOption(optIdx);
      }
      // Letters A, B, C, D
      else if (['a', 'A'].includes(e.key)) handleSelectOption(0);
      else if (['b', 'B'].includes(e.key)) handleSelectOption(1);
      else if (['c', 'C'].includes(e.key)) handleSelectOption(2);
      else if (['d', 'D'].includes(e.key)) handleSelectOption(3);
      // Arrow keys
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key === 'ArrowLeft') handlePrevious();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubmitted, isFinishModalOpen, currentIndex, questions]);

  // Submit test and calculate results
  const handleSubmitExam = () => {
    const finishTimestamp = Date.now();
    setEndTime(finishTimestamp);
    setIsFinishModalOpen(false);
    setIsSubmitted(true);

    // Save to in-memory session context
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });

    const sessionRecord: UserExamSession = {
      sessionId: `sess-${finishTimestamp}`,
      subjectId: subjectId as SubjectId,
      topicId: topicId as TopicId,
      topicTitle: displayTopic.title,
      mode,
      startTime,
      endTime: finishTimestamp,
      durationSeconds: Math.max(1, Math.round((finishTimestamp - startTime) / 1000)),
      totalQuestions: questions.length,
      questions,
      userAnswers,
      completed: true,
      score: correct,
    };

    saveCompletedSession(sessionRecord);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compute result summary
  const resultSummary: ExamResultSummary = useMemo(() => {
    let correct = 0;
    let answered = 0;

    questions.forEach((q, idx) => {
      const studentAns = userAnswers[idx];
      if (studentAns !== undefined) {
        answered++;
        if (studentAns === q.correctAnswer) {
          correct++;
        }
      }
    });

    const total = questions.length || 1;
    const incorrect = answered - correct;
    const unanswered = total - answered;
    const scorePercentage = Math.round((correct / total) * 100);
    const duration = endTime 
      ? Math.round((endTime - startTime) / 1000) 
      : Math.round((Date.now() - startTime) / 1000);

    return {
      totalQuestions: total,
      answeredCount: answered,
      unansweredCount: unanswered,
      correctCount: correct,
      incorrectCount: incorrect,
      scorePercentage,
      timeSpentSeconds: duration,
      passed: scorePercentage >= 50,
    };
  }, [questions, userAnswers, startTime, endTime]);

  // Identify unanswered question indices for jump navigation
  const unansweredIndices = useMemo(() => {
    return questions
      .map((_, idx) => idx)
      .filter((idx) => userAnswers[idx] === undefined);
  }, [questions, userAnswers]);

  // Fallback while loading
  if (questions.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-blue border-t-transparent animate-spin mb-4" />
        <p className="font-extrabold text-slate-600">Loading your questions...</p>
      </div>
    );
  }

  // 1. Result Summary Screen
  if (isSubmitted && !isReviewing) {
    return (
      <ResultSummary
        summary={resultSummary}
        topic={displayTopic}
        onReviewAnswers={() => {
          setIsReviewing(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTryAgain={() => {
          initializeTest();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onGoHome={() => navigate(`/topics/${subjectId}`)}
      />
    );
  }

  // 2. Answer Review Screen
  if (isSubmitted && isReviewing) {
    return (
      <AnswerReview
        questions={questions}
        userAnswers={userAnswers}
        summary={resultSummary}
        topic={displayTopic}
        onBackToResult={() => setIsReviewing(false)}
        onRetake={() => initializeTest()}
      />
    );
  }

  // 3. Active Question Screen
  const currentQuestion = questions[currentIndex];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC]">
      
      {/* Top Progress Bar & Timer */}
      <ExamProgress
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        mode={mode}
        timeLeftSeconds={mode === 'exam' ? timeLeft : undefined}
        onQuit={() => {
          if (Object.keys(userAnswers).length === 0 || window.confirm('Exit practice? Your session progress will not be saved.')) {
            navigate(`/topics/${subjectId}`);
          }
        }}
      />

      {/* Main Question Area */}
      <main className="flex-1 max-w-[700px] w-full mx-auto px-4 py-6 sm:py-8 flex flex-col justify-center">
        <QuestionCard
          question={currentQuestion}
          questionNumber={currentIndex + 1}
          selectedOptionIndex={userAnswers[currentIndex]}
          onSelectOption={handleSelectOption}
          mode={mode}
        />
      </main>

      {/* Bottom Sticky Navigation */}
      <ExamNavigation
        currentIndex={currentIndex}
        totalQuestions={questions.length}
        hasAnsweredCurrent={userAnswers[currentIndex] !== undefined}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onOpenFinishModal={() => setIsFinishModalOpen(true)}
        isLastQuestion={currentIndex === questions.length - 1}
      />

      {/* Finish Confirmation Dialog */}
      <FinishConfirmation
        isOpen={isFinishModalOpen}
        totalQuestions={questions.length}
        answeredCount={resultSummary.answeredCount}
        unansweredCount={resultSummary.unansweredCount}
        onConfirmFinish={handleSubmitExam}
        onReturnToExam={() => setIsFinishModalOpen(false)}
        onJumpToQuestion={(idx) => {
          setIsFinishModalOpen(false);
          setCurrentIndex(idx);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unansweredIndices={unansweredIndices}
      />

    </div>
  );
};
