import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Info, Search, X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { navigation } from './navigation';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/appStore';

function CommandPalette() {
  const { searchOpen, setSearchOpen } = useAppStore();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const search = useRef<HTMLInputElement>(null);
  const results = navigation.filter(({ label, detail }) => `${label} ${detail}`.toLowerCase().includes(query.trim().toLowerCase()));

  function close() {
    setSearchOpen(false);
  }

  function select(path: string) {
    navigate(path);
    close();
  }

  useEffect(() => {
    function shortcut(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(!useAppStore.getState().searchOpen);
      }
    }
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [setSearchOpen]);

  useEffect(() => {
    if (searchOpen) {
      setQuery('');
      setIndex(0);
      search.current?.focus();
    }
  }, [searchOpen]);

  return (
    <Modal isOpen={searchOpen} onClose={close} title="Find a page">
      <form onSubmit={(event) => {
        event.preventDefault();
        if (results[index]) select(results[index].path);
      }} className="command-palette">
        <div className="command-search">
          <Search size={18} aria-hidden="true" />
          <input ref={search} aria-label="Search workspace pages" value={query} placeholder="Search workspace pages"
            onChange={(event) => { setQuery(event.target.value); setIndex(0); }}
            onKeyDown={(event) => {
              if (results.length === 0) return;
              if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setIndex((current) => (current + results.length + (event.key === 'ArrowDown' ? 1 : -1)) % results.length);
              }
            }}
          />
        </div>
        {results.length ? (
          <ul>
            {results.map(({ label, detail, path, icon: Icon }, position) => (
              <li key={path}>
                <button type="button" className="command-item" data-selected={index === position} onClick={() => select(path)}>
                  <Icon size={18} aria-hidden="true" />
                  <span><strong>{label}</strong><small>{detail}</small></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : <p className="muted" role="status">No pages match “{query}”.</p>}
      </form>
    </Modal>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { toasts, removeToast, setSidebarCollapsed } = useAppStore();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const narrow = window.matchMedia('(max-width: 1023px)');
    const resize = () => setSidebarCollapsed(narrow.matches);
    resize();
    narrow.addEventListener('change', resize);
    return () => narrow.removeEventListener('change', resize);
  }, [setSidebarCollapsed]);

  useEffect(() => {
    if (previousPath.current !== pathname) {
      previousPath.current = pathname;
      window.scrollTo(0, 0);
      main.current?.focus({ preventScroll: true });
    }
  }, [pathname]);

  return (
    <div className="workspace-shell">
      <a className="skip-link" href="#workspace-main" onClick={(event) => { event.preventDefault(); main.current?.focus(); }}>
        Skip to content
      </a>
      <Sidebar />
      <div className="workspace-body">
        <TopBar />
        <main ref={main} id="workspace-main" className="workspace-main" tabIndex={-1}>{children}</main>
      </div>
      <nav className="mobile-nav" aria-label="Workspace">
        {navigation.map(({ path, label, short, icon: Icon }) => (
          <NavLink key={path} to={path} aria-label={label}>
            <Icon size={19} aria-hidden="true" /><span>{short}</span>
          </NavLink>
        ))}
      </nav>
      <div className="toast-stack">
        {toasts.map(({ id, type, message }) => {
          const Icon = type === 'success' ? Check : Info;
          return (
            <div key={id} className="workspace-toast page-enter" data-kind={type}>
              <Icon size={18} aria-hidden="true" />
              <p role={type === 'error' ? 'alert' : 'status'}>{message}</p>
              <button type="button" className="icon-control" aria-label="Dismiss message" onClick={() => removeToast(id)}>
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
      <CommandPalette />
    </div>
  );
}
