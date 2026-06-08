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
      "feedback": ["string feedback point 1", "string feedback point 2"]
    }
  ],
  "recommendations": [
    {
      "id": "string-uuid-or-number",
      "priority": "HIGH" | "MED" | "LOW",
      "title": "string action item title",
      "description": "string detailed description of the action item"
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
Interview Focus Type: ${type}

Each question should challenge the candidate's core expertise. Provide realistic technical, scenario-based, or behavioral questions.

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
  "strengths": ["string strength 1", "string strength 2"],
  "improvements": ["string improvement area 1", "string improvement area 2"],
  "modelAnswer": "string (a high-quality, comprehensive reference answer that demonstrates how to answer this question perfectly)"
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
          "description": "string (topic brief description)",
          "whyItMatters": "Why this matters: 1-sentence explanation",
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
