import type { ReactNode } from 'react';

export function PageHeading({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <header className="page-heading">
      <div>
        <h1>{title}</h1>
        {children && <p>{children}</p>}
      </div>
      {action && <div className="heading-action">{action}</div>}
    </header>
  );
}

export function WorkSheet({ children, note }: { children: ReactNode; note: ReactNode }) {
  return (
    <div className="worksheet">
      <section className="worksheet-form">{children}</section>
      <aside className="worksheet-note">{note}</aside>
    </div>
  );
}
