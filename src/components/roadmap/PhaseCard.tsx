import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle, Clock, Play } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ResourceLinks } from './ResourceLinks';
import { Phase } from '../../types';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface PhaseCardProps {
  phase: Phase;
  completed: boolean;
  onToggleComplete: () => void;
}

export const PhaseCard: React.FC<PhaseCardProps> = ({
  phase,
  completed,
  onToggleComplete
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const getTopicLevelBadge = (level: 'Beginner' | 'Intermediate' | 'Advanced') => {
    switch (level) {
      case 'Beginner': return <Badge variant="success">Beginner</Badge>;
      case 'Intermediate': return <Badge variant="info">Intermediate</Badge>;
      case 'Advanced': return <Badge variant="danger">Advanced</Badge>;
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface)',
        border: completed ? '1px solid var(--border-active)' : '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: completed ? 'var(--glow-primary)' : 'none',
        overflow: 'hidden',
        transition: 'all 200ms ease',
        width: '100%'
      }}
    >
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          cursor: 'pointer',
          userSelect: 'none',
          backgroundColor: completed ? 'rgba(0, 212, 170, 0.02)' : 'transparent'
        }}
        className="phase-header"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Completion Checkbox */}
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete();
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '6px',
              border: completed ? '2px solid var(--accent-primary)' : '2px solid var(--text-muted)',
              backgroundColor: completed ? 'var(--accent-primary)' : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#050A0F',
              transition: 'all 150ms ease'
            }}
          >
            {completed && <CheckCircle style={{ width: '14px', height: '14px', strokeWidth: 3 }} />}
          </div>
          
          <div>
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 600, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              {phase.title}
            </h4>
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {phase.weeks}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {completed ? (
            <Badge variant="success">Done</Badge>
          ) : (
            <Badge variant="info">In Progress</Badge>
          )}
          {isOpen ? (
            <ChevronUp style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
          ) : (
            <ChevronDown style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
          )}
        </div>
      </div>

      {/* Expanded details */}
      {isOpen && (
        <div 
          style={{ 
            padding: '24px', 
            borderTop: '1px solid var(--border-subtle)', 
            backgroundColor: 'rgba(5, 10, 15, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            animation: 'fadeIn 250ms ease'
          }}
        >
          {phase.topics.map((topic) => (
            <div 
              key={topic.id}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {topic.name}
                </span>
                {getTopicLevelBadge(topic.level)}
              </div>

              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {topic.description}
              </p>
              
              <div style={{ fontSize: '10px', color: 'var(--accent-primary)', fontWeight: 500, fontStyle: 'italic' }}>
                {topic.whyItMatters}
              </div>

              {topic.resources && topic.resources.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <ResourceLinks resources={topic.resources} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
export default PhaseCard;
