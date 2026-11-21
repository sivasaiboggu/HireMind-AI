import React, { useState, useRef } from 'react';
import { ResumeUploader } from '../components/resume/ResumeUploader';
import { ATSScoreCard } from '../components/resume/ATSScoreCard';
import { ResumeAnalysis } from '../components/resume/ResumeAnalysis';
import { Skeleton } from '../components/ui/Skeleton';
import { ProgressiveLoader } from '../components/ui/ProgressiveLoader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { analyzeResumeLocally } from '../services/ats';
import { buildScoreBreakdown } from '../services/score-breakdown';
import { useAppStore, generateId } from '../store/appStore';
import { SavedResumeAnalysis } from '../types';
import { Activity, Terminal, ShieldCheck, Download, Info } from 'lucide-react';
import '../styles/globals.css';
import '../styles/animations.css';

/** Render the audit as a shareable Markdown report for download. */
function toMarkdownReport(analysis: SavedResumeAnalysis): string {
  const breakdown = buildScoreBreakdown(analysis);
  const lines = [
    `# HireMind AI — Resume ATS Report`,
    ``,
    `Role: ${analysis.jobRole} · Experience: ${analysis.experienceLevel} · ${new Date(analysis.timestamp).toLocaleDateString()}`,
    analysis.isLocalAudit ? `Method: local deterministic audit (AI was unavailable)` : `Method: AI analysis`,
    ``,
    `| Metric | Score |`,
    `| --- | ---: |`,
    `| ATS | ${analysis.atsScore}/100 |`,
    `| Content | ${analysis.contentScore}/100 |`,
    `| Format | ${analysis.formatScore}/100 |`,
    `| Overall | ${analysis.overallScore}/100 |`,
    ``,
    `## How the ATS score is built`,
    ...breakdown.parts.map((p) => `- ${p.label}: ${p.points}/${p.weight} pts — ${p.detail}`),
    ...(breakdown.nextFix ? [``, `What to fix next: ${breakdown.nextFix.title} — ${breakdown.nextFix.description}`] : []),
    ``,
    `## Matched keywords`,
    analysis.matchedKeywords.length ? analysis.matchedKeywords.join(', ') : 'None',
    ``,
    `## Missing keywords`,
    analysis.missingKeywords.length ? analysis.missingKeywords.join(', ') : 'None',
    ``,
    `## Recommendations`,
    ...analysis.recommendations.map((r) => `- [${r.priority}] ${r.title} — ${r.description}`),
    ``,
    `## ATS checklist`,
    ...analysis.atsChecklist.map((c) => `- [${c.checked ? 'x' : ' '}] ${c.label}`),
    ``,
  ];
  return lines.join('\n');
}

export const ResumeAnalyzer: React.FC = () => {
  const { addResumeAnalysis, activeResume, setActiveResume } = useAppStore();
  const { execute, loading, error, reset } = useGemini(gemini.analyzeResume, 10); // cost 10 credits

  // State to track current input fields for display in result
  const [currentRole, setCurrentRole] = useState(activeResume?.jobRole || '');
  const [currentExp, setCurrentExp] = useState(activeResume?.experienceLevel || '');

  // Synchronous in-flight guard. The `loading` state above lags a tick, so
  // two submits in the same tick (double-click, Enter + click) both passed
  // the old check: the second hit useGemini's guard, returned null, and was
  // misread as "AI unavailable", saving a spurious local audit while the
  // real AI call was still running. A ref updates synchronously, so the
  // second submit is dropped before it can do anything.
  const submittingRef = useRef(false);

  const handleAnalyze = async (resumeText: string, jobRole: string, experienceLevel: string, jobDescription?: string) => {
    if (loading || submittingRef.current) return;
    submittingRef.current = true;
    try {
      await runAnalysis(resumeText, jobRole, experienceLevel, jobDescription);
    } finally {
      submittingRef.current = false;
    }
  };

  const runAnalysis = async (resumeText: string, jobRole: string, experienceLevel: string, jobDescription?: string) => {
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
      return;
    }

    // AI unavailable (no key, quota, network): fall back to the deterministic
    // local audit instead of leaving the user with only an error. The result
    // is labelled as a local audit so nobody mistakes it for AI judgement,
    // and no credits are charged for it.
    const local = analyzeResumeLocally(resumeText, jobDescription);
    const savedLocal: SavedResumeAnalysis = {
      ...local,
      id: generateId(),
      timestamp: Date.now(),
      jobRole,
      experienceLevel,
      isLocalAudit: true,
    };
    reset();
    addResumeAnalysis(savedLocal);
    useAppStore.getState().addToast('info', 'AI analysis was unavailable — showing a local ATS audit instead.');
  };

  const handleDownloadReport = () => {
    if (!displayAnalysis) return;
    const blob = new Blob([toMarkdownReport(displayAnalysis)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hiremind-ats-report-${displayAnalysis.jobRole.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'resume'}.md`;
    link.click();
    // Revoking synchronously can cancel the download in some browsers
    // (notably Firefox); give the navigation a moment to start first.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
          <div className="skeleton-grid-3">
            <Skeleton height={140} />
            <Skeleton height={140} />
            <Skeleton height={140} />
          </div>

          <div className="skeleton-grid-2col">
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
          {displayAnalysis.isLocalAudit && (
            <Card hoverable={false} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px 20px', borderColor: 'var(--accent-warning)' }}>
              <Info style={{ width: '20px', height: '20px', color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Local ATS audit.</strong>{' '}
                The AI analysis was unavailable, so these scores come from a deterministic on-device audit
                (keyword coverage, sections, quantified results, format). Connect a Google AI key for the
                full AI review with rewrites and section feedback.
              </p>
            </Card>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={handleDownloadReport}>
              <Download style={{ width: '16px', height: '16px' }} /> Download report (.md)
            </Button>
          </div>
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
            analysisId={displayAnalysis.id}
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
