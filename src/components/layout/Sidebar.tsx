import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Mic, 
  Map, 
  ChevronLeft, 
  ChevronRight, 
  Coins,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { useAppStore, AppView } from '../../store/appStore';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface NavItem {
  id: AppView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const Sidebar: React.FC = () => {
  const { 
    sidebarCollapsed, 
    toggleSidebar, 
    credits, 
    resetCredits,
    user
  } = useAppStore();

  const location = useLocation();
  const navigate = useNavigate();

  const currentView = (location.pathname.substring(1) || 'dashboard') as AppView;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'resume', label: 'Resume Analyzer', icon: FileText },
    { id: 'interview', label: 'Interview Prep', icon: Mic },
    { id: 'roadmap', label: 'Learning Path', icon: Map },
    { id: 'quiz', label: 'Practice', icon: BookOpen },
  ];

  return (
    <aside 
      className="sidebar-container"
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 50,
        width: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Sidebar Left Gradient Accent */}
      <div 
        className="sidebar-glow-bar"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          background: 'linear-gradient(to bottom, var(--accent-primary), transparent)',
          opacity: 0.8
        }}
      />

      {/* Header Logo */}
      <div 
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          padding: sidebarCollapsed ? '0 18px' : '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          gap: '12px'
        }}
      >
        <div 
          className="flex-center"
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
            color: '#050A0F',
            fontWeight: 700,
            flexShrink: 0
          }}
        >
          H
        </div>
        {!sidebarCollapsed && (
          <span 
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: '1.25rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            HireMind
            <span 
              className="logo-pulse-dot"
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                display: 'inline-block'
              }}
            />
          </span>
        )}
      </div>

      {/* Navigation List */}
      <nav 
        style={{
          flexGrow: 1,
          padding: '24px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate('/' + item.id)}
              className="btn-press"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: sidebarCollapsed ? '0' : '16px',
                padding: '12px',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                transition: 'all 200ms ease',
                position: 'relative'
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon 
                className="nav-icon"
                style={{
                  width: '20px',
                  height: '20px',
                  flexShrink: 0,
                  color: isActive ? 'var(--accent-primary)' : 'inherit'
                }} 
              />
              {!sidebarCollapsed && (
                <span 
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: isActive ? 600 : 500,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Credits Section */}
      <div 
        style={{
          padding: sidebarCollapsed ? '12px' : '20px',
          borderTop: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--panel-bg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          overflow: 'hidden'
        }}
      >
        {sidebarCollapsed ? (
          <div 
            className="flex-center"
            style={{
              flexDirection: 'column',
              gap: '4px',
              cursor: 'pointer'
            }}
            onClick={resetCredits}
            title={user ? `Credits: ${credits} left - Click to sync from server` : `Credits: ${credits}% - Click to refill to 100`}
          >
            <Coins style={{ width: '16px', height: '16px', color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 700 }}>
              {credits}
            </span>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Coins style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                AI CREDITS
              </span>
              <button 
                onClick={resetCredits}
                title={user ? "Sync Credits from Database" : "Refresh Credits to 100"}
                style={{
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                className="btn-press"
              >
                <RefreshCw style={{ width: '12px', height: '12px', hover: { color: 'var(--accent-primary)' } }} />
              </button>
            </div>
            
            <div style={{ width: '100%' }}>
              <div 
                style={{
                  height: '6px',
                  backgroundColor: 'var(--bg-elevated)',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  width: '100%',
                  position: 'relative'
                }}
              >
                <div 
                  style={{
                    height: '100%',
                    backgroundColor: 'var(--accent-primary)',
                    width: `${credits}%`,
                    borderRadius: '3px',
                    transition: 'width 500ms ease-in-out'
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px', fontWeight: 600 }}>
                <span>{credits} Left</span>
                <span>100 Limit</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toggle Collapse Button */}
      <button
        onClick={toggleSidebar}
        style={{
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-secondary)',
          width: '100%',
          backgroundColor: 'var(--collapse-bg)'
        }}
        className="btn-press"
      >
        {sidebarCollapsed ? (
          <ChevronRight style={{ width: '18px', height: '18px' }} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-xs)', fontWeight: 600 }}>
            <ChevronLeft style={{ width: '18px', height: '18px' }} />
            Collapse Sidebar
          </div>
        )}
      </button>
    </aside>
  );
};
