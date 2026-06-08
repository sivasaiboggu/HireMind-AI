import React from 'react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'primary' | 'amber' | 'none';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glow = 'none',
  hoverable = true,
  style,
  ...props
}) => {
  const getGlowShadow = () => {
    if (glow === 'primary') return 'var(--glow-primary)';
    if (glow === 'amber') return 'var(--glow-amber)';
    return 'none';
  };

  return (
    <div
      className={hoverable ? 'glass-panel animate-hover-card' : 'glass-panel'}
      style={{
        padding: '24px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        backdropFilter: 'var(--blur-glass)',
        boxShadow: getGlowShadow(),
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
