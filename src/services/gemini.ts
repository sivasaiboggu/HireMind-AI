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

const getApiKey = (): string => {
  // Try to read from Vite's import.meta.env or process.env configuration defines
  const apiKey = (
    import.meta.env.VITE_GEMINI_API_KEY || 
    process.env.GEMINI_API_KEY || 
    process.env.VITE_GEMINI_API_KEY || 
    process.env.API_KEY || 
    ''
  );
  return typeof apiKey === 'string' ? apiKey.trim() : '';
};

const handleApiError = (error: any, context: string): never => {
  console.error(`Gemini API error during ${context}:`, error);
  const originalMessage = error?.message || error?.toString() || '';
  
  if (originalMessage.includes('429') || originalMessage.toLowerCase().includes('quota') || originalMessage.toLowerCase().includes('limit exceeded') || originalMessage.toLowerCase().includes('resource exhausted')) {
    throw new Error(
      `[Quota/Rate Limit Exceeded (429)]\n\n` +
      `Your Google AI Studio Free Tier quota has been exhausted. To fix this, please try one of these options:\n` +
      `• Option A: Create a brand new API key in Google AI Studio (https://aistudio.google.com/) using a different Google Cloud project or a different Google account.\n` +
      `• Option B: Enable billing on your current Google Cloud project to upgrade to Pay-As-You-Go pricing.\n` +
      `• Option C: Wait a few minutes (for per-minute limits) or until midnight Pacific Time (for daily free tier limits) for your quota to reset.`
    );
  }
  
  if (originalMessage.includes('403') || originalMessage.toLowerCase().includes('denied') || originalMessage.toLowerCase().includes('permission')) {
    throw new Error(
      `[Access Denied (403)]\n\n` +
      `The Gemini API key is either invalid, lacks permissions, or has been restricted. Please verify the VITE_GEMINI_API_KEY in your .env file or generate a new key in Google AI Studio.`
    );
  }

  if (originalMessage.includes('404') || originalMessage.toLowerCase().includes('not found')) {
    throw new Error(
      `[Model/Resource Not Found (404)]\n\n` +
      `The requested Gemini model was not found or is deprecated. We have updated the app to 'gemini-2.5-flash'. Please restart your server if this persists.`
    );
  }

  throw new Error(originalMessage || `Gemini API call failed during ${context}.`);
};

export class GeminiService {
  private getClient = () => {
    const key = getApiKey();
    if (!key) {
      throw new Error(
        'Gemini API Key is missing. Please define VITE_GEMINI_API_KEY in your .env file or verify configuration.'
      );
    }
    return new GoogleGenerativeAI(key);
  };

  /**
   * Run full ATS resume analysis
   */
  analyzeResume = async (resumeText: string, jobDescription?: string): Promise<ResumeAnalysis> => {
    try {
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = RESUME_ANALYSIS_PROMPT(resumeText, jobDescription);
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
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
      
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = ANSWER_EVALUATION_PROMPT(question, expectedTopics, answer, role);
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = ROADMAP_PROMPT(goal, skills, level, timeline);
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = QUIZ_PROMPT(role, stack, count);
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = DSA_QUESTIONS_PROMPT(role, company, count, easyCount, mediumCount, hardCount);
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = THEMATIC_QUESTIONS_PROMPT(role, company, count, easyCount, mediumCount, hardCount);
      const response = await model.generateContent(prompt);
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
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });

      const prompt = AI_COMPILER_PROMPT(code, language, testCases);
      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return parsed;
    } catch (error: any) {
      return handleApiError(error, 'AI sandbox compiler execution');
    }
  };
}

export const gemini = new GeminiService();
