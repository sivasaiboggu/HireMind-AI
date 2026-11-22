import React, { Component, lazy, Suspense, useEffect } from 'react';
import { HashRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Brand } from './components/layout/Brand';
import { PageHeading } from './components/ui/PageHeading';
import { Button } from './components/ui/Button';
import Hiring from './pages/Hiring';
import { useAppStore } from './store/appStore';
import { hasSupabaseConfig } from './services/supabase';

const Auth = lazy(() => import('./pages/Auth').then(({ Auth }) => ({ default: Auth })));
const Dashboard = lazy(() => import('./pages/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const ResumeAnalyzer = lazy(() => import('./pages/ResumeAnalyzer'));
const InterviewPractice = lazy(() => import('./pages/InterviewPractice'));
const LearningRoadmap = lazy(() => import('./pages/LearningRoadmap').then(({ LearningRoadmap }) => ({ default: LearningRoadmap })));
const QuizPractice = lazy(() => import('./pages/QuizPractice').then(({ QuizPractice }) => ({ default: QuizPractice })));

function PageFallback({ message = 'Opening page…' }: { message?: string }) {
  return <div className="container"><p className="page-status" role="status"><span className="busy-mark" aria-hidden="true" />{message}</p></div>;
}

class PageErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container tool-page">
        <PageHeading title="This page couldn’t load.">Reload HireMind to try again.</PageHeading>
        <div><Button onClick={() => window.location.reload()}>Reload</Button></div>
      </div>
    );
  }
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, guestMode, authLoading } = useAppStore();
  const location = useLocation();
  if (authLoading) return <PageFallback message="Opening your workspace…" />;
  if (hasSupabaseConfig && !user && !guestMode) return <Navigate to="/auth" state={{ from: location }} replace />;
  return children;
}

function MissingPage() {
  return (
    <div className="container tool-page">
      <PageHeading title="Page not found.">Check the address or return to your overview.</PageHeading>
      <div><Link to="/dashboard" className="button primary-button">Go to overview</Link></div>
    </div>
  );
}

function Privacy() {
  return (
    <div className="auth-page">
      <header className="auth-header"><Brand /><Link to="/auth">Sign in</Link></header>
      <main className="container tool-page privacy-page">
        <PageHeading title="Privacy and data">Where HireMind keeps your work and what it sends to connected services.</PageHeading>
        <section>
          <h2>Work you save</h2>
          <p>Guest reviews, interview results, study plans, and settings stay in this browser. If you sign in, your saved reviews, interview results, and study plans are linked to your account and stored in Supabase. You can delete saved work from your overview. Clearing this site’s browser data also clears guest work.</p>
        </section>
        <section>
          <h2>Hiring records</h2>
          <p>Candidate names, application notes, reviews, and interview times stay in this browser, including when you sign in. The register is separate for each signed-in account and for guests. You can delete a candidate and their history from the record. Clearing this site’s browser data removes the local hiring register. Calendar downloads contain the candidate name, interview topic, and time.</p>
        </section>
        <section>
          <h2>AI and your browser</h2>
          <p>AI features send the information needed to generate a result to Google Gemini, either directly with your connected key or through the server when an account proxy is configured. A personal key is stored in this browser and can be removed from the connection dialog. Local resume checks run in your browser.</p>
        </section>
        <section>
          <h2>Camera and microphone</h2>
          <p>Allow access to use video preview or voice input in a mock interview. Speech recognition uses your browser’s speech service where available. You can answer by typing.</p>
        </section>
      </main>
    </div>
  );
}

function AppRoutes() {
  const initializeAuth = useAppStore((state) => state.initializeAuth);
  const { pathname, key } = useLocation();

  useEffect(() => initializeAuth(), [initializeAuth]);
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Hiring pipeline', '/hiring': 'Hiring pipeline', '/dashboard': 'Career overview', '/resume': 'Resume review',
      '/interview': 'Mock interview', '/roadmap': 'Study plan', '/quiz': 'Practice lab',
      '/auth': 'Sign in', '/privacy': 'Privacy and data',
    };
    document.title = `${titles[pathname] || 'Page not found'} · HireMind`;
  }, [pathname]);

  return (
    <Routes>
      <Route path="/auth" element={<Suspense fallback={<PageFallback />}><Auth /></Suspense>} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/*" element={
        <AuthGuard>
          <Layout>
            <PageErrorBoundary key={pathname}>
              <Suspense fallback={<PageFallback />}>
                <div className={key === 'default' ? undefined : 'page-enter'}>
                  <Routes>
                    <Route index element={<Hiring />} />
                    <Route path="hiring" element={<Hiring />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="resume" element={<ResumeAnalyzer />} />
                    <Route path="interview" element={<InterviewPractice />} />
                    <Route path="roadmap" element={<LearningRoadmap />} />
                    <Route path="quiz" element={<QuizPractice />} />
                    <Route path="*" element={<MissingPage />} />
                  </Routes>
                </div>
              </Suspense>
            </PageErrorBoundary>
          </Layout>
        </AuthGuard>
      } />
    </Routes>
  );
}

export function App() {
  return <HashRouter><AppRoutes /></HashRouter>;
}

export default App;
