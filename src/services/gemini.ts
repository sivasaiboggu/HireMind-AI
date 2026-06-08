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
  SYSTEM_INSTRUCTION
} from './prompts';
import { ResumeAnalysis, Question, AnswerFeedback, Roadmap, InterviewConfig } from '../types';

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
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = RESUME_ANALYSIS_PROMPT(resumeText, jobDescription);
      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeResumeAnalysis(parsed);
    } catch (error: any) {
      console.error('Gemini analyzeResume API error:', error);
      throw new Error(error.message || 'Gemini API call failed during resume analysis.');
    }
  };

  /**
   * Generate multiple interview questions based on configurations
   */
  generateInterviewQuestions = async (config: InterviewConfig): Promise<Question[]> => {
    try {
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = INTERVIEW_QUESTIONS_PROMPT(
        config.jobRole,
        config.techStack,
        config.difficulty,
        config.interviewType,
        config.questionCount
      );
      
      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeInterviewQuestions(parsed);
    } catch (error: any) {
      console.error('Gemini generateInterviewQuestions API error:', error);
      throw new Error(error.message || 'Gemini API call failed during question generation.');
    }
  };

  /**
   * Evaluate a single question-answer pair from the session
   */
  evaluateAnswer = async (question: string, answer: string, role: string, expectedTopics: string[]): Promise<AnswerFeedback> => {
    try {
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = ANSWER_EVALUATION_PROMPT(question, expectedTopics, answer, role);
      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeAnswerFeedback(parsed);
    } catch (error: any) {
      console.error('Gemini evaluateAnswer API error:', error);
      throw new Error(error.message || 'Gemini API call failed during answer evaluation.');
    }
  };

  /**
   * Generate a custom learning strategy roadmap with phases and topics
   */
  generateRoadmap = async (goal: string, skills: string[], level: string, timeline: string): Promise<Roadmap> => {
    try {
      const ai = this.getClient();
      const model = ai.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const prompt = ROADMAP_PROMPT(goal, skills, level, timeline);
      const response = await model.generateContent(prompt);
      const responseText = response.response.text();
      const parsed = parseGeminiJson<any>(responseText);
      return sanitizeRoadmap(parsed);
    } catch (error: any) {
      console.error('Gemini generateRoadmap API error:', error);
      throw new Error(error.message || 'Gemini API call failed during roadmap generation.');
    }
  };
}

export const gemini = new GeminiService();
