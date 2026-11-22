import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  emphasis?: 'primary' | 'secondary' | 'none';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  emphasis = 'none', hoverable = true, className = '', ...props
}) => (
  <div
    className={`panel ${hoverable ? 'panel-interactive' : ''} ${className}`}
    data-emphasis={emphasis}
    {...props}
  />
);
