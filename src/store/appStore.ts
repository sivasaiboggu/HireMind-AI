import { create } from 'zustand';
import { SavedResumeAnalysis, SavedInterview, SavedRoadmap, ActivityEvent } from '../types';

export type AppView = 'dashboard' | 'resume' | 'interview' | 'roadmap';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

interface AppState {
  view: AppView;
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toasts: Toast[];
  credits: number;
  
  resumeHistory: SavedResumeAnalysis[];
  activeResume: SavedResumeAnalysis | null;
  
  interviewHistory: SavedInterview[];
  activeInterview: SavedInterview | null;
  
  roadmapHistory: SavedRoadmap[];
  activeRoadmap: SavedRoadmap | null;
  
  // Navigation & UI Layout Actions
  setView: (view: AppView) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  
  // Notification Toast Actions
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  
  // Credit management Actions
  useCredit: (amount?: number) => boolean;
  resetCredits: () => void;
  
  // Resume Actions
  addResumeAnalysis: (analysis: SavedResumeAnalysis) => void;
  deleteResumeAnalysis: (id: string) => void;
  setActiveResume: (resume: SavedResumeAnalysis | null) => void;
  
  // Interview Actions
  addInterviewSession: (session: SavedInterview) => void;
  deleteInterviewSession: (id: string) => void;
  setActiveInterview: (interview: SavedInterview | null) => void;
  
  // Roadmap Actions
  addRoadmap: (roadmap: SavedRoadmap) => void;
  deleteRoadmap: (id: string) => void;
  setActiveRoadmap: (roadmap: SavedRoadmap | null) => void;
  togglePhaseCompleted: (roadmapId: string, phaseId: string) => void;
  
  // Metrics & Activity Helpers
  getRecentActivity: () => ActivityEvent[];
}

// LocalStorage Keys
const KEYS = {
  RESUMES: 'hiremind_resume_v9',
  INTERVIEWS: 'hiremind_interview_v9',
  ROADMAPS: 'hiremind_roadmap_v9',
  CREDITS: 'hiremind_credits_v9',
  VIEW: 'hiremind_view_v9',
  COLLAPSED: 'hiremind_collapsed_v9',
};

// Safe parsers
const getSavedJson = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const useAppStore = create<AppState>((set, get) => ({
  view: getSavedJson<AppView>(KEYS.VIEW, 'dashboard'),
  sidebarCollapsed: getSavedJson<boolean>(KEYS.COLLAPSED, false),
  searchOpen: false,
  toasts: [],
  credits: getSavedJson<number>(KEYS.CREDITS, 85), // Default starting credits
  
  resumeHistory: getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []),
  activeResume: getSavedJson<SavedResumeAnalysis | null>(KEYS.RESUMES, []).length > 0
    ? getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, [])[0]
    : null,
    
  interviewHistory: getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []),
  activeInterview: getSavedJson<SavedInterview | null>(KEYS.INTERVIEWS, []).length > 0
    ? getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, [])[0]
    : null,
    
  roadmapHistory: getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []),
  activeRoadmap: getSavedJson<SavedRoadmap | null>(KEYS.ROADMAPS, []).length > 0
    ? getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, [])[0]
    : null,

  setView: (view) => {
    set({ view });
    localStorage.setItem(KEYS.VIEW, JSON.stringify(view));
  },
  
  toggleSidebar: () => {
    const nextState = !get().sidebarCollapsed;
    set({ sidebarCollapsed: nextState });
    localStorage.setItem(KEYS.COLLAPSED, JSON.stringify(nextState));
  },
  
  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
    localStorage.setItem(KEYS.COLLAPSED, JSON.stringify(collapsed));
  },
  
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  
  addToast: (type, message) => {
    const id = crypto.randomUUID();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }]
    }));
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),
  
  useCredit: (amount = 5) => {
    const current = get().credits;
    if (current < amount) {
      get().addToast('error', 'Insufficient AI credits. Upgrade to PRO or wait for credit refresh!');
      return false;
    }
    const nextCredits = current - amount;
    set({ credits: nextCredits });
    localStorage.setItem(KEYS.CREDITS, JSON.stringify(nextCredits));
    return true;
  },
  
  resetCredits: () => {
    set({ credits: 100 });
    localStorage.setItem(KEYS.CREDITS, JSON.stringify(100));
    get().addToast('info', 'Credits successfully refreshed to 100.');
  },
  
  addResumeAnalysis: (analysis) => {
    const nextHistory = [analysis, ...get().resumeHistory];
    set({ resumeHistory: nextHistory, activeResume: analysis });
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(nextHistory));
    get().addToast('success', `Resume analyzed successfully. ATS Score: ${analysis.atsScore}`);
  },
  
  deleteResumeAnalysis: (id) => {
    const nextHistory = get().resumeHistory.filter(r => r.id !== id);
    const active = get().activeResume?.id === id
      ? (nextHistory.length > 0 ? nextHistory[0] : null)
      : get().activeResume;
    set({ resumeHistory: nextHistory, activeResume: active });
    localStorage.setItem(KEYS.RESUMES, JSON.stringify(nextHistory));
    get().addToast('info', 'Resume audit record deleted.');
  },
  
  setActiveResume: (activeResume) => set({ activeResume }),
  
  addInterviewSession: (session) => {
    const nextHistory = [session, ...get().interviewHistory];
    set({ interviewHistory: nextHistory, activeInterview: session });
    localStorage.setItem(KEYS.INTERVIEWS, JSON.stringify(nextHistory));
    get().addToast('success', `Interview evaluated. Score: ${session.overallScore}/10`);
  },
  
  deleteInterviewSession: (id) => {
    const nextHistory = get().interviewHistory.filter(i => i.id !== id);
    const active = get().activeInterview?.id === id
      ? (nextHistory.length > 0 ? nextHistory[0] : null)
      : get().activeInterview;
    set({ interviewHistory: nextHistory, activeInterview: active });
    localStorage.setItem(KEYS.INTERVIEWS, JSON.stringify(nextHistory));
    get().addToast('info', 'Interview session record deleted.');
  },
  
  setActiveInterview: (activeInterview) => set({ activeInterview }),
  
  addRoadmap: (roadmap) => {
    const nextHistory = [roadmap, ...get().roadmapHistory];
    set({ roadmapHistory: nextHistory, activeRoadmap: roadmap });
    localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
    get().addToast('success', `Learning path generated for ${roadmap.role}.`);
  },
  
  deleteRoadmap: (id) => {
    const nextHistory = get().roadmapHistory.filter(r => r.id !== id);
    const active = get().activeRoadmap?.id === id
      ? (nextHistory.length > 0 ? nextHistory[0] : null)
      : get().activeRoadmap;
    set({ roadmapHistory: nextHistory, activeRoadmap: active });
    localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
    get().addToast('info', 'Learning roadmap deleted.');
  },
  
  setActiveRoadmap: (activeRoadmap) => set({ activeRoadmap }),
  
  togglePhaseCompleted: (roadmapId, phaseId) => {
    const nextHistory = get().roadmapHistory.map((roadmap) => {
      if (roadmap.id === roadmapId) {
        const completed = roadmap.completedPhases || [];
        const nextCompleted = completed.includes(phaseId)
          ? completed.filter(p => p !== phaseId)
          : [...completed, phaseId];
        return { ...roadmap, completedPhases: nextCompleted };
      }
      return roadmap;
    });
    
    const active = get().activeRoadmap?.id === roadmapId
      ? nextHistory.find(r => r.id === roadmapId) || null
      : get().activeRoadmap;
      
    set({ roadmapHistory: nextHistory, activeRoadmap: active });
    localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
    get().addToast('info', 'Roadmap milestone progress updated.');
  },
  
  getRecentActivity: () => {
    const resumes = get().resumeHistory.map(r => ({
      id: r.id,
      type: 'resume' as const,
      title: 'Resume Analyzed',
      subtitle: `${r.jobRole} (ATS: ${r.atsScore})`,
      timestamp: r.timestamp,
      score: r.atsScore
    }));
    
    const interviews = get().interviewHistory.map(i => ({
      id: i.id,
      type: 'interview' as const,
      title: 'Mock Interview Done',
      subtitle: `${i.config.interviewType} - ${i.config.jobRole} (Score: ${i.overallScore}/10)`,
      timestamp: i.timestamp,
      score: i.overallScore * 10 // scale to percentage-ish for UI
    }));
    
    const roadmaps = get().roadmapHistory.map(r => ({
      id: r.id,
      type: 'roadmap' as const,
      title: 'Roadmap Generated',
      subtitle: `Target: ${r.role} (${r.totalWeeks} Weeks)`,
      timestamp: r.timestamp,
    }));
    
    // Sort all by timestamp desc
    return [...resumes, ...interviews, ...roadmaps].sort((a, b) => b.timestamp - a.timestamp);
  }
}));
