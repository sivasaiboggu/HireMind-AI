import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', loading = false, icon, disabled, className = '', type = 'button', ...props
}) => (
  <button
    type={type}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`button ${variant}-button ${className}`}
    {...props}
  >
    {loading ? <span className="busy-mark" aria-hidden="true" /> : icon}
    {children}
  </button>
);
