import React from 'react';
import { ProgressRing } from '../ui/ProgressRing';
import { Card } from '../ui/Card';
import '../../styles/globals.css';

interface ATSScoreCardProps {
  atsScore: number;
  contentScore: number;
  formatScore: number;
}

export const ATSScoreCard: React.FC<ATSScoreCardProps> = ({
  atsScore,
  contentScore,
  formatScore
}) => {
  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '24px',
        width: '100%'
      }}
      className="score-cards-grid"
    >
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .score-cards-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}} />

      {/* Card 1: ATS Compliance */}
      <Card 
        glow={atsScore > 75 ? 'primary' : 'amber'} 
        hoverable 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '32px 16px',
          gap: '16px'
        }}
      >
        <ProgressRing score={atsScore} size={88} strokeWidth={8} />
        <span 
          style={{ 
            fontSize: 'var(--text-xs)', 
            fontWeight: 700, 
            color: 'var(--accent-secondary)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            textAlign: 'center'
          }}
        >
          ATS Score
        </span>
      </Card>

      {/* Card 2: Content Alignment */}
      <Card 
        hoverable 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '32px 16px',
          gap: '16px'
        }}
      >
        <ProgressRing score={contentScore} size={88} strokeWidth={8} />
        <span 
          style={{ 
            fontSize: 'var(--text-xs)', 
            fontWeight: 700, 
            color: 'var(--accent-primary)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            textAlign: 'center'
          }}
        >
          Content Strength
        </span>
      </Card>

      {/* Card 3: Formatting Quality */}
      <Card 
        hoverable 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '32px 16px',
          gap: '16px'
        }}
      >
        <ProgressRing score={formatScore} size={88} strokeWidth={8} />
        <span 
          style={{ 
            fontSize: 'var(--text-xs)', 
            fontWeight: 700, 
            color: 'var(--accent-purple)', 
            textTransform: 'uppercase', 
            letterSpacing: '0.08em',
            textAlign: 'center'
          }}
        >
          Layout & Formatting
        </span>
      </Card>
    </div>
  );
};
