import { z } from 'zod/mini';

export const stages = ['Applied', 'Review', 'Interview', 'Offer', 'Closed'] as const;
export const recommendations = ['Advance', 'Hold', 'Decline'] as const;
export const durations = [15, 30, 45, 60, 90] as const;

export type Stage = typeof stages[number];
export type Recommendation = typeof recommendations[number];
export type Duration = typeof durations[number];

export interface Interview {
  start: number;
  duration: Duration;
  topic: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

interface Entry {
  id: string;
  at: number;
  description: string;
  notes?: string;
  interview?: Interview;
}

export interface Candidate {
  id: string;
  revision: number;
  name: string;
  role: string;
  evidence: string;
  stage: Stage;
  review?: { recommendation: Recommendation; notes: string };
  interview?: Interview;
  activity: Entry[];
}

export type HiringAction =
  | { type: 'add'; name: string; role: string; evidence: string }
  | ({ id: string; revision: number } & (
    | { type: 'review'; recommendation: Recommendation; notes: string }
    | { type: 'move'; stage: Stage }
    | { type: 'schedule'; start: number; duration: Duration; topic: string }
    | { type: 'complete' | 'cancel' | 'remove' }
  ));

type Result = { candidates: Candidate[]; message: string };

export function nextStages(candidate: Candidate): Stage[] {
  switch (candidate.stage) {
    case 'Applied': return ['Review', 'Closed'];
    case 'Review': return ['Applied', 'Closed'];
    case 'Interview': return candidate.interview?.status === 'Completed' && candidate.review?.recommendation === 'Advance'
      ? ['Offer', 'Review', 'Closed'] : ['Review', 'Closed'];
    case 'Offer': return ['Interview', 'Closed'];
    case 'Closed': return ['Review'];
  }
}

export function canSchedule(candidate: Candidate): boolean {
  return (candidate.stage === 'Review' && candidate.review?.recommendation === 'Advance')
    || candidate.stage === 'Interview';
}

export function findCandidates(candidates: Candidate[], stage: Stage | 'All', query: string) {
  const words = query.trim().toLowerCase().split(/\s+/);
  return candidates.filter((candidate) => {
    const label = `${candidate.name} ${candidate.role}`.toLowerCase();
    return (stage === 'All' || stage === candidate.stage) && words.every((word) => label.includes(word));
  });
}

export function scheduledCandidates(candidates: Candidate[]) {
  return candidates.filter((candidate): candidate is Candidate & { interview: Interview } => candidate.interview?.status === 'Scheduled')
    .sort((a, b) => a.interview.start - b.interview.start);
}

function textField(value: string, name: string, max: number, required = true) {
  const result = z.string().check(
    z.trim(),
    z.minLength(required ? 1 : 0, `Enter ${name}.`),
    z.maxLength(max, `Use ${max} characters or fewer for ${name}.`),
  ).safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0].message);
  return result.data;
}

export function updateHiring(candidates: Candidate[], action: HiringAction, id: string, now: number): Result {
  if (action.type === 'add') {
    const name = textField(action.name, 'a candidate name', 100);
    const role = textField(action.role, 'a role', 100);
    const evidence = textField(action.evidence, 'the application notes', 4000, false);
    return {
      candidates: [{ id, name, role, evidence, stage: 'Applied', revision: 0, activity: [{ id, at: now, description: 'Application added' }] }, ...candidates],
      message: `${name} added.`,
    };
  }

  const current = candidates.find((candidate) => candidate.id === action.id);
  if (!current || current.revision !== action.revision) {
    throw new Error('This candidate changed in another view. Check the latest record and try again.');
  }
  if (action.type === 'remove') {
    return { candidates: candidates.filter((candidate) => candidate.id !== current.id), message: `${current.name} deleted.` };
  }

  const candidate = { ...current, revision: current.revision + 1 };
  let description: string;

  switch (action.type) {
    case 'review':
      if (candidate.stage !== 'Review' && candidate.stage !== 'Interview') {
        throw new Error('Move the candidate to Review before recording a recommendation.');
      }
      if (!recommendations.includes(action.recommendation)) throw new Error('Choose a recommendation.');
      candidate.review = { recommendation: action.recommendation, notes: textField(action.notes, 'review notes', 2000) };
      description = `Review recorded · ${action.recommendation}`;
      break;

    case 'move':
      if (!nextStages(candidate).includes(action.stage)) throw new Error('That stage is unavailable for this candidate.');
      description = `Moved from ${candidate.stage} to ${action.stage}`;
      candidate.stage = action.stage;
      if (candidate.interview?.status === 'Scheduled' && (action.stage === 'Closed' || action.stage === 'Review')) {
        candidate.interview = { ...candidate.interview, status: 'Cancelled' };
        description += ' and cancelled the interview';
      }
      if (current.stage === 'Closed' || action.stage === 'Applied') {
        candidate.review = undefined;
        candidate.interview = undefined;
      }
      break;

    case 'schedule': {
      if (!canSchedule(candidate)) throw new Error('Record an Advance recommendation before scheduling an interview.');
      const { start, duration } = action;
      if (!Number.isFinite(start) || start <= now) throw new Error('Choose a future interview date and time.');
      if (!durations.includes(duration)) throw new Error('Choose one of the listed durations.');
      const topic = textField(action.topic, 'an interview topic', 100);
      const end = start + duration * 60_000;
      const conflict = scheduledCandidates(candidates).find(({ id, interview }) =>
        id !== candidate.id && interview.start < end && start < interview.start + interview.duration * 60_000);
      if (conflict) throw new Error(`This time overlaps with ${conflict.name}’s interview.`);
      description = candidate.interview?.status === 'Scheduled' ? 'Interview rescheduled' : 'Interview scheduled';
      if (candidate.stage === 'Review') description += ' and moved to Interview';
      candidate.stage = 'Interview';
      candidate.interview = { start, duration, topic, status: 'Scheduled' };
      break;
    }

    case 'complete':
      if (candidate.interview?.status !== 'Scheduled' || candidate.interview.start > now) {
        throw new Error('You can mark an interview complete once its start time has passed.');
      }
      candidate.interview = { ...candidate.interview, status: 'Completed' };
      description = 'Interview completed';
      break;

    case 'cancel':
      if (candidate.interview?.status !== 'Scheduled') throw new Error('There is no scheduled interview to cancel.');
      candidate.interview = { ...candidate.interview, status: 'Cancelled' };
      description = 'Interview cancelled';
      break;
  }

  candidate.activity = [{
    id, at: now, description,
    notes: action.type === 'review' ? candidate.review?.notes : undefined,
    interview: current.interview !== candidate.interview ? candidate.interview : undefined,
  }, ...current.activity];
  return {
    candidates: candidates.map((entry) => entry.id === candidate.id ? candidate : entry),
    message: `${description}.`,
  };
}

export function parseInterviewTime(value: string) {
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  // A local time in the spring DST gap is silently shifted by Date.
  return Number.isFinite(+date) && local.toISOString().slice(0, 16) === value ? +date : NaN;
}
