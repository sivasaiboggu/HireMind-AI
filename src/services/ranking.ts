import { analyzeResumeLocally } from './ats';
import type { ResumeAnalysis } from '../types';

/**
 * Candidate ranking: order a set of applicants against one job description
 * by the same deterministic ATS audit that scores a single resume.
 *
 * HireMind could already audit ONE resume against a job (analyzeResumeLocally
 * in ats.ts) but had no way to compare several candidates for the same role.
 * This module closes that gap: every candidate is audited the same way, and
 * the list is ordered by overall score, then ATS score, then name. The
 * name tie-break keeps the order identical on every run — two candidates
 * with equal scores never swap places between renders.
 *
 * Scores come from visible evidence only (keyword coverage, sections,
 * quantified achievements, action verbs, format). Nothing here invents a
 * score: a candidate with no resume text scores 0 and ranks last.
 */

export interface RankedCandidate {
  id: string;
  name: string;
  /** 1-based position in the ranked list. */
  rank: number;
  atsScore: number;
  overallScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  /** Full audit for the detail view; callers should not re-run the audit. */
  analysis: ResumeAnalysis;
}

export interface RankInput {
  id: string;
  name: string;
  resumeText: string;
}

export function rankCandidates(
  candidates: RankInput[],
  jobDescription: string,
): RankedCandidate[] {
  const scored = candidates.map((candidate) => {
    const analysis = analyzeResumeLocally(candidate.resumeText, jobDescription);
    return {
      id: candidate.id,
      name: candidate.name,
      atsScore: analysis.atsScore,
      overallScore: analysis.overallScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      analysis,
    };
  });
  scored.sort(
    (a, b) =>
      b.overallScore - a.overallScore ||
      b.atsScore - a.atsScore ||
      a.name.localeCompare(b.name),
  );
  return scored.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
}

/** The top `count` candidates from a ranked list, in rank order. */
export function topCandidates(ranked: RankedCandidate[], count: number): RankedCandidate[] {
  if (!Number.isFinite(count) || count <= 0) return [];
  return ranked.slice(0, Math.floor(count));
}
