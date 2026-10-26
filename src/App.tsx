import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './context/SessionContext';
import { SiteHeader } from './components/layout/SiteHeader';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
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
          {/* Main Top Header */}
          <SiteHeader />

          {/* Main Content Area */}
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/topics/:subjectId" element={<TopicsPage />} />
              <Route path="/intro/:subjectId/:topicId" element={<ExamIntroPage />} />
              <Route path="/exam/:subjectId/:topicId" element={<ExamPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Mobile Bottom Navigation Bar (Hidden during active exams) */}
          <MobileBottomNav />
        </div>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
