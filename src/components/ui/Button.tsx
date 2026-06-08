import React from 'react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  loading = false,
  icon,
  style,
  disabled,
  ...props
}) => {
  const getStyles = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      padding: '12px 20px',
      borderRadius: 'var(--radius-md)',
      fontSize: 'var(--text-sm)',
      fontWeight: 600,
      fontFamily: 'var(--font-body)',
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.6 : 1,
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      userSelect: 'none',
      border: '1px solid transparent',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    };

    switch (variant) {
      case 'primary':
        return {
          ...base,
          backgroundColor: 'var(--accent-primary)',
          color: '#050A0F',
          boxShadow: 'var(--glow-primary)',
          hover: { brightness: 1.1 }
        };
      case 'ghost':
        return {
          ...base,
          backgroundColor: 'transparent',
          border: '1px solid var(--accent-primary)',
          color: 'var(--accent-primary)'
        };
      case 'danger':
        return {
          ...base,
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          border: '1px solid var(--accent-danger)',
          color: 'var(--accent-danger)'
        };
      case 'subtle':
        return {
          ...base,
          backgroundColor: 'var(--bg-hover)',
          color: 'var(--text-secondary)'
        };
    }
  };

  return (
    <button
      disabled={disabled || loading}
      className={`btn-press ${variant}-button`}
      style={{
        ...getStyles(),
        ...style
      }}
      {...props}
    >
      {loading && (
        <span 
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            display: 'inline-block',
            animation: 'spinBrain 1s linear infinite',
            flexShrink: 0
          }}
        />
      )}
      {!loading && icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      {children}
    </button>
  );
};
