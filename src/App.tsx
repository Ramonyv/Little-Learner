import React from 'react';
import { BrowserRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { SiteHeader } from './components/layout/SiteHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { SeedActivity } from './pages/SeedActivity';
import { DrawingBoard } from './pages/DrawingBoard';
import { HomePage } from './pages/HomePage';
import { TopicsPage } from './pages/TopicsPage';
import { ExamIntroPage } from './pages/ExamIntroPage';
import { ExamPage } from './pages/ExamPage';
import { ProgressPage } from './pages/ProgressPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-brand-ink selection:bg-brand-yellow selection:text-brand-ink">
          <Routes>
            <Route path="/drawing-board" element={<main><DrawingBoard /></main>} />
            <Route element={<><SiteHeader /><main className="flex-1"><Outlet /></main><MobileBottomNav /></>}>
              <Route path="/explore/seed" element={<SeedActivity />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/topics/:subjectId" element={<TopicsPage />} />
              <Route path="/intro/:subjectId/:topicId" element={<ExamIntroPage />} />
              <Route path="/exam/:subjectId/:topicId" element={<ExamPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
