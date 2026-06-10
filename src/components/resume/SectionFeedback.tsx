import React, { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { SectionFeedback as ISectionFeedback } from '../../types';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface SectionFeedbackProps {
  sections: ISectionFeedback[];
}

export const SectionFeedback: React.FC<SectionFeedbackProps> = ({ sections }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const toggleSection = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const getStatusBadge = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <Badge variant="success">Pass</Badge>;
      case 'warn':
        return <Badge variant="warning">Improve</Badge>;
      case 'fail':
        return <Badge variant="danger">Fix Required</Badge>;
    }
  };

  const getBulletIcon = (status: 'pass' | 'warn' | 'fail') => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 style={{ width: '16px', height: '16px', color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />;
      case 'warn':
        return <AlertTriangle style={{ width: '16px', height: '16px', color: 'var(--accent-secondary)', flexShrink: 0, marginTop: '2px' }} />;
      case 'fail':
        return <XCircle style={{ width: '16px', height: '16px', color: 'var(--accent-danger)', flexShrink: 0, marginTop: '2px' }} />;
    }
  };

  const getSectionBorderColor = (status: 'pass' | 'warn' | 'fail', isExpanded: boolean) => {
    if (!isExpanded) return 'var(--border-subtle)';
    switch (status) {
      case 'pass': return 'rgba(0, 212, 170, 0.3)';
      case 'warn': return 'rgba(245, 158, 11, 0.3)';
      case 'fail': return 'rgba(244, 63, 94, 0.3)';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Section-by-Section Analysis
      </h3>

      {sections.map((sect, idx) => {
        const isExpanded = expandedIndex === idx;
        return (
          <div
            key={sect.name}
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: `1px solid ${getSectionBorderColor(sect.status, isExpanded)}`,
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              transition: 'all 200ms ease'
            }}
          >
            {/* Header Accordion Bar */}
            <div
              onClick={() => toggleSection(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px 24px',
                cursor: 'pointer',
                userSelect: 'none'
              }}
              className="accordion-header"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {sect.name}
                </span>
                {getStatusBadge(sect.status)}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span 
                  style={{ 
                    fontFamily: 'var(--font-numeric)', 
                    fontSize: 'var(--text-sm)', 
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                  }}
                >
                  {sect.score}/100
                </span>
                {isExpanded ? (
                  <ChevronUp style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
                ) : (
                  <ChevronDown style={{ width: '18px', height: '18px', color: 'var(--text-secondary)' }} />
                )}
              </div>
            </div>

            {/* Expanded Content Panel */}
            {isExpanded && (
              <div 
                style={{ 
                  padding: '0 24px 24px 24px',
                  borderTop: '1px solid var(--border-subtle)',
                  animation: 'fadeIn 250ms ease'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '20px' }}>
                  {sect.feedback.map((point, pIdx) => (
                    <div 
                      key={pIdx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '12px',
                        fontSize: 'var(--text-sm)',
                        color: 'var(--text-secondary)',
                        lineHeight: 1.5
                      }}
                    >
                      {getBulletIcon(sect.status)}
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
export default SectionFeedback;
