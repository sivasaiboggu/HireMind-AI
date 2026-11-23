import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarDays, Plus, Search, UsersRound } from 'lucide-react';
import { AddCandidate, CandidateRecord, interviewTime } from '../components/hiring/CandidateRecord';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';
import { findCandidates, scheduledCandidates, stages, type Candidate, type HiringAction, type Stage } from '../services/hiring';
import { hiringTransaction } from '../services/hiring-storage';
import '../styles/hiring.css';

function HiringRegister({ workspace }: { workspace: string }) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [stage, setStage] = useState<Stage | 'All'>('All');
  const [query, setQuery] = useState('');
  const [selection, setSelection] = useState<{ id: string } | 'add' | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [now, setNow] = useState(Date.now);
  const pages = useRef<BroadcastChannel | null>(null);
  const readGeneration = useRef(0);
  const saving = useRef(false);
  const registerHeading = useRef<HTMLHeadingElement>(null);
  const addToast = useAppStore((state) => state.addToast);
  const visible = findCandidates(candidates ?? [], stage, query);
  const scheduled = scheduledCandidates(candidates ?? []);
  const selected = typeof selection === 'object' && selection
    ? candidates?.find(({ id }) => id === selection.id) : undefined;
  const selectedMissing = typeof selection === 'object' && selection && !selected && candidates !== null;
  const candidateCount = candidates?.length || 1;

  const reload = useCallback(async () => {
    const generation = ++readGeneration.current;
    try {
      const result = await hiringTransaction(workspace);
      if (generation === readGeneration.current) {
        setCandidates(result.candidates);
        setLoadError('');
      }
    } catch {
      if (generation === readGeneration.current) setLoadError('The hiring register could not open. Check browser storage and try again.');
    }
  }, [workspace]);

  useEffect(() => {
    void reload();
    if ('BroadcastChannel' in window) {
      pages.current = new BroadcastChannel('hiremind-hiring');
      pages.current.onmessage = ({ data }) => { if (data === workspace) void reload(); };
    }
    const refresh = () => { void reload(); setNow(Date.now()); };
    const clock = window.setInterval(() => setNow(Date.now()), 15_000);
    window.addEventListener('focus', refresh);
    return () => {
      readGeneration.current++;
      pages.current?.close();
      pages.current = null;
      window.clearInterval(clock);
      window.removeEventListener('focus', refresh);
    };
  }, [reload, workspace]);

  async function save(action: HiringAction) {
    if (saving.current) return false;
    saving.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await hiringTransaction(workspace, action);
      readGeneration.current++;
      setCandidates(result.candidates);
      setLoadError('');
      setNow(Date.now());
      pages.current?.postMessage(workspace);
      void reload();
      addToast('success', result.message);
      return true;
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'The change could not be saved.');
      void reload();
      return false;
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  function open(value: typeof selection) {
    setError('');
    setSelection(value);
  }

  function close() {
    setSelection(null);
    requestAnimationFrame(() => {
      if (document.activeElement === document.body) registerHeading.current?.focus();
    });
  }

  return (
    <div className="container hiring-page">
      <header className="hiring-lede">
        <div>
          <h1>Hiring pipeline</h1>
          <p>Review applications, move candidates through stages, and schedule interviews.</p>
        </div>
        <Button disabled={candidates === null || Boolean(loadError)} icon={<Plus size={18} aria-hidden="true" />} onClick={() => open('add')}>Add candidate</Button>
      </header>

      <nav className="pipeline-stages" aria-label="Filter candidates by stage">
        {stages.map((item) => {
          const count = candidates?.filter(({ stage }) => item === stage).length;
          return <button key={item} type="button" className="pipeline-stage" aria-pressed={stage === item}
            onClick={() => setStage(stage === item ? 'All' : item)}>
            <span>{item}</span>
            <strong className="numeric">{count ?? '–'}</strong>
            <span className="stage-meter" aria-hidden="true">
              <i style={{ '--stage-share': (count ?? 0) / candidateCount } as CSSProperties} />
            </span>
          </button>;
        })}
      </nav>

      <div className="hiring-columns">
        <section className="candidate-register" aria-labelledby="register-title">
          <div className="register-title">
            <div>
              <h2 id="register-title" ref={registerHeading} tabIndex={-1}>Candidate register</h2>
              <p>{candidates === null ? 'Applications by stage' : `${visible.length} of ${candidates.length} ${candidates.length === 1 ? 'candidate' : 'candidates'}`}</p>
            </div>
            <div className="register-search">
              <Search size={17} aria-hidden="true" />
              <input type="search" aria-label="Search candidates by name or role" placeholder="Search name or role"
                value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
          </div>
          {stage !== 'All' && <div className="register-filter">
            <span>Stage · {stage}</span><button type="button" className="text-control" onClick={() => setStage('All')}>Show all stages</button>
          </div>}
          {loadError ? <div className="register-empty">
            <p className="error-text" role="alert">{loadError}</p>
            <Button variant="ghost" onClick={() => void reload()}>Try again</Button>
          </div> : candidates === null ? <p className="register-empty muted" role="status">Opening the candidate register…</p> : (
            <table className="candidate-table" aria-labelledby="register-title">
              <thead>
                <tr><th scope="col">Candidate</th><th scope="col">Stage</th><th scope="col" className="updated-column">Last activity</th></tr>
              </thead>
              <tbody>
                {visible.map((candidate, index) => <tr key={candidate.id} style={{ '--row-delay': `${Math.min(index, 4) * 32}ms` } as CSSProperties}>
                  <th scope="row">
                    <button type="button" className="record-link" onClick={() => open({ id: candidate.id })}>
                      <span className="candidate-initials" aria-hidden="true">{candidate.name.split(/\s+/).slice(0, 2).map((word) => Array.from(word)[0]).join('')}</span>
                      <span><strong>{candidate.name}</strong><small>{candidate.role}</small></span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                  </th>
                  <td><span className="stage-label" data-stage={candidate.stage}>{candidate.stage}</span></td>
                  <td className="updated-column"><time dateTime={new Date(candidate.activity[0].at).toISOString()}>
                    {new Date(candidate.activity[0].at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </time></td>
                </tr>)}
                {!visible.length && <tr><td colSpan={3}>
                  <div className="register-empty">
                    <UsersRound size={24} aria-hidden="true" />
                    <h3>{candidates.length ? 'No matching candidates' : 'No candidates yet'}</h3>
                    <p>{candidates.length ? 'Try a different name, role, or stage.' : 'Add an applicant to start the register. Open their record when it’s time to review.'}</p>
                    {candidates.length > 0 && <Button variant="ghost" onClick={() => { setQuery(''); setStage('All'); }}>Clear filters</Button>}
                  </div>
                </td></tr>}
              </tbody>
            </table>
          )}
        </section>

        <aside className="interview-agenda" aria-labelledby="agenda-title">
          <div className="agenda-title"><CalendarDays size={18} aria-hidden="true" /><h2 id="agenda-title">Interview agenda</h2></div>
          {scheduled.length ? (
            <ol className="agenda-list">
              {scheduled.map(({ id, name, interview }) => <li key={id}>
                <time dateTime={new Date(interview.start).toISOString()}>{interviewTime(interview.start)}</time>
                <button type="button" className="record-link" onClick={() => open({ id })}>
                  <span><strong>{name}</strong><small>{interview.topic} · {interview.duration} min</small></span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
                {interview.start <= now && <p className="agenda-note">Awaiting outcome</p>}
              </li>)}
            </ol>
          ) : <p className="agenda-copy">{candidates === null ? 'Interview times appear here.' : 'No interviews scheduled. Open a candidate in Review to record a recommendation and set a time.'}</p>}
          <p className="agenda-footer">Saved in this browser</p>
        </aside>
      </div>

      {selection === 'add' && <AddCandidate close={close} save={save} busy={busy} error={error} />}
      {selected && <CandidateRecord key={selected.id} candidate={selected} close={close} save={save} busy={busy} error={error} clearError={() => setError('')} now={now} />}
      {selectedMissing && <p role="status" className="muted">This candidate record was deleted.</p>}
    </div>
  );
}

export default function Hiring() {
  const user = useAppStore((state) => state.user);
  const workspace = user ? `account:${user.id}` : 'guest';
  return <HiringRegister key={workspace} workspace={workspace} />;
}
