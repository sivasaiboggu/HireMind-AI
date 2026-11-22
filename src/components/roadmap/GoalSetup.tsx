import { useState, type FormEvent, type KeyboardEvent } from 'react';
import { ArrowRight, Import, Plus, X } from 'lucide-react';
import { z } from 'zod/mini';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/appStore';

interface GoalSetupProps {
  onGenerate: (goal: string, skills: string[], level: string, timeline: string) => void;
  loading: boolean;
}

const roleInput = z.string().check(z.trim(), z.minLength(1));
const levels = [['student', 'Student or entry level'], ['1-2yr', 'Junior (1–2 years)'], ['3-5yr', 'Mid-level (3–5 years)'], ['Senior', 'Senior and above']];
const timelines = ['3 months', '6 months', '1 year'];

export function GoalSetup({ onGenerate, loading }: GoalSetupProps) {
  const lastResume = useAppStore((state) => state.resumeHistory[0]);
  const [goal, setGoal] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [level, setLevel] = useState('1-2yr');
  const [timeline, setTimeline] = useState('6 months');

  function addSkill() {
    const skill = skillInput.trim();
    if (skill) setSkills((current) => current.includes(skill) ? current : [...current, skill]);
    setSkillInput('');
  }

  function addSkillByKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addSkill();
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const role = roleInput.safeParse(goal);
    if (!role.success) return;
    const pendingSkill = skillInput.trim();
    const submittedSkills = pendingSkill && !skills.includes(pendingSkill) ? [...skills, pendingSkill] : skills;
    onGenerate(role.data, submittedSkills.length ? submittedSkills : ['General Web Development'], level, timeline);
  }

  return (
    <form onSubmit={submit} className="form-stack form-work">
      {lastResume && (
        <Button variant="ghost" className="import-skills" icon={<Import size={16} aria-hidden="true" />} onClick={() => {
          setSkills([...new Set(lastResume.matchedKeywords)].slice(0, 10));
          setGoal(lastResume.jobRole);
        }}>Use role and skills from last resume</Button>
      )}
      <label className="form-field">Target role<input required placeholder="Frontend engineer" value={goal} onChange={(event) => setGoal(event.target.value)} /></label>
      <div className="form-field">
        <label htmlFor="study-skill">Skills you already know</label>
        <div className="input-with-action">
          <input id="study-skill" value={skillInput} placeholder="Add a skill" onChange={(event) => setSkillInput(event.target.value)} onKeyDown={addSkillByKey} />
          <Button variant="ghost" aria-label="Add skill" onClick={addSkill}><Plus size={18} aria-hidden="true" /></Button>
        </div>
        {skills.length > 0 && (
          <div className="skill-tags">
            {skills.map((skill) => <button type="button" key={skill} className="skill-tag" aria-label={`Remove ${skill}`} onClick={() => setSkills((current) => current.filter((item) => item !== skill))}>{skill}<X size={14} aria-hidden="true" /></button>)}
          </div>
        )}
      </div>
      <div className="control-pair">
        <label className="form-field">Experience level
          <select value={level} onChange={(event) => setLevel(event.target.value)}>
            {levels.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="form-field">Time to prepare
          <select value={timeline} onChange={(event) => setTimeline(event.target.value)}>
            {timelines.map((option) => <option key={option}>{option}</option>)}
          </select>
        </label>
      </div>
      <Button type="submit" loading={loading} disabled={!goal.trim()}>Make study plan <ArrowRight size={16} aria-hidden="true" /></Button>
    </form>
  );
}

export default GoalSetup;
