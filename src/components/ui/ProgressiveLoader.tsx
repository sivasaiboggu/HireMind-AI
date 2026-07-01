import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ProgressiveLoaderProps {
  messages: string[];
  subtitle?: string;
  intervalMs?: number;
  iconColor?: string;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  messages,
  subtitle = 'Evaluating structural parameters, keyword compliance benchmarks, and strategic alignment goals.',
  intervalMs = 2200,
  iconColor = 'var(--accent-primary)'
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (messages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx(prev => (prev + 1) % messages.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [messages, intervalMs]);

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px 0',
        textAlign: 'center',
        gap: '16px',
        width: '100%'
      }}
    >
      <Activity className="rotating-brain" style={{ width: '48px', height: '48px', color: iconColor }} />
      <div 
        className="typing-cursor"
        style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: iconColor, letterSpacing: '0.05em', minHeight: '24px' }}
      >
        {messages[currentIdx]}
      </div>
      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto', lineHeight: 1.5 }}>
        {subtitle}
      </p>
    </div>
  );
};
