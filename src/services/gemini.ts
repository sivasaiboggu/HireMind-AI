import { safeApiError } from './api-errors';
import { resolveGeminiApiKey, readStoredGeminiKey } from './ai-key';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { 
  parseGeminiJson, 
  sanitizeResumeAnalysis, 
  sanitizeInterviewQuestions, 
  sanitizeAnswerFeedback, 
  sanitizeRoadmap 
} from './parsers';
import { 
  RESUME_ANALYSIS_PROMPT, 
  INTERVIEW_QUESTIONS_PROMPT, 
  ANSWER_EVALUATION_PROMPT, 
  ROADMAP_PROMPT,
  SYSTEM_INSTRUCTION,
  QUIZ_PROMPT,
  DSA_QUESTIONS_PROMPT,
  THEMATIC_QUESTIONS_PROMPT,
  AI_COMPILER_PROMPT
} from './prompts';
import { ResumeAnalysis, Question, AnswerFeedback, Roadmap, InterviewConfig, QuizQuestion } from '../types';

import { supabase, hasSupabaseConfig } from './supabase';
import type { RequestOptions } from '@google/generative-ai';

// Optional authenticated server-side proxy (Supabase edge function). When set
// and the user is signed in, AI calls go through it and the provider key stays
// on the server. Guests and signed-out users fall back to their own key.
const PROXY_URL = (import.meta.env.VITE_GEMINI_PROXY_URL || '').trim();

const getApiKey = (): string => {
  // Public builds reject baked-in provider secrets. Local development uses the
  // env key; everyone can connect their own free Google AI key from the top bar.
  return resolveGeminiApiKey({
    isDev: import.meta.env.DEV,
    devKey: import.meta.env.VITE_GEMINI_API_KEY || '',
    storedKey: readStoredGeminiKey()
  });
};

const handleApiError = (error: unknown, _context: string): never => { throw safeApiError(error); };

export class GeminiService {
  private getRequestOptions = async (): Promise<RequestOptions | undefined> => {
    if (!PROXY_URL || !hasSupabaseConfig) return undefined;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return undefined;
      return {
        baseUrl: PROXY_URL,
        apiVersion: 'v1beta',
        customHeaders: { Authorization: `Bearer ${token}` }
      };
    } catch {
      return undefined;
    }
  };

  private getClient = (viaProxy: boolean) => {
    if (viaProxy) {
      // The proxy replaces this placeholder with the server-side key.
      return new GoogleGenerativeAI('server-managed');
    }
    const key = getApiKey();
    if (!key) {
      throw new Error(
        'AI features need a Google AI key. Tap the key icon in the top bar to connect your free key, then try again.'
      );
    }
    return new GoogleGenerativeAI(key);
  };

  /**
   * Run full ATS resume analysis
   */
  analyzeResume = async (resumeText: string, jobDescription?: string): Promise<ResumeAnalysis> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = RESUME_ANALYSIS_PROMPT(resumeText, jobDescription);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeResumeAnalysis(parsed);
    } catch (error: any) {
      return handleApiError(error, 'resume analysis');
    }
  };

  /**
   * Generate multiple interview questions based on configurations
   */
  generateInterviewQuestions = async (config: InterviewConfig): Promise<Question[]> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = INTERVIEW_QUESTIONS_PROMPT(
        config.jobRole,
        config.techStack,
        config.difficulty,
        config.interviewType,
        config.questionCount,
        config.targetCompany,
        config.candidateBackground || ''
      );
      
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeInterviewQuestions(parsed);
    } catch (error: any) {
      return handleApiError(error, 'question generation');
    }
  };

  /**
   * Evaluate a single question-answer pair from the session
   */
  evaluateAnswer = async (question: string, answer: string, role: string, expectedTopics: string[]): Promise<AnswerFeedback> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = ANSWER_EVALUATION_PROMPT(question, expectedTopics, answer, role);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeAnswerFeedback(parsed);
    } catch (error: any) {
      return handleApiError(error, 'answer evaluation');
    }
  };

  /**
   * Generate a custom learning strategy roadmap with phases and topics
   */
  generateRoadmap = async (goal: string, skills: string[], level: string, timeline: string): Promise<Roadmap> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = ROADMAP_PROMPT(goal, skills, level, timeline);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeRoadmap(parsed);
    } catch (error: any) {
      return handleApiError(error, 'roadmap generation');
    }
  };

  /**
   * Generate multiple quiz questions based on configuration
   */
  generateQuizQuestions = async (role: string, stack: string[], count: number = 5): Promise<QuizQuestion[]> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = QUIZ_PROMPT(role, stack, count);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      
      const arr = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : []);
      return arr.map((q: any, idx: number) => ({
        id: String(q?.id || `quiz-q-${idx}`),
        text: String(q?.text || q?.question || 'No question text provided'),
        codeSnippet: q?.codeSnippet || q?.code_snippet || undefined,
        type: ['mcq', 'coding-fill'].includes(q?.type) ? q.type : 'mcq',
        options: Array.isArray(q?.options) ? q.options.map(String) : [],
        correctAnswer: String(q?.correctAnswer || q?.correct_answer || ''),
        explanation: String(q?.explanation || ''),
        category: ['technical', 'coding', 'behavioral'].includes(q?.category) ? q.category : 'technical'
      }));
    } catch (error: any) {
      return handleApiError(error, 'quiz generation');
    }
  };

  /**
   * Generate DSA questions
   */
  generateDsaQuestions = async (
    role: string,
    company: string,
    count: number,
    easyCount: number,
    mediumCount: number,
    hardCount: number
  ): Promise<any[]> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = DSA_QUESTIONS_PROMPT(role, company, count, easyCount, mediumCount, hardCount);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : []);
    } catch (error: any) {
      return handleApiError(error, 'DSA questions generation');
    }
  };

  /**
   * Generate Technical, Behavioural, and HR questions
   */
  generateNonDsaQuestions = async (
    role: string,
    company: string,
    count: number,
    easyCount: number,
    mediumCount: number,
    hardCount: number
  ): Promise<any[]> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = THEMATIC_QUESTIONS_PROMPT(role, company, count, easyCount, mediumCount, hardCount);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.questions) ? parsed.questions : []);
    } catch (error: any) {
      return handleApiError(error, 'interview questions generation');
    }
  };

  /**
   * Simulate a C++ or Java compiler run
   */
  simulateCompilerRun = async (
    code: string,
    language: string,
    testCases: any[]
  ): Promise<any> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = AI_COMPILER_PROMPT(code, language, testCases);
      const response = await model.generateContent(prompt, requestOptions);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return parsed;
    } catch (error: any) {
      return handleApiError(error, 'AI sandbox compiler execution');
    }
  };

  /**
   * Quick conversational dialogue response for candidates asking questions in the call
   */
  converseWithCandidate = async (
    candidateText: string,
    currentQuestion: string,
    role: string,
    interviewerName: string
  ): Promise<string> => {
    try {
      const requestOptions = await this.getRequestOptions();
      const ai = this.getClient(!!requestOptions);
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION
      });

      const prompt = `
You are the AI interviewer named ${interviewerName} conducting a live technical/behavioral interview for a ${role} position.
The current interview question is: "${currentQuestion}".

The candidate just said/asked: "${candidateText}".

Please respond to the candidate directly in a natural, helpful, yet brief and professional manner.
If they asked a technical question (like explaining a concept or asking for clarification), explain it clearly in 2-3 sentences max.
Then, encourage them to continue with their main answer.
Do not provide the full code or solution directly, but guide them if they are stuck.
Keep your response conversational, concise, and under 70 words.
      `;

      const response = await model.generateContent(prompt, requestOptions);
      return response.response.text();
    } catch (error: any) {
      // Do not log raw provider errors, which may include private request text.
      throw safeApiError(error);
    }
  };
}

export const gemini = new GeminiService();
