import { Link } from 'react-router-dom';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" to="/dashboard" aria-label="HireMind overview">
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true">
        <rect width="32" height="32" rx="3" fill="currentColor" />
        <path d="M9 8v16m14-16v16M9 16h14" stroke="var(--bg-base)" strokeWidth="2" />
        <path d="M14 16h4" stroke="var(--accent-primary)" strokeWidth="2" />
      </svg>
      {!compact && <span>HireMind<span className="brand-period">.</span></span>}
    </Link>
  );
}
