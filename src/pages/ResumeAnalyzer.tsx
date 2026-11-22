import { PageHeading, WorkSheet } from '../components/ui/PageHeading';
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
import { localAuditReason, type LocalAuditReason } from '../services/local-audit';
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
  // Why the current result is a local audit (null when it is an AI review).
  const [auditReason, setAuditReason] = useState<LocalAuditReason | null>(
    activeResume?.isLocalAudit ? 'unavailable' : null,
  );

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

    const creditsBefore = useAppStore.getState().credits;
    const result = await execute(resumeText, jobDescription);
    if (result) {
      setAuditReason(null);
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

    // AI unavailable (no key, quota, network) or out of credits: fall back
    // to the deterministic local audit instead of leaving the user with
    // only an error. The result is labelled as a local audit so nobody
    // mistakes it for AI judgement, and no credits are charged for it.
    // The reason matters: out of credits is not "unavailable", and the
    // banner says which it was so the refill button reads as the fix.
    const reason = localAuditReason(creditsBefore, 10);
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
    setAuditReason(reason);
    addResumeAnalysis(savedLocal);
    useAppStore.getState().addToast('info', reason === 'credits'
      ? 'Out of AI credits — showing a local ATS audit instead. Refill from the sidebar to use the AI review.'
      : 'AI analysis was unavailable — showing a local ATS audit instead.');
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
    setAuditReason(null);
    setActiveResume(null);
  };

  // Show active analysis from history or newly generated one
  const displayAnalysis = activeResume;

  return (
    <div className="container tool-page page-enter">
      <PageHeading
        title={displayAnalysis ? 'Resume results' : 'Resume review'}
        action={displayAnalysis && !loading && (
          <Button variant="ghost" onClick={handleDownloadReport}>
            <Download size={16} aria-hidden="true" /> Download report
          </Button>
        )}
      >
        {displayAnalysis ? displayAnalysis.jobRole : 'Check how your resume lines up with the job you want.'}
      </PageHeading>

      {/* Loading State Skeleton */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', width: '100%' }}>
          {/* Thinking overlay */}
          <ProgressiveLoader 
            messages={[
              "Reading the resume text...",
              "Checking sections and contact details...",
              "Matching keywords against the job description...",
              "Checking word choice and bullet verbs...",
              "Writing the recommendations..."
            ]}
            subtitle="This usually takes a few seconds."
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
        <WorkSheet note={
          <>
            <h2>What you’ll get</h2>
            <ul>
              <li>An ATS score and missing keywords.</li>
              <li>Checks for section structure and formatting.</li>
              <li>Bullet rewrites when AI review is available.</li>
            </ul>
            <p>Add a job description for a closer keyword match.</p>
          </>
        }>
          <ResumeUploader onAnalyze={handleAnalyze} loading={loading} />
        </WorkSheet>
      )}

      {/* Results View */}
      {!loading && displayAnalysis && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {displayAnalysis.isLocalAudit && (
            <Card hoverable={false} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '16px 20px', borderColor: 'var(--accent-warning)' }}>
              <Info style={{ width: '20px', height: '20px', color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Local ATS audit.</strong>{' '}
                {auditReason === 'credits'
                  ? 'You’re out of AI credits. This review checks keywords, sections, numbers, and formatting in your browser. Refill credits to get rewrites and section feedback.'
                  : 'This review checked keywords, sections, numbers, and formatting in your browser. Connect a Google AI key for rewrites and section feedback.'}
              </p>
            </Card>
          )}
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
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Couldn’t review this resume</h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {error.message || 'Check the resume text and try again.'}
          </p>
          <Button variant="danger" onClick={reset} style={{ width: 'fit-content' }}>
            Dismiss
          </Button>
        </Card>
      )}

    </div>
  );
};
export default ResumeAnalyzer;
