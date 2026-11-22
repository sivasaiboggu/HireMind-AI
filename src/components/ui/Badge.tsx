import React from 'react';
import '../../styles/globals.css';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  style
}) => {
  const getBadgeColors = () => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'rgba(198, 242, 78, 0.1)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(198, 242, 78, 0.2)'
        };
      case 'warning':
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent-warning) 10%, transparent)',
          color: 'var(--accent-warning)',
          border: '1px solid color-mix(in srgb, var(--accent-warning) 20%, transparent)'
        };
      case 'danger':
        return {
          backgroundColor: 'color-mix(in srgb, var(--accent-danger) 10%, transparent)',
          color: 'var(--accent-danger)',
          border: '1px solid color-mix(in srgb, var(--accent-danger) 20%, transparent)'
        };
      case 'info':
        // Mint, not indigo: the old rgba(129, 140, 248, …) was the last
        // purple-blue remnant in the app. Info badges read as labels.
        return {
          backgroundColor: 'rgba(139, 233, 200, 0.1)',
          color: 'var(--accent-purple)',
          border: '1px solid rgba(139, 233, 200, 0.2)'
        };
    }
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '10px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1,
        // Badges are labels, not sentences: "HIGH PRIORITY" wrapped mid-word
        // in the recommendations column and read as two broken chips.
        whiteSpace: 'nowrap',
        ...getBadgeColors(),
        ...style
      }}
    >
      {children}
    </span>
  );
};
