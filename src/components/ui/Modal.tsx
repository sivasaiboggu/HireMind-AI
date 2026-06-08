import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = '540px'
}) => {
  // Bind escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 10, 15, 0.85)',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        animation: 'fadeIn 200ms ease'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--glow-primary)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'pageFadeUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border-subtle)'
          }}
        >
          {title ? (
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>{title}</h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            style={{
              color: 'var(--text-secondary)',
              padding: '6px',
              backgroundColor: 'transparent',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="btn-press hover:bg-[var(--bg-hover)]"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', maxHeight: 'calc(100vh - 180px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
};
