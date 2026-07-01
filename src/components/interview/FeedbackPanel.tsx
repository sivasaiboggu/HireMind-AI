import React, { useState } from 'react';
import { Award, Check, AlertTriangle, ChevronDown, ChevronUp, ArrowRight, Lightbulb } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ScoreBar } from '../ui/ScoreBar';
import { ProgressRing } from '../ui/ProgressRing';
import { AnswerFeedback } from '../../types';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface FeedbackPanelProps {
  feedback: AnswerFeedback;
  onNext: () => void;
  isLastQuestion: boolean;
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({
  feedback,
  onNext,
  isLastQuestion
}) => {
  const [modelOpen, setModelOpen] = useState(false);

  return (
    <div className="slide-in-right" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
          alignItems: 'start'
        }}
        className="feedback-grid-cols"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .feedback-grid-cols {
              grid-template-columns: 5fr 7fr !important;
            }
          }
        `}} />

        {/* Column 1: Scores and Ring */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px', gap: '16px' }}>
            <ProgressRing score={feedback.overallScore * 10} size={100} strokeWidth={8} label="Overall Score" />
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Evaluation Complete
            </span>
          </Card>

          {/* Subscores Grid */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ScoreBar label="Technical Accuracy" value={feedback.accuracy} max={10} />
            <ScoreBar label="Clarity & Communication" value={feedback.clarity} max={10} />
            <ScoreBar label="Depth of Answer" value={feedback.depth} max={10} />
            <ScoreBar label="Use of Examples (STAR)" value={feedback.examples} max={10} />
          </Card>
        </div>

        {/* Column 2: Details feedback */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Strengths and Improvements */}
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Strengths */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check style={{ width: '14px', height: '14px' }} /> What you did well
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feedback.strengths.map((str, idx) => (
                  <div key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 'bold' }}>✓</span>
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

            {/* Improvements */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle style={{ width: '14px', height: '14px' }} /> Key Areas to improve
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {feedback.improvements.map((imp, idx) => (
                  <div key={idx} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'flex-start', gap: '8px', lineHeight: 1.4 }}>
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold' }}>•</span>
                    <span>{imp}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Model Answer Accordion */}
          <div 
            style={{ 
              backgroundColor: 'var(--bg-surface)', 
              border: '1px solid var(--border-subtle)', 
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => setModelOpen(!modelOpen)}
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                userSelect: 'none'
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                View Model Reference Answer
              </span>
              {modelOpen ? (
                <ChevronUp style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
              ) : (
                <ChevronDown style={{ width: '16px', height: '16px', color: 'var(--text-secondary)' }} />
              )}
            </div>

            {modelOpen && (
              <div 
                style={{ 
                  padding: '0 20px 20px 20px', 
                  borderTop: '1px solid var(--border-subtle)', 
                  fontSize: 'var(--text-xs)', 
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  paddingTop: '16px',
                  fontStyle: 'italic',
                  backgroundColor: 'rgba(5, 10, 15, 0.2)'
                }}
              >
                "{feedback.modelAnswer}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <Button
        variant="primary"
        onClick={onNext}
        icon={<ArrowRight style={{ width: '16px', height: '16px' }} />}
        style={{ alignSelf: 'flex-end', padding: '12px 24px', width: 'fit-content' }}
      >
        {isLastQuestion ? 'Complete Assessment & View Summary' : 'Proceed to Next Question'}
      </Button>

    </div>
  );
};
