import { ResumeAnalysis, Question, AnswerFeedback, Roadmap } from '../types';

/**
 * Strips markdown code blocks (e.g., ```json ... ```) from the LLM's raw text response
 * and parses the clean string as JSON. If the parsing fails, it logs diagnostic errors
 * and throws a user-friendly error message.
 */
export function parseGeminiJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  
  // E.g., if the LLM output is wrapped inside markdown tags, we need to extract the raw JSON
  if (cleaned.startsWith('```')) {
    cleaned = cleaned
      .replace(/^```json\s*/i, '') // Remove opening json codeblock tag
      .replace(/^```\s*/, '')     // Remove generic opening codeblock tag
      .replace(/\s*```$/, '');    // Remove closing codeblock tag
  }
  
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    // Log the malformed response so we can debug prompt issues in Google AI Studio
    console.error('Failed to parse Gemini response as JSON. Cleaned text:', cleaned);
    console.error('Original raw text was:', rawText);
    throw new Error('API returned an invalid JSON response structure. Please retry.');
  }
}

/**
 * Normalizes and validates the raw resume audit data returned from the LLM.
 * This guarantees that even if the AI misses properties or formats scores as strings,
 * the UI will receive a clean, predictable object matching the ResumeAnalysis type.
 */
export function sanitizeResumeAnalysis(data: any): ResumeAnalysis {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid resume analysis response: expected an object.');
  }

  // Ensures we always get a valid numeric score between 0 and 100
  const getScore = (val: any, fallback: number = 70): number => {
    const num = Number(val);
    return isNaN(num) ? fallback : Math.min(100, Math.max(0, num));
  };

  const atsScore = getScore(data.atsScore ?? data.ats_score ?? data.atsScoreCard);
  const contentScore = getScore(data.contentScore ?? data.content_score);
  const formatScore = getScore(data.formatScore ?? data.format_score);
  const overallScore = getScore(data.overallScore ?? data.overall_score ?? data.overall);

  // Normalize checklist guidelines and pass/warn/fail indicators
  const sections = Array.isArray(data.sections) 
    ? data.sections.map((s: any) => ({
        name: String(s?.name || 'Section'),
        score: getScore(s?.score, 8),
        status: ['pass', 'warn', 'fail'].includes(s?.status) ? s.status : 'warn',
        feedback: Array.isArray(s?.feedback) ? s.feedback.map(String) : []
      }))
    : [];

  // Parse recommendations and assign priority levels
  const recommendations = Array.isArray(data.recommendations)
    ? data.recommendations.map((r: any, idx: number) => ({
        id: String(r?.id || `rec-${idx}`),
        priority: ['HIGH', 'MED', 'LOW'].includes(r?.priority) ? r.priority : 'MED',
        title: String(r?.title || 'Recommendation'),
        description: String(r?.description || '')
      }))
    : [];

  const matchedKeywords = Array.isArray(data.matchedKeywords ?? data.matched_keywords)
    ? (data.matchedKeywords ?? data.matched_keywords).map(String)
    : [];

  const missingKeywords = Array.isArray(data.missingKeywords ?? data.missing_keywords)
    ? (data.missingKeywords ?? data.missing_keywords).map(String)
    : [];

  // Validate ATS checklist items and flags
  const atsChecklist = Array.isArray(data.atsChecklist ?? data.ats_checklist)
    ? (data.atsChecklist ?? data.ats_checklist).map((c: any) => ({
        label: String(c?.label || 'ATS Guideline'),
        checked: Boolean(c?.checked === true || c?.checked === 'true' || c?.status === 'pass')
      }))
    : [];

  // Parse suggested sentence-level rewrites
  const rewrites = Array.isArray(data.rewrites)
    ? data.rewrites.map((rw: any) => ({
        original: String(rw?.original || ''),
        improved: String(rw?.improved || rw?.star_improved || rw?.starImproved || '')
      }))
    : [];

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
    rewrites
  };
}

/**
 * Standardizes questions returned by the AI mock generator.
 * Maps category fields to standard types including DSA rounds.
 */
export function sanitizeInterviewQuestions(data: any): Question[] {
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : []);
  return arr.map((q: any, idx: number) => ({
    id: String(q?.id || `q-${idx}`),
    text: String(q?.text || q?.question || 'No question text provided'),
    category: ['technical', 'behavioral', 'system-design', 'hr', 'dsa'].includes(q?.category) ? q.category : 'technical',
    difficulty: ['easy', 'medium', 'hard'].includes(q?.difficulty) ? q.difficulty : 'medium',
    expectedTopics: Array.isArray(q?.expectedTopics ?? q?.expected_topics) 
      ? (q.expectedTopics ?? q.expected_topics).map(String) 
      : []
  }));
}

/**
 * Validates evaluation scorecards for individual mock interview answers.
 * Scores are validated on a standard 1 to 10 rating scale.
 */
export function sanitizeAnswerFeedback(data: any): AnswerFeedback {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid answer feedback response.');
  }

  // Ensures sub-ratings are within valid range [0, 10]
  const getScore = (val: any, fallback: number = 5): number => {
    const num = Number(val);
    return isNaN(num) ? fallback : Math.min(10, Math.max(0, num));
  };

  return {
    overallScore: getScore(data.overallScore ?? data.overall_score ?? data.overall),
    accuracy: getScore(data.accuracy),
    clarity: getScore(data.clarity),
    depth: getScore(data.depth),
    examples: getScore(data.examples),
    strengths: Array.isArray(data.strengths) ? data.strengths.map(String) : [],
    improvements: Array.isArray(data.improvements) ? data.improvements.map(String) : [],
    modelAnswer: String(data.modelAnswer ?? data.model_answer ?? 'N/A')
  };
}

/**
 * Sanitizes the structured learning path curriculum generated by the AI model.
 * Maps out stages, weekly outlines, recommended resource URLs, and skill deficits.
 */
export function sanitizeRoadmap(data: any): Roadmap {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid roadmap response.');
  }

  const role = String(data.role || 'Target Role');
  const totalWeeks = Number(data.totalWeeks ?? data.total_weeks ?? 12) || 12;

  // Build the learning roadmap stages recursively
  const phases = Array.isArray(data.phases)
    ? data.phases.map((p: any, pIdx: number) => ({
        id: String(p?.id || `phase-${pIdx}`),
        title: String(p?.title || `Phase ${pIdx + 1}`),
        weeks: String(p?.weeks || ''),
        color: String(p?.color || '#818CF8'),
        topics: Array.isArray(p?.topics)
          ? p.topics.map((t: any, tIdx: number) => ({
              id: String(t?.id || `topic-${pIdx}-${tIdx}`),
              name: String(t?.name || 'Topic'),
              level: ['Beginner', 'Intermediate', 'Advanced'].includes(t?.level) ? t.level : 'Intermediate',
              description: String(t?.description || ''),
              whyItMatters: String(t?.whyItMatters ?? t?.why_it_matters ?? ''),
              resources: Array.isArray(t?.resources)
                ? t.resources.map((r: any) => ({
                    type: ['video', 'article', 'project', 'quiz'].includes(r?.type) ? r.type : 'article',
                    title: String(r?.title || 'Resource Link'),
                    url: String(r?.url || 'https://google.com')
                  }))
                : []
            }))
          : []
      }))
    : [];

  // Parse user skill gap recommendations
  const skillGaps = Array.isArray(data.skillGaps ?? data.skill_gaps)
    ? (data.skillGaps ?? data.skill_gaps).map((g: any) => ({
        name: String(g?.name || 'Skill'),
        demandPercentage: Number(g?.demandPercentage ?? g?.demand_percentage ?? 50) || 50,
        gapPercentage: Number(g?.gapPercentage ?? g?.gap_percentage ?? 30) || 30
      }))
    : [];

  return {
    role,
    totalWeeks,
    phases,
    skillGaps
  };
}
