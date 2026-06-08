import React from 'react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface SkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rect',
  width = '100%',
  height = '16px',
  style
}) => {
  const getBorderRadius = () => {
    if (variant === 'circle') return '50%';
    if (variant === 'text') return '4px';
    return 'var(--radius-md)';
  };

  return (
    <div
      className="shimmer"
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius: getBorderRadius(),
        opacity: 0.15,
        ...style
      }}
    />
  );
};
