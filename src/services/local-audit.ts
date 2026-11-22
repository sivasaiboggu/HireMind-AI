/**
 * Why the resume page fell back to the deterministic local audit instead
 * of the AI review. The two causes read differently to the user: "the AI
 * was unavailable" is true for a missing key, quota or network failure,
 * but when the user simply ran out of credits the banner must say so —
 * otherwise the local audit looks like a silent free substitute for a
 * paid-for AI call, and the refill button in the sidebar looks unrelated.
 */
export type LocalAuditReason = 'credits' | 'unavailable';

export function localAuditReason(credits: number, cost: number): LocalAuditReason {
  return credits < cost ? 'credits' : 'unavailable';
}
