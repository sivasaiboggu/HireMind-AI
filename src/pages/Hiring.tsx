import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowUpRight, CalendarDays, Plus, Search, UsersRound } from 'lucide-react';
import { AddCandidate, CandidateRecord, interviewTime } from '../components/hiring/CandidateRecord';
import { Button } from '../components/ui/Button';
import { useAppStore } from '../store/appStore';
import { findCandidates, scheduledCandidates, stages, type Candidate, type HiringAction, type Stage } from '../services/hiring';
import { rankRegisterCandidates, registerSignature } from '../services/hiring-ranking';
import type { RankedCandidate } from '../services/ranking';
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
  // Candidate ranking: the job description to rank against, the last
  // ranking, and the register signature it was computed from.
  const [jobDescription, setJobDescription] = useState('');
  const [ranked, setRanked] = useState<RankedCandidate[] | null>(null);
  const [rankedSignature, setRankedSignature] = useState('');
  const currentSignature = registerSignature(candidates ?? []);
  const rankingStale = ranked !== null && rankedSignature !== currentSignature;
  const byId = new Map((candidates ?? []).map((candidate) => [candidate.id, candidate]));

  function rank() {
    if (!candidates?.length || !jobDescription.trim()) return;
    setRanked(rankRegisterCandidates(candidates, jobDescription));
    setRankedSignature(currentSignature);
  }

  function clearRanking() {
    setRanked(null);
    setRankedSignature('');
  }
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

      <section className="rank-panel" aria-labelledby="rank-title">
        <div className="rank-intro">
          <h2 id="rank-title">Rank candidates</h2>
          <p>Paste the job description. Candidates are ranked on the application notes held for each of them — the same audit as a resume check, applied to every candidate the same way. Notes are short, so scores run lower than a full resume audit; use the order to pick who to review first, not as a final mark.</p>
        </div>
        <label className="rank-label" htmlFor="rank-job-description">Job description</label>
        <textarea id="rank-job-description" rows={4} maxLength={10000} value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the job description to rank against" />
        <div className="hiring-actions">
          <Button disabled={!candidates?.length || !jobDescription.trim()} onClick={rank}>Rank candidates</Button>
          {ranked !== null && <Button variant="ghost" onClick={clearRanking}>Clear ranking</Button>}
        </div>
        {candidates !== null && candidates.length === 0 && (
          <p className="rank-note" role="status">Add a candidate before ranking — the register is empty.</p>
        )}
        {rankingStale && (
          <p className="rank-note" role="status">The register changed since this ranking — rank again for current numbers.</p>
        )}
        {ranked !== null && ranked.length > 0 && (
          <ol className="rank-list">
            {ranked.map((entry) => {
              const record = byId.get(entry.id);
              const matched = entry.matchedKeywords.slice(0, 6);
              const missing = entry.missingKeywords.slice(0, 6);
              return (
                <li key={entry.id} className="rank-row">
                  <span className="rank-position numeric" aria-label={`Rank ${entry.rank}`}>{entry.rank}</span>
                  <span className="rank-main">
                    <button type="button" className="record-link" onClick={() => open({ id: entry.id })}>
                      <span><strong>{entry.name}</strong><small>{record?.role ?? ''}</small></span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </button>
                    {record && <span className="stage-label" data-stage={record.stage}>{record.stage}</span>}
                    <span className="rank-keywords">
                      {entry.matchedKeywords.length > 0 ? (
                        <>Matched: {matched.join(', ')}{entry.matchedKeywords.length > 6 ? `, and ${entry.matchedKeywords.length - 6} more` : ''}</>
                      ) : (
                        <>No application notes — scored 0.</>
                      )}
                      {entry.missingKeywords.length > 0 && (
                        <> · Missing: {missing.join(', ')}{entry.missingKeywords.length > 6 ? `, and ${entry.missingKeywords.length - 6} more` : ''}</>
                      )}
                    </span>
                  </span>
                  <span className="rank-scores">
                    <span><strong className="numeric">{entry.overallScore}</strong><small>overall</small></span>
                    <span><strong className="numeric">{entry.atsScore}</strong><small>ATS</small></span>
                  </span>
                </li>
              );
            })}
          </ol>
        )}
        {ranked !== null && ranked.length === 0 && (
          <p className="rank-note" role="status">No candidates to rank.</p>
        )}
      </section>

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
