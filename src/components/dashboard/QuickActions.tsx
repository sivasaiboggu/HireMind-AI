import React from 'react';
import { FileText, Mic, Map, ArrowRight } from 'lucide-react';
import { Card } from '../ui/Card';
import { useAppStore, AppView } from '../../store/appStore';
import '../../styles/globals.css';
import '../../styles/animations.css';

export const QuickActions: React.FC = () => {
  const { setView } = useAppStore();

  const actions = [
    {
      title: 'Analyze Resume',
      desc: 'Get immediate ATS scores and section-by-section improvements.',
      view: 'resume' as AppView,
      icon: FileText,
      color: 'var(--accent-secondary)'
    },
    {
      title: 'Practice Interview',
      desc: 'Simulate high-stakes role assessments with real-time feedback.',
      view: 'interview' as AppView,
      icon: Mic,
      color: 'var(--accent-primary)'
    },
    {
      title: 'Build Roadmap',
      desc: 'Generate custom learning pathways tailored to market demand.',
      view: 'roadmap' as AppView,
      icon: Map,
      color: 'var(--accent-purple)'
    }
  ];

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        width: '100%'
      }}
    >
      {actions.map((act) => {
        const Icon = act.icon;
        return (
          <Card 
            key={act.view} 
            onClick={() => setView(act.view)}
            style={{ 
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '180px',
              padding: '24px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div 
                style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  backgroundColor: 'var(--bg-elevated)', 
                  color: act.color,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Icon style={{ width: '24px', height: '24px' }} />
              </div>
              <div 
                className="flex-center btn-press"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)'
                }}
              >
                <ArrowRight style={{ width: '16px', height: '16px' }} />
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                {act.title}
              </h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {act.desc}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
