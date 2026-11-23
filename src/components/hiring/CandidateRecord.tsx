import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ArrowRight, CalendarDays, Download, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import {
  canSchedule, durations, nextStages, parseInterviewTime, recommendations,
  type Candidate, type Duration, type HiringAction, type Interview, type Recommendation, type Stage,
} from '../../services/hiring';

const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
const calendarZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const interviewTime = (start: number) => timestamp.format(start);

type Edit = 'review' | 'schedule' | 'move' | 'cancel' | 'complete' | 'remove';
export type SaveCandidate = (action: HiringAction) => Promise<boolean>;

function localDateTime(start: number) {
  const date = new Date(start);
  return new Date(start - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function downloadInterview(candidate: Candidate, interview: Interview) {
  const utc = (time: number) => new Date(time).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const escape = (value: string) => value.replace(/[\\;,]|\r\n?|\n/g, (character) =>
    /[\r\n]/.test(character) ? '\\n' : '\\' + character);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HireMind//Hiring register//EN', 'BEGIN:VEVENT',
    `UID:${candidate.id}@hiremind.local`, `DTSTAMP:${utc(Date.now())}`, `SEQUENCE:${candidate.revision}`,
    `DTSTART:${utc(interview.start)}`, `DTEND:${utc(interview.start + interview.duration * 60_000)}`,
    `SUMMARY:${escape(`${interview.topic} with ${candidate.name}`)}`,
    'END:VEVENT', 'END:VCALENDAR', '',
  ];

  // Calendar content lines are folded at 75 UTF-8 octets.
  const encoder = new TextEncoder();
  const folded = lines.map((line) => {
    let column = 0;
    let output = '';
    for (const character of line) {
      const size = encoder.encode(character).length;
      if (column + size > 75) {
        output += '\r\n ';
        column = 1;
      }
      output += character;
      column += size;
    }
    return output;
  });
  const url = URL.createObjectURL(new Blob([folded.join('\r\n')], { type: 'text/calendar' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'hiremind-interview.ics';
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function AddCandidate({ close, save, busy, error }: {
  close: () => void; save: SaveCandidate; busy: boolean; error: string;
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const saved = await save({
      type: 'add', name: String(data.get('name')), role: String(data.get('role')), evidence: String(data.get('evidence')),
    });
    if (saved) close();
  }

  return (
    <Modal isOpen onClose={close} title="Add a candidate" dismissible={!busy}>
      <form className="form-stack" onSubmit={submit}>
        <label>Candidate name <input name="name" required maxLength={100} autoComplete="off" /></label>
        <label>Role <input name="role" required maxLength={100} /></label>
        <label>Application notes <span className="muted">(optional)</span>
          <textarea name="evidence" rows={4} maxLength={4000} />
        </label>
        <p className="muted">The candidate starts in Applied. This register is saved in this browser.</p>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="hiring-actions"><Button type="submit" loading={busy}>Add candidate</Button></div>
      </form>
    </Modal>
  );
}

export function CandidateRecord({ candidate, close, save, busy, error, clearError, now }: {
  candidate: Candidate; close: () => void; save: SaveCandidate; busy: boolean; error: string;
  clearError: () => void; now: number;
}) {
  const [editor, setEditor] = useState<{ mode: Edit; revision: number } | null>(null);
  const mode = editor?.mode;
  const record = useRef<HTMLDivElement>(null);
  const focusEditor = useRef(false);
  useEffect(() => {
    if (!focusEditor.current) return;
    focusEditor.current = false;
    if (mode) record.current?.querySelector<HTMLElement>('.record-editor :is(input, select, textarea, button)')?.focus();
    else record.current?.focus({ preventScroll: true });
  }, [mode]);
  const interview = candidate.interview;
  const next = nextStages(candidate);
  const reviewing = candidate.stage === 'Review' || candidate.stage === 'Interview';

  function edit(mode: Edit) {
    clearError();
    focusEditor.current = true;
    setEditor({ mode, revision: candidate.revision });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor) return;
    const data = new FormData(event.currentTarget);
    const target = { id: candidate.id, revision: editor.revision };
    let action: HiringAction;
    switch (editor.mode) {
      case 'review':
        action = { ...target, type: 'review', recommendation: data.get('recommendation') as Recommendation, notes: String(data.get('notes')) };
        break;
      case 'schedule':
        action = {
          ...target, type: 'schedule', start: parseInterviewTime(String(data.get('start'))),
          duration: Number(data.get('duration')) as Duration, topic: String(data.get('topic')),
        };
        break;
      case 'move': action = { ...target, type: 'move', stage: data.get('stage') as Stage }; break;
      default: action = { ...target, type: editor.mode };
    }
    if (await save(action)) {
      if (mode === 'remove') close();
      focusEditor.current = true;
      setEditor(null);
    }
  }

  return (
    <Modal isOpen onClose={close} title={candidate.name} maxWidth="640px" dismissible={!busy}>
      <div className="candidate-record" ref={record} tabIndex={-1}>
        <p className="candidate-subtitle">{candidate.role} <span className="stage-label">{candidate.stage}</span></p>
        {mode ? (
          <form className="form-stack record-editor" key={mode} onSubmit={submit}>
            {mode === 'review' && <>
              <label>Recommendation
                <select name="recommendation" required defaultValue={candidate.review?.recommendation ?? ''}>
                  <option value="" disabled>Choose a recommendation</option>
                  {recommendations.map((value) => <option key={value}>{value}</option>)}
                </select>
              </label>
              <label>Review notes <textarea name="notes" rows={5} required maxLength={2000} defaultValue={candidate.review?.notes} /></label>
            </>}
            {mode === 'schedule' && <>
              <label>Interview topic <input name="topic" required maxLength={100} defaultValue={interview?.topic} /></label>
              <div className="control-pair">
                <label>Local date and time
                  <input name="start" type="datetime-local" required defaultValue={interview?.status === 'Scheduled' ? localDateTime(interview.start) : undefined} />
                </label>
                <label>Duration
                  <select name="duration" defaultValue={interview?.duration ?? 30}>
                    {durations.map((duration) => <option key={duration} value={duration}>{duration} minutes</option>)}
                  </select>
                </label>
              </div>
              <p className="muted">Times use {calendarZone}. You can download the calendar event after saving.</p>
            </>}
            {mode === 'move' && <>
              <label>Move to stage
                <select name="stage" required defaultValue="">
                  <option value="" disabled>Choose a stage</option>
                  {next.map((stage) => <option key={stage}>{stage}</option>)}
                </select>
              </label>
              {interview?.status === 'Scheduled' && <p className="muted">Moving to Review or Closed will cancel the interview in this register.</p>}
            </>}
            {mode === 'cancel' && <p>Cancel {candidate.name}’s interview in this register? Update any external calendar separately.</p>}
            {mode === 'complete' && <p>Mark this interview complete so you can record the outcome.</p>}
            {mode === 'remove' && <p>Delete this candidate, their review notes, and interview history from this browser?</p>}
            {error && <p className="error-text" role="alert">{error}</p>}
            <div className="hiring-actions">
              <Button type="submit" variant={mode === 'remove' ? 'danger' : 'primary'} loading={busy}>
                {{ review: 'Save review', schedule: 'Save interview', move: 'Move candidate',
                  cancel: 'Cancel interview', complete: 'Mark complete', remove: 'Delete candidate' }[mode]}
              </Button>
              <Button variant="ghost" disabled={busy} onClick={() => { clearError(); focusEditor.current = true; setEditor(null); }}>Back to record</Button>
            </div>
          </form>
        ) : <>
          <section className="record-section">
            <h3>Application notes</h3>
            <p className="record-notes">{candidate.evidence || 'No application notes were added.'}</p>
          </section>
          <section className="record-section">
            <h3>Review</h3>
            {candidate.review
              ? <><strong>{candidate.review.recommendation}</strong><p className="record-notes">{candidate.review.notes}</p></>
              : <p className="muted">A recommendation and supporting notes will appear here.</p>}
          </section>
          {(interview || candidate.stage === 'Review' || candidate.stage === 'Interview') && <section className="record-section">
            <h3>Interview</h3>
            {interview ? (
              <>
                <p><strong>{interview.topic}</strong> · {interview.status}</p>
                <p className="muted">{interviewTime(interview.start)} · {interview.duration} minutes</p>
                {interview.status === 'Scheduled' && <div className="hiring-actions">
                  <Button variant="ghost" icon={<Download size={16} aria-hidden="true" />} onClick={() => downloadInterview(candidate, interview)}>Calendar file</Button>
                  <Button variant="ghost" onClick={() => edit('cancel')}>Cancel interview</Button>
                  {interview.start <= now && <Button variant="ghost" onClick={() => edit('complete')}>Mark complete</Button>}
                </div>}
              </>
            ) : <p className="muted">{canSchedule(candidate) ? 'No interview is scheduled.' : 'Record an Advance recommendation to schedule an interview.'}</p>}
            {candidate.stage === 'Interview' && !next.includes('Offer') && <p className="muted">Complete the interview and record an Advance recommendation to move to Offer.</p>}
          </section>}
          <div className="hiring-actions">
            {reviewing && <Button onClick={() => edit('review')}>{candidate.review ? 'Update review' : 'Record review'}</Button>}
            {canSchedule(candidate) && <Button variant="ghost" icon={<CalendarDays size={16} aria-hidden="true" />} onClick={() => edit('schedule')}>
              {interview?.status === 'Scheduled' ? 'Reschedule' : 'Schedule interview'}
            </Button>}
            <Button variant="ghost" icon={<ArrowRight size={16} aria-hidden="true" />} onClick={() => edit('move')}>Move stage</Button>
          </div>
          <details className="record-activity">
            <summary>Activity history <span className="numeric">({candidate.activity.length})</span></summary>
            <ol>
              {candidate.activity.map((entry) => <li key={entry.id}>
                <strong>{entry.description}</strong>
                <time dateTime={new Date(entry.at).toISOString()}>{interviewTime(entry.at)}</time>
                {entry.notes && <p className="record-notes">{entry.notes}</p>}
                {entry.interview && <p className="muted">{entry.interview.topic} · {interviewTime(entry.interview.start)} · {entry.interview.duration} min</p>}
              </li>)}
            </ol>
          </details>
          <div><Button variant="danger" icon={<Trash2 size={16} aria-hidden="true" />} onClick={() => edit('remove')}>Delete candidate</Button></div>
        </>}
      </div>
    </Modal>
  );
}
