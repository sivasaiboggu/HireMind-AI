import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Plus, X } from 'lucide-react';
import { z } from 'zod/mini';
import { Button } from '../ui/Button';
import type { InterviewConfig } from '../../types';
import { safeLocalGet, useAppStore } from '../../store/appStore';

interface SetupFormProps {
  onGenerate: (config: InterviewConfig) => void;
  loading: boolean;
}

const presetTags = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'System Design', 'Git'];
const levels = ['Beginner', 'Intermediate', 'Senior'] as const;
const rounds = {
  technical: 'Technical',
  behavioral: 'Behavioural',
  'system-design': 'System design',
  hr: 'HR',
  dsa: 'Coding',
} as const;
const roleInput = z.string().check(z.trim(), z.minLength(1));

export function SetupForm({ onGenerate, loading }: SetupFormProps) {
  const profile = useAppStore((state) => state.profile);
  const [role, setRole] = useState(() => profile?.target_role || safeLocalGet('hiremind_guest_role') || '');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState<InterviewConfig['difficulty']>('Intermediate');
  const [round, setRound] = useState<keyof typeof rounds>('technical');
  const [questionCount, setQuestionCount] = useState(5);
  const [company, setCompany] = useState('');
  const [mode, setMode] = useState<'full' | 'specific'>('full');
  const [videoMode, setVideoMode] = useState(false);

  function addTag(tag: string) {
    const trimmed = tag.trim();
    if (trimmed) setTechStack((current) => current.includes(trimmed) ? current : [...current, trimmed]);
    setTagInput('');
  }

  function addTagByKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag(tagInput);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const jobRole = roleInput.safeParse(role);
    if (!jobRole.success) return;
    onGenerate({
      jobRole: jobRole.data,
      techStack: techStack.length ? techStack : ['General'],
      difficulty,
      interviewType: mode === 'full' ? 'full' : round,
      questionCount,
      mode,
      videoMode,
      voiceMode: false,
      targetCompany: company.trim() || 'General',
    });
  }

  return (
    <form className="form-stack form-work" onSubmit={submit}>
      <fieldset>
        <legend>Interview format</legend>
        <div className="tabs" role="group" aria-label="Interview format">
          <button type="button" aria-pressed={mode === 'full'} onClick={() => setMode('full')}>Full interview</button>
          <button type="button" aria-pressed={mode === 'specific'} onClick={() => setMode('specific')}>Single round</button>
        </div>
        {mode === 'specific' ? (
          <label className="form-field">Round type
            <select value={round} onChange={(event) => setRound(event.target.value as keyof typeof rounds)}>
              {Object.entries(rounds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        ) : <p className="form-help">Covers technical questions, coding, system design or behavioural questions, and HR.</p>}
      </fieldset>

      <div className="control-pair">
        <label className="form-field">Target role<input required value={role} onChange={(event) => setRole(event.target.value)} placeholder="Frontend engineer" /></label>
        <label className="form-field">Company <span className="muted">(optional)</span><input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company name" /></label>
      </div>

      <div className="form-field">
        <label htmlFor="interview-skill">Skills to cover</label>
        <div className="input-with-action">
          <input id="interview-skill" value={tagInput} placeholder="Add a skill" onChange={(event) => setTagInput(event.target.value)} onKeyDown={addTagByKey} />
          <Button variant="ghost" aria-label="Add skill" onClick={() => addTag(tagInput)}><Plus size={18} aria-hidden="true" /></Button>
        </div>
        <div className="skill-tags">
          {techStack.map((tag) => <button type="button" key={tag} className="skill-tag" aria-label={`Remove ${tag}`} onClick={() => setTechStack((current) => current.filter((item) => item !== tag))}>{tag}<X size={14} aria-hidden="true" /></button>)}
          {presetTags.filter((tag) => !techStack.includes(tag)).map((tag) => <button type="button" key={tag} className="skill-tag skill-suggestion" onClick={() => addTag(tag)}><Plus size={14} aria-hidden="true" />{tag}</button>)}
        </div>
      </div>

      <div className="control-pair">
        <label className="form-field">Experience level
          <select value={difficulty} onChange={(event) => setDifficulty(event.target.value as InterviewConfig['difficulty'])}>
            {levels.map((level) => <option key={level}>{level}</option>)}
          </select>
        </label>
        <label className="form-field">Questions
          <select value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
            {[4, 5, 8, 12, 16, 20].map((count) => <option key={count}>{count}</option>)}
          </select>
        </label>
      </div>
      <label className="check-line"><input type="checkbox" checked={videoMode} onChange={(event) => setVideoMode(event.target.checked)} /> Show and hear the simulated interviewer</label>
      <Button type="submit" loading={loading} disabled={!role.trim()}>Set up interview <ArrowRight size={16} aria-hidden="true" /></Button>
    </form>
  );
}
