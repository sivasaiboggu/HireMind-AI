import React from 'react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import '../../styles/globals.css';

interface KeywordCloudProps {
  matchedKeywords: string[];
  missingKeywords: string[];
}

export const KeywordCloud: React.FC<KeywordCloudProps> = ({
  matchedKeywords = [],
  missingKeywords = []
}) => {
  const total = matchedKeywords.length + missingKeywords.length;
  const percentage = total > 0 ? Math.round((matchedKeywords.length / total) * 100) : 0;

  return (
    <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      <div>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
          ATS Keyword Analysis
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Identified from target job requirements and industry benchmarks.
        </p>
      </div>

      {/* Percentage Match Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Keyword Match Rate</span>
          <span style={{ color: 'var(--accent-primary)', fontFamily: 'var(--font-numeric)', fontWeight: 700 }}>
            {percentage}%
          </span>
        </div>
        <div style={{ height: '6px', backgroundColor: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', 
              backgroundColor: 'var(--accent-primary)', 
              width: `${percentage}%`,
              borderRadius: '3px',
              transition: 'width 800ms ease'
            }}
          />
        </div>
      </div>

      {/* Matched Keywords */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ✅ Matched Keywords ({matchedKeywords.length})
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {matchedKeywords.length > 0 ? (
            matchedKeywords.map((kw, i) => (
              <Badge key={`match-${i}`} variant="success">
                {kw}
              </Badge>
            ))
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>None identified</span>
          )}
        </div>
      </div>

      {/* Missing Keywords */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          ❌ Missing Keywords ({missingKeywords.length})
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {missingKeywords.length > 0 ? (
            missingKeywords.map((kw, i) => (
              <Badge key={`miss-${i}`} variant="danger">
                {kw}
              </Badge>
            ))
          ) : (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>None missing</span>
          )}
        </div>
      </div>
    </Card>
  );
};
