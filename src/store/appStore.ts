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

// Persisted JSON is untrusted. Validate nested records before UI consumers use
// .map(), .length or string methods. Never rewrite rejected stored bytes here.
type StoredObject = Record<string, any>;
const object = (v: unknown): v is StoredObject => !!v && typeof v === 'object' && !Array.isArray(v);
const text = (v: unknown) => typeof v === 'string';
const texts = (v: unknown) => Array.isArray(v) && v.every(text);
const numberIn = (v: unknown, max = Number.MAX_VALUE) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= max;
const list = (v: unknown, check: (item: any) => boolean) => Array.isArray(v) && v.every(item => object(item) && check(item));
const oneOf = (v: unknown, choices: string[]) => typeof v === 'string' && choices.includes(v);
const baseRecord = (v: StoredObject) => text(v.id) && !!v.id.trim() && numberIn(v.timestamp);
const feedbackRecord = (v: StoredObject) =>
  ['overallScore', 'accuracy', 'clarity', 'depth', 'examples'].every(k => numberIn(v[k], 10)) &&
  texts(v.strengths) && texts(v.improvements) && text(v.modelAnswer);
const questionRecord = (v: StoredObject) => text(v.id) && text(v.text) &&
  oneOf(v.category, ['technical', 'behavioral', 'system-design', 'hr', 'dsa']) &&
  oneOf(v.difficulty, ['easy', 'medium', 'hard']) && texts(v.expectedTopics);
const resumeRecord = (v: StoredObject) => baseRecord(v) && text(v.jobRole) && text(v.experienceLevel) &&
  ['atsScore', 'contentScore', 'formatScore', 'overallScore'].every(k => numberIn(v[k], 100)) &&
  list(v.sections, s => text(s.name) && numberIn(s.score, 100) && oneOf(s.status, ['pass', 'warn', 'fail']) && texts(s.feedback)) &&
  list(v.recommendations, r => text(r.id) && oneOf(r.priority, ['HIGH', 'MED', 'LOW']) && text(r.title) && text(r.description)) &&
  texts(v.matchedKeywords) && texts(v.missingKeywords) &&
  list(v.atsChecklist, c => text(c.label) && typeof c.checked === 'boolean') &&
  list(v.rewrites, r => text(r.original) && text(r.improved));
const interviewRecord = (v: StoredObject) => baseRecord(v) && numberIn(v.overallScore, 10) &&
  object(v.config) && text(v.config.jobRole) && texts(v.config.techStack) &&
  oneOf(v.config.difficulty, ['Beginner', 'Intermediate', 'Senior']) &&
  oneOf(v.config.interviewType, ['technical', 'behavioral', 'system-design', 'hr', 'full', 'dsa']) &&
  numberIn(v.config.questionCount) && Number.isInteger(v.config.questionCount) &&
  list(v.answers, a => object(a.question) && questionRecord(a.question) && text(a.userAnswer) &&
    object(a.feedback) && feedbackRecord(a.feedback) && numberIn(a.timestamp));
const safeResource = (v: StoredObject) => {
  if (!oneOf(v.type, ['video', 'article', 'project', 'quiz']) || !text(v.title) || !text(v.url)) return false;
  try {
    const url = new URL(v.url);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
};
const roadmapRecord = (v: StoredObject) => baseRecord(v) && text(v.role) && text(v.experienceLevel) &&
  texts(v.currentSkills) && numberIn(v.totalWeeks, 104) && v.totalWeeks >= 1 &&
  list(v.phases, p => text(p.id) && text(p.title) && text(p.weeks) && text(p.color) &&
    list(p.topics, t => text(t.id) && text(t.name) && oneOf(t.level, ['Beginner', 'Intermediate', 'Advanced']) &&
      text(t.description) && text(t.whyItMatters) && list(t.resources, safeResource))) &&
  list(v.skillGaps, g => text(g.name) && numberIn(g.demandPercentage, 100) && numberIn(g.gapPercentage, 100)) &&
  (v.completedPhases === undefined || (texts(v.completedPhases) &&
    v.completedPhases.every((id: string) => v.phases.some((p: StoredObject) => p.id === id))));
const historyValidators: Record<string, (v: StoredObject) => boolean> = {
  [KEYS.RESUMES]: resumeRecord, [KEYS.INTERVIEWS]: interviewRecord, [KEYS.ROADMAPS]: roadmapRecord,
};

// Safe parsers
const getSavedJson = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    const parsed: unknown = JSON.parse(data);
    // JSON syntax alone does not make a stored preference/history usable.
    // Reject incompatible containers without overwriting the recoverable bytes.
    if (Array.isArray(defaultValue)) {
      if (!Array.isArray(parsed)) return defaultValue;
      const validate = historyValidators[key];
      return parsed.filter(item => object(item) && (!validate || validate(item))) as T;
    } else if (typeof parsed !== typeof defaultValue || parsed === null) return defaultValue;
    if (typeof parsed === 'number' && (!Number.isFinite(parsed) || parsed < 0)) return defaultValue;
    return parsed as T;
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

// Serialize local writes to one roadmap so rapid toggles do not overwrite each
// other. This is not a server-side cross-tab concurrency or quota boundary.
const progressWrites = new Map<string, Promise<void>>();

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: getSavedJson<boolean>(KEYS.COLLAPSED, false),
  searchOpen: false,
  toasts: [],
  credits: getSavedJson<number>(KEYS.CREDITS, 85), 
  theme: (() => {
    let saved: 'light' | 'dark' = 'dark';
    try { saved = localStorage.getItem('hiremind_theme_v9') === 'light' ? 'light' : 'dark'; } catch {}
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
      // Guest localStorage changes must not overwrite a signed-in workspace.
      if (!e.key || get().user) return;
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

    let authEpoch = 0;
    let resumeRead = 0, interviewRead = 0, roadmapRead = 0;
    let disposed = false;
    // Run database work after Supabase releases its auth callback. Each auth
    // event invalidates earlier work, including in-flight realtime reads.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const epoch = ++authEpoch;
      const isCurrent = () => !disposed && epoch === authEpoch;
      const incomingUser = session?.user || null;
      cleanRealtimeSubscriptions();
      set({ authLoading: true, user: incomingUser, profile: null, credits: 0, guestMode: false,
        resumeHistory: [], activeResume: null, interviewHistory: [],
        activeInterview: null, roadmapHistory: [], activeRoadmap: null });
      setTimeout(() => { void (async () => {
      if (!isCurrent()) return;
      try {
        const currentUser = session?.user || null;
        cleanRealtimeSubscriptions();

        if (currentUser) {
          // Logged In -> Fetch User Data from Supabase database safely with 6s timeout
          const withTimeout = <T>(promise: Promise<T>, ms = 6000): Promise<T> =>
            Promise.race([
              promise,
              new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error('Saved history request timed out')), ms))
            ]);

          let userProfile = null;
          let resumes: any[] = [];
          let interviews: any[] = [];
          let roadmaps: any[] = [];

          try {
            [userProfile, resumes, interviews, roadmaps] = await Promise.all([
              withTimeout(supabaseService.getProfile(currentUser.id)),
              withTimeout(supabaseService.fetchResumes(currentUser.id)),
              withTimeout(supabaseService.fetchInterviews(currentUser.id)),
              withTimeout(supabaseService.fetchRoadmaps(currentUser.id))
            ]);
          } catch (dbErr) {
            console.error("Supabase Database fetch failed:", dbErr);
            if (isCurrent()) get().addToast('error', 'Saved history could not be loaded. Your records have not been deleted. Try signing in again.');
          }

          if (!isCurrent()) return;
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
                  if (!isCurrent()) return;
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
                    if (!isCurrent()) return;
                    const read = ++resumeRead;
                    const res = await supabaseService.fetchResumes(currentUser.id);
                    if (!isCurrent() || read !== resumeRead) return;
                    set({ resumeHistory: res, activeResume: res.find(item => item.id === get().activeResume?.id) || res[0] || null });
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
                    if (!isCurrent()) return;
                    const read = ++interviewRead;
                    const ints = await supabaseService.fetchInterviews(currentUser.id);
                    if (!isCurrent() || read !== interviewRead) return;
                    set({ interviewHistory: ints, activeInterview: ints.find(item => item.id === get().activeInterview?.id) || ints[0] || null });
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
                    if (!isCurrent()) return;
                    const read = ++roadmapRead;
                    const rds = await supabaseService.fetchRoadmaps(currentUser.id);
                    if (!isCurrent() || read !== roadmapRead) return;
                    set({ roadmapHistory: rds, activeRoadmap: rds.find(item => item.id === get().activeRoadmap?.id) || rds[0] || null });
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
        if (isCurrent()) set({ authLoading: false });
      }
      })(); }, 0);
    });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      disposed = true;
      ++authEpoch;
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
    const ownerId = get().user?.id ?? null;
    try {
      let saved = analysis;
      if (ownerId && hasSupabaseConfig) {
        const record = await supabaseService.insertResume(ownerId, analysis);
        if (!record?.id) throw new Error('Save did not return a record ID.');
        saved = { ...analysis, id: record.id };
      } else {
        const nextHistory = [analysis, ...get().resumeHistory];
        localStorage.setItem(KEYS.RESUMES, JSON.stringify(nextHistory));
      }
      // A response for a prior account must never enter the current workspace.
      if ((get().user?.id ?? null) !== ownerId) return;
      set({ resumeHistory: [saved, ...get().resumeHistory.filter(row => row.id !== saved.id)],
            activeResume: saved });
      get().addToast('success', 'Resume analysis saved.');
    } catch (err) {
      if ((get().user?.id ?? null) !== ownerId) return;
      get().addToast('error', 'Resume analysis could not be saved. Keep this result open and try again.');
    }
  },
  
  deleteResumeAnalysis: async (id) => {
    // Persist first. A rejected deletion must not disappear locally or claim success.
    const user = get().user;
    const ownerId = user?.id ?? null;
    try {
      if (user && hasSupabaseConfig) {
        await supabaseService.deleteResume(user.id, id);
      } else {
        const nextHistory = get().resumeHistory.filter(record => record.id !== id);
        localStorage.setItem(KEYS.RESUMES, JSON.stringify(nextHistory));
      }
      if ((get().user?.id ?? null) !== ownerId) return;
      // Read current state after await so unrelated updates are not overwritten.
      const nextHistory = get().resumeHistory.filter(record => record.id !== id);
      const active = get().activeResume?.id === id
        ? (nextHistory[0] || null) : get().activeResume;
      set({ resumeHistory: nextHistory, activeResume: active });
      get().addToast('info', 'Resume audit record deleted.');
    } catch (err) {
      if ((get().user?.id ?? null) !== ownerId) return;
      get().addToast('error', 'Failed to remove resume record from server.');
    }
  },
  
  setActiveResume: (activeResume) => set({ activeResume }),
  
  addInterviewSession: async (session) => {
    const ownerId = get().user?.id ?? null;
    try {
      let saved = session;
      if (ownerId && hasSupabaseConfig) {
        const record = await supabaseService.insertInterview(ownerId, session);
        if (!record?.id) throw new Error('Save did not return a record ID.');
        saved = { ...session, id: record.id };
      } else {
        const nextHistory = [session, ...get().interviewHistory];
        localStorage.setItem(KEYS.INTERVIEWS, JSON.stringify(nextHistory));
      }
      // A response for a prior account must never enter the current workspace.
      if ((get().user?.id ?? null) !== ownerId) return;
      set({ interviewHistory: [saved, ...get().interviewHistory.filter(row => row.id !== saved.id)],
            activeInterview: saved });
      get().addToast('success', 'Interview session saved.');
    } catch (err) {
      if ((get().user?.id ?? null) !== ownerId) return;
      get().addToast('error', 'Interview session could not be saved. Keep this result open and try again.');
    }
  },
  
  deleteInterviewSession: async (id) => {
    // Persist first. A rejected deletion must not disappear locally or claim success.
    const user = get().user;
    const ownerId = user?.id ?? null;
    try {
      if (user && hasSupabaseConfig) {
        await supabaseService.deleteInterview(user.id, id);
      } else {
        const nextHistory = get().interviewHistory.filter(record => record.id !== id);
        localStorage.setItem(KEYS.INTERVIEWS, JSON.stringify(nextHistory));
      }
      if ((get().user?.id ?? null) !== ownerId) return;
      // Read current state after await so unrelated updates are not overwritten.
      const nextHistory = get().interviewHistory.filter(record => record.id !== id);
      const active = get().activeInterview?.id === id
        ? (nextHistory[0] || null) : get().activeInterview;
      set({ interviewHistory: nextHistory, activeInterview: active });
      get().addToast('info', 'Interview session record deleted.');
    } catch (err) {
      if ((get().user?.id ?? null) !== ownerId) return;
      get().addToast('error', 'Failed to remove interview record from database.');
    }
  },
  
  setActiveInterview: (activeInterview) => set({ activeInterview }),
  
  addRoadmap: async (roadmap) => {
    const ownerId = get().user?.id ?? null;
    try {
      let saved = roadmap;
      if (ownerId && hasSupabaseConfig) {
        const record = await supabaseService.insertRoadmap(ownerId, roadmap);
        if (!record?.id) throw new Error('Save did not return a record ID.');
        saved = { ...roadmap, id: record.id };
      } else {
        const nextHistory = [roadmap, ...get().roadmapHistory];
        localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
      }
      // A response for a prior account must never enter the current workspace.
      if ((get().user?.id ?? null) !== ownerId) return;
      set({ roadmapHistory: [saved, ...get().roadmapHistory.filter(row => row.id !== saved.id)],
            activeRoadmap: saved });
      get().addToast('success', 'Learning roadmap saved.');
    } catch (err) {
      if ((get().user?.id ?? null) !== ownerId) return;
      get().addToast('error', 'Learning roadmap could not be saved. Keep this result open and try again.');
    }
  },
  
  deleteRoadmap: async (id) => {
    // Persist first. A rejected deletion must not disappear locally or claim success.
    const user = get().user;
    const ownerId = user?.id ?? null;
    try {
      if (user && hasSupabaseConfig) {
        await supabaseService.deleteRoadmap(user.id, id);
      } else {
        const nextHistory = get().roadmapHistory.filter(record => record.id !== id);
        localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(nextHistory));
      }
      if ((get().user?.id ?? null) !== ownerId) return;
      // Read current state after await so unrelated updates are not overwritten.
      const nextHistory = get().roadmapHistory.filter(record => record.id !== id);
      const active = get().activeRoadmap?.id === id
        ? (nextHistory[0] || null) : get().activeRoadmap;
      set({ roadmapHistory: nextHistory, activeRoadmap: active });
      get().addToast('info', 'Learning roadmap deleted.');
    } catch (err) {
      if ((get().user?.id ?? null) !== ownerId) return;
      get().addToast('error', 'Failed to remove roadmap database record.');
    }
  },
  
  setActiveRoadmap: (activeRoadmap) => set({ activeRoadmap }),
  
  togglePhaseCompleted: async (roadmapId, phaseId) => {
    const ownerId = get().user?.id ?? null;
    const queueKey = JSON.stringify([ownerId, roadmapId]);
    const prior = progressWrites.get(queueKey) ?? Promise.resolve();
    const write = prior.then(async () => {
      if ((get().user?.id ?? null) !== ownerId) return;
      const roadmap = get().roadmapHistory.find(row => row.id === roadmapId);
      if (!roadmap || !roadmap.phases.some(phase => phase.id === phaseId)) {
        get().addToast('error', 'This saved roadmap milestone is unavailable.');
        return;
      }
      const completed = roadmap.completedPhases || [];
      const nextCompleted = completed.includes(phaseId)
        ? completed.filter(id => id !== phaseId) : [...completed, phaseId];
      try {
        if (ownerId && hasSupabaseConfig) {
          await supabaseService.updateRoadmapProgress(ownerId, roadmapId, nextCompleted);
        } else {
          const history = get().roadmapHistory.map(row => row.id === roadmapId
            ? { ...row, completedPhases: nextCompleted } : row);
          localStorage.setItem(KEYS.ROADMAPS, JSON.stringify(history));
        }
        if ((get().user?.id ?? null) !== ownerId) return;
        // Preserve unrelated updates and never resurrect a deleted record.
        const history = get().roadmapHistory.map(row => row.id === roadmapId
          ? { ...row, completedPhases: nextCompleted } : row);
        const active = get().activeRoadmap;
        set({ roadmapHistory: history, activeRoadmap: active?.id === roadmapId
          ? history.find(row => row.id === roadmapId) || null : active });
        get().addToast('info', 'Roadmap milestone progress saved.');
      } catch (err) {
        if ((get().user?.id ?? null) === ownerId) {
          get().addToast('error', 'Roadmap progress could not be saved. Try again.');
        }
      }
    });
    progressWrites.set(queueKey, write);
    try { await write; }
    finally { if (progressWrites.get(queueKey) === write) progressWrites.delete(queueKey); }
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

