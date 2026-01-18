
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AtsAnalysis, InterviewEvaluation, LearningRoadmap, InterviewRound } from "../types";

const SYSTEM_PERSONALITY = `You are an Elite Executive Technical Recruiter. 
Your tone is professional, critical, and result-oriented. DO NOT USE EMOJIS.
Focus on hard-hitting metrics and professional clarity.`;

export class GeminiService {
  private async safeCall<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (err: any) {
        lastError = err;
        const status = err.status || (err.message?.includes('429') ? 429 : 500);
        if (status === 429 || (status >= 500 && status <= 599)) {
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  async analyzeResume(jobRole: string, experienceLevel: string, resumeText: string): Promise<AtsAnalysis> {
    return this.safeCall(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const prompt = `Perform a high-level strategic audit for a ${jobRole} (${experienceLevel}).
      Resume Text: ${resumeText}

      You must evaluate 4 critical areas: 
      1. Tone & Style: Language professional, active verbs, tone consistency.
      2. Content & Impact: Quantifiable results, STAR method, depth of contribution.
      3. Structure & Flow: Logical progression, scanability, header clarity.
      4. Skills Alignment: Keyword density, technology stack relevance, domain expertise.

      Return ONLY JSON with this EXACT structure:
      {
        "ats_score": number,
        "categories": {
          "tone_style": { "score": number, "strengths": string[], "weaknesses": string[] },
          "content_impact": { "score": number, "strengths": string[], "weaknesses": string[] },
          "structural_integrity": { "score": number, "strengths": string[], "weaknesses": string[] },
          "skills_relevance": { "score": number, "strengths": string[], "weaknesses": string[] }
        },
        "industry_benchmark_comparison": string,
        "missing_keywords": string[],
        "formatting_issues": string[],
        "detailed_improvements": [
          { "issue": string, "suggestion": string, "example_before": string, "example_after": string, "rationale": string, "category": "Tone" | "Content" | "Structure" | "Skills" }
        ],
        "project_audit": [
          { "name": string, "current_description": string, "improved_description": string, "impact_critique": string, "ats_relevance_score": number }
        ],
        "road_to_100": string[],
        "pro_tips": string[]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_PERSONALITY, responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '{}') as AtsAnalysis;
    });
  }

  async startInterview(role: string, stack: string, difficulty: string, round: InterviewRound = 'TECHNICAL'): Promise<string> {
    return this.safeCall(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Start a professional interview for ${role}. Level: ${difficulty}. Round: ${round}. NO EMOJIS.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_PERSONALITY }
      });
      return response.text || '';
    });
  }

  async getFollowUpQuestion(history: string, lastAnswer: string, round: InterviewRound = 'TECHNICAL'): Promise<string> {
    return this.safeCall(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Interview History: ${history}\nAnswer: ${lastAnswer}\nAsk a challenging follow-up. NO EMOJIS.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { systemInstruction: SYSTEM_PERSONALITY }
      });
      return response.text || '';
    });
  }

  async evaluateInterview(transcript: string): Promise<InterviewEvaluation> {
    return this.safeCall(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Evaluate transcript: ${transcript}`,
        config: { systemInstruction: SYSTEM_PERSONALITY, responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '{}') as InterviewEvaluation;
    });
  }

  async generateCustomRoadmap(field: string, goal: string): Promise<Partial<LearningRoadmap>> {
    return this.safeCall(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Roadmap for ${field}: ${goal}`,
        config: { systemInstruction: SYSTEM_PERSONALITY, responseMimeType: 'application/json' }
      });
      return JSON.parse(response.text || '{}') as Partial<LearningRoadmap>;
    });
  }
}

export const gemini = new GeminiService();
