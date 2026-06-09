import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { InterviewPractice } from './pages/InterviewPractice';
import { LearningRoadmap } from './pages/LearningRoadmap';
import { QuizPractice } from './pages/QuizPractice';

// Synchronizes React Router path and Zustand view store
const AppRoutes: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/resume" element={<ResumeAnalyzer />} />
        <Route path="/interview" element={<InterviewPractice />} />
        <Route path="/roadmap" element={<LearningRoadmap />} />
        <Route path="/quiz" element={<QuizPractice />} />
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
