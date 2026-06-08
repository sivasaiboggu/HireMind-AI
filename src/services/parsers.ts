import { ResumeAnalysis, Question, AnswerFeedback, Roadmap } from '../types';

/**
 * Utility functions to clean up and parse JSON responses from Gemini
 */
export function parseGeminiJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  
  // If the model wrapped the JSON in markdown code blocks, strip them out
  if (cleaned.startsWith('```')) {
    // Match both ```json ... ``` and ``` ... ```
    cleaned = cleaned
      .replace(/^```json\s*/i, '') // Remove opening ```json
      .replace(/^```\s*/, '')     // Remove opening ```
      .replace(/\s*```$/, '');    // Remove closing ```
  }
  
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON. Cleaned text:', cleaned);
    console.error('Original raw text was:', rawText);
    throw new Error('API returned an invalid JSON response structure. Please retry.');
  }
}

/**
 * Defensively cleans and normalizes ResumeAnalysis output
 */
export function sanitizeResumeAnalysis(data: any): ResumeAnalysis {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid resume analysis response: expected an object.');
  }

  const getScore = (val: any, fallback: number = 70): number => {
    const num = Number(val);
    return isNaN(num) ? fallback : Math.min(100, Math.max(0, num));
  };

  const atsScore = getScore(data.atsScore ?? data.ats_score ?? data.atsScoreCard);
  const contentScore = getScore(data.contentScore ?? data.content_score);
  const formatScore = getScore(data.formatScore ?? data.format_score);
  const overallScore = getScore(data.overallScore ?? data.overall_score ?? data.overall);

  const sections = Array.isArray(data.sections) 
    ? data.sections.map((s: any) => ({
        name: String(s?.name || 'Section'),
        score: getScore(s?.score, 8),
        status: ['pass', 'warn', 'fail'].includes(s?.status) ? s.status : 'warn',
        feedback: Array.isArray(s?.feedback) ? s.feedback.map(String) : []
      }))
    : [];

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

  const atsChecklist = Array.isArray(data.atsChecklist ?? data.ats_checklist)
    ? (data.atsChecklist ?? data.ats_checklist).map((c: any) => ({
        label: String(c?.label || 'ATS Guideline'),
        checked: Boolean(c?.checked ?? c?.status === 'pass' ?? c?.checked === 'true')
      }))
    : [];

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
 * Defensively cleans and normalizes Question[] output
 */
export function sanitizeInterviewQuestions(data: any): Question[] {
  const arr = Array.isArray(data) ? data : (Array.isArray(data?.questions) ? data.questions : []);
  return arr.map((q: any, idx: number) => ({
    id: String(q?.id || `q-${idx}`),
    text: String(q?.text || q?.question || 'No question text provided'),
    category: ['technical', 'behavioral', 'system-design', 'hr'].includes(q?.category) ? q.category : 'technical',
    difficulty: ['easy', 'medium', 'hard'].includes(q?.difficulty) ? q.difficulty : 'medium',
    expectedTopics: Array.isArray(q?.expectedTopics ?? q?.expected_topics) 
      ? (q.expectedTopics ?? q.expected_topics).map(String) 
      : []
  }));
}

/**
 * Defensively cleans and normalizes AnswerFeedback output
 */
export function sanitizeAnswerFeedback(data: any): AnswerFeedback {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid answer feedback response.');
  }

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
 * Defensively cleans and normalizes Roadmap output
 */
export function sanitizeRoadmap(data: any): Roadmap {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid roadmap response.');
  }

  const role = String(data.role || 'Target Role');
  const totalWeeks = Number(data.totalWeeks ?? data.total_weeks ?? 12) || 12;

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
