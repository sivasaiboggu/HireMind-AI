import React, { useState } from 'react';
import { SectionFeedback } from './SectionFeedback';
import { KeywordCloud } from './KeywordCloud';
import { ScoreBreakdown } from './ScoreBreakdown';
import { ImprovementChecklist } from './ImprovementChecklist';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ResumeAnalysis as IResumeAnalysis } from '../../types';
import { Check, X, Info, FileEdit, CheckSquare, Copy, CheckCheck, ArrowRight } from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ResumeAnalysisProps {
  analysis: IResumeAnalysis;
  jobRole: string;
  experienceLevel: string;
  onReset: () => void;
  /** Stable id of the saved analysis, used to persist checklist progress. */
  analysisId?: string;
}

/** Copy text to the clipboard, with a fallback for browsers without the API. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      return true;
    } catch {
      return false;
    }
  }
}

export const ResumeAnalysis: React.FC<ResumeAnalysisProps> = ({
  analysis,
  jobRole,
  experienceLevel,
  onReset,
  analysisId,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyOne = async (text: string, index: number) => {
    if (await copyText(text)) {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex((cur) => (cur === index ? null : cur)), 2000);
    }
  };

  const handleCopyAll = async () => {
    const all = analysis.rewrites.map((r) => `• ${r.improved}`).join('\n');
    if (await copyText(all)) {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    }
  };
  const getPriorityBadge = (priority: 'HIGH' | 'MED' | 'LOW') => {
    switch (priority) {
      case 'HIGH': return <Badge variant="danger">High Priority</Badge>;
      case 'MED': return <Badge variant="warning">Medium Priority</Badge>;
      case 'LOW': return <Badge variant="info">Low Priority</Badge>;
    }
  };

  // The signal label follows the overall score. It used to read "ATS SIGNAL
  // ACTIVE" for every resume, including a 40/100 one — a green-looking claim
  // next to a failing score.
  const signal =
    analysis.overallScore >= 80
      ? { label: 'Strong ATS signal', color: 'var(--accent-primary)' }
      : analysis.overallScore >= 60
        ? { label: 'ATS signal on track', color: 'var(--accent-secondary)' }
        : { label: 'ATS signal needs work', color: 'var(--accent-danger)' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      <div className="analysis-summary">
        <div>
          <h2>Overall review</h2>
          <p className="muted">{jobRole} · {experienceLevel}</p>
        </div>
        <div className="summary-verdict">
          <strong className="numeric">{analysis.overallScore}<small>/100</small></strong>
          <span style={{ color: signal.color }}>{signal.label}</span>
        </div>
        <Button variant="ghost" onClick={onReset}>Review another resume <ArrowRight size={16} aria-hidden="true" /></Button>
      </div>

      {/* How the score is built + what to fix next */}
      <ScoreBreakdown analysis={analysis} />

      {/* Two-Column Grid */}
      <div className="analysis-layout-grid">
        {/* Left Column: Sections, Keywords, and Rewrite Proposals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section audits accordion */}
          <SectionFeedback sections={analysis.sections} />
          
          {/* Keywords match cloud */}
          <KeywordCloud 
            matchedKeywords={analysis.matchedKeywords} 
            missingKeywords={analysis.missingKeywords} 
          />

          {/* AI Rewrite Suggestions — before / after comparison */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileEdit style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Suggested rewrites</h3>
              </div>
              {analysis.rewrites.length > 0 && (
                <Button variant="ghost" onClick={handleCopyAll} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {copiedAll ? <CheckCheck style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                  {copiedAll ? 'Copied all' : 'Copy all improved bullets'}
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analysis.rewrites.length === 0 ? (
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  No rewrite proposals here. The offline local audit scores the resume
                  honestly but cannot write personalised rewrites — run the AI analysis
                  with a Gemini key to get STAR-framework rewrites for weak bullets.
                </p>
              ) : (
                analysis.rewrites.map((rewrite, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Rewrite {idx + 1} of {analysis.rewrites.length}
                    </span>
                    <Button variant="ghost" onClick={() => handleCopyOne(rewrite.improved, idx)} style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {copiedIndex === idx ? <CheckCheck style={{ width: '16px', height: '16px' }} /> : <Copy style={{ width: '16px', height: '16px' }} />}
                      {copiedIndex === idx ? 'Copied' : 'Copy improved bullet'}
                    </Button>
                  </div>
                  <div className="rewrite-compare-grid">
                    <div style={{ borderLeft: '2px solid var(--danger-wash)', paddingLeft: '12px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        Before (weak bullet)
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.5 }}>
                        “{rewrite.original}”
                      </div>
                    </div>
                    <div className="rewrite-compare-arrow" aria-hidden="true">
                      <ArrowRight style={{ width: '18px', height: '18px' }} />
                    </div>
                    <div style={{ borderLeft: '2px solid var(--accent-wash)', paddingLeft: '12px' }}>
                      <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                        After (STAR framework)
                      </div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.5 }}>
                        “{rewrite.improved}”
                      </div>
                    </div>
                  </div>
                </div>
                ))
              )}
            </div>
          </Card>

          {/* Guided improvement checklist */}
          <ImprovementChecklist
            analysisId={analysisId}
            recommendations={analysis.recommendations}
            atsChecklist={analysis.atsChecklist}
          />
        </div>

        {/* Right Column: Recommendations and Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 1. What to fix first */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>What to fix first</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analysis.recommendations.slice(0, 5).map((rec, index) => (
                <div 
                  key={rec.id || index}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    padding: '16px',
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {index + 1}. {rec.title}
                    </span>
                    {getPriorityBadge(rec.priority)}
                  </div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* 2. ATS Compatibility Checklist */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckSquare style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>ATS checklist</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {analysis.atsChecklist.map((item, idx) => (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                    backgroundColor: 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)'
                  }}
                >
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {item.label}
                  </span>
                  {item.checked ? (
                    <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
                      <Check style={{ width: '16px', height: '16px' }} />
                    </div>
                  ) : (
                    <div style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center' }}>
                      <X style={{ width: '16px', height: '16px' }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

        </div>
      </div>

    </div>
  );
};
export default ResumeAnalysis;
