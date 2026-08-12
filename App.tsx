import React, { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTopButton from './components/ScrollToTopButton';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ResearchPage from './pages/ResearchPage';
import TeachingPage from './pages/TeachingPage';
import AcademicActivitiesPage from './pages/AcademicActivitiesPage';
import AcademicServicePage from './pages/AcademicServicePage';
import LinksPage from './pages/LinksPage';
import NotFoundPage from './pages/NotFoundPage';

const RouteScroll: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <RouteScroll />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Navbar />
        <main id="main-content" className="flex-grow pt-[4.25rem]">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/teaching" element={<TeachingPage />} />
            <Route path="/activities" element={<AcademicActivitiesPage />} />
            <Route path="/service" element={<AcademicServicePage />} />
            <Route path="/links" element={<LinksPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <Footer />
        <ScrollToTopButton />
      </div>
    </HashRouter>
  );
};

export default App;
