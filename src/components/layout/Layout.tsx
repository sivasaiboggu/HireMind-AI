import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore, AppView, Toast } from '../../store/appStore';
import { 
  X, 
  Search, 
  LayoutDashboard, 
  FileText, 
  Mic, 
  Map, 
  Menu,
  CheckCircle,
  AlertTriangle,
  Info,
  BookOpen
} from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    sidebarCollapsed, 
    setSidebarCollapsed, 
    searchOpen, 
    setSearchOpen,
    toasts,
    removeToast 
  } = useAppStore();

  const location = useLocation();
  const navigate = useNavigate();

  const currentView = (location.pathname.substring(1) || 'dashboard') as AppView;

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Track window size
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      } else if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      } else {
        setSidebarCollapsed(false);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // run initially
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  // Bind Ctrl+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(!searchOpen);
      }
      if (e.key === 'Escape') {
        setSearchOpen(false);
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchOpen, setSearchOpen]);

  const isMobile = windowWidth < 768;

  // Command palette navigation options
  const searchItems = [
    { label: 'Dashboard Overview', desc: 'Main control center and career metrics', view: 'dashboard' as AppView, icon: LayoutDashboard },
    { label: 'Resume Analyzer', desc: 'Check resume against ATS requirements', view: 'resume' as AppView, icon: FileText },
    { label: 'Interview Practice', desc: 'Launch mock interview simulation', view: 'interview' as AppView, icon: Mic },
    { label: 'Learning Roadmap', desc: 'Create step-by-step career milestones', view: 'roadmap' as AppView, icon: Map },
    { label: 'Quiz Practice', desc: 'Take technical and coding practice tests', view: 'quiz' as AppView, icon: BookOpen },
  ];

  const filteredSearchItems = searchItems.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchNavigate = (targetView: AppView) => {
    navigate('/' + targetView);
    setSearchOpen(false);
    setSearchQuery('');
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
        display: 'flex',
        position: 'relative'
      }}
    >
      {/* Background aesthetics */}
      <div className="app-grid-bg" />
      <div className="app-mesh-glow" />

      {/* Responsive Navigation Shell */}
      {!isMobile && <Sidebar />}

      <div 
        style={{
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)'),
          transition: 'margin-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          minWidth: 0 // Prevents flex child overflow
        }}
      >
        {/* Mobile Header */}
        {isMobile ? (
          <header
            style={{
              height: 'var(--topbar-height)',
              backgroundColor: 'var(--bg-surface)',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 16px',
              position: 'sticky',
              top: 0,
              zIndex: 40
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div 
                className="flex-center"
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-purple))',
                  color: '#050A0F',
                  fontWeight: 700,
                  fontSize: '12px'
                }}
              >
                H
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, letterSpacing: '-0.02em' }}>HireMind</span>
            </div>
            
            <button 
              onClick={() => setMobileMenuOpen(true)}
              style={{ color: 'var(--text-primary)', padding: '8px' }}
            >
              <Menu style={{ width: '20px', height: '20px' }} />
            </button>
          </header>
        ) : (
          <TopBar />
        )}

        {/* Page Content */}
        <main style={{ flexGrow: 1 }} className="page-enter">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      {isMobile && (
        <nav
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '60px',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 40,
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          {searchItems.map(item => {
            const Icon = item.icon;
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => navigate('/' + item.view)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  padding: '8px',
                  backgroundColor: 'transparent'
                }}
              >
                <Icon style={{ width: '20px', height: '20px' }} />
              </button>
            );
          })}
        </nav>
      )}

      {/* Mobile Fullscreen Menu Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--bg-base)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            padding: '24px',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '1.25rem' }}>Menu</span>
            <button onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--text-primary)' }}>
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {searchItems.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.view;
              return (
                <button
                  key={item.view}
                  onClick={() => {
                    navigate('/' + item.view);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '1.125rem',
                    color: isActive ? 'var(--accent-primary)' : 'var(--text-primary)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: isActive ? 'var(--bg-hover)' : 'transparent',
                    textAlign: 'left'
                  }}
                >
                  <Icon style={{ width: '24px', height: '24px' }} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Global Toast Notifications */}
      <div
        style={{
          position: 'fixed',
          bottom: isMobile ? '80px' : '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          maxWidth: '360px',
          width: 'calc(100% - 48px)'
        }}
      >
        {toasts.map((toast: Toast) => {
          let Icon = Info;
          let color = 'var(--accent-primary)';
          let border = '1px solid var(--border-subtle)';
          
          if (toast.type === 'success') {
            Icon = CheckCircle;
            color = 'var(--accent-primary)';
            border = '1px solid rgba(0, 212, 170, 0.3)';
          } else if (toast.type === 'error') {
            Icon = X;
            color = 'var(--accent-danger)';
            border = '1px solid rgba(244, 63, 94, 0.3)';
          } else if (toast.type === 'info') {
            Icon = AlertTriangle;
            color = 'var(--accent-secondary)';
            border = '1px solid rgba(245, 158, 11, 0.3)';
          }

          return (
            <div
              key={toast.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                border,
                backgroundColor: 'var(--bg-surface)',
                backdropFilter: 'blur(8px)',
                color: 'var(--text-primary)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                transform: 'translateY(0)',
                animation: 'slideInRight 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Toast Left Accent indicator */}
              <div 
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  backgroundColor: color
                }}
              />

              <Icon style={{ width: '18px', height: '18px', color, flexShrink: 0, marginTop: '2px' }} />
              
              <div style={{ flexGrow: 1, fontSize: 'var(--text-sm)', fontWeight: 500, lineHeight: 1.4, paddingRight: '12px' }}>
                {toast.message}
              </div>

              <button 
                onClick={() => removeToast(toast.id)}
                style={{
                  color: 'var(--text-muted)',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'transparent'
                }}
              >
                <X style={{ width: '14px', height: '14px' }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Ctrl+K Global Search / Command Palette Modal */}
      {searchOpen && (
        <div
          onClick={() => setSearchOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'var(--modal-overlay)',
            backdropFilter: 'blur(12px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '80px 24px',
            animation: 'fadeIn 200ms ease'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '600px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-active)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--glow-primary)',
              overflow: 'hidden',
              animation: 'pageFadeUp 300ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
            }}
          >
            {/* Input Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-subtle)'
              }}
            >
              <Search style={{ width: '20px', height: '20px', color: 'var(--accent-primary)' }} />
              <input
                autoFocus
                type="text"
                placeholder="Type a feature name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  padding: 0,
                  fontSize: 'var(--text-md)',
                  color: 'var(--text-primary)',
                  boxShadow: 'none',
                  flexGrow: 1
                }}
              />
              <button 
                onClick={() => setSearchOpen(false)}
                style={{
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  backgroundColor: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px',
                  padding: '4px 8px'
                }}
              >
                ESC
              </button>
            </div>

            {/* Results list */}
            <div style={{ padding: '8px', maxHeight: '380px', overflowY: 'auto' }}>
              <div 
                style={{ 
                  fontSize: '10px', 
                  fontWeight: 700, 
                  color: 'var(--text-muted)', 
                  letterSpacing: '0.05em', 
                  padding: '8px 12px 4px 12px',
                  textTransform: 'uppercase'
                }}
              >
                Tools & Features
              </div>

              {filteredSearchItems.length > 0 ? (
                filteredSearchItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.view}
                      onClick={() => handleSearchNavigate(item.view)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        padding: '12px',
                        borderRadius: 'var(--radius-md)',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                      className="command-item hover:bg-[var(--bg-hover)]"
                    >
                      <div 
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--accent-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Icon style={{ width: '18px', height: '18px' }} />
                      </div>
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No results matching your query.
                </div>
              )}
            </div>
            
            {/* Command Palette Footer */}
            <div 
              style={{
                backgroundColor: 'rgba(5, 10, 15, 0.3)',
                padding: '12px 20px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '10px',
                color: 'var(--text-secondary)',
                display: 'flex',
                gap: '16px'
              }}
            >
              <span>↑↓ Navigation</span>
              <span>↵ Enter to select</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
