import { rankCandidates, type RankedCandidate } from './ranking';
import type { Candidate } from './hiring';

/**
 * Rank the hiring register against one job description.
 *
 * The register holds application notes for each candidate (`evidence`),
 * not full resumes, so the notes are the text being audited — the same
 * deterministic ATS audit that scores a single resume, applied to every
 * candidate the same way. Notes are short, so scores run lower than a
 * full-resume audit; the ranking orders the shortlist, it is not a final
 * mark. A candidate with no notes scores 0 and ranks last; nothing
 * invents a score for them.
 *
 * A blank job description returns no ranking: ordering candidates with
 * no job to order them against would be a made-up list. Callers show
 * their own "paste a job description" state for that case.
 */
export function rankRegisterCandidates(
  candidates: Candidate[],
  jobDescription: string,
): RankedCandidate[] {
  if (typeof jobDescription !== 'string' || !jobDescription.trim()) return [];
  if (!Array.isArray(candidates) || candidates.length === 0) return [];
  return rankCandidates(
    candidates.map((candidate) => ({
      id: candidate.id,
      name: candidate.name,
      resumeText: candidate.evidence ?? '',
    })),
    jobDescription,
  );
}

/**
 * A stable signature for the register as ranked: candidate ids with
 * their revisions, in register order. The UI compares it with the live
 * register to say when a ranking went stale (a candidate was added,
 * edited, moved or deleted after the rank ran) instead of showing old
 * numbers as if they were current.
 */
export function registerSignature(candidates: Candidate[]): string {
  if (!Array.isArray(candidates)) return '';
  return candidates.map((candidate) => `${candidate.id}:${candidate.revision}`).join(',');
}
