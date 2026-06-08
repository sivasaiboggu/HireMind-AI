export interface Recommendation {
  id: string;
  priority: 'HIGH' | 'MED' | 'LOW';
  title: string;
  description: string;
}

export interface ChecklistItem {
  label: string;
  checked: boolean;
}

export interface RewriteSuggestion {
  original: string;
  improved: string;
}

export interface SectionFeedback {
  name: string;
  score: number;
  status: 'pass' | 'warn' | 'fail';
  feedback: string[];
}

export interface ResumeAnalysis {
  atsScore: number;
  contentScore: number;
  formatScore: number;
  overallScore: number;
  sections: SectionFeedback[];
  recommendations: Recommendation[];
  matchedKeywords: string[];
  missingKeywords: string[];
  atsChecklist: ChecklistItem[];
  rewrites: RewriteSuggestion[];
}

export interface SavedResumeAnalysis extends ResumeAnalysis {
  id: string;
  timestamp: number;
  jobRole: string;
  experienceLevel: string;
}

export interface Question {
  id: string;
  text: string;
  category: 'technical' | 'behavioral' | 'system-design' | 'hr';
  difficulty: 'easy' | 'medium' | 'hard';
  expectedTopics: string[];
}

export interface AnswerFeedback {
  overallScore: number;
  accuracy: number;
  clarity: number;
  depth: number;
  examples: number;
  strengths: string[];
  improvements: string[];
  modelAnswer: string;
}

export interface Resource {
  type: 'video' | 'article' | 'project' | 'quiz';
  title: string;
  url: string;
}

export interface Topic {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  whyItMatters: string;
  resources: Resource[];
}

export interface Phase {
  id: string;
  title: string;
  weeks: string;
  topics: Topic[];
  color: string;
}

export interface SkillGap {
  name: string;
  demandPercentage: number;
  gapPercentage: number;
}

export interface Roadmap {
  role: string;
  totalWeeks: number;
  phases: Phase[];
  skillGaps: SkillGap[];
}

export interface SavedRoadmap extends Roadmap {
  id: string;
  timestamp: number;
  experienceLevel: string;
  currentSkills: string[];
  completedPhases?: string[]; // IDs of phases completed by user
}

export interface InterviewConfig {
  jobRole: string;
  techStack: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Senior';
  interviewType: 'technical' | 'behavioral' | 'system-design' | 'hr';
  questionCount: number;
}

export interface AnswerRecord {
  question: Question;
  userAnswer: string;
  feedback: AnswerFeedback;
  timestamp: number;
}

export interface SavedInterview {
  id: string;
  timestamp: number;
  config: InterviewConfig;
  answers: AnswerRecord[];
  overallScore: number;
}

export interface ActivityEvent {
  id: string;
  type: 'resume' | 'interview' | 'roadmap';
  title: string;
  subtitle: string;
  timestamp: number;
  score?: number;
}
