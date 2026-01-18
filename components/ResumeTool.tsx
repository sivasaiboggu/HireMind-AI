
import React, { useState, useRef } from 'react';
import { gemini } from '../services/geminiService';
import { AtsAnalysis, CategoryFeedback, ImprovementStep } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://esm.sh/pdfjs-dist@4.10.38/build/pdf.worker.mjs';

interface Props {
  onAnalysisComplete: (data: AtsAnalysis, role: string, exp: string) => void;
  setResumeText: (text: string) => void;
}

const DetailedCategoryCard: React.FC<{ label: string; feedback: CategoryFeedback; details: ImprovementStep[] }> = ({ label, feedback, details }) => {
  const [isOpen, setIsOpen] = useState(false);
  const status = feedback.score >= 80 ? 'Strong' : feedback.score >= 60 ? 'Good Start' : 'Needs Work';
  const statusColor = feedback.score >= 80 ? 'text-emerald-400 bg-emerald-500/10' : feedback.score >= 60 ? 'text-amber-400 bg-amber-500/10' : 'text-rose-400 bg-rose-500/10';

  return (
    <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden transition-all hover:border-white/10 shadow-lg">
      <div 
        className="p-10 flex items-center justify-between cursor-pointer group"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black text-white tracking-tight">{label}</span>
          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
            {status}
          </span>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-2xl font-black text-white tabular-nums">
            <span className={statusColor.split(' ')[0]}>{feedback.score}</span>
            <span className="text-slate-600 opacity-40">/100</span>
          </div>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-indigo-600 text-white rotate-180' : 'bg-white/5 text-slate-500'}`}>
            <i className="fas fa-chevron-down text-xs"></i>
          </div>
        </div>
      </div>
      
      {isOpen && (
        <div className="px-10 pb-12 space-y-10 animate-in slide-in-from-top-4 duration-500">
          <div className="pt-8 border-t border-white/5 space-y-4">
             {/* Dynamic Strengths (Checkmarks) */}
             {feedback.strengths.map((s, i) => (
               <div key={`s-${i}`} className="flex items-start gap-5 p-5 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] shrink-0"><i className="fas fa-check"></i></div>
                  <p className="text-[13px] font-bold text-slate-200">{s}</p>
               </div>
             ))}
             {/* Dynamic Weaknesses (Warnings) */}
             {feedback.weaknesses.map((w, i) => (
               <div key={`w-${i}`} className="flex items-start gap-5 p-5 bg-amber-500/5 rounded-2xl border border-amber-500/10">
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white text-[10px] shrink-0"><i className="fas fa-exclamation"></i></div>
                  <p className="text-[13px] font-bold text-slate-200">{w}</p>
               </div>
             ))}
          </div>

          {/* Detailed Enhancement Logic mapping Improvements to each category */}
          {details.length > 0 && (
            <div className="space-y-6">
              <h5 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">STRUCTURAL ENHANCEMENTS</h5>
              <div className="space-y-4">
                {details.map((d, i) => (
                  <div key={i} className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-6">
                    <div className="space-y-2">
                       <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">CRITIQUE</span>
                       <p className="text-sm font-black text-white leading-tight">{d.issue}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-3">
                          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">CURRENT STATE</span>
                          <div className="p-5 bg-rose-500/5 rounded-xl border border-rose-500/10 text-xs italic text-slate-400 leading-relaxed font-medium">"{d.example_before}"</div>
                       </div>
                       <div className="space-y-3">
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">OPTIMIZED PROPOSAL</span>
                          <div className="p-5 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-xs italic text-white leading-relaxed font-bold">"{d.example_after}"</div>
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/5">
                       <p className="text-[11px] text-slate-400 font-medium leading-relaxed italic"><i className="fas fa-circle-info text-indigo-500 mr-2"></i> {d.rationale}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ResumeTool: React.FC<Props> = ({ onAnalysisComplete, setResumeText }) => {
  const [role, setRole] = useState('');
  const [exp, setExp] = useState('2-5 YEARS');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AtsAnalysis | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
    }
    return fullText;
  };

  const processFile = async (file: File) => {
    if (file.type !== 'application/pdf') return alert("Standard PDF documents only.");
    setExtracting(true);
    try {
      const text = await extractTextFromPdf(file);
      setContent(text);
      setResumeText(text);
    } catch (err) {
      alert("Extraction failed.");
    } finally {
      setExtracting(false);
    }
  };

  const handleAnalyze = async () => {
    if (!role || !content) return alert("All parameters required.");
    setLoading(true);
    try {
      const result = await gemini.analyzeResume(role, exp, content);
      setAnalysisResult(result);
      onAnalysisComplete(result, role, exp);
    } catch (error) {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  if (analysisResult) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-12 animate-in fade-in duration-700">
        <div className="space-y-12">
          <button 
            onClick={() => setAnalysisResult(null)}
            className="flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-500 hover:text-white transition-all bg-white/5 px-8 py-4 rounded-2xl border border-white/5"
          >
            <i className="fas fa-arrow-left text-[9px]"></i> RE-AUDIT DOCUMENT
          </button>

          <header>
            <h2 className="text-6xl font-black text-white tracking-tighter italic">Advanced Performance Audit</h2>
          </header>

          {/* Hero Score Gauge */}
          <div className="glass rounded-[4rem] p-16 border-white/5 shadow-2xl relative overflow-hidden">
             <div className="flex flex-col md:flex-row items-center gap-16">
                <div className="relative w-64 h-64 shrink-0">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#ats-hero-grad)" strokeWidth="8" 
                      strokeDasharray="282.7" 
                      strokeDashoffset={282.7 * (1 - analysisResult.ats_score / 100)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="ats-hero-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-7xl font-black text-white tracking-tighter tabular-nums leading-none">{analysisResult.ats_score}</span>
                    <span className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] mt-2">ATS SCORE</span>
                  </div>
                </div>

                <div className="space-y-6 text-center md:text-left">
                  <h3 className="text-4xl font-black text-white tracking-tight">System Compliance</h3>
                  <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-sm">
                    Benchmarking your credentials against current industry standards for <span className="text-indigo-400 italic">{role}</span>.
                  </p>
                  <div className="flex flex-wrap gap-3">
                     <span className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-indigo-400">FAANG COMPLIANT</span>
                     <span className="px-4 py-2 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-emerald-400">SEO OPTIMIZED</span>
                  </div>
                </div>
             </div>

             <div className="mt-20 space-y-8">
                <DetailedCategoryCard 
                  label="Tone & Style" 
                  feedback={analysisResult.categories.tone_style}
                  details={analysisResult.detailed_improvements.filter(d => d.category === 'Tone')}
                />
                <DetailedCategoryCard 
                  label="Content & Impact" 
                  feedback={analysisResult.categories.content_impact}
                  details={analysisResult.detailed_improvements.filter(d => d.category === 'Content')}
                />
                <DetailedCategoryCard 
                  label="Structure & Flow" 
                  feedback={analysisResult.categories.structural_integrity}
                  details={analysisResult.detailed_improvements.filter(d => d.category === 'Structure')}
                />
                <DetailedCategoryCard 
                  label="Skills Alignment" 
                  feedback={analysisResult.categories.skills_relevance}
                  details={analysisResult.detailed_improvements.filter(d => d.category === 'Skills')}
                />
             </div>
          </div>

          {/* Project Specific Feedback Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-4 px-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400"><i className="fas fa-diagram-project"></i></div>
              <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.4em]">PROJECT-SPECIFIC AUDIT</h3>
            </div>
            
            <div className="space-y-6">
               {analysisResult.project_audit.map((project, idx) => (
                 <div key={idx} className="glass rounded-[3rem] overflow-hidden border-white/5 hover:border-emerald-500/20 transition-all">
                    <div className="p-10 bg-white/5 border-b border-white/5 flex items-center justify-between">
                       <h4 className="text-2xl font-black text-white">{project.name}</h4>
                       <div className="text-right">
                          <div className="text-2xl font-black text-emerald-400">{project.ats_relevance_score}%</div>
                          <div className="text-[9px] font-black text-slate-600 uppercase tracking-widest">ATS RELEVANCE</div>
                       </div>
                    </div>
                    <div className="p-10 space-y-8">
                       <div className="space-y-4">
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">CRITICAL CRITIQUE</span>
                          <p className="text-[13px] text-slate-300 font-medium leading-relaxed italic">"{project.impact_critique}"</p>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-3">
                             <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">CURRENT SUMMARY</span>
                             <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 text-[12px] text-slate-400 italic">"{project.current_description}"</div>
                          </div>
                          <div className="space-y-3">
                             <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">HIGH-IMPACT OPTIMIZATION</span>
                             <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-[12px] text-white font-bold italic">"{project.improved_description}"</div>
                          </div>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          {/* Strategic Action Roadmap */}
          <div className="p-12 bg-indigo-500/5 border border-indigo-500/10 rounded-[4rem] space-y-10 shadow-inner relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full"></div>
             <div className="flex items-center gap-6 relative z-10">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl shadow-xl border border-indigo-500/20">
                  <i className="fas fa-bolt-lightning"></i>
                </div>
                <h4 className="text-3xl font-black text-white italic tracking-tighter">Strategic Action Plan</h4>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                {analysisResult.road_to_100.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-6 p-6 rounded-3xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-all">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400 font-black text-[10px] shrink-0">0{idx + 1}</div>
                    <p className="text-[13px] text-slate-300 font-bold leading-relaxed">{step}</p>
                  </div>
                ))}
             </div>

             <div className="pt-10 border-t border-white/5 flex items-center gap-6 relative z-10">
                <i className="fas fa-info-circle text-slate-600"></i>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em]">RE-AUDIT RECOMMENDED AFTER IMPLEMENTING TOP 3 ACTIONS</p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="glass rounded-[4rem] p-10 md:p-20 relative overflow-hidden shadow-2xl border-white/[0.03]">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-emerald-500 to-indigo-500 opacity-30"></div>
        
        <header className="mb-16 text-center md:text-left">
           <h2 className="text-6xl font-black text-white tracking-tighter italic mb-4">Resume Architect</h2>
           <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.5em] flex items-center justify-center md:justify-start gap-3">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span> INITIALIZING ADVANCED DOCUMENT PARSER
           </p>
        </header>

        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Target Job Title</label>
              <input type="text" placeholder="e.g. Senior Software Engineer" className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 py-5 text-white font-bold outline-none focus:border-indigo-500/50 shadow-inner transition-all" value={role} onChange={(e) => setRole(e.target.value)} />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Experience Horizon</label>
              <select className="w-full bg-black/40 border border-white/5 rounded-2xl px-8 py-5 text-white font-bold outline-none focus:border-indigo-500/50 cursor-pointer shadow-inner transition-all" value={exp} onChange={(e) => setExp(e.target.value)}>
                <option value="0-2 YEARS">Junior Level (0-2y)</option>
                <option value="2-5 YEARS">Experienced (2-5y)</option>
                <option value="5+ YEARS">Senior / Staff (5+y)</option>
                <option value="10+ YEARS">Principal / Executive (10+y)</option>
              </select>
            </div>
          </div>

          <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f); }} onClick={() => fileInputRef.current?.click()} className={`group border-2 border-dashed rounded-[3rem] p-20 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-black/30 hover:bg-white/5'}`}>
            <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }} />
            {extracting ? (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em]">DECONSTRUCTING DOCUMENT ELEMENTS...</p>
              </div>
            ) : (
              <div className="text-center space-y-8">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto text-5xl transition-all ${content ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-indigo-600/10 text-indigo-400 shadow-indigo-600/10'}`}>
                  <i className={`fas ${content ? 'fa-check-double' : 'fa-cloud-arrow-up'}`}></i>
                </div>
                <div>
                   <p className="text-2xl font-black text-white mb-3 uppercase tracking-tight">{content ? 'Experience Data Mapped' : 'Upload Career Document'}</p>
                   <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.4em] italic">High Resolution PDF Required</p>
                </div>
              </div>
            )}
          </div>

          <textarea rows={6} placeholder="Alternatively, paste raw career data here for a deep-tissue diagnostic..." className="w-full bg-black/40 border border-white/5 rounded-[2.5rem] px-10 py-10 outline-none focus:border-indigo-500/50 text-slate-400 text-sm font-medium scrollbar-thin transition-all" value={content} onChange={(e) => setContent(e.target.value)} />

          <button onClick={handleAnalyze} disabled={loading || extracting} className="w-full py-10 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[2.5rem] font-black text-[12px] tracking-[0.6em] uppercase transition-all shadow-2xl shadow-indigo-600/40 active:scale-95 disabled:opacity-50">
            {loading ? <span className="flex items-center justify-center gap-6"><i className="fas fa-circle-notch animate-spin text-2xl"></i> ANALYZING CREDENTIALS...</span> : 'Initiate Performance Diagnostic'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResumeTool;
