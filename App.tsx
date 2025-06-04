
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom'; // Updated for v6/v7
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
import NotFoundPage from './pages/NotFoundPage'; // Optional

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-slate-100 text-slate-800">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 pt-20"> {/* Adjusted padding top */}
          <Routes> {/* Changed from Switch to Routes */}
            <Route path="/" element={<HomePage />} /> {/* Used element prop */}
            <Route path="/about" element={<AboutPage />} /> {/* Used element prop */}
            <Route path="/research" element={<ResearchPage />} /> {/* Used element prop */}
            <Route path="/teaching" element={<TeachingPage />} /> {/* Used element prop */}
            <Route path="/activities" element={<AcademicActivitiesPage />} /> {/* Used element prop */}
            <Route path="/service" element={<AcademicServicePage />} /> {/* Used element prop */}
            <Route path="/links" element={<LinksPage />} /> {/* Used element prop */}
            <Route path="*" element={<NotFoundPage />} /> {/* Used element prop */}
          </Routes>
        </main>
        <Footer />
        <ScrollToTopButton />
      </div>
    </HashRouter>
  );
};

export default App;