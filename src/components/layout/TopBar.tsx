import { Bell, LogOut, Moon, Search, Sun, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { safeLocalGet, useAppStore } from '../../store/appStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Brand } from './Brand';
import { Credits } from './Sidebar';
import { GoogleAIKeyConnect } from './GoogleAIKeyConnect';

export function ThemeControl() {
  const { theme, toggleTheme } = useAppStore();
  const label = theme === 'dark' ? 'Use light theme' : 'Use dark theme';
  const Icon = theme === 'dark' ? Sun : Moon;
  return (
    <button type="button" className="icon-control" aria-label={label} title={label} onClick={toggleTheme}>
      <Icon size={18} aria-hidden="true" />
    </button>
  );
}

export function TopBar() {
  const { setSearchOpen, user, profile, signOutUser, getRecentActivity } = useAppStore();
  const [dialog, setDialog] = useState<'account' | 'activity' | null>(null);
  const navigate = useNavigate();
  const activity = getRecentActivity();
  const name = profile?.full_name || (user ? 'Your account' : safeLocalGet('hiremind_guest_name') || 'Guest workspace');
  const role = profile?.target_role || (!user && safeLocalGet('hiremind_guest_role'));

  return (
    <header className="workspace-topbar">
      <div className="mobile-brand"><Brand /></div>
      <span className="workspace-location">{user ? 'Personal workspace' : 'Guest workspace'}</span>
      <div className="topbar-controls">
        <button type="button" className="search-control" onClick={() => setSearchOpen(true)} aria-label="Find a page">
          <Search size={18} aria-hidden="true" /><span>Find a page</span><kbd>Ctrl K</kbd>
        </button>
        <ThemeControl />
        <GoogleAIKeyConnect />
        <button type="button" className="icon-control" aria-label="Activity" title="Activity" onClick={() => setDialog('activity')}>
          <Bell size={18} aria-hidden="true" />
        </button>
        <button type="button" className="icon-control" aria-label="Account" title="Account" onClick={() => setDialog('account')}>
          <UserRound size={18} aria-hidden="true" />
        </button>
      </div>
      <Modal isOpen={dialog === 'activity'} onClose={() => setDialog(null)} title="Activity">
        {activity.length > 0 ? (
          <ul className="activity-list">
            {activity.map((item, index) => (
              <li key={`${item.type}-${item.timestamp}-${index}`}>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>
                <time dateTime={new Date(item.timestamp).toISOString()}>{new Date(item.timestamp).toLocaleDateString()}</time>
              </li>
            ))}
          </ul>
        ) : <p className="muted">Your activity will appear here after you save some work.</p>}
      </Modal>
      <Modal isOpen={dialog === 'account'} onClose={() => setDialog(null)} title="Account">
        <div className="form-stack">
          <div>
            <strong>{name}</strong>
            <p className="muted">{user?.email || 'Work is saved in this browser.'}</p>
            {role && <p className="muted">{role}</p>}
          </div>
          <Credits />
          <Button variant="ghost" icon={<LogOut size={16} aria-hidden="true" />} onClick={async () => {
            setDialog(null);
            await signOutUser();
            navigate('/auth');
          }}>{user ? 'Sign out' : 'Go to sign in'}</Button>
        </div>
      </Modal>
    </header>
  );
}
