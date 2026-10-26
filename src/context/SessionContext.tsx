import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserExamSession } from '../types';
import { isSoundEnabled, setSoundEnabled } from '../utils/soundEffects';

interface SessionContextType {
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
  const [selectedClass, setSelectedClass] = useState<number>(1);
  const [completedSessions, setCompletedSessions] = useState<UserExamSession[]>([]);
  const [soundOn, setSoundOnState] = useState<boolean>(isSoundEnabled());
  const [activeSession, setActiveSession] = useState<UserExamSession | null>(null);

  const setSoundOn = (enabled: boolean) => {
    setSoundEnabled(enabled);
    setSoundOnState(enabled);
  };

  const saveCompletedSession = (session: UserExamSession) => {
    setCompletedSessions((prev) => [session, ...prev]);
  };

  return (
    <SessionContext.Provider
      value={{
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
