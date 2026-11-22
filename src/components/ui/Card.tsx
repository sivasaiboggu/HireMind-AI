import React from 'react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Emphasis is a 1px accent-tinted border, never a coloured shadow.
   * The old `glow` prop (lime/mint box-shadow) is gone: a glow reads as
   * decoration on every card that carries it, and the signature idea is
   * the thin lime rule + the number, not a halo. */
  emphasis?: 'primary' | 'secondary' | 'none';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  emphasis = 'none',
  hoverable = true,
  style,
  ...props
}) => {
  const emphasisBorder =
    emphasis === 'primary'
      ? '1px solid var(--accent-primary)'
      : emphasis === 'secondary'
        ? '1px solid var(--accent-secondary)'
        : '1px solid var(--border-subtle)';

  return (
    <div
      className={hoverable ? 'panel animate-hover-card' : 'panel'}
      style={{
        padding: '24px',
        background: 'var(--bg-surface)',
        border: emphasisBorder,
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-depth-1)',
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
