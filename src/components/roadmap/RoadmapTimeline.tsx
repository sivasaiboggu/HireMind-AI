import React from 'react';
import { PhaseCard } from './PhaseCard';
import { Phase } from '../../types';
import '../../styles/globals.css';

interface RoadmapTimelineProps {
  phases: Phase[];
  completedPhases: string[];
  onToggleComplete: (phaseId: string) => void;
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({
  phases = [],
  completedPhases = [],
  onToggleComplete
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          position: 'relative',
          paddingLeft: '24px'
        }}
        className="timeline-wrapper"
      >
        {/* Timeline connector line */}
        <div 
          style={{
            position: 'absolute',
            left: '8px',
            top: '24px',
            bottom: '24px',
            width: '2px',
            background: 'linear-gradient(to bottom, var(--accent-purple), var(--accent-primary))',
            opacity: 0.3
          }}
        />

        {phases.map((phase, idx) => {
          const isCompleted = completedPhases.includes(phase.id);
          return (
            <div 
              key={phase.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%'
              }}
            >
              {/* Timeline bubble node marker */}
              <div 
                style={{
                  position: 'absolute',
                  left: '-24px',
                  top: '16px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-base)',
                  border: `3px solid ${isCompleted ? 'var(--accent-primary)' : 'var(--accent-purple)'}`,
                  boxShadow: isCompleted ? 'var(--glow-primary)' : 'none',
                  zIndex: 10,
                  transform: 'translateX(-50%)',
                  transition: 'all 200ms ease'
                }}
              />

              <PhaseCard
                phase={phase}
                completed={isCompleted}
                onToggleComplete={() => onToggleComplete(phase.id)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default RoadmapTimeline;
