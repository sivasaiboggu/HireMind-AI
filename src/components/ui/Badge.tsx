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
          backgroundColor: 'rgba(0, 212, 170, 0.1)',
          color: 'var(--accent-primary)',
          border: '1px solid rgba(0, 212, 170, 0.2)'
        };
      case 'warning':
        return {
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          color: 'var(--accent-secondary)',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        };
      case 'danger':
        return {
          backgroundColor: 'rgba(244, 63, 94, 0.1)',
          color: 'var(--accent-danger)',
          border: '1px solid rgba(244, 63, 94, 0.2)'
        };
      case 'info':
        return {
          backgroundColor: 'rgba(129, 140, 248, 0.1)',
          color: 'var(--accent-purple)',
          border: '1px solid rgba(129, 140, 248, 0.2)'
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
        ...getBadgeColors(),
        ...style
      }}
    >
      {children}
    </span>
  );
};
