import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { navigation } from './navigation';
import { Brand } from './Brand';

export function Credits({ compact = false }: { compact?: boolean }) {
  const { credits, resetCredits, user } = useAppStore();
  const action = user ? 'Sync AI credits' : 'Refill AI credits';
  return (
    <div className={compact ? 'credit-ledger credit-compact' : 'credit-ledger'}>
      {!compact && <span className="meta-label">AI credits</span>}
      <div className="credit-total">
        <strong className="numeric" aria-label={`${credits} AI credits`}>{credits}</strong>
        <button type="button" className="icon-control" aria-label={action} title={action} onClick={resetCredits}>
          <RefreshCw size={15} aria-hidden="true" />
        </button>
      </div>
      {!compact && <small>{user ? 'Account balance' : 'Available in this browser'}</small>}
    </div>
  );
}

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const CollapseIcon = sidebarCollapsed ? ChevronRight : ChevronLeft;
  return (
    <aside className="workspace-sidebar" data-collapsed={sidebarCollapsed}>
      <div className="sidebar-brand"><Brand compact={sidebarCollapsed} /></div>
      <nav className="sidebar-nav" aria-label="Workspace">
        {!sidebarCollapsed && <p className="meta-label">Workspace</p>}
        {navigation.map(({ path, label, icon: Icon }) => (
          <NavLink key={path} to={path} className="nav-entry" aria-label={label} title={sidebarCollapsed ? label : undefined}>
            <Icon size={19} aria-hidden="true" />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <Credits compact={sidebarCollapsed} />
        <button
          type="button"
          className="collapse-control"
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <CollapseIcon size={18} aria-hidden="true" />
          {!sidebarCollapsed && 'Collapse sidebar'}
        </button>
      </div>
    </aside>
  );
}
