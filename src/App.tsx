import React, { useEffect, lazy, Suspense } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Auth } from './pages/Auth';
import { useAppStore } from './store/appStore';
import { hasSupabaseConfig } from './services/supabase';

// Heavy pages are code-split so the first load stays lean: the resume
// analyzer pulls in pdfjs-dist and the interview page is the largest in
// the app. They load on demand when the route is visited.
const ResumeAnalyzer = lazy(() =>
  import('./pages/ResumeAnalyzer').then((m) => ({ default: m.ResumeAnalyzer })),
);
const InterviewPractice = lazy(() =>
  import('./pages/InterviewPractice').then((m) => ({ default: m.InterviewPractice })),
);
const LearningRoadmap = lazy(() =>
  import('./pages/LearningRoadmap').then((m) => ({ default: m.LearningRoadmap })),
);
const QuizPractice = lazy(() =>
  import('./pages/QuizPractice').then((m) => ({ default: m.QuizPractice })),
);

/** Branded loading state shown while a code-split page downloads. */
const PageFallback: React.FC = () => (
  <div
    role="status"
    aria-label="Loading page"
    style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      color: 'var(--text-secondary)',
    }}
  >
    <div
      style={{
        width: '36px',
        height: '36px',
        border: '3px solid var(--accent-primary)',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spinBrain 1s linear infinite',
      }}
    />
    <span style={{ fontSize: 'var(--text-sm)' }}>Loading…</span>
  </div>
);

// Protected Route Guard component
const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, guestMode, authLoading } = useAppStore();
  const location = useLocation();

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-base)',
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
          @keyframes hmDotBounce {
            0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
            40% { transform: translateY(-7px); opacity: 1; }
          }
        `}</style>

        {/* Logo + spinner */}
        <div style={{ position: 'relative', marginBottom: '32px' }}>
          {/* Spinning arc */}
          <div style={{
            position: 'absolute', inset: '-8px',
            borderRadius: '50%',
            border: '2.5px solid transparent',
            borderTopColor: 'var(--accent-primary)',
            borderRightColor: 'rgba(198,242,78,0.35)',
            animation: 'hmSpin 0.9s linear infinite',
          }} />
          {/* Logo mark — the same lime "H" as the sidebar, not a foreign brand */}
          <div style={{
            width: '64px', height: '64px',
            borderRadius: '18px',
            backgroundColor: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-depth-2)',
            color: 'var(--on-accent)',
            fontFamily: "'Syne', 'Inter', sans-serif",
            fontSize: '30px',
            fontWeight: 800,
          }}>
            H
          </div>
        </div>

        {/* Brand name */}
        <div style={{
          fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)',
          fontFamily: "'Syne', 'Inter', sans-serif",
          letterSpacing: '-0.02em', marginBottom: '6px',
        }}>
          HireMind
        </div>

        {/* Subtitle */}
        <div style={{
          fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '28px',
        }}>
          Securing your session…
        </div>

        {/* Bouncing dots */}
        <div style={{
          display: 'flex', gap: '7px', alignItems: 'center',
        }}>
          {[0, 150, 300].map((delay) => (
            <div key={delay} style={{
              width: '7px', height: '7px', borderRadius: '50%',
              backgroundColor: 'var(--accent-primary)',
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
              <Suspense fallback={<PageFallback />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/resume" element={<ResumeAnalyzer />} />
                  <Route path="/interview" element={<InterviewPractice />} />
                  <Route path="/roadmap" element={<LearningRoadmap />} />
                  <Route path="/quiz" element={<QuizPractice />} />
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </Suspense>
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
