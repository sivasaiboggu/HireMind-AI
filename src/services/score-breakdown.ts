import type { ResumeAnalysis } from '../types';

/**
 * Explains how the deterministic ATS score is built, in plain language.
 *
 * The weights mirror src/services/ats.ts exactly (keywords 40, sections 25,
 * format 15, content 20), and every rate is derived from the audit result
 * itself — matched/missing keywords, passed sections, format and content
 * scores — so the breakdown can never disagree with the score it explains.
 * Nothing here invents a number: a part with no evidence behind it scores 0.
 */

export interface ScorePart {
  /** What the part measures, e.g. "Job keywords". */
  label: string;
  /** Weight in the ATS score, in points out of 100. */
  weight: number;
  /** Fraction of this part earned, 0–1. */
  rate: number;
  /** Points this part contributes to the ATS score (weight × rate, rounded). */
  points: number;
  /** One concrete line of evidence, e.g. "12 of 30 job keywords found". */
  detail: string;
}

export interface ScoreBreakdown {
  parts: ScorePart[];
  /** Points the four parts add up to (equals the ATS score, ±1 from rounding). */
  totalPoints: number;
  /** The single highest-impact fix, or null when every driver is already full. */
  nextFix: { title: string; description: string } | null;
}

export function buildScoreBreakdown(analysis: ResumeAnalysis): ScoreBreakdown {
  const keywordTotal = analysis.matchedKeywords.length + analysis.missingKeywords.length;
  const keywordRate = keywordTotal ? analysis.matchedKeywords.length / keywordTotal : 1;
  const passedSections = analysis.sections.filter((s) => s.score === 100).length;
  const sectionRate = analysis.sections.length ? passedSections / analysis.sections.length : 0;
  const formatRate = analysis.formatScore / 100;
  const contentRate = analysis.contentScore / 100;

  const missingSections = analysis.sections
    .filter((s) => s.score !== 100)
    .map((s) => s.name);

  const parts: ScorePart[] = [
    {
      label: 'Job keywords',
      weight: 40,
      rate: keywordRate,
      points: Math.round(40 * keywordRate),
      detail: keywordTotal
        ? `${analysis.matchedKeywords.length} of ${keywordTotal} job keywords found`
        : 'No job description given, so keywords were not scored',
    },
    {
      label: 'Sections',
      weight: 25,
      rate: sectionRate,
      points: Math.round(25 * sectionRate),
      detail: analysis.sections.length
        ? `${passedSections} of ${analysis.sections.length} expected sections present` +
          (missingSections.length ? ` — missing: ${missingSections.join(', ')}` : '')
        : 'No sections checked',
    },
    {
      label: 'Format',
      weight: 15,
      rate: formatRate,
      points: Math.round(15 * formatRate),
      detail: `Format score ${analysis.formatScore}/100 (contact details, length, symbols)`,
    },
    {
      label: 'Content',
      weight: 20,
      rate: contentRate,
      points: Math.round(20 * contentRate),
      detail: `Content score ${analysis.contentScore}/100 (quantified results, action verbs, bullets)`,
    },
  ];

  const totalPoints = parts.reduce((sum, p) => sum + p.points, 0);

  // Highest-impact fix = the highest-weight part that is not yet full.
  const weakest = [...parts].sort((a, b) => b.weight - a.weight).find((p) => p.rate < 1);
  let nextFix: ScoreBreakdown['nextFix'] = null;
  if (weakest) {
    if (weakest.label === 'Job keywords') {
      nextFix = {
        title: `Add missing keywords: ${analysis.missingKeywords.slice(0, 3).join(', ')}`,
        description:
          'Keywords carry the most weight in the score. Add them only where you genuinely have the experience — inventing them backfires in interviews.',
      };
    } else if (weakest.label === 'Sections') {
      nextFix = {
        title: `Add missing sections: ${missingSections.join(', ')}`,
        description:
          'ATS parsers score resumes by recognised headings. A missing section can cost the whole application before a human reads it.',
      };
    } else if (weakest.label === 'Content') {
      nextFix = {
        title: 'Quantify more achievements',
        description:
          'Add numbers (%, users, latency, cost saved) to at least 3 bullet points and lead each bullet with a strong action verb.',
      };
    } else {
      nextFix = {
        title: 'Tidy up the format',
        description:
          'Put a plain-text email and phone number at the top, keep the resume to 250–1200 words, and avoid decorative symbols.',
      };
    }
  }

  return { parts, totalPoints, nextFix };
}
