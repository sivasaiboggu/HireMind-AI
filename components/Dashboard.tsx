
import React, { useState, useMemo } from 'react';
import { SavedResumeAnalysis, SavedInterview, LearningRoadmap } from '../types';

interface Props {
  activeResume: SavedResumeAnalysis | null;
  resumeHistory: SavedResumeAnalysis[];
  activeInterview: SavedInterview | null;
  interviewHistory: SavedInterview[];
  activeRoadmap: LearningRoadmap | null;
  roadmapHistory: LearningRoadmap[];
  onStartInterview: () => void;
  onGenerateRoadmap: () => void;
  onSelectSession: (session: SavedInterview) => void;
  onDeleteSession: (id: string) => void;
  onSelectResume: (analysis: SavedResumeAnalysis) => void;
  onDeleteResume: (id: string) => void;
  onSelectRoadmap: (roadmap: LearningRoadmap) => void;
  onDeleteRoadmap: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ 
  activeResume, 
  resumeHistory,
  activeInterview, 
  interviewHistory,
  activeRoadmap,
  roadmapHistory,
  onStartInterview, 
  onGenerateRoadmap,
  onSelectSession,
  onDeleteSession,
  onSelectResume,
  onDeleteResume,
  onSelectRoadmap,
  onDeleteRoadmap
}) => {
  const [tab, setTab] = useState<'resume' | 'interview'>('resume');
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredResumeHistory = useMemo(() => {
    return resumeHistory.filter(r => r.jobRole.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [resumeHistory, searchTerm]);

  const filteredInterviewHistory = useMemo(() => {
    return interviewHistory.filter(i => 
      i.jobRole.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [interviewHistory, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 border-b border-white/5 pb-12">
        <div className="space-y-4">
          <h1 className="text-6xl font-black text-white tracking-tighter italic">Command Board</h1>
          <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-[10px] flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            Professional Growth & Record History
          </p>
        </div>
        
        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
           <button 
            onClick={() => setTab('resume')}
            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'resume' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
           >
             Resume Audits
           </button>
           <button 
            onClick={() => setTab('interview')}
            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'interview' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}
           >
             Interview Lab
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-10">
           {tab === 'resume' ? (
              <div className="space-y-10">
                 {activeResume ? (
                    <div className="space-y-12">
                       {/* High Fidelity Review Header matches reference image */}
                       <header className="flex items-start justify-between">
                          <div className="space-y-2">
                             <h2 className="text-4xl font-black text-white tracking-tight">Latest Review</h2>
                             <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.4em]">{activeResume.jobRole}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-7xl font-black text-indigo-400 tabular-nums leading-none">{activeResume.ats_score}</div>
                             <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mt-3">ATS SIGNAL STRENGTH</div>
                          </div>
                       </header>
                       
                       {/* 2x2 Grid of scores matches reference image */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-10 glass rounded-[2.5rem] border-white/5 hover:border-indigo-500/20 transition-all group">
                             <div className="text-4xl font-black text-white mb-3 tabular-nums">{activeResume.categories.tone_style.score}%</div>
                             <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">TONE STYLE</div>
                          </div>
                          <div className="p-10 glass rounded-[2.5rem] border-white/5 hover:border-indigo-500/20 transition-all group">
                             <div className="text-4xl font-black text-white mb-3 tabular-nums">{activeResume.categories.content_impact.score}%</div>
                             <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">CONTENT IMPACT</div>
                          </div>
                          <div className="p-10 glass rounded-[2.5rem] border-white/5 hover:border-indigo-500/20 transition-all group">
                             <div className="text-4xl font-black text-white mb-3 tabular-nums">{activeResume.categories.structural_integrity.score}%</div>
                             <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">STRUCTURAL INTEGRITY</div>
                          </div>
                          <div className="p-10 glass rounded-[2.5rem] border-white/5 hover:border-indigo-500/20 transition-all group">
                             <div className="text-4xl font-black text-white mb-3 tabular-nums">{activeResume.categories.skills_relevance.score}%</div>
                             <div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-400 transition-colors">SKILLS RELEVANCE</div>
                          </div>
                       </div>

                       <div className="space-y-6 pt-10 border-t border-white/5">
                          <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em]">KEY ROADMAP STEPS</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {activeResume.road_to_100.slice(0, 3).map((step, idx) => (
                               <div key={idx} className="flex gap-4 p-6 bg-black/20 rounded-3xl border border-white/5 items-start">
                                  <span className="w-8 h-8 rounded-full bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-[10px] shrink-0">{idx + 1}</span>
                                  <p className="text-[11px] text-slate-400 font-bold leading-relaxed">{step}</p>
                               </div>
                            ))}
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="glass rounded-[4rem] py-40 text-center border-white/5">
                       <i className="fas fa-file-invoice text-slate-800 text-7xl mb-10 block"></i>
                       <h3 className="text-2xl font-black text-white mb-4">No Resume Data</h3>
                       <p className="text-slate-500 text-sm font-medium">Analyze your professional resume to see detailed performance metrics.</p>
                    </div>
                 )}
              </div>
           ) : (
              <div className="space-y-10">
                 {activeInterview ? (
                    <div className="glass rounded-[4rem] p-12 border-white/5 shadow-2xl space-y-12">
                       <header className="flex items-center justify-between">
                          <div>
                             <h2 className="text-3xl font-black text-white">Last Evaluation</h2>
                             <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">{activeInterview.jobRole} | {activeInterview.techStack}</p>
                          </div>
                          <div className="text-right">
                             <div className="text-5xl font-black text-emerald-400 tabular-nums">{activeInterview.evaluation.technical_score}</div>
                             <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">Technical Proficiency</div>
                          </div>
                       </header>

                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                             <div className="text-xl font-black text-white">{activeInterview.evaluation.communication_score}</div>
                             <div className="text-[8px] font-black text-slate-500 uppercase">Communication</div>
                          </div>
                          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                             <div className="text-xl font-black text-white">{activeInterview.evaluation.problem_solving_score}</div>
                             <div className="text-[8px] font-black text-slate-500 uppercase">Problem Solving</div>
                          </div>
                          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                             <div className="text-xl font-black text-white">{activeInterview.evaluation.confidence_score}</div>
                             <div className="text-[8px] font-black text-slate-500 uppercase">Confidence</div>
                          </div>
                          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                             <div className="text-xl font-black text-white">100%</div>
                             <div className="text-[8px] font-black text-slate-500 uppercase">Fluency</div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback Summary</h4>
                          <p className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 text-slate-300 text-sm leading-relaxed italic">
                             "{activeInterview.evaluation.overall_feedback}"
                          </p>
                       </div>
                    </div>
                 ) : (
                    <div className="glass rounded-[4rem] py-40 text-center border-white/5">
                       <i className="fas fa-microphone-lines text-slate-800 text-7xl mb-10 block"></i>
                       <h3 className="text-2xl font-black text-white mb-4">No Interview Data</h3>
                       <p className="text-slate-500 text-sm font-medium">Complete a mock interview simulation to receive technical performance feedback.</p>
                    </div>
                 )}
              </div>
           )}
        </div>

        {/* Sidebar History Area */}
        <div className="lg:col-span-4 space-y-10">
           <div className="glass rounded-[4rem] p-10 h-full min-h-[600px] border-white/5 shadow-2xl flex flex-col">
              <div className="mb-10">
                 <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-8 ml-2">Record History</h3>
                 <div className="relative group">
                    <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-700"></i>
                    <input 
                      type="text" 
                      placeholder="Search records..." 
                      className="w-full bg-black/40 border border-white/5 rounded-2xl py-4.5 pl-16 pr-6 text-xs text-white outline-none focus:border-indigo-500/50 shadow-inner font-bold"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                 </div>
              </div>

              <div className="flex-grow overflow-y-auto space-y-8 pr-2 scrollbar-thin">
                 {tab === 'resume' ? (
                   filteredResumeHistory.map(res => (
                      <div key={res.id} onClick={() => onSelectResume(res)} className={`group relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${activeResume?.id === res.id ? 'bg-indigo-600/10 border-indigo-500/40 shadow-xl' : 'bg-black/20 border-white/5'}`}>
                         <div className="flex justify-between items-start mb-2">
                            <div className="font-black text-[11px] text-white tracking-tight uppercase truncate max-w-[150px]">{res.jobRole}</div>
                            <div className="text-[10px] font-black text-indigo-400 tabular-nums">{res.ats_score}</div>
                         </div>
                         <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{new Date(res.timestamp).toLocaleDateString()}</div>
                         <button onClick={(e) => { e.stopPropagation(); onDeleteResume(res.id); }} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-rose-500/20"><i className="fas fa-times text-[10px]"></i></button>
                      </div>
                   ))
                 ) : (
                   filteredInterviewHistory.map(int => (
                      <div key={int.id} onClick={() => onSelectSession(int)} className={`group relative p-6 rounded-[2rem] border-2 cursor-pointer transition-all ${activeInterview?.id === int.id ? 'bg-emerald-600/10 border-emerald-500/40 shadow-xl' : 'bg-black/20 border-white/5'}`}>
                         <div className="flex justify-between items-start mb-2">
                            <div className="font-black text-[11px] text-white tracking-tight uppercase truncate max-w-[150px]">{int.jobRole}</div>
                            <div className="text-[10px] font-black text-emerald-400 tabular-nums">{int.evaluation.technical_score}</div>
                         </div>
                         <div className="text-[8px] font-black text-slate-700 uppercase tracking-widest">{new Date(int.timestamp).toLocaleDateString()}</div>
                         <button onClick={(e) => { e.stopPropagation(); onDeleteSession(int.id); }} className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center border border-rose-500/20"><i className="fas fa-times text-[10px]"></i></button>
                      </div>
                   ))
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
