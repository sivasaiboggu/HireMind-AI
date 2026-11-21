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
 * src/services/score-breakdown.ts). For a local audit the bars add up to the
 * ATS score; for an AI analysis the model's own score is its judgement and
 * can differ from this recomputation, so the copy never claims the parts
 * sum to the score — they show where the points come from.
 */
export const ScoreBreakdown: React.FC<{ analysis: ResumeAnalysis }> = ({ analysis }) => {
  const { parts, totalPoints, nextFix } = buildScoreBreakdown(analysis);
  // A local audit's parts sum to its ATS score (±1 rounding). An AI score
  // is the model's own judgement, so a wider gap is expected, not an error
  // — say so instead of printing two numbers that quietly disagree.
  const partsAgree = Math.abs(totalPoints - analysis.atsScore) <= 2;

  return (
    <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>How your ATS score is built</h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
          Your ATS score is {analysis.atsScore}/100. Four drivers shape it — each bar is
          calculated from the audit on this page.
          {!partsAgree && (
            <> The drivers below add up to {totalPoints}: the AI's own score is its judgement on top of them.</>
          )}
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
