import { Link } from 'react-router-dom';

export function Brand() {
  return (
    <Link className="brand" to="/hiring" aria-label="HireMind hiring pipeline">
      <svg viewBox="0 0 32 32" width="32" height="32" fill="none" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 9h5m-2.5 0v14M8 23h5M19 9h5m-2.5 0v14M19 23h5M10.5 15.5h11" stroke="currentColor" strokeWidth="1.5" />
      </svg>
      <span>HireMind</span>
    </Link>
  );
}
