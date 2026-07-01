import { create } from 'zustand';
import { SavedResumeAnalysis, SavedInterview, SavedRoadmap, ActivityEvent } from '../types';
import { supabase, supabaseService, hasSupabaseConfig } from '../services/supabase';
import { User } from '@supabase/supabase-js';

export type AppView = 'dashboard' | 'resume' | 'interview' | 'roadmap' | 'quiz';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface UserProfile {
  id: string;
  full_name: string;
  target_role: string;
  credits: number;
  updated_at?: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  searchOpen: boolean;
  toasts: Toast[];
  credits: number;
  theme: 'light' | 'dark';
  
  // Auth State
  user: User | null;
  profile: UserProfile | null;
  authLoading: boolean;
  guestMode: boolean;
  
  resumeHistory: SavedResumeAnalysis[];
  activeResume: SavedResumeAnalysis | null;
  
  interviewHistory: SavedInterview[];
  activeInterview: SavedInterview | null;
  
  roadmapHistory: SavedRoadmap[];
  activeRoadmap: SavedRoadmap | null;
  
  // Layout & Theme Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  toggleTheme: () => void;
  
  // Notification Toast Actions
  addToast: (type: 'success' | 'error' | 'info', message: string) => void;
  removeToast: (id: string) => void;
  
  // Credit management Actions
  useCredit: (amount?: number) => Promise<boolean>;
  resetCredits: () => Promise<void>;
  
  // Auth Actions
  initializeAuth: () => () => void;
  signOutUser: () => Promise<void>;
  setGuestMode: (active: boolean) => void;
  
  // Resume Actions
  addResumeAnalysis: (analysis: SavedResumeAnalysis) => Promise<void>;
  deleteResumeAnalysis: (id: string) => Promise<void>;
  setActiveResume: (resume: SavedResumeAnalysis | null) => void;
  
  // Interview Actions
  addInterviewSession: (session: SavedInterview) => Promise<void>;
  deleteInterviewSession: (id: string) => Promise<void>;
  setActiveInterview: (interview: SavedInterview | null) => void;
  
  // Roadmap Actions
  addRoadmap: (roadmap: SavedRoadmap) => Promise<void>;
  deleteRoadmap: (id: string) => Promise<void>;
  setActiveRoadmap: (roadmap: SavedRoadmap | null) => void;
  togglePhaseCompleted: (roadmapId: string, phaseId: string) => Promise<void>;
  
  // Metrics & Activity Helpers
  getRecentActivity: () => ActivityEvent[];
}

// LocalStorage Keys (Guest Mode fallbacks)
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

export const generateId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
};

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: getSavedJson<boolean>(KEYS.COLLAPSED, false),
  searchOpen: false,
  toasts: [],
  credits: getSavedJson<number>(KEYS.CREDITS, 85), 
  theme: (() => {
    const saved = localStorage.getItem('hiremind_theme_v9') || 'dark';
    try {
      document.documentElement.setAttribute('data-theme', saved);
    } catch (e) {}
    return saved as 'light' | 'dark';
  })(),
  
  // Auth initial state
  user: null,
  profile: null,
  authLoading: true,
  guestMode: getSavedJson<boolean>('hiremind_guest_v9', false),
  
  resumeHistory: [],
  activeResume: null,
  interviewHistory: [],
  activeInterview: null,
  roadmapHistory: [],
  activeRoadmap: null,

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    set({ theme: nextTheme });
    localStorage.setItem('hiremind_theme_v9', nextTheme);
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
    } catch (e) {}
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
    const id = generateId();
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }]
    }));
    
    setTimeout(() => {
      get().removeToast(id);
    }, 4000);
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  /**
   * Auth Initialization Subscriber
   */
  initializeAuth: () => {
    // 1. Cross-tab LocalStorage synchronization listener
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === KEYS.CREDITS) {
        const val = getSavedJson<number>(KEYS.CREDITS, 85);
        if (get().credits !== val) {
          set({ credits: val });
          get().addToast('info', 'Sync: Credits updated');
        }
      } else if (e.key === KEYS.RESUMES) {
        const val = getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []);
        set({
          resumeHistory: val,
          activeResume: val.length > 0 ? val[0] : null
        });
        get().addToast('info', 'Sync: Resumes updated');
      } else if (e.key === KEYS.INTERVIEWS) {
        const val = getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []);
        set({
          interviewHistory: val,
          activeInterview: val.length > 0 ? val[0] : null
        });
        get().addToast('info', 'Sync: Interviews updated');
      } else if (e.key === KEYS.ROADMAPS) {
        const val = getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []);
        set({
          roadmapHistory: val,
          activeRoadmap: val.length > 0 ? val[0] : null
        });
        get().addToast('info', 'Sync: Roadmaps updated');
      }
    };
    window.addEventListener('storage', handleStorageChange);

    if (!hasSupabaseConfig) {
      // Offline mode - Load Guest historical records from localStorage immediately
      set({
        resumeHistory: getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []),
        activeResume: getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []).length > 0 ? getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, [])[0] : null,
        interviewHistory: getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []),
        activeInterview: getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []).length > 0 ? getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, [])[0] : null,
        roadmapHistory: getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []),
        activeRoadmap: getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []).length > 0 ? getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, [])[0] : null,
        guestMode: true,
        authLoading: false
      });
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    }

    // Real-time Supabase Database listeners reference variables
    let profileChannel: any = null;
    let resumeChannel: any = null;
    let interviewChannel: any = null;
    let roadmapChannel: any = null;

    const cleanRealtimeSubscriptions = () => {
      if (profileChannel) supabase.removeChannel(profileChannel);
      if (resumeChannel) supabase.removeChannel(resumeChannel);
      if (interviewChannel) supabase.removeChannel(interviewChannel);
      if (roadmapChannel) supabase.removeChannel(roadmapChannel);
    };

    // Subscribe to auth state updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      set({ authLoading: true });
      try {
        const currentUser = session?.user || null;
        cleanRealtimeSubscriptions();

        if (currentUser) {
          // Logged In -> Fetch User Data from Supabase database safely
          let userProfile = null;
          let resumes: any[] = [];
          let interviews: any[] = [];
          let roadmaps: any[] = [];

          try {
            userProfile = await supabaseService.getProfile(currentUser.id);
            resumes = await supabaseService.fetchResumes(currentUser.id);
            interviews = await supabaseService.fetchInterviews(currentUser.id);
            roadmaps = await supabaseService.fetchRoadmaps(currentUser.id);
          } catch (dbErr) {
            console.error("Supabase Database fetch failed:", dbErr);
          }

          localStorage.setItem('hiremind_guest_v9', 'false');
          set({
            user: currentUser,
            profile: userProfile,
            credits: userProfile?.credits ?? 100,
            resumeHistory: resumes,
            activeResume: resumes.length > 0 ? resumes[0] : null,
            interviewHistory: interviews,
            activeInterview: interviews.length > 0 ? interviews[0] : null,
            roadmapHistory: roadmaps,
            activeRoadmap: roadmaps.length > 0 ? roadmaps[0] : null,
            guestMode: false,
            authLoading: false
          });

          // Register table-level realtime database changes for the authenticated candidate
          try {
            profileChannel = supabase
              .channel(`profile-db-sync-${currentUser.id}`)
              .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUser.id}` },
                (payload) => {
                  const updatedProfile = payload.new as UserProfile;
                  if (updatedProfile && get().credits !== updatedProfile.credits) {
                    set({
                      profile: updatedProfile,
                      credits: updatedProfile.credits ?? 100
                    });
                    get().addToast('success', `Real-time Sync: AI Credits updated to ${updatedProfile.credits}`);
                  }
                }
              )
              .subscribe();

            resumeChannel = supabase
              .channel(`resumes-db-sync-${currentUser.id}`)
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'saved_resumes', filter: `user_id=eq.${currentUser.id}` },
                async () => {
                  try {
                    const res = await supabaseService.fetchResumes(currentUser.id);
                    set({ resumeHistory: res, activeResume: res.length > 0 ? res[0] : null });
                    get().addToast('info', 'Real-time Sync: Resumes history updated');
                  } catch (err) {}
                }
              )
              .subscribe();

            interviewChannel = supabase
              .channel(`interviews-db-sync-${currentUser.id}`)
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'saved_interviews', filter: `user_id=eq.${currentUser.id}` },
                async () => {
                  try {
                    const ints = await supabaseService.fetchInterviews(currentUser.id);
                    set({ interviewHistory: ints, activeInterview: ints.length > 0 ? ints[0] : null });
                    get().addToast('info', 'Real-time Sync: Mock Interviews updated');
                  } catch (err) {}
                }
              )
              .subscribe();

            roadmapChannel = supabase
              .channel(`roadmaps-db-sync-${currentUser.id}`)
              .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'saved_roadmaps', filter: `user_id=eq.${currentUser.id}` },
                async () => {
                  try {
                    const rds = await supabaseService.fetchRoadmaps(currentUser.id);
                    set({ roadmapHistory: rds, activeRoadmap: rds.length > 0 ? rds[0] : null });
                    get().addToast('info', 'Real-time Sync: Learning Roadmaps updated');
                  } catch (err) {}
                }
              )
              .subscribe();
          } catch (syncErr) {
            console.error("Supabase Realtime subscription initialization failed:", syncErr);
          }

        } else {
          // Logged Out -> Read from Guest localStorage mode if guestMode is true, otherwise empty
          const isGuest = getSavedJson<boolean>('hiremind_guest_v9', false);
          set({
            user: null,
            profile: null,
            credits: getSavedJson<number>(KEYS.CREDITS, 85),
            resumeHistory: isGuest ? getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []) : [],
            activeResume: isGuest && getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []).length > 0 ? getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, [])[0] : null,
            interviewHistory: isGuest ? getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []) : [],
            activeInterview: isGuest && getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []).length > 0 ? getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, [])[0] : null,
            roadmapHistory: isGuest ? getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []) : [],
            activeRoadmap: isGuest && getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []).length > 0 ? getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, [])[0] : null,
            authLoading: false
          });
        }
      } catch (err) {
        console.error("Failed executing AuthStateChange listener:", err);
        set({ authLoading: false });
      }
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      subscription.unsubscribe();
      cleanRealtimeSubscriptions();
    };
  },

  signOutUser: async () => {
    localStorage.setItem('hiremind_guest_v9', 'false');
    set({ guestMode: false });
    if (hasSupabaseConfig) {
      await supabase.auth.signOut();
    }
    get().addToast('info', 'Logged out of account session.');
  },
  
  setGuestMode: (active: boolean) => {
    localStorage.setItem('hiremind_guest_v9', JSON.stringify(active));
    set({ 
      guestMode: active,
      // Load local storage content immediately if activated
      resumeHistory: active ? getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []) : [],
      activeResume: active && getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, []).length > 0 ? getSavedJson<SavedResumeAnalysis[]>(KEYS.RESUMES, [])[0] : null,
      interviewHistory: active ? getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []) : [],
      activeInterview: active && getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, []).length > 0 ? getSavedJson<SavedInterview[]>(KEYS.INTERVIEWS, [])[0] : null,
      roadmapHistory: active ? getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []) : [],
      activeRoadmap: active && getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, []).length > 0 ? getSavedJson<SavedRoadmap[]>(KEYS.ROADMAPS, [])[0] : null,
    });
  },
  
  useCredit: async (amount = 5) => {
    const current = get().credits;
    if (current < amount) {
      get().addToast('error', 'Insufficient AI credits. Upgrade to PRO or wait for credit refresh!');
      return false;
    }
    const nextCredits = current - amount;
    
    // Update local state
    set((state) => ({
      credits: nextCredits,
      profile: state.profile ? { ...state.profile, credits: nextCredits } : null
    }));
    
    // Sync to Supabase profile
    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.updateProfile(user.id, { credits: nextCredits });
      } catch (err) {
        console.error('Failed to sync updated credits to Supabase:', err);
      }
    } else {
      localStorage.setItem(KEYS.CREDITS, JSON.stringify(nextCredits));
    }
    return true;
  },
  
  resetCredits: async () => {
    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        const userProfile = await supabaseService.getProfile(user.id);
        if (userProfile) {
          set({
            profile: userProfile,
            credits: userProfile.credits ?? 100
          });
          get().addToast('success', `Credits successfully synced from server: ${userProfile.credits}`);
        } else {
          get().addToast('error', 'Failed to retrieve profile data.');
        }
      } catch (err) {
        console.error('Failed to sync credits in Supabase:', err);
        get().addToast('error', 'Network error syncing credits.');
      }
    } else {
      set({ credits: 100 });
      localStorage.setItem(KEYS.CREDITS, JSON.stringify(100));
      get().addToast('info', 'Credits successfully refreshed to 100.');
    }
  },
  
  addResumeAnalysis: async (analysis) => {
    const nextHistory = [analysis, ...get().resumeHistory];
    set({ resumeHistory: nextHistory, activeResume: analysis });

    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.insertResume(user.id, analysis);
        // Refresh analysis listing from database to get UUID
        const refreshedResumes = await supabaseService.fetchResumes(user.id);
        set({ 
          resumeHistory: refreshedResumes, 
          activeResume: refreshedResumes.length > 0 ? refreshedResumes[0] : analysis 
        });
      } catch (err) {
        get().addToast('error', 'Failed to save resume analysis to database.');
      }
    } else {
      localStorage.setItem(KEYS.RESUMES, JSON.stringify(nextHistory));
    }
    get().addToast('success', `Resume analyzed successfully. ATS Score: ${analysis.atsScore}`);
  },
  
  deleteResumeAnalysis: async (id) => {
    const nextHistory = get().resumeHistory.filter(r => r.id !== id);
    const active = get().activeResume?.id === id
      ? (nextHistory.length > 0 ? nextHistory[0] : null)
      : get().activeResume;
    set({ resumeHistory: nextHistory, activeResume: active });

    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.deleteResume(user.id, id);
      } catch (err) {
        get().addToast('error', 'Failed to remove resume record from server.');
      }
    } else {
      localStorage.setItem(KEYS.RESUMES, JSON.stringify(nextHistory));
    }
    get().addToast('info', 'Resume audit record deleted.');
  },
  
  setActiveResume: (activeResume) => set({ activeResume }),
  
  addInterviewSession: async (session) => {
    const nextHistory = [session, ...get().interviewHistory];
    set({ interviewHistory: nextHistory, activeInterview: session });

    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.insertInterview(user.id, session);
        const refreshedInterviews = await supabaseService.fetchInterviews(user.id);
        set({ 
          interviewHistory: refreshedInterviews, 
          activeInterview: refreshedInterviews.length > 0 ? refreshedInterviews[0] : session 
        });
      } catch (err) {
        get().addToast('error', 'Failed to save interview session to database.');
      }
    } else {
      localStorage.setItem(KEYS.INTERVIEWS, JSON.stringify(nextHistory));
    }
    get().addToast('success', `Interview evaluated. Score: ${session.overallScore}/10`);
  },
  
  deleteInterviewSession: async (id) => {
    const nextHistory = get().interviewHistory.filter(i => i.id !== id);
    const active = get().activeInterview?.id === id
      ? (nextHistory.length > 0 ? nextHistory[0] : null)
      : get().activeInterview;
    set({ interviewHistory: nextHistory, activeInterview: active });

    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.deleteInterview(user.id, id);
      } catch (err) {
        get().addToast('error', 'Failed to remove interview record from database.');
      }
    } else {
      localStorage.setItem(KEYS.INTERVIEWS, JSON.stringify(nextHistory));
    }
    get().addToast('info', 'Interview session record deleted.');
  },
  
  setActiveInterview: (activeInterview) => set({ activeInterview }),
  
  addRoadmap: async (roadmap) => {
    const nextHistory = [roadmap, ...get().roadmapHistory];
    set({ roadmapHistory: nextHistory, activeRoadmap: roadmap });

    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.insertRoadmap(user.id, roadmap);
        const refreshedRoadmaps = await supabaseService.fetchRoadmaps(user.id);
        set({ 
          roadmapHistory: refreshedRoadmaps, 
          activeRoadmap: refreshedRoadmaps.length > 0 ? refreshedRoadmaps[0] : roadmap 
        });
      } catch (err) {
        get().addToast('error', 'Failed to save roadmap to database.');
      }
    } else {
      localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
    }
    get().addToast('success', `Learning path generated for ${roadmap.role}.`);
  },
  
  deleteRoadmap: async (id) => {
    const nextHistory = get().roadmapHistory.filter(r => r.id !== id);
    const active = get().activeRoadmap?.id === id
      ? (nextHistory.length > 0 ? nextHistory[0] : null)
      : get().activeRoadmap;
    set({ roadmapHistory: nextHistory, activeRoadmap: active });

    const user = get().user;
    if (user && hasSupabaseConfig) {
      try {
        await supabaseService.deleteRoadmap(user.id, id);
      } catch (err) {
        get().addToast('error', 'Failed to remove roadmap database record.');
      }
    } else {
      localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
    }
    get().addToast('info', 'Learning roadmap deleted.');
  },
  
  setActiveRoadmap: (activeRoadmap) => set({ activeRoadmap }),
  
  togglePhaseCompleted: async (roadmapId, phaseId) => {
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

    const user = get().user;
    const activeRoadmapRecord = nextHistory.find(r => r.id === roadmapId);
    if (user && hasSupabaseConfig && activeRoadmapRecord) {
      try {
        await supabaseService.updateRoadmapProgress(
          user.id, 
          roadmapId, 
          activeRoadmapRecord.completedPhases || []
        );
      } catch (err) {
        get().addToast('error', 'Failed to sync roadmap progress to database.');
      }
    } else {
      localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
    }
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
      score: i.overallScore * 10 
    }));
    
    const roadmaps = get().roadmapHistory.map(r => ({
      id: r.id,
      type: 'roadmap' as const,
      title: 'Roadmap Generated',
      subtitle: `Target: ${r.role} (${r.totalWeeks} Weeks)`,
      timestamp: r.timestamp,
    }));
    
    return [...resumes, ...interviews, ...roadmaps].sort((a, b) => b.timestamp - a.timestamp);
  }
}));

