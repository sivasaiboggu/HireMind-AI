import React, { useState } from 'react';
import '../../styles/globals.css';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top'
}) => {
  const [active, setActive] = useState(false);

  const getTooltipPosition = () => {
    switch (position) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(-8px)'
        };
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) translateY(8px)'
        };
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(-8px)'
        };
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) translateX(8px)'
        };
    }
  };

  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setActive(true)}
      onMouseLeave={() => setActive(false)}
    >
      {children}
      {active && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1000,
            padding: '8px 12px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-active)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: '10px',
            fontWeight: 500,
            lineHeight: 1.2,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            ...getTooltipPosition()
          }}
          className="fade-in"
        >
          {content}
        </div>
      )}
    </div>
  );
};
