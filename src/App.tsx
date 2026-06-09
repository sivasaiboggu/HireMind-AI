import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { ResumeAnalyzer } from './pages/ResumeAnalyzer';
import { InterviewPractice } from './pages/InterviewPractice';
import { LearningRoadmap } from './pages/LearningRoadmap';
import { QuizPractice } from './pages/QuizPractice';
import { Auth } from './pages/Auth';
import { useAppStore } from './store/appStore';
import { hasSupabaseConfig } from './services/supabase';

// Protected Route Guard component
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, guestMode, authLoading } = useAppStore();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#030712',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        color: '#f3f4f6',
        fontFamily: 'var(--font-body)'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid rgba(0, 212, 170, 0.15)',
          borderTopColor: '#00d4aa',
          borderRadius: '50%',
          animation: 'voicePulse 1.2s infinite ease-in-out'
        }} />
        <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 600, letterSpacing: '0.05em' }}>RESOLVING SECURE SESSION...</span>
      </div>
    );
  }

  // Redirect to auth if not logged in AND not in guest mode AND hasSupabaseConfig is true
  if (hasSupabaseConfig && !user && !guestMode) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Synchronizes React Router path and Zustand view store
const AppRoutes: React.FC = () => {
  const initializeAuth = useAppStore(state => state.initializeAuth);

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return () => unsubscribe();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Auth page is rendered standalone, without sidebar/topbar Layout */}
      <Route path="/auth" element={<Auth />} />

      {/* Protected sections require AuthGuard and use Layout scaffolding */}
      <Route
        path="/*"
        element={
          <AuthGuard>
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
          </AuthGuard>
        }
      />
    </Routes>
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
