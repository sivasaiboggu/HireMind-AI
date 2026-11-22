import React, { type CSSProperties } from 'react';
import { clamp } from '../../services/numbers';
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
  // The bar, the printed value and the aria value all agree, and none of
  // them can run past the track (or below it) on out-of-range input.
  const safeValue = clamp(value, 0, max);
  const percentage = max > 0 ? clamp((safeValue / max) * 100, 0, 100) : 0;
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
        <span className="numeric" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--text-primary)' }}>
          {safeValue}/{max}
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
        role="progressbar"
        aria-valuenow={safeValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Score'}
      >
        <div
          className="progress-bar-fill"
          style={{
            height: '100%',
            backgroundColor: barColor,
            '--progress': percentage / 100,
            borderRadius: '3px'
          } as CSSProperties}
        />
      </div>
    </div>
  );
};
