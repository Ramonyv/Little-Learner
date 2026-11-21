import { readWork, saveWork } from '../utils/localWork';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserExamSession } from '../types';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

interface SessionContextType {
  puzzleWins: number;
  recordPuzzleWin: () => void;
  selectedClass: number;
  setSelectedClass: (cls: number) => void;
  completedSessions: UserExamSession[];
  saveCompletedSession: (session: UserExamSession) => void;
  soundOn: boolean;
  setSoundOn: (enabled: boolean) => void;
  activeSession: UserExamSession | null;
  setActiveSession: (session: UserExamSession | null) => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [puzzleWins, setPuzzleWins] = useState(() => readWork<number>("ll-puzzle-wins", 0));
  const recordPuzzleWin = () => {
    saveWork("ll-puzzle-wins", puzzleWins + 1);
    setPuzzleWins(puzzleWins + 1);
  };
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [completedSessions, setCompletedSessions] = useState<UserExamSession[]>(() => readWork('ll-results', []));
  const [soundOn, setSoundOnState] = useState<boolean>(isSoundEnabled());
  const [activeSession, setActiveSession] = useState<UserExamSession | null>(null);

  const setSoundOn = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundOnState(enabled);
  };

  const saveCompletedSession = (session: UserExamSession) => {
    setCompletedSessions((prev) => { const next=[session,...prev];saveWork('ll-results',next);return next; });
  };

  return (
    <SessionContext.Provider
      value={{
        puzzleWins, recordPuzzleWin,
        selectedClass,
        setSelectedClass,
        completedSessions,
        saveCompletedSession,
        soundOn,
        setSoundOn,
        activeSession,
        setActiveSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
