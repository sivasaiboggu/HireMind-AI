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
        backgroundColor: '#F4F1EA',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.018) 1px, transparent 1px)',
        backgroundSize: '28px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0px',
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes hmSpin {
            to { transform: rotate(360deg); }
          }
          @keyframes hmPulseRing {
            0%, 100% { opacity: 0.15; transform: scale(1); }
            50% { opacity: 0.35; transform: scale(1.08); }
          }
          @keyframes hmDotBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-7px); opacity: 1; }
          }
          @keyframes hmFadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        {/* Ambient glow blobs */}
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', top: '-180px', left: '-180px',
          background: 'radial-gradient(circle, rgba(255,106,85,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          borderRadius: '50%', bottom: '-180px', right: '-180px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
          filter: 'blur(60px)', pointerEvents: 'none'
        }} />

        {/* Logo + spinner */}
        <div style={{ position: 'relative', marginBottom: '32px', animation: 'hmFadeUp 0.5s ease forwards' }}>
          {/* Outer pulsing ring */}
          <div style={{
            position: 'absolute', inset: '-16px',
            borderRadius: '50%',
            border: '1.5px solid rgba(255,106,85,0.3)',
            animation: 'hmPulseRing 2s ease-in-out infinite',
          }} />
          {/* Spinning arc */}
          <div style={{
            position: 'absolute', inset: '-8px',
            borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: '#FF6A55',
            borderRightColor: 'rgba(255,106,85,0.35)',
            animation: 'hmSpin 0.9s linear infinite',
          }} />
          {/* Logo mark */}
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '18px',
            background: 'linear-gradient(135deg, #FF6A55 0%, #8B5CF6 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 32px rgba(255,106,85,0.25), 0 4px 10px rgba(0,0,0,0.06)',
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
                fill="white" opacity="0.9"/>
            </svg>
          </div>
        </div>

        {/* Brand name */}
        <div style={{
          fontSize: '22px', fontWeight: 700, color: '#09090E',
          letterSpacing: '-0.02em', marginBottom: '6px',
          animation: 'hmFadeUp 0.55s ease forwards',
        }}>
          HireMind
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '12.5px', color: '#7E7989', marginBottom: '28px',
          animation: 'hmFadeUp 0.6s ease forwards',
        }}>
          Securing your session…
        </div>

        {/* Bouncing dots */}
        <div style={{
          display: 'flex', gap: '7px', alignItems: 'center',
          animation: 'hmFadeUp 0.65s ease forwards',
        }}>
          {[0, 150, 300].map((delay) => (
            <div key={delay} style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF6A55, #8B5CF6)',
              animation: `hmDotBounce 1.1s ease-in-out ${delay}ms infinite`,
            }} />
          ))}
        </div>
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
