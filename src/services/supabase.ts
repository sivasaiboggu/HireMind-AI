import { createClient } from '@supabase/supabase-js';

// Retrieve keys from import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const hasSupabaseConfig = 
  typeof supabaseUrl === 'string' && supabaseUrl.trim() !== '' &&
  typeof supabaseAnonKey === 'string' && supabaseAnonKey.trim() !== '';

if (!hasSupabaseConfig) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing.\n' +
    'The application will fall back to Local Storage (Guest Mode) for database saving and authentication.'
  );
}

// Create client (use empty strings as fallback if disabled to avoid initialization errors)
export const supabase = createClient(
  hasSupabaseConfig ? supabaseUrl : 'https://dummy-placeholder-url.supabase.co',
  hasSupabaseConfig ? supabaseAnonKey : 'dummy-placeholder-anon-key'
);

/**
 * Sync operations for profiles and candidate history items
 */
export const supabaseService = {
  /**
   * Profiles Operations
   */
  async getProfile(userId: string) {
    if (!hasSupabaseConfig) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  },

  async updateProfile(userId: string, updates: { full_name?: string; target_role?: string; credits?: number }) {
    if (!hasSupabaseConfig) return null;
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
    return data;
  },

  /**
   * Resumes History Operations
   */
  async fetchResumes(userId: string) {
    if (!hasSupabaseConfig) return [];
    const { data, error } = await supabase
      .from('saved_resumes')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching resume history:', error);
      return [];
    }
    return (data || []).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      jobRole: r.job_role,
      experienceLevel: r.experience_level,
      atsScore: r.ats_score,
      contentScore: r.content_score,
      formatScore: r.format_score,
      overallScore: r.overall_score,
      ...r.data
    }));
  },

  async insertResume(userId: string, record: any) {
    if (!hasSupabaseConfig) return null;
    const { data, error } = await supabase
      .from('saved_resumes')
      .insert({
        user_id: userId,
        timestamp: record.timestamp,
        job_role: record.jobRole,
        experience_level: record.experienceLevel,
        ats_score: record.atsScore,
        content_score: record.contentScore,
        format_score: record.formatScore,
        overall_score: record.overallScore,
        data: {
          sections: record.sections,
          recommendations: record.recommendations,
          matchedKeywords: record.matchedKeywords,
          missingKeywords: record.missingKeywords,
          atsChecklist: record.atsChecklist,
          rewrites: record.rewrites
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving resume analysis:', error);
      throw error;
    }
    return data;
  },

  async deleteResume(userId: string, id: string) {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase
      .from('saved_resumes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting resume record:', error);
      throw error;
    }
  },

  /**
   * Interview Sessions Operations
   */
  async fetchInterviews(userId: string) {
    if (!hasSupabaseConfig) return [];
    const { data, error } = await supabase
      .from('saved_interviews')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching interview sessions:', error);
      return [];
    }
    return (data || []).map(i => ({
      id: i.id,
      timestamp: i.timestamp,
      config: i.config,
      answers: i.answers,
      overallScore: Number(i.overall_score)
    }));
  },

  async insertInterview(userId: string, record: any) {
    if (!hasSupabaseConfig) return null;
    const { data, error } = await supabase
      .from('saved_interviews')
      .insert({
        user_id: userId,
        timestamp: record.timestamp,
        config: record.config,
        answers: record.answers,
        overall_score: record.overallScore
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving interview session:', error);
      throw error;
    }
    return data;
  },

  async deleteInterview(userId: string, id: string) {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase
      .from('saved_interviews')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error deleting interview record:', error);
      throw error;
    }
  },

  /**
   * Learning Roadmaps Operations
   */
  async fetchRoadmaps(userId: string) {
    if (!hasSupabaseConfig) return [];
    const { data, error } = await supabase
      .from('saved_roadmaps')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching roadmap histories:', error);
      return [];
    }
    return (data || []).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      role: r.role,
      totalWeeks: r.total_weeks,
      experienceLevel: r.experience_level || 'Intermediate',
      currentSkills: Array.isArray(r.current_skills) ? r.current_skills : [],
      phases: r.phases,
      skillGaps: r.skill_gaps,
      completedPhases: r.completed_phases || []
    }));
  },

  async insertRoadmap(userId: string, record: any) {
    if (!hasSupabaseConfig) return null;
    const { data, error } = await supabase
      .from('saved_roadmaps')
      .insert({
        user_id: userId,
        timestamp: record.timestamp,
        role: record.role,
        total_weeks: record.totalWeeks,
        experience_level: record.experienceLevel,
        current_skills: record.currentSkills || [],
        phases: record.phases,
        skill_gaps: record.skillGaps,
        completed_phases: record.completedPhases || []
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving roadmap milestone:', error);
      throw error;
    }
    return data;
  },

  async updateRoadmapProgress(userId: string, roadmapId: string, completedPhases: string[]) {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase
      .from('saved_roadmaps')
      .update({ completed_phases: completedPhases })
      .eq('id', roadmapId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error syncing roadmap progress:', error);
      throw error;
    }
  },

  async deleteRoadmap(userId: string, id: string) {
    if (!hasSupabaseConfig) return;
    const { error } = await supabase
      .from('saved_roadmaps')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting roadmap database record:', error);
      throw error;
    }
  }
};
