import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { InterviewPractice } from './pages/InterviewPractice';
import { LearningRoadmap } from './pages/LearningRoadmap';
import { useAppStore, AppView } from './store/appStore';

// Synchronizes React Router path and Zustand view store
const AppRoutes: React.FC = () => {
  const { view, setView } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync route pathname to store view
  useEffect(() => {
    const path = location.pathname.substring(1) || 'dashboard';
    if (['dashboard', 'resume', 'interview', 'roadmap'].includes(path)) {
      if (view !== path) {
        setView(path as AppView);
      }
    }
  }, [location, setView, view]);

  // Sync store view changes back to route path
  useEffect(() => {
    const currentPath = location.pathname.substring(1) || 'dashboard';
    if (view !== currentPath) {
      navigate(`/${view}`);
    }
  }, [view, navigate, location]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeAnalyzer />} />
        <Route path="/interview" element={<InterviewPractice />} />
        <Route path="/roadmap" element={<LearningRoadmap />} />
        <Route path="*" element={<Dashboard />} />
      </Routes>
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
