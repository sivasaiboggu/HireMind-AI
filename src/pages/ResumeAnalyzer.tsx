import React, { useState } from 'react';
import { ResumeUploader } from '../components/resume/ResumeUploader';
import { ATSScoreCard } from '../components/resume/ATSScoreCard';
import { ResumeAnalysis } from '../components/resume/ResumeAnalysis';
import { Skeleton } from '../components/ui/Skeleton';
import { ProgressiveLoader } from '../components/ui/ProgressiveLoader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore, generateId } from '../store/appStore';
import { SavedResumeAnalysis } from '../types';
import { Activity, Terminal, ShieldCheck } from 'lucide-react';
import '../styles/globals.css';
import '../styles/animations.css';

export const ResumeAnalyzer: React.FC = () => {
  const { addResumeAnalysis, activeResume, setActiveResume } = useAppStore();
  const { execute, loading, error, reset } = useGemini(gemini.analyzeResume, 10); // cost 10 credits

  // State to track current input fields for display in result
  const [currentRole, setCurrentRole] = useState(activeResume?.jobRole || '');
  const [currentExp, setCurrentExp] = useState(activeResume?.experienceLevel || '');

  const handleAnalyze = async (resumeText: string, jobRole: string, experienceLevel: string, jobDescription?: string) => {
    setCurrentRole(jobRole);
    setCurrentExp(experienceLevel);
    
    const result = await execute(resumeText, jobDescription);
    if (result) {
      const savedAnalysis: SavedResumeAnalysis = {
        ...result,
        id: generateId(),
        timestamp: Date.now(),
        jobRole,
        experienceLevel
      };
      // Save in Zustand (which updates localStorage)
      addResumeAnalysis(savedAnalysis);
    }
  };

  const handleReset = () => {
    reset();
    setActiveResume(null);
  };

  // Show active analysis from history or newly generated one
  const displayAnalysis = activeResume;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Page description */}
      {!loading && !displayAnalysis && (
        <div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Check your resume against ATS requirements and optimize bullet points instantly using AI.
          </p>
        </div>
      )}

      {/* Loading State Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
          {/* Thinking overlay */}
          <ProgressiveLoader 
            messages={[
              "DECONSTRUCTING RESUME DOCUMENT & PARSING LAYOUT...",
              "MATCHING CANDIDATE PROFILE AGAINST INDUSTRY BENCHMARKS...",
              "ANALYZING WORD CHOICE AND STRUCTURAL VERB IMPACT...",
              "EVALUATING ATS COMPLIANCE KEYWORDS & REQUIREMENTS...",
              "FORMULATING ACTIONABLE CRITIQUES & REWRITE SUGGESTIONS..."
            ]}
            subtitle="Benchmarking formatting parameters, structural checklists, and industry keywords against dream recruiter standards."
          />

          {/* Core Skeletons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
            <Skeleton height={140} />
            <Skeleton height={140} />
            <Skeleton height={140} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Skeleton height={80} />
              <Skeleton height={200} />
              <Skeleton height={150} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <Skeleton height={250} />
              <Skeleton height={150} />
            </div>
          </div>
        </div>
      )}

      {/* Input Form / Uploader */}
      {!loading && !displayAnalysis && (
        <Card hoverable={false} style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '32px' }}>
          <ResumeUploader onAnalyze={handleAnalyze} loading={loading} />
        </Card>
      )}

      {/* Results View */}
      {!loading && displayAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* 3 circular progress ring cards */}
          <ATSScoreCard 
            atsScore={displayAnalysis.atsScore} 
            contentScore={displayAnalysis.contentScore} 
            formatScore={displayAnalysis.formatScore} 
          />
          {/* Detailed analysis cards */}
          <ResumeAnalysis 
            analysis={displayAnalysis} 
            jobRole={displayAnalysis.jobRole} 
            experienceLevel={displayAnalysis.experienceLevel} 
            onReset={handleReset} 
          />
        </div>
      )}
      
      {/* Error state card */}
      {!loading && error && (
        <Card 
          hoverable={false} 
          style={{ 
            borderColor: 'var(--accent-danger)', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            padding: '24px',
            marginTop: '16px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-danger)' }}>
            <Terminal style={{ width: '24px', height: '24px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Analysis Process Halted</h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {error.message || 'An unexpected error occurred while processing your resume details. Please try again.'}
          </p>
          <Button variant="danger" onClick={reset} style={{ width: 'fit-content' }}>
            Dismiss & Retry
          </Button>
        </Card>
      )}

    </div>
  );
};
export default ResumeAnalyzer;
