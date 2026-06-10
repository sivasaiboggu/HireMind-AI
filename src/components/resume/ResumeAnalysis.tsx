import React from 'react';
import { SectionFeedback } from './SectionFeedback';
import { KeywordCloud } from './KeywordCloud';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ResumeAnalysis as IResumeAnalysis } from '../../types';
import { Check, X, Award, Info, FileEdit, CheckSquare } from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ResumeAnalysisProps {
  analysis: IResumeAnalysis;
  jobRole: string;
  experienceLevel: string;
  onReset: () => void;
}

export const ResumeAnalysis: React.FC<ResumeAnalysisProps> = ({
  analysis,
  jobRole,
  experienceLevel,
  onReset
}) => {
  const getPriorityBadge = (priority: 'HIGH' | 'MED' | 'LOW') => {
    switch (priority) {
      case 'HIGH': return <Badge variant="danger">High Priority</Badge>;
      case 'MED': return <Badge variant="warning">Medium Priority</Badge>;
      case 'LOW': return <Badge variant="info">Low Priority</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      {/* Navigation Re-Audit Trigger */}
      <div>
        <button
          onClick={onReset}
          style={{
            fontSize: '11px',
            color: 'var(--text-secondary)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            padding: '8px 16px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)'
          }}
          className="btn-press"
        >
          ← Run Another Resume Audit
        </button>
      </div>

      {/* Target summary banner */}
      <div 
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 212, 170, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            Strategic Resume Audit Results
          </h2>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Target: <span className="text-cyan" style={{ fontWeight: 600 }}>{jobRole}</span> ({experienceLevel})
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
          <Award style={{ width: '18px', height: '18px' }} />
          <span>ATS SIGNAL ACTIVE</span>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          alignItems: 'start'
        }}
        className="analysis-layout-grid"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .analysis-layout-grid {
              grid-template-columns: 7fr 5fr !important;
            }
          }
        `}} />

        {/* Left Column: Sections, Keywords, and Rewrite Proposals */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Section audits accordion */}
          <SectionFeedback sections={analysis.sections} />
          
          {/* Keywords match cloud */}
          <KeywordCloud 
            matchedKeywords={analysis.matchedKeywords} 
            missingKeywords={analysis.missingKeywords} 
          />

          {/* AI Rewrite Suggestions */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileEdit style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>AI Rewrite Proposals</h3>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {analysis.rewrites.map((rewrite, idx) => (
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
                  <div>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-danger)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Original (Weak Bullet)
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{rewrite.original}"
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                    <div style={{ fontSize: '9px', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                      Improved (STAR Framework)
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500, lineHeight: 1.4 }}>
                      "{rewrite.improved}"
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Recommendations and Checklist */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* 1. Top Recommendations */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Info style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Top Recommendations</h3>
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
                  <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
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
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>ATS Checklist Audit</h3>
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
