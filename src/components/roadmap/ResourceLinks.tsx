import React from 'react';
import { Video, BookOpen, Terminal, CheckCircle2, ExternalLink } from 'lucide-react';
import { Resource } from '../../types';
import '../../styles/globals.css';

interface ResourceLinksProps {
  resources: Resource[];
}

export const ResourceLinks: React.FC<ResourceLinksProps> = ({ resources }) => {
  const getResourceIcon = (type: 'video' | 'article' | 'project' | 'quiz') => {
    switch (type) {
      case 'video':
        return <Video style={{ width: '14px', height: '14px', color: 'var(--accent-secondary)' }} />;
      case 'article':
        return <BookOpen style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />;
      case 'project':
        return <Terminal style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />;
      case 'quiz':
        return <CheckCircle2 style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Curated Study Materials
      </span>
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '8px' 
        }}
      >
        {resources.map((res, idx) => (
          <a
            key={idx}
            href={res.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              textDecoration: 'none',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 500,
              transition: 'all 200ms ease'
            }}
            className="resource-link hover:border-[var(--border-active)] hover:text-white"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {getResourceIcon(res.type)}
              <span>{res.title}</span>
            </div>
            <ExternalLink style={{ width: '10px', height: '10px', flexShrink: 0, color: 'var(--text-muted)' }} />
          </a>
        ))}
      </div>
    </div>
  );
};
export default ResourceLinks;
