import type { Roadmap } from '../types';

/**
 * LLM output-quality improvement loop: evaluate what the model produced,
 * and when the score is low, refine it with the evaluation's feedback
 * instead of handing the weak output to the user.
 *
 * HireMind already evaluated output (GeminiService.evaluateAnswer scores a
 * candidate's interview answer), but nothing ever IMPROVED a low-quality
 * model output — a thin roadmap or a weak draft went straight to the
 * screen. This module is the loop: generate, evaluate, and while the score
 * is below the bar, refine with the named issues and re-evaluate, up to a
 * bounded number of attempts. The best-scoring output seen is returned,
 * so a refinement that makes things worse never replaces a better draft.
 *
 * Everything model-shaped is injected: `generate`, `evaluate` and `refine`
 * are caller-supplied functions, so tests use deterministic fakes and the
 * app wires in Gemini. A failed generation throws (there is no output to
 * improve); a failed refinement keeps the best output so far instead of
 * losing it.
 */

export interface QualityEvaluation {
  /** 0–100. At or above minScore the output is accepted as-is. */
  score: number;
  /** Concrete gaps the refinement step must fix, in plain words. */
  issues: string[];
}

export interface ImproveOptions<T> {
  generate: () => Promise<T>;
  evaluate: (output: T) => Promise<QualityEvaluation> | QualityEvaluation;
  refine: (output: T, evaluation: QualityEvaluation) => Promise<T>;
  /** Accept an output at or above this score. Default 70. */
  minScore?: number;
  /** Total generation attempts including the first. Default 3. */
  maxAttempts?: number;
}

export interface ImproveResult<T> {
  output: T;
  /** Total generation attempts used (1 when the first draft passed). */
  attempts: number;
  /** Every evaluation, in order. */
  evaluations: QualityEvaluation[];
  /** True when the returned output scores higher than the first draft. */
  improved: boolean;
}

export async function improveOutput<T>(options: ImproveOptions<T>): Promise<ImproveResult<T>> {
  const minScore = options.minScore ?? 70;
  const maxAttempts = Math.max(1, Math.floor(options.maxAttempts ?? 3));
  const evaluations: QualityEvaluation[] = [];

  let output: T = await options.generate();
  let evaluation = await options.evaluate(output);
  evaluations.push(evaluation);
  let best: { output: T; score: number } = { output, score: evaluation.score };
  const firstScore = evaluation.score;
  let attempts = 1;

  while (evaluation.score < minScore && attempts < maxAttempts) {
    let refined: T;
    try {
      refined = await options.refine(output, evaluation);
    } catch {
      break;
    }
    attempts += 1;
    output = refined;
    evaluation = await options.evaluate(output);
    evaluations.push(evaluation);
    if (evaluation.score > best.score) best = { output, score: evaluation.score };
  }

  return {
    output: best.output,
    attempts,
    evaluations,
    improved: best.score > firstScore,
  };
}

/**
 * Deterministic quality score for a learning roadmap (no model needed):
 * phases exist, every phase teaches at least one topic, the timeline is
 * stated, skill gaps are named, and every topic explains itself. A
 * roadmap that passes all five checks scores 100; each named issue is
 * exactly what a refinement prompt must fix.
 */
export function scoreRoadmap(roadmap: Roadmap): QualityEvaluation {
  const issues: string[] = [];
  let score = 0;

  if (Array.isArray(roadmap.phases) && roadmap.phases.length > 0) {
    score += 25;
  } else {
    issues.push('The roadmap has no phases.');
  }

  const phases = Array.isArray(roadmap.phases) ? roadmap.phases : [];
  const emptyPhases = phases.filter((phase) => !Array.isArray(phase.topics) || phase.topics.length === 0);
  if (phases.length > 0 && emptyPhases.length === 0) {
    score += 25;
  } else if (phases.length > 0) {
    issues.push(`${emptyPhases.length} phase${emptyPhases.length === 1 ? ' has' : 's have'} no topics.`);
  }

  if (typeof roadmap.totalWeeks === 'number' && roadmap.totalWeeks > 0) {
    score += 20;
  } else {
    issues.push('The roadmap states no total timeline in weeks.');
  }

  if (Array.isArray(roadmap.skillGaps) && roadmap.skillGaps.length > 0) {
    score += 15;
  } else {
    issues.push('The roadmap names no skill gaps.');
  }

  const topics = phases.flatMap((phase) => (Array.isArray(phase.topics) ? phase.topics : []));
  const unexplained = topics.filter((topic) => !topic.description || !topic.description.trim());
  if (topics.length > 0 && unexplained.length === 0) {
    score += 15;
  } else if (topics.length > 0) {
    issues.push(`${unexplained.length} topic${unexplained.length === 1 ? ' has' : 's have'} no description.`);
  } else if (topics.length === 0 && phases.length > 0) {
    issues.push('The roadmap has no topics at all.');
  }

  return { score, issues };
}
