import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Search, Bell, Sun, Moon, Award, Activity } from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import '../../styles/globals.css';
import '../../styles/animations.css';

export const TopBar: React.FC = () => {
  const { sidebarCollapsed, setSearchOpen, theme, toggleTheme } = useAppStore();
  const location = useLocation();

  const currentView = location.pathname.substring(1) || 'dashboard';

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
        {/* Real-time Status Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(0, 212, 170, 0.05)',
            border: '1px solid rgba(0, 212, 170, 0.15)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            color: 'var(--accent-primary)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}
          title="Gemini API endpoint synced in real time"
        >
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
          API LIVE
        </div>

        {/* Pro Badge */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 10px',
            color: 'var(--accent-secondary)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.05em'
          }}
        >
          <Award style={{ width: '12px', height: '12px' }} />
          PRO
        </div>

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

        {/* Notification Bell */}
        <button 
          style={{
            position: 'relative',
            color: 'var(--text-secondary)',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)'
          }}
          className="btn-press"
        >
          <Bell style={{ width: '18px', height: '18px' }} />
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
        </button>

        {/* User initials circle */}
        <div 
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
            cursor: 'pointer'
          }}
          title="Boggu Sivasai"
        >
          BS
        </div>
      </div>
    </header>
  );
};
