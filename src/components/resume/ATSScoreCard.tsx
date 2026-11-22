import React from 'react';
import { ProgressRing } from '../ui/ProgressRing';
import { Card } from '../ui/Card';
import '../../styles/globals.css';

interface ATSScoreCardProps {
  atsScore: number;
  contentScore: number;
  formatScore: number;
}

/** Plain-language verdict, using the same thresholds as the ring colours. */
function verdict(score: number): { label: string; color: string } {
  if (score >= 80) return { label: 'Strong', color: 'var(--accent-primary)' };
  if (score >= 60) return { label: 'On track', color: 'var(--accent-secondary)' };
  return { label: 'Needs work', color: 'var(--accent-danger)' };
}

export const ATSScoreCard: React.FC<ATSScoreCardProps> = ({
  atsScore,
  contentScore,
  formatScore
}) => {
  const cards = [
    { score: atsScore, title: 'ATS Score', titleColor: 'var(--accent-secondary)', emphasis: (atsScore > 75 ? 'primary' : 'secondary') as 'primary' | 'secondary', ariaLabel: `ATS Score ${atsScore} out of 100` },
    { score: contentScore, title: 'Content Strength', titleColor: 'var(--accent-primary)', emphasis: 'none' as const, ariaLabel: `Content Strength ${contentScore} out of 100` },
    { score: formatScore, title: 'Layout & Formatting', titleColor: 'var(--accent-purple)', emphasis: 'none' as const, ariaLabel: `Layout and Formatting ${formatScore} out of 100` },
  ];
  return (
    <div className="score-cards-grid">
      {cards.map((card) => {
        const v = verdict(card.score);
        return (
          <Card
            key={card.title}
            emphasis={card.emphasis}
            hoverable
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 16px',
              gap: '8px'
            }}
          >
            <ProgressRing score={card.score} size={96} strokeWidth={8} ariaLabel={card.ariaLabel} />
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
                color: card.titleColor,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                textAlign: 'center',
                marginTop: '8px'
              }}
            >
              {card.title}
            </span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: v.color }}>
              {v.label}
            </span>
          </Card>
        );
      })}
    </div>
  );
};
