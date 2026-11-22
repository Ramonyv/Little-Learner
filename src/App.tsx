import { Games, Puzzle } from './pages/Games';
import { LearningToolsPage } from './pages/LearningToolsPage';
import { MyWorkPage } from './pages/MyWorkPage';
import { LocalSaveNotice } from './components/board/LocalSaveNotice';
import { InformationPage } from './pages/InformationPage';
import { ContactPage } from './pages/ContactPage';
import { SiteFooter } from './components/layout/SiteFooter';
import { PageMetadata } from './components/layout/PageMetadata';
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

const Runner = React.lazy(() => import('./runner/Runner'));
const BrushGallery = import.meta.env.DEV ? React.lazy(() => import('./pages/BrushGallery')) : null;

export const App: React.FC = () => {
  return (
    <SessionProvider>
      <BrowserRouter><PageMetadata/><LocalSaveNotice/>
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-brand-ink selection:bg-brand-yellow selection:text-brand-ink">
          <SiteHeader />
          <Routes>
            {BrushGallery && <Route path="/dev/brushes" element={<React.Suspense><BrushGallery/></React.Suspense>}/> }
            <Route path="/games" element={<main><Games /></main>} />
            <Route path="/games/hanuman-runner" element={<React.Suspense><Runner /></React.Suspense>} />
            <Route path="/games/sliding-puzzle" element={<main><Puzzle /></main>} />
            <Route path="/drawing-board" element={<main><DrawingBoard /></main>} />
            <Route element={<><main className="flex-1"><Outlet /></main><SiteFooter/><MobileBottomNav /></>}>
              <Route path="/explore/seed" element={<SeedActivity />} />
              <Route path="/" element={<HomePage />} />
              <Route path="/topics/:subjectId" element={<TopicsPage />} />
              <Route path="/intro/:subjectId/:topicId" element={<ExamIntroPage />} />
              <Route path="/exam/:subjectId/:topicId" element={<ExamPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/information/:slug" element={<InformationPage/>}/><Route path="/learning-tools" element={<LearningToolsPage/>}/><Route path="/my-work" element={<MyWorkPage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/about" element={<AboutPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </SessionProvider>
  );
};

export default App;
