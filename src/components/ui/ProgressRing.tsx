import React from 'react';
import { useCountUp } from '../../hooks/useCountUp';
import '../../styles/globals.css';

interface ProgressRingProps {
  score: number; // 0 to 100
  size?: number; // width/height in px
  strokeWidth?: number;
  label?: string;
  animate?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  score,
  size = 96,
  strokeWidth = 8,
  label,
  animate = true
}) => {
  const animatedScore = animate ? useCountUp(score, 1200) : score;
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Dynamic colors: cyan > 80, amber 60-80, rose < 60
  const getRingColor = (val: number) => {
    if (val >= 80) return 'var(--accent-primary)';
    if (val >= 60) return 'var(--accent-secondary)';
    return 'var(--accent-danger)';
  };

  const ringColor = getRingColor(score);

  return (
    <div 
      style={{ 
        display: 'inline-flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative',
        width: `${size}px`,
        height: `${size}px`
      }}
    >
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Background track circle */}
        <circle
          stroke="var(--bg-elevated)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground dynamic circle */}
        <circle
          stroke={ringColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            transition: 'stroke-dashoffset 800ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 300ms ease'
          }}
        />
      </svg>
      
      {/* Center content */}
      <div 
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <span 
          style={{
            fontSize: size > 80 ? 'var(--text-2xl)' : 'var(--text-sm)',
            fontWeight: 700,
            fontFamily: 'var(--font-numeric)',
            color: 'var(--text-primary)',
            lineHeight: 1
          }}
        >
          {animatedScore}
        </span>
        {label && (
          <span 
            style={{
              fontSize: '8px',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '4px'
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
