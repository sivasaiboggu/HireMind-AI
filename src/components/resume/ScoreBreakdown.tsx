import React from 'react';
import { Card } from '../ui/Card';
import { ScoreBar } from '../ui/ScoreBar';
import { buildScoreBreakdown } from '../../services/score-breakdown';
import type { ResumeAnalysis } from '../../types';
import { ArrowUpRight } from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

/**
 * "How your score is built" — a plain-language breakdown of the ATS score.
 *
 * Every bar is derived from the audit result itself (see
 * src/services/score-breakdown.ts), so the numbers shown here always agree
 * with the score rings above. The "What to fix next" line names the single
 * highest-weight driver that is not yet full.
 */
export const ScoreBreakdown: React.FC<{ analysis: ResumeAnalysis }> = ({ analysis }) => {
  const { parts, totalPoints, nextFix } = buildScoreBreakdown(analysis);

  return (
    <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>How your ATS score is built</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
          {totalPoints} of 100 points come from four drivers below. Nothing here is a guess —
          each bar is calculated from the audit on this page.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {parts.map((part) => (
          <div key={part.label} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <ScoreBar
              value={Math.round(part.rate * 100)}
              max={100}
              label={`${part.label} · ${part.points}/${part.weight} pts`}
            />
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {part.detail}
            </p>
          </div>
        ))}
      </div>

      {nextFix ? (
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <ArrowUpRight style={{ width: '18px', height: '18px', color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--text-primary)' }}>
              What to fix next: {nextFix.title}
            </div>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px' }}>
              {nextFix.description}
            </p>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', fontWeight: 600 }}>
          Every driver is already at full marks — this resume is in great shape for ATS.
        </p>
      )}
    </Card>
  );
};
export default ScoreBreakdown;
