import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import '../../styles/globals.css';
import '../../styles/animations.css';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  
  const { 
    sidebarCollapsed, 
    setSearchOpen, 
    theme, 
    toggleTheme,
    user,
    profile,
    signOutUser,
    getRecentActivity
  } = useAppStore();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const currentView = location.pathname.substring(1) || 'dashboard';
  
  const recentActivities = getRecentActivity ? getRecentActivity() : [];

  // Close dropdown menus when clicking outside their containers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Helper to display time relative to the current timestamp
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

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOutUser();
    navigate('/auth');
  };

  const getInitials = () => {
    if (profile?.full_name) {
      const parts = profile.full_name.trim().split(' ');
      if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'BS';
  };

  // Dynamic titles
  const getPageTitle = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Career Hub';
      case 'resume':
        return 'Resume Intelligence';
      case 'interview':
        return 'Interview Simulator';
      case 'roadmap':
        return 'Career Roadmap';
      case 'quiz':
        return 'Practice Workspace';
      default:
        return 'Career Hub';
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        right: 0,
        height: 'var(--topbar-height)',
        left: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)',
        zIndex: 40,
        backgroundColor: 'var(--header-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'left 300ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Left Title */}
      <div>
        <h1 
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            fontFamily: 'var(--font-display)',
            color: 'var(--text-primary)'
          }}
        >
          {getPageTitle()}
        </h1>
      </div>

      {/* Search Bar - Center */}
      <div 
        onClick={() => setSearchOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 16px',
          width: '100%',
          maxWidth: '380px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          fontSize: 'var(--text-sm)',
          transition: 'all 200ms ease'
        }}
        className="search-bar-trigger"
      >
        <Search style={{ width: '16px', height: '16px' }} />
        <span style={{ flexGrow: 1, textAlign: 'left' }}>Search features, tools (Ctrl+K)</span>
        <kbd 
          style={{
            fontSize: '10px',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '4px',
            padding: '2px 6px',
            color: 'var(--text-secondary)',
            fontFamily: 'sans-serif'
          }}
        >
          Ctrl K
        </kbd>
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>

        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          style={{
            color: 'var(--text-secondary)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer'
          }}
          className="btn-press"
          title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === 'dark' ? (
            <Sun style={{ width: '18px', height: '18px', color: 'var(--accent-secondary)' }} />
          ) : (
            <Moon style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
          )}
        </button>

        {/* Notification Bell Dropdown Container */}
        <div style={{ position: 'relative' }} ref={bellRef}>
          <button 
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setMenuOpen(false);
            }}
            style={{
              position: 'relative',
              color: 'var(--text-secondary)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
            className="btn-press"
            title="Real-time Notifications"
          >
            <Bell style={{ width: '18px', height: '18px' }} />
            {recentActivities.length > 0 && (
              <span 
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '6px',
                  height: '6px',
                  backgroundColor: 'var(--accent-primary)',
                  borderRadius: '50%'
                }}
              />
            )}
          </button>

          {notificationsOpen && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '320px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Notifications Hub
                </span>
              </div>
              
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {recentActivities.length > 0 ? (
                  recentActivities.slice(0, 5).map((act) => (
                    <div 
                      key={act.id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '2px', 
                        padding: '8px 10px', 
                        borderRadius: 'var(--radius-sm)', 
                        backgroundColor: 'var(--bg-elevated)',
                        borderLeft: `3px solid ${act.type === 'resume' ? 'var(--accent-secondary)' : act.type === 'interview' ? 'var(--accent-primary)' : 'var(--accent-purple)'}`
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {act.title}
                        </span>
                        <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>
                          {formatTime(act.timestamp)}
                        </span>
                      </div>
                      <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>
                        {act.subtitle}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '24px 0', fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    No notifications recorded.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User initials circle with Dropdown menu */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <div 
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--accent-primary)',
              color: 'var(--accent-primary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--glow-primary)',
              cursor: 'pointer',
              userSelect: 'none'
            }}
            title={profile?.full_name || user?.email || "User Profile"}
          >
            {getInitials()}
          </div>

          {menuOpen && (
            <div 
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '240px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                zIndex: 100
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile?.full_name || 'Boggu Sivasai'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || 'guest@hiremind.ai'}
                </span>
                {profile?.target_role && (
                  <span style={{ fontSize: '10px', color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, marginTop: '4px' }}>
                    {profile.target_role}
                  </span>
                )}
              </div>
              
              <div style={{ height: '1px', backgroundColor: 'var(--border-subtle)' }} />

              <button
                onClick={handleSignOut}
                className="btn-press"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--accent-danger)',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  width: '100%',
                  padding: '8px 4px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
                Sign Out Session
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
