import React, { useState, useEffect } from 'react';
import { Lightbulb, FastForward, CheckSquare, MessageSquare } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Question } from '../../types';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface QuestionCardProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onSubmitAnswer: (answer: string) => void;
  onSkip: () => void;
  loading: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onSubmitAnswer,
  onSkip,
  loading
}) => {
  const [answer, setAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);

  // Reset answer when question changes
  useEffect(() => {
    setAnswer('');
    setShowHint(false);
  }, [question]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim() || loading) return;
    onSubmitAnswer(answer);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'technical': return 'success';
      case 'system-design': return 'info';
      case 'behavioral': return 'warning';
      default: return 'info';
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'success';
      case 'medium': return 'warning';
      case 'hard': return 'danger';
      default: return 'info';
    }
  };

  return (
    <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', padding: '32px' }}>
      
      {/* Header status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 700, 
              backgroundColor: 'var(--bg-elevated)', 
              border: '1px solid var(--border-subtle)',
              borderRadius: '4px',
              padding: '4px 8px',
              color: 'var(--accent-primary)',
              fontFamily: 'var(--font-numeric)'
            }}
          >
            QUESTION {currentIndex} OF {totalQuestions}
          </span>
          <Badge variant={getCategoryColor(question.category)}>
            {question.category}
          </Badge>
        </div>
        <Badge variant={getDifficultyColor(question.difficulty)}>
          {question.difficulty}
        </Badge>
      </div>

      {/* Question Text */}
      <div style={{ padding: '8px 0' }}>
        <h3 
          style={{ 
            fontSize: 'var(--text-xl)', 
            fontWeight: 500, 
            fontFamily: 'var(--font-display)',
            lineHeight: 1.4,
            color: 'var(--text-primary)'
          }}
        >
          {question.text}
        </h3>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
          <textarea
            rows={12}
            required
            disabled={loading}
            placeholder="Type your response here..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{
              fontSize: 'var(--text-sm)',
              lineHeight: 1.6,
              padding: '20px',
              backgroundColor: 'var(--bg-elevated)'
            }}
          />
          <div 
            style={{ 
              position: 'absolute', 
              bottom: '12px', 
              right: '16px', 
              fontSize: '10px', 
              color: 'var(--text-muted)',
              fontWeight: 600
            }}
          >
            {answer.length} Characters
          </div>
        </div>

        {/* Hints panel */}
        {showHint && (
          <div
            style={{
              padding: '16px',
              backgroundColor: 'rgba(0, 212, 170, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              lineHeight: 1.5,
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            className="fade-in"
          >
            <Lightbulb style={{ width: '14px', height: '14px', flexShrink: 0 }} />
            <span>
              <strong>Focus Areas:</strong> Consider explaining: {question.expectedTopics.join(', ')}
            </span>
          </div>
        )}

        {/* Buttons Dock */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', gap: '12px' }}>
            <Button
              type="button"
              variant="subtle"
              onClick={() => setShowHint(!showHint)}
              icon={<Lightbulb style={{ width: '16px', height: '16px' }} />}
            >
              Hint
            </Button>
            
            <Button
              type="button"
              variant="subtle"
              onClick={onSkip}
              disabled={loading}
              icon={<FastForward style={{ width: '16px', height: '16px' }} />}
            >
              Skip
            </Button>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading || !answer.trim()}
            icon={<CheckSquare style={{ width: '16px', height: '16px' }} />}
          >
            Submit Answer
          </Button>
        </div>
      </form>
      
    </Card>
  );
};
