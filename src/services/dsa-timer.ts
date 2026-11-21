/**
 * Pure helpers for the DSA practice question timer.
 *
 * The timer used to live inside a `setSecondsLeft` updater: the updater
 * called the expiry handler (toast + auto-submit) and wrote the per-question
 * remaining time, so the side effects ran inside a function React is
 * allowed to invoke twice under StrictMode — double toast, double
 * auto-submit — and the handler closed over the code as of the last effect
 * run, so a timeout could submit stale code. The interval now ticks
 * through these pure functions instead: the remaining time is computed
 * first, the component stores it, and expiry is handled once, outside any
 * updater.
 */

export function dsaQuestionSeconds(difficulty: string | undefined): number {
  // 20 / 35 / 50 minutes. Unknown difficulties get the hard allowance
  // rather than no time at all.
  return difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 2100 : 3000;
}

export interface DsaTick {
  /** Seconds left for this question after the tick, never negative. */
  remaining: number;
  /** True exactly when the tick reaches zero. */
  expired: boolean;
  /** The per-question remaining-time map with this question updated. */
  next: Record<string, number>;
}

export function tickDsaTimer(
  remainingByQuestion: Record<string, number>,
  questionId: string,
): DsaTick {
  const remaining = Math.max(0, (remainingByQuestion[questionId] ?? 0) - 1);
  return {
    remaining,
    expired: remaining === 0,
    next: { ...remainingByQuestion, [questionId]: remaining },
  };
}
