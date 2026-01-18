
export interface CategoryFeedback {
  strengths: string[];
  weaknesses: string[];
  score: number;
}

export interface ImprovementStep {
  issue: string;
  suggestion: string;
  example_before: string;
  example_after: string;
  rationale: string;
  category: 'Tone' | 'Content' | 'Structure' | 'Skills';
}

export interface ProjectAudit {
  name: string;
  current_description: string;
  improved_description: string;
  impact_critique: string;
  ats_relevance_score: number;
}

export interface AtsAnalysis {
  ats_score: number;
  categories: {
    tone_style: CategoryFeedback;
    content_impact: CategoryFeedback;
    structural_integrity: CategoryFeedback;
    skills_relevance: CategoryFeedback;
  };
  industry_benchmark_comparison: string;
  missing_keywords: string[];
  formatting_issues: string[];
  detailed_improvements: ImprovementStep[];
  project_audit: ProjectAudit[];
  road_to_100: string[];
  pro_tips: string[];
}

export interface SavedResumeAnalysis extends AtsAnalysis {
  id: string;
  timestamp: number;
  jobRole: string;
  experienceLevel: string;
  // Added version property to satisfy type requirements in App.tsx
  version?: number;
}

export interface InterviewEvaluation {
  technical_score: number;
  communication_score: number;
  problem_solving_score: number;
  confidence_score: number;
  overall_feedback: string;
  strengths: string[];
  weaknesses: string[];
  improvement_tips: string[];
}

export interface Message {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: number;
}

export type InterviewRound = 'BEHAVIORAL' | 'TECHNICAL' | 'CODING';

export interface SavedInterview {
  id: string;
  timestamp: number;
  jobRole: string;
  techStack: string;
  transcript: Message[];
  evaluation: InterviewEvaluation;
  roundType?: InterviewRound;
}

export interface LearningRoadmap {
  id: string;
  timestamp: number;
  field: string;
  goal: string;
  estimated_days: number;
  milestones: Array<{
    week: number;
    topic: string;
    description: string;
    tasks: string[];
    resources: Array<{ title: string; url: string }>;
  }>;
  project_suggestions: Array<{
    name: string;
    description: string;
    tech_stack: string[];
  }>;
  hiring_companies: Array<{
    name: string;
    industry: string;
    typical_roles: string[];
  }>;
}

export interface CompanyQuestion {
  id: string;
  company: string;
  role: string;
  question: string;
  category: 'Coding' | 'System Design' | 'Behavioral';
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type AppView = 'landing' | 'resume' | 'interview' | 'dashboard' | 'learning-path' | 'questions-bank';