import React, { useState, useMemo } from 'react';
import { StatsGrid } from '../components/dashboard/StatsGrid';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { QuickActions } from '../components/dashboard/QuickActions';
import { Card } from '../components/ui/Card';
import { useAppStore, AppView } from '../store/appStore';
import { Search, Trash2, Calendar, FileText, Mic, Map } from 'lucide-react';
import '../styles/globals.css';
import '../styles/animations.css';

export const Dashboard: React.FC = () => {
  const { 
    resumeHistory, 
    activeResume, 
    setActiveResume, 
    deleteResumeAnalysis,
    interviewHistory, 
    activeInterview, 
    setActiveInterview, 
    deleteInterviewSession,
    roadmapHistory, 
    activeRoadmap, 
    setActiveRoadmap, 
    deleteRoadmap,
    setView 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'resume' | 'interview' | 'roadmap'>('resume');
  const [searchTerm, setSearchTerm] = useState('');

  // Greetings logic
  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredResumeHistory = useMemo(() => {
    return resumeHistory.filter(r => r.jobRole.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [resumeHistory, searchTerm]);

  const filteredInterviewHistory = useMemo(() => {
    return interviewHistory.filter(i => i.config.jobRole.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [interviewHistory, searchTerm]);

  const filteredRoadmapHistory = useMemo(() => {
    return roadmapHistory.filter(r => r.role.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [roadmapHistory, searchTerm]);

  const handleSelectResume = (id: string) => {
    const resume = resumeHistory.find(r => r.id === id) || null;
    setActiveResume(resume);
    setView('resume');
  };

  const handleSelectInterview = (id: string) => {
    const interview = interviewHistory.find(i => i.id === id) || null;
    setActiveInterview(interview);
    setView('interview');
  };

  const handleSelectRoadmap = (id: string) => {
    const roadmap = roadmapHistory.find(r => r.id === id) || null;
    setActiveRoadmap(roadmap);
    setView('roadmap');
  };

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
      
      {/* Hero Greeting */}
      <div>
        <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
          {getGreeting()}, Sivasai 👋
        </h2>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Your career intelligence hub is ready. Optimize your profile and practice key roles.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <StatsGrid />

      {/* Quick Action Shortcuts */}
      <QuickActions />

      {/* Two Column Bottom Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '32px',
          width: '100%',
          alignItems: 'start'
        }}
        className="bottom-dashboard-grid"
      >
        {/* Media queries applied in index.css, style override here for responsive grid on desktop */}
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .bottom-dashboard-grid {
              grid-template-columns: 5fr 7fr !important;
            }
          }
        `}} />

        {/* Left Column: Timeline */}
        <RecentActivity />

        {/* Right Column: History Archive */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px' }}>
          
          {/* Header & Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>History Records</h3>
              
              {/* Tab Selector */}
              <div 
                style={{ 
                  display: 'flex', 
                  backgroundColor: 'var(--bg-elevated)', 
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)', 
                  padding: '4px' 
                }}
              >
                <button
                  onClick={() => setActiveTab('resume')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: activeTab === 'resume' ? 'var(--bg-hover)' : 'transparent',
                    color: activeTab === 'resume' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                  className="btn-press"
                >
                  Resumes
                </button>
                <button
                  onClick={() => setActiveTab('interview')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: activeTab === 'interview' ? 'var(--bg-hover)' : 'transparent',
                    color: activeTab === 'interview' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                  className="btn-press"
                >
                  Interviews
                </button>
                <button
                  onClick={() => setActiveTab('roadmap')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: activeTab === 'roadmap' ? 'var(--bg-hover)' : 'transparent',
                    color: activeTab === 'roadmap' ? 'var(--accent-primary)' : 'var(--text-secondary)'
                  }}
                  className="btn-press"
                >
                  Roadmaps
                </button>
              </div>
            </div>

            {/* Local Search input */}
            <div style={{ position: 'relative' }}>
              <Search 
                style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  width: '16px', 
                  height: '16px', 
                  color: 'var(--text-muted)' 
                }} 
              />
              <input
                type="text"
                placeholder={`Search ${activeTab} records...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  paddingLeft: '40px',
                  backgroundColor: 'var(--bg-elevated)',
                  height: '38px',
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--text-xs)'
                }}
              />
            </div>
          </div>

          {/* List display */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flexGrow: 1, maxHeight: '320px' }}>
            
            {/* Resume Audits */}
            {activeTab === 'resume' && (
              filteredResumeHistory.length > 0 ? (
                filteredResumeHistory.map(res => (
                  <div
                    key={res.id}
                    onClick={() => handleSelectResume(res.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    className="history-row hover:border-[var(--border-active)]"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <FileText style={{ width: '18px', height: '18px', color: 'var(--accent-secondary)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{res.jobRole}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {new Date(res.timestamp).toLocaleDateString()} · Score: {res.atsScore}%
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResumeAnalysis(res.id);
                      }}
                      style={{ color: 'var(--text-muted)', padding: '6px', backgroundColor: 'transparent' }}
                      className="btn-press hover:text-[var(--accent-danger)]"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No resume audits found.
                </div>
              )
            )}

            {/* Mock Interviews */}
            {activeTab === 'interview' && (
              filteredInterviewHistory.length > 0 ? (
                filteredInterviewHistory.map(int => (
                  <div
                    key={int.id}
                    onClick={() => handleSelectInterview(int.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    className="history-row hover:border-[var(--border-active)]"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Mic style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                          {int.config.jobRole} ({int.config.interviewType})
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {new Date(int.timestamp).toLocaleDateString()} · Score: {int.overallScore}/10 · {int.answers.length} Qs
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteInterviewSession(int.id);
                      }}
                      style={{ color: 'var(--text-muted)', padding: '6px', backgroundColor: 'transparent' }}
                      className="btn-press hover:text-[var(--accent-danger)]"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No interview sessions found.
                </div>
              )
            )}

            {/* Roadmaps */}
            {activeTab === 'roadmap' && (
              filteredRoadmapHistory.length > 0 ? (
                filteredRoadmapHistory.map(road => (
                  <div
                    key={road.id}
                    onClick={() => handleSelectRoadmap(road.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-elevated)',
                      border: '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                    className="history-row hover:border-[var(--border-active)]"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Map style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
                      <div>
                        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{road.role}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                          {new Date(road.timestamp).toLocaleDateString()} · {road.phases.length} Phases · {road.totalWeeks} Weeks
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRoadmap(road.id);
                      }}
                      style={{ color: 'var(--text-muted)', padding: '6px', backgroundColor: 'transparent' }}
                      className="btn-press hover:text-[var(--accent-danger)]"
                    >
                      <Trash2 style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                  No roadmaps generated yet.
                </div>
              )
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;
