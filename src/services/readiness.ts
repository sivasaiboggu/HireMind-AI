/**
 * Career readiness from the two signals the dashboard actually has: the
 * last ATS score (0–100) and the average interview score (0–10, scaled to
 * 0–100). Both signals count equally when both exist; with only one, the
 * readiness is that signal as-is — no invented discount for having done
 * only one kind of work. With neither, readiness is 0 and the dashboard
 * shows an empty state instead of a number.
 */
export function careerReadiness(atsScore: number, avgInterviewScore10: number): number {
  const interview = avgInterviewScore10 > 0 ? avgInterviewScore10 * 10 : 0;
  if (atsScore > 0 && interview > 0) return Math.round((atsScore + interview) / 2);
  if (atsScore > 0) return Math.round(atsScore);
  if (interview > 0) return Math.round(interview);
  return 0;
}
