import type { ResumeAnalysis } from '../types';

/**
 * Deterministic, offline ATS audit.
 *
 * HireMind's AI analysis is the primary path, but it needs a Gemini key and a
 * network round-trip. This module gives every resume a real, explainable
 * audit with no model at all: keyword coverage against the job description,
 * section completeness, quantified achievements, action verbs, contact info
 * and length. Scores are computed from visible evidence only, so the same
 * resume + job description always produces the same result, and every point
 * can be traced back to a concrete finding in the report.
 *
 * It is deliberately conservative: it never invents rewrites or claims the
 * AI's judgement, and callers must label its output as a local audit.
 */

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'your', 'are', 'have', 'has', 'will',
  'this', 'that', 'from', 'into', 'our', 'who', 'what', 'when', 'where',
  'about', 'after', 'before', 'over', 'under', 'between', 'through', 'during',
  'such', 'than', 'then', 'them', 'they', 'their', 'there', 'these', 'those',
  'being', 'been', 'also', 'more', 'most', 'other', 'some', 'any', 'all',
  'can', 'could', 'should', 'would', 'must', 'may', 'per', 'via', 'etc',
  'role', 'team', 'work', 'experience', 'years', 'year', 'job', 'candidate',
  'looking', 'seeking', 'strong', 'good', 'great', 'ability', 'skills',
  'skill', 'knowledge', 'including', 'required', 'preferred', 'responsibilities',
  'need', 'needs', 'want', 'wants', 'join', 'joining', 'help', 'helps',
]);

const ACTION_VERBS = [
  'built', 'developed', 'designed', 'implemented', 'led', 'launched', 'improved',
  'optimized', 'automated', 'created', 'delivered', 'reduced', 'increased',
  'architected', 'deployed', 'migrated', 'scaled', 'shipped', 'owned',
  'mentored', 'collaborated', 'analyzed', 'engineered', 'refactored',
];

const SECTION_PATTERNS: Array<{ name: string; pattern?: RegExp; test?: (text: string) => boolean }> = [
  // Contact counts only on a real contact signal. The old phone regex also
  // matched year ranges such as "2023-2027", so a resume with no phone
  // number passed this section on its education dates alone.
  { name: 'Contact Information', test: (text) => /@|linkedin\.com|github\.com/i.test(text) || hasPhoneNumber(text) },
  { name: 'Professional Summary', pattern: /^\s*(summary|profile|objective|about)\b/im },
  { name: 'Work Experience', pattern: /^\s*(work\s+experience|experience|employment|professional\s+experience)\b/im },
  { name: 'Education', pattern: /^\s*(education|academic)\b/im },
  { name: 'Skills', pattern: /^\s*(skills|technical\s+skills|technologies|core\s+competencies)\b/im },
  { name: 'Projects', pattern: /^\s*(projects|personal\s+projects|key\s+projects)\b/im },
  { name: 'Certifications', pattern: /^\s*(certifications?|licenses?|awards?)\b/im },
];

/**
 * A phone number is a digit run of at least 10 digits (international and
 * Indian mobile numbers). The naive span regex also matched year ranges
 * like "2020-2024" (8 digits), crediting a phone number the resume never
 * had. Short local numbers (7 digits) are not credited — they are
 * indistinguishable from dates in plain text.
 */
export function hasPhoneNumber(text: string): boolean {
  for (const match of text.matchAll(/\+?[\d][\d\s\-().]{7,}\d/g)) {
    if (match[0].replace(/\D/g, '').length >= 10) return true;
  }
  return false;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./-]/g, ' ')
    .split(/\s+/)
    // Keep a trailing + or # so "c++" and "c#" survive as tokens instead of
    // collapsing to "c" (length 1, dropped) and never matching a job keyword.
    .map((t) => t.replace(/^[^a-z0-9]+|[^a-z0-9+#]+$/g, ''))
    .filter((t) => (t.length >= 3 || /[+#]$/.test(t)) && !STOPWORDS.has(t));
}

/** Keywords from the job description, most frequent first, capped for focus. */
export function extractJobKeywords(jobDescription: string, limit = 30): string[] {
  const counts = new Map<string, number>();
  for (const token of tokenize(jobDescription)) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token]) => token);
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function analyzeResumeLocally(resumeText: string, jobDescription?: string): ResumeAnalysis {
  const resume = resumeText || '';
  const words = resume.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // A blank resume has nothing to audit — score it 0 rather than letting
  // format defaults (e.g. "no excessive symbols") award free points.
  if (wordCount === 0) {
    const keywords = jobDescription ? extractJobKeywords(jobDescription) : [];
    return {
      atsScore: 0,
      contentScore: 0,
      formatScore: 0,
      overallScore: 0,
      sections: SECTION_PATTERNS.map(({ name }) => ({
        name,
        score: 0,
        status: 'fail' as const,
        feedback: [`Add a ${name.toLowerCase()} section — ATS parsers look for it by heading.`],
      })),
      recommendations: [
        {
          id: 'rec-empty',
          priority: 'HIGH',
          title: 'Resume text is empty',
          description: 'Upload a PDF with extractable text or paste your resume text before running the audit.',
        },
        ...(keywords.length
          ? [{
              id: 'rec-keywords',
              priority: 'HIGH' as const,
              title: `Add ${Math.min(5, keywords.length)} missing keywords`,
              description: `The job description emphasises ${keywords.slice(0, 5).join(', ')} — none appear in the resume.`,
            }]
          : []),
      ],
      matchedKeywords: [],
      missingKeywords: keywords,
      atsChecklist: [
        { label: 'Contact email present', checked: false },
        { label: 'Phone number present', checked: false },
        { label: 'Work experience section', checked: false },
        { label: 'Skills section', checked: false },
        { label: 'Education section', checked: false },
        { label: 'Quantified achievements (3+)', checked: false },
        { label: 'Resume length 250–1200 words', checked: false },
        { label: 'Job keywords covered (50%+)', checked: false },
      ],
      rewrites: [],
    };
  }

  // --- Keyword coverage -------------------------------------------------
  // Word-boundary matching: a job keyword counts only when it appears as a
  // whole token in the resume. Substring matching used to credit "java" for
  // a resume that only mentions "javascript", and "react" for "reaction".
  const resumeTokens = new Set(tokenize(resume));
  const keywords = jobDescription ? extractJobKeywords(jobDescription) : [];
  // A dotted token and its head name the same skill: "Node.js" in the resume
  // satisfies a "Node" keyword and vice versa. Without this, a resume that
  // writes "Node.js" lost points against a JD asking for "Node" (and the
  // reverse), even though any recruiter treats them as one skill. The match
  // stays whole-token — "js" alone never satisfies "node.js" — and version
  // numbers do not cross-match ("3.11" only matches "3.11").
  const keywordMatches = (keyword: string): boolean => {
    if (resumeTokens.has(keyword)) return true;
    const dot = keyword.indexOf('.');
    if (dot > 0 && resumeTokens.has(keyword.slice(0, dot))) return true;
    for (const token of resumeTokens) {
      const tokenDot = token.indexOf('.');
      if (tokenDot > 0 && token.slice(0, tokenDot) === keyword) return true;
    }
    return false;
  };
  const matchedKeywords = keywords.filter(keywordMatches);
  const missingKeywords = keywords.filter((k) => !keywordMatches(k));
  const keywordRate = keywords.length ? matchedKeywords.length / keywords.length : 1;

  // --- Section completeness ---------------------------------------------
  const sections = SECTION_PATTERNS.map(({ name, pattern, test }) => {
    const present = test ? test(resume) : pattern!.test(resume);
    return {
      name,
      score: present ? 100 : 0,
      status: present ? ('pass' as const) : ('fail' as const),
      feedback: present
        ? [`${name} section found.`]
        : [`Add a ${name.toLowerCase()} section — ATS parsers look for it by heading.`],
    };
  });
  const sectionRate = sections.filter((s) => s.score === 100).length / sections.length;

  // --- Content signals ---------------------------------------------------
  const quantified = (resume.match(/\d+(\.\d+)?\s*(%|percent|\+|x\b|users|customers|requests|ms|s\b)/gi) || []).length;
  const verbHits = ACTION_VERBS.filter((v) => new RegExp(`\\b${v}\\b`, 'i').test(resume)).length;
  // PDF text extraction preserves the bullet glyphs resumes actually use:
  // en/em dashes, middle dots, guillemets and arrows, plus numbered lists.
  // Counting only • - * missed most pasted resumes' bullets entirely.
  const bulletCount = (resume.match(/^(?:[•\-*–—·›→▪]|\d+[.)])\s/mg) || []).length;
  const contentRate = Math.min(
    1,
    0.45 * Math.min(1, quantified / 5) +
      0.35 * Math.min(1, verbHits / 8) +
      0.2 * Math.min(1, bulletCount / 8),
  );

  // --- Format signals ----------------------------------------------------
  const hasEmail = /[\w.+-]+@[\w-]+\.[\w.]+/.test(resume);
  const hasPhone = hasPhoneNumber(resume);
  const lengthOk = wordCount >= 250 && wordCount <= 1200;
  const excessiveSymbols = (resume.match(/[|■◆●★]/g) || []).length > 20;
  const formatRate =
    (hasEmail ? 0.3 : 0) + (hasPhone ? 0.2 : 0) + (lengthOk ? 0.3 : 0) + (!excessiveSymbols ? 0.2 : 0);

  const atsScore = clampScore(40 * keywordRate + 25 * sectionRate + 15 * formatRate + 20 * contentRate);
  const contentScore = clampScore(100 * contentRate);
  const formatScore = clampScore(100 * formatRate);
  const overallScore = clampScore(0.45 * atsScore + 0.3 * contentScore + 0.25 * formatScore);

  // --- Recommendations, ordered by impact --------------------------------
  const recommendations: ResumeAnalysis['recommendations'] = [];
  if (missingKeywords.length) {
    recommendations.push({
      id: 'rec-keywords',
      priority: 'HIGH',
      title: `Add ${Math.min(5, missingKeywords.length)} missing keywords`,
      description: `The job description emphasises ${missingKeywords.slice(0, 5).join(', ')} — none appear in the resume. Add them only where you genuinely have the experience.`,
    });
  }
  const missingSections = sections.filter((s) => s.score === 0);
  if (missingSections.length) {
    recommendations.push({
      id: 'rec-sections',
      priority: 'HIGH',
      title: `Add missing sections: ${missingSections.map((s) => s.name).join(', ')}`,
      description: 'ATS parsers score resumes by recognised headings. Missing sections can cost the whole application before a human reads it.',
    });
  }
  if (quantified < 3) {
    recommendations.push({
      id: 'rec-metrics',
      priority: 'MED',
      title: 'Quantify more achievements',
      description: `Only ${quantified} quantified result${quantified === 1 ? '' : 's'} found. Add numbers (%, users, latency, cost saved) to at least 3 bullet points.`,
    });
  }
  if (!hasEmail || !hasPhone) {
    recommendations.push({
      id: 'rec-contact',
      priority: 'HIGH',
      title: 'Make contact details easy to parse',
      description: 'Put a plain-text email and phone number at the top of the resume. ATS parsers miss contact details hidden in headers or images.',
    });
  }
  if (!lengthOk) {
    recommendations.push({
      id: 'rec-length',
      priority: 'LOW',
      title: wordCount < 250 ? 'Resume looks too short' : 'Resume looks too long',
      description: `Current length is ${wordCount} words. Aim for roughly 400–800 words for a 1-page resume so parsers and recruiters both get the full picture.`,
    });
  }
  if (verbHits < 5) {
    recommendations.push({
      id: 'rec-verbs',
      priority: 'MED',
      title: 'Start bullets with strong action verbs',
      description: 'Lead each bullet with a verb such as built, shipped, improved or automated instead of “responsible for”.',
    });
  }

  // Look sections up by name: the checklist used to index sections[2] /
  // sections[4] / sections[3], so reordering SECTION_PATTERNS silently
  // checked the wrong section. A missing section can never pass its check.
  const sectionPassed = (name: string) =>
    sections.find((s) => s.name === name)?.score === 100;

  const atsChecklist: ResumeAnalysis['atsChecklist'] = [
    { label: 'Contact email present', checked: hasEmail },
    { label: 'Phone number present', checked: hasPhone },
    { label: 'Work experience section', checked: sectionPassed('Work Experience') },
    { label: 'Skills section', checked: sectionPassed('Skills') },
    { label: 'Education section', checked: sectionPassed('Education') },
    { label: 'Quantified achievements (3+)', checked: quantified >= 3 },
    { label: 'Resume length 250–1200 words', checked: lengthOk },
    { label: 'Job keywords covered (50%+)', checked: keywordRate >= 0.5 },
  ];

  return {
    atsScore,
    contentScore,
    formatScore,
    overallScore,
    sections,
    recommendations,
    matchedKeywords,
    missingKeywords,
    atsChecklist,
    // A deterministic audit cannot write personalised rewrites — it reports
    // this honestly instead of inventing them.
    rewrites: [],
  };
}
