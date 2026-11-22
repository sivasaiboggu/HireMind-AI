import { useState, type FormEvent } from 'react';
import { ArrowRight, ArrowUpRight, FileText, Mic, Map, Search, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button } from '../components/ui/Button';
import { safeLocalGet, safeLocalSet, useAppStore } from '../store/appStore';
import { supabaseService } from '../services/supabase';
import { careerReadiness } from '../services/readiness';
import type { ActivityEvent } from '../types';

const roleSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.'),
  role: z.string().trim().min(1, 'Enter the role you’re preparing for.'),
});

const historyTypes = [
  { id: 'resume', label: 'Resumes', icon: FileText },
  { id: 'interview', label: 'Interviews', icon: Mic },
  { id: 'roadmap', label: 'Study plans', icon: Map },
] as const;
type HistoryType = typeof historyTypes[number]['id'];

const actions = [
  { title: 'Review a resume', detail: 'See which keywords are missing and what to rewrite.', to: '/resume', icon: FileText },
  { title: 'Rehearse an interview', detail: 'Answer questions for your role and get feedback.', to: '/interview', icon: Mic },
  { title: 'Build a study plan', detail: 'Break a target role into skills to work on each week.', to: '/roadmap', icon: Map },
];

export function Dashboard() {
  const store = useAppStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HistoryType>('resume');
  const [search, setSearch] = useState('');
  const [guestName, setGuestName] = useState(() => safeLocalGet('hiremind_guest_name') || '');
  const [guestRole, setGuestRole] = useState(() => safeLocalGet('hiremind_guest_role') || '');
  const [saving, setSaving] = useState(false);
  const [roleError, setRoleError] = useState('');

  const name = store.user ? store.profile?.full_name || store.user.user_metadata?.full_name : guestName;
  const targetRole = (store.user ? store.profile?.target_role : guestRole)?.trim();
  const showSetup = !targetRole && (!store.user || !!store.profile);
  const lastResume = store.activeResume || store.resumeHistory[0];
  const interviewCount = store.interviewHistory.length;
  const average = interviewCount ? store.interviewHistory.reduce((total, session) => total + session.overallScore, 0) / interviewCount : 0;
  const readiness = careerReadiness(lastResume?.atsScore || 0, average);
  const activity = store.getRecentActivity();

  const history = {
    resume: store.resumeHistory.map((item) => ({
      ...item, name: item.jobRole, detail: `ATS score ${item.atsScore}%`,
    })),
    interview: store.interviewHistory.map((item) => ({
      ...item, name: item.config.jobRole, detail: `${item.overallScore}/10 · ${item.answers.length} answers`,
    })),
    roadmap: store.roadmapHistory.map((item) => ({
      ...item, name: item.role, detail: `${item.phases.length} phases · ${item.totalWeeks} weeks`,
    })),
  };
  const filtered = history[activeTab].filter((item) => item.name.toLowerCase().includes(search.trim().toLowerCase()));

  async function saveRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    const result = roleSchema.safeParse(Object.fromEntries(fields));
    if (!result.success) {
      setRoleError(result.error.issues[0].message);
      return;
    }
    setRoleError('');
    setSaving(true);
    const { name, role } = result.data;
    try {
      if (store.user) {
        const profile = await supabaseService.updateProfile(store.user.id, { full_name: name, target_role: role });
        if (!profile) throw new Error('Profile update failed');
        useAppStore.setState({ profile });
      } else {
        if (!safeLocalSet('hiremind_guest_name', name) || !safeLocalSet('hiremind_guest_role', role)) {
          throw new Error('Local storage unavailable');
        }
        setGuestName(name);
        setGuestRole(role);
      }
      store.addToast('success', 'Target role saved.');
    } catch {
      setRoleError('Couldn’t save your target role. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function openRecord(type: ActivityEvent['type'], id: string) {
    if (type === 'resume') store.setActiveResume(store.resumeHistory.find((item) => item.id === id) || null);
    if (type === 'interview') store.setActiveInterview(store.interviewHistory.find((item) => item.id === id) || null);
    if (type === 'roadmap') store.setActiveRoadmap(store.roadmapHistory.find((item) => item.id === id) || null);
    navigate('/' + type);
  }

  const deleteRecord = {
    resume: store.deleteResumeAnalysis,
    interview: store.deleteInterviewSession,
    roadmap: store.deleteRoadmap,
  };

  return (
    <div className="container dashboard">
      <section className="overview-lead" aria-labelledby="overview-title">
        <div className="overview-intro margin-mark">
          <p className="meta-label">{targetRole || 'Career preparation'}</p>
          <h1 id="overview-title">Career<br />overview<span className="brand-period">.</span></h1>
          <p>{name?.trim() ? `${name.trim().split(/\s+/)[0]}, use this space to review your resume, rehearse answers, and plan what to study.` : 'Review your resume, rehearse interview answers, and plan what to study.'}</p>
          <Link to="/resume" className="button primary-button">{lastResume ? 'Open resume review' : 'Review your resume'}<ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
        <aside className="readiness-sheet" aria-labelledby="readiness-label">
          <div className="sheet-top"><h2 id="readiness-label" className="meta-label">Career readiness</h2><ArrowUpRight size={19} aria-hidden="true" /></div>
          <p className="readiness-number numeric">{lastResume || interviewCount ? <>{readiness}<small>%</small></> : '—'}</p>
          <div className="readiness-track" aria-hidden="true"><span style={{ width: `${readiness}%` }} /></div>
          <p>{lastResume || interviewCount ? 'Based on your latest resume score and average interview score, where available.' : 'Your score will appear after your first resume review or scored interview.'}</p>
        </aside>
      </section>

      <dl className="score-ledger" aria-label="Preparation scores">
        <div><dt>Latest ATS score</dt><dd>{lastResume ? `${lastResume.atsScore}%` : '—'}</dd></div>
        <div><dt>Interviews completed</dt><dd>{interviewCount}</dd></div>
        <div><dt>Skills in active plan</dt><dd>{store.activeRoadmap?.skillGaps.length || 0}</dd></div>
      </dl>

      {showSetup && (
        <section className="role-setup">
          <div><h2>Set your target role</h2><p className="muted">Give your saved work a name and a role.</p></div>
          <form className="role-form" onSubmit={saveRole}>
            <label>Your name<input name="name" autoComplete="name" defaultValue={name || ''} required /></label>
            <label>Target role<input name="role" placeholder="Frontend engineer" required /></label>
            <Button type="submit" variant="ghost" loading={saving}>Save role</Button>
            {roleError && <p role="alert" className="error-text">{roleError}</p>}
          </form>
        </section>
      )}

      <div className="dashboard-columns">
        <section aria-labelledby="action-title">
          <h2 id="action-title" className="section-title">What to work on</h2>
          <ul className="action-list">
            {actions.map(({ title, detail, to, icon: Icon }) => (
              <li key={to}><Link to={to}><Icon size={20} aria-hidden="true" /><span><strong>{title}</strong><small>{detail}</small></span><ArrowUpRight size={18} aria-hidden="true" /></Link></li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="activity-title">
          <h2 id="activity-title" className="section-title">Recent activity</h2>
          {activity.length === 0 ? (
            <p className="blank-note">Your saved reviews, interviews, and plans will appear here.</p>
          ) : (
            <ul className="action-list">
              {activity.slice(0, 5).map((item) => (
                <li key={`${item.type}-${item.id}`}>
                  <button type="button" onClick={() => openRecord(item.type, item.id)}><span><strong>{item.title}</strong><small>{item.subtitle}</small></span><ArrowUpRight size={18} aria-hidden="true" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section aria-labelledby="history-title">
        <h2 id="history-title" className="section-title">Saved work</h2>
        <div className="history-controls">
          <div className="tabs" role="group" aria-label="Saved work type">
            {historyTypes.map(({ id, label }) => (
              <button type="button" key={id} aria-pressed={id === activeTab} onClick={() => setActiveTab(id)}>{label}</button>
            ))}
          </div>
          <div className="history-search"><Search size={16} aria-hidden="true" /><input type="search" aria-label="Filter by role" placeholder="Filter by role" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
        </div>
        {filtered.length === 0 ? (
          <p className="blank-note">{search.trim() ? 'No saved work matches that role.' : `No saved ${historyTypes.find(({ id }) => id === activeTab)?.label.toLowerCase()} yet.`}</p>
        ) : (
          <ul className="history-list">
            {filtered.map((item) => (
              <li key={item.id}>
                <button type="button" className="record-link" onClick={() => openRecord(activeTab, item.id)}>
                  <strong>{item.name}</strong><small>{new Date(item.timestamp).toLocaleDateString()} · {item.detail}</small>
                </button>
                <button type="button" className="icon-control history-delete" aria-label={`Delete ${item.name}`} onClick={() => deleteRecord[activeTab](item.id)}><Trash2 size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Dashboard;
