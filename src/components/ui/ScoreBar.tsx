import React, { useEffect, useState } from 'react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ScoreBarProps {
  value: number; // 0-10 or 0-100
  max?: number;  // 10 or 100
  label?: string;
}

export const ScoreBar: React.FC<ScoreBarProps> = ({
  value,
  max = 10,
  label
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  const getColor = (pct: number) => {
    if (pct >= 80) return 'var(--accent-primary)';
    if (pct >= 60) return 'var(--accent-secondary)';
    return 'var(--accent-danger)';
  };

  const barColor = getColor(percentage);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {label && (
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {label}
          </span>
        )}
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--text-primary)' }}>
          {value}/{max}
        </span>
      </div>

      <div 
        style={{
          height: '6px',
          backgroundColor: 'var(--bg-elevated)',
          borderRadius: '3px',
          overflow: 'hidden',
          width: '100%',
          position: 'relative'
        }}
      >
        <div
          className="progress-bar-fill"
          style={{
            height: '100%',
            backgroundColor: barColor,
            width: `${width}%`,
            borderRadius: '3px'
          }}
        />
      </div>
    </div>
  );
};
