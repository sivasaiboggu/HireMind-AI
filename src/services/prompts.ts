/**
 * central systems prompts for HireMind AI services
 */

export const SYSTEM_INSTRUCTION = `You are an elite, executive-level technical career strategist and technical recruiter.
Your tone is professional, analytical, direct, and constructive.
Do not use emojis. Focus on quantifiable metrics and professional clarity.`;

export const RESUME_ANALYSIS_PROMPT = (resumeText: string, jobDescription?: string) => `
Analyze the following resume details and benchmark them for the target job role.
${jobDescription ? `Target Job Description:\n${jobDescription}\n` : ''}

Resume Text Content:
---
${resumeText}
---

Your response MUST be a JSON object with this EXACT structure (all scores are out of 100):
{
  "atsScore": number,
  "contentScore": number,
  "formatScore": number,
  "overallScore": number,
  "sections": [
    {
      "name": "Work Experience" | "Education" | "Skills" | "Summary" | "Projects",
      "score": number,
      "status": "pass" | "warn" | "fail",
      "feedback": ["concise feedback point (max 1 sentence)", "concise feedback point (max 1 sentence)"]
    }
  ],
  "recommendations": [
    {
      "id": "string-uuid-or-number",
      "priority": "HIGH" | "MED" | "LOW",
      "title": "string action item title",
      "description": "string description of the action item (concise, max 2 sentences)"
    }
  ],
  "matchedKeywords": ["string", "string"],
  "missingKeywords": ["string", "string"],
  "atsChecklist": [
    { "label": "string criteria (e.g. Standard fonts)", "checked": boolean }
  ],
  "rewrites": [
    {
      "original": "string original weak bullet point from the resume",
      "improved": "string rewritten high-impact action-oriented bullet point using STAR method"
    }
  ]
}

Ensure the output is valid JSON and only contains the JSON block. Do not wrap the JSON in markdown blocks (e.g. do not write \`\`\`json).
`;

export const INTERVIEW_QUESTIONS_PROMPT = (role: string, stack: string[], difficulty: string, type: string, count: number) => `
Generate exactly ${count} mock interview questions for the role: "${role}".
Target Stack: ${stack.join(', ')}
Seniority Level: ${difficulty}
Interview Focus Type: ${type} (can be 'technical', 'behavioral', 'system-design', 'hr', or 'full')

${type === 'full' ? `
For 'full' type, the interview must be a complete progressive loop of:
- First ~25%: Easy Technical questions.
- Next ~25%: Coding challenges (requiring writing actual code snippets).
- Next ~25%: Medium System Design or Behavioral questions.
- Last ~25%: HR/cultural fit questions.
The difficulty of questions MUST escalate progressively from easy to hard.
` : `
Each question should challenge the candidate's core expertise. Provide realistic technical, scenario-based, or behavioral questions.
`}

Your response MUST be a JSON array of objects with this EXACT structure:
[
  {
    "id": "string",
    "text": "string (the interview question text)",
    "category": "technical" | "behavioral" | "system-design" | "hr",
    "difficulty": "easy" | "medium" | "hard",
    "expectedTopics": ["string expected topic 1", "string expected topic 2"]
  }
]

Ensure the output is valid JSON and only contains the JSON block. Do not wrap the JSON in markdown blocks.
`;

export const ANSWER_EVALUATION_PROMPT = (question: string, expectedTopics: string[], answer: string, role: string) => `
Evaluate the candidate's answer to the following interview question for a "${role}" position.

Question: "${question}"
Expected Topics to cover: ${expectedTopics.join(', ')}
Candidate's Answer: "${answer}"

Provide an objective critique and score the response on 4 dimensions (Accuracy, Clarity, Depth, Examples) out of 10.
Provide an overall score out of 10.

Your response MUST be a JSON object with this EXACT structure:
{
  "overallScore": number,
  "accuracy": number,
  "clarity": number,
  "depth": number,
  "examples": number,
  "strengths": ["concise strength (max 1 sentence)", "concise strength (max 1 sentence)"],
  "improvements": ["concise improvement area (max 1 sentence)", "concise improvement area (max 1 sentence)"],
  "modelAnswer": "string (a high-quality, professional, and concise reference answer demonstrating how to answer this question perfectly, max 4 sentences)"
}

Ensure the output is valid JSON and only contains the JSON block. Do not wrap the JSON in markdown blocks.
`;

export const ROADMAP_PROMPT = (goal: string, skills: string[], level: string, timeline: string) => `
Generate a highly structured, step-by-step learning roadmap to help a candidate achieve their target career goal.
Career Goal: "${goal}"
Current Skills: ${skills.join(', ')}
Current Experience Level: ${level}
Target Completion Timeline: ${timeline}

Your response MUST be a JSON object with this EXACT structure:
{
  "role": "string (the target role title)",
  "totalWeeks": number,
  "phases": [
    {
      "id": "string",
      "title": "string (e.g. Phase 1: Foundations)",
      "weeks": "string (e.g. Weeks 1–3)",
      "color": "string (tailwind-like color reference or hex: e.g. #818CF8, #00D4AA, #F59E0B)",
      "topics": [
        {
          "id": "string",
          "name": "string (topic name)",
          "level": "Beginner" | "Intermediate" | "Advanced",
          "description": "string (topic brief description, max 2 sentences)",
          "whyItMatters": "Why this matters: concise 1-sentence explanation",
          "resources": [
            {
              "type": "video" | "article" | "project" | "quiz",
              "title": "string resource title",
              "url": "string valid URL (suggest official docs, standard learning platform, MDN, or YouTube search query link)"
            }
          ]
        }
      ]
    }
  ],
  "skillGaps": [
    {
      "name": "string (skill name)",
      "demandPercentage": number,
      "gapPercentage": number
    }
  ]
}

Ensure the output is valid JSON and only contains the JSON block. Do not wrap the JSON in markdown blocks.
`;

export const QUIZ_PROMPT = (role: string, stack: string[], count: number) => `
Generate exactly \${count} practice quiz questions for a candidate targeted at the role "\${role}" with tech stack: \${stack.join(', ')}.
The quiz must include a mix of:
- Multiple-choice questions (MCQs) testing core concepts.
- Coding snippet questions (where the user identifies the output or fills in the blank).

Your response MUST be a JSON array of objects with this EXACT structure:
[
  {
    "id": "string",
    "text": "string (the quiz question text or question about coding snippet)",
    "codeSnippet": "string (optional, any code block to display for analysis, or empty)",
    "type": "mcq" | "coding-fill",
    "options": ["Option A", "Option B", "Option C", "Option D"], // Provide exactly 4 options for mcq. Empty array for coding-fill.
    "correctAnswer": "string (exact correct option matching one of the options, or the correct code snippet/answer for coding-fill)",
    "explanation": "string (detailed, professional explanation of why this answer is correct)",
    "category": "technical" | "coding" | "behavioral"
  }
]

Ensure the output is valid JSON and only contains the JSON block. Do not wrap the JSON in markdown blocks.
`;
