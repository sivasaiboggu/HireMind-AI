import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Mic, Map, Calendar, AlertCircle, Award, Zap } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { Card } from '../ui/Card';
import '../../styles/globals.css';
import '../../styles/animations.css';

export const RecentActivity: React.FC = () => {
  const { getRecentActivity } = useAppStore();
  const navigate = useNavigate();
  const activities = getRecentActivity();

  // Helper to format timestamps relative to current time
  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getActivityIcon = (type: 'resume' | 'interview' | 'roadmap' | 'quiz') => {
    switch (type) {
      case 'resume':
        return <FileText style={{ width: '14px', height: '14px', color: 'var(--accent-secondary)' }} />;
      case 'interview':
        return <Mic style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />;
      case 'roadmap':
        return <Map style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />;
      case 'quiz':
        return <Award style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />;
    }
  };

  const getBorderColor = (type: 'resume' | 'interview' | 'roadmap' | 'quiz') => {
    switch (type) {
      case 'resume': return 'var(--accent-secondary)';
      case 'interview': return 'var(--accent-primary)';
      case 'roadmap': return 'var(--accent-purple)';
      case 'quiz': return 'var(--accent-purple)';
    }
  };

  return (
    <Card hoverable={false} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Recent Activities</h3>
        <Calendar style={{ width: '18px', height: '18px', color: 'var(--text-muted)' }} />
      </div>

      {activities.length > 0 ? (
        <div 
          style={{ 
            position: 'relative', 
            paddingLeft: '20px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px',
            flexGrow: 1
          }}
        >
          {/* Vertical timeline line */}
          <div 
            style={{
              position: 'absolute',
              left: '6px',
              top: '8px',
              bottom: '8px',
              width: '1px',
              backgroundColor: 'var(--border-subtle)',
              zIndex: 0
            }}
          />

          {activities.slice(0, 5).map((act) => (
            <div 
              key={act.id} 
              style={{ 
                position: 'relative', 
                zIndex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '4px' 
              }}
            >
              {/* Timeline marker */}
              <div 
                style={{
                  position: 'absolute',
                  left: '-20px',
                  top: '4px',
                  width: '13px',
                  height: '13px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-surface)',
                  border: `2px solid ${getBorderColor(act.type)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {act.title}
                </span>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {formatTime(act.timestamp)}
                </span>
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                {act.subtitle}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Illustrated Empty State */
        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '40px 0',
            textAlign: 'center',
            flexGrow: 1,
            gap: '16px'
          }}
        >
          <svg 
            width="80" 
            height="80" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="var(--text-muted)" 
            strokeWidth="1.5" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            style={{ opacity: 0.4 }}
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--text-secondary)' }}>
            No activities recorded yet
          </div>
          <button 
            onClick={() => navigate('/resume')}
            style={{
              fontSize: '11px',
              color: 'var(--accent-primary)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer'
            }}
            className="btn-press"
          >
            <Zap style={{ width: '12px', height: '12px' }} />
            Analyze a Resume to Start
          </button>
        </div>
      )}
    </Card>
  );
};
