import React from 'react';
import { Award, RefreshCw, Archive, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ProgressRing } from '../ui/ProgressRing';
import { SavedInterview } from '../../types';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface SessionSummaryProps {
  session: SavedInterview;
  onRetry: () => void;
  onDashboard: () => void;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
  session,
  onRetry,
  onDashboard
}) => {
  const { answers, config, overallScore } = session;

  // Gather categories present in this interview and score them
  const categoryScores = answers.reduce((acc, curr) => {
    const cat = curr.question.category;
    if (!acc[cat]) {
      acc[cat] = { total: 0, count: 0 };
    }
    acc[cat].total += curr.feedback.overallScore;
    acc[cat].count += 1;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  // Group strengths & improvements across the session to detect focus areas
  const allImprovements = answers.flatMap(ans => ans.feedback.improvements);
  const uniqueWeaknesses = Array.from(new Set(allImprovements)).slice(0, 3);

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      
      {/* Session Title Summary banner */}
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
            Interview Lab Scorecard
          </h2>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Role: <span className="text-cyan" style={{ fontWeight: 600 }}>{config.jobRole}</span> ({config.difficulty}) · Round: {config.interviewType}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-primary)', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
          <ShieldCheck style={{ width: '18px', height: '18px' }} />
          <span>EVALUATION LOGGED</span>
        </div>
      </div>

      {/* Grid of radial charts for categories */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="summary-stats-grid"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .summary-stats-grid {
              grid-template-columns: 2fr 1fr 1fr 1fr 1fr !important;
            }
          }
        `}} />

        {/* Big Overall Card */}
        <Card glow="primary" hoverable={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '16px' }}>
          <ProgressRing score={overallScore * 10} size={112} strokeWidth={8} label="Aggregate Score" />
          <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em' }}>
            LAB RATING
          </span>
        </Card>

        {/* Dynamic Category rings */}
        {Object.entries(categoryScores).map(([cat, metric]) => {
          const score = Math.round((metric.total / (metric.count * 10)) * 100);
          return (
            <Card key={cat} hoverable={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '12px' }}>
              <ProgressRing score={score} size={64} strokeWidth={6} />
              <span style={{ fontSize: '9px', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', textAlign: 'center' }}>
                {cat.replace('-', ' ')}
              </span>
            </Card>
          );
        })}
        
        {/* Placeholder cells for categories not present to keep sizing clean */}
        {Object.keys(categoryScores).length < 4 && 
          Array.from({ length: 4 - Object.keys(categoryScores).length }).map((_, i) => (
            <Card key={`empty-${i}`} hoverable={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '12px', opacity: 0.3 }}>
              <ProgressRing score={0} size={64} strokeWidth={6} animate={false} />
              <span style={{ fontSize: '9px', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                No Data
              </span>
            </Card>
          ))
        }
      </div>

      {/* Two Column details: Table vs Weaknesses */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          alignItems: 'start'
        }}
        className="summary-col-grid"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .summary-col-grid {
              grid-template-columns: 7fr 5fr !important;
            }
          }
        `}} />

        {/* Left Column: Performance Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Performance Breakdown</h3>
          
          <Card hoverable={false} style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-xs)' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Question</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600, width: '80px', textAlign: 'center' }}>Score</th>
                  <th style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontWeight: 600 }}>Top Strength</th>
                </tr>
              </thead>
              <tbody>
                {answers.map((ans, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < answers.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '16px 20px', color: 'var(--text-primary)', fontWeight: 500, maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {idx + 1}. {ans.question.text}
                    </td>
                    <td style={{ padding: '16px 20px', color: ans.feedback.overallScore >= 8 ? 'var(--accent-primary)' : ans.feedback.overallScore >= 6 ? 'var(--accent-secondary)' : 'var(--accent-danger)', fontWeight: 700, fontFamily: 'var(--font-numeric)', textAlign: 'center' }}>
                      {ans.feedback.overallScore}/10
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                      {ans.feedback.strengths[0] || 'Good attempt'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Right Column: Weaknesses & CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Areas needing focus */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-secondary)' }}>
              ⚠️ Top Focus Areas
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {uniqueWeaknesses.length > 0 ? (
                uniqueWeaknesses.map((weak, idx) => (
                  <div 
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(245, 158, 11, 0.03)',
                      border: '1px solid rgba(245, 158, 11, 0.1)',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.4
                    }}
                  >
                    {weak}
                  </div>
                ))
              ) : (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                  Excellent performance! No critical weaknesses identified.
                </div>
              )}
            </div>
          </Card>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Button
              variant="primary"
              onClick={onRetry}
              icon={<RefreshCw style={{ width: '16px', height: '16px' }} />}
              style={{ width: '100%' }}
            >
              Simulate New Session
            </Button>
            <Button
              variant="ghost"
              onClick={onDashboard}
              icon={<Archive style={{ width: '16px', height: '16px' }} />}
              style={{ width: '100%' }}
            >
              Return to Career Board
            </Button>
          </div>
        </div>
      </div>
      
    </div>
  );
};
