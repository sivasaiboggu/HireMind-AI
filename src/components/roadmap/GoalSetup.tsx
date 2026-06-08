import React, { useState } from 'react';
import { Compass, Plus, X, Import } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAppStore } from '../../store/appStore';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface GoalSetupProps {
  onGenerate: (goal: string, skills: string[], level: string, timeline: string) => void;
  loading: boolean;
}

export const GoalSetup: React.FC<GoalSetupProps> = ({
  onGenerate,
  loading
}) => {
  const { resumeHistory } = useAppStore();

  const [goal, setGoal] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [level, setLevel] = useState('1-2yr');
  const [timeline, setTimeline] = useState('6 months');

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addSkill(skillInput);
    }
  };

  // Premium feature: auto-import skills from the last analyzed resume!
  const handleAutoImportSkills = () => {
    if (resumeHistory.length === 0) return;
    const lastResume = resumeHistory[0];
    const imported = [...lastResume.matchedKeywords].slice(0, 10);
    setSkills(imported);
    setGoal(lastResume.jobRole);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    onGenerate(
      goal,
      skills.length > 0 ? skills : ['General Web Development'],
      level,
      timeline
    );
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Dynamic Skill Import Helper */}
      {resumeHistory.length > 0 && (
        <div 
          onClick={handleAutoImportSkills}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 20px',
            backgroundColor: 'rgba(0, 212, 170, 0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: 'var(--text-xs)',
            color: 'var(--accent-primary)',
            transition: 'all 200ms ease'
          }}
          className="btn-press hover:bg-[rgba(0,212,170,0.08)]"
        >
          <Import style={{ width: '16px', height: '16px' }} />
          <span>Auto-fill target role and skills from your last resume audit ({resumeHistory[0].jobRole})</span>
        </div>
      )}

      {/* Target role input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Target Career Role</label>
        <input
          type="text"
          required
          placeholder="e.g. Senior Full-Stack React Engineer"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          style={{
            fontSize: 'var(--text-md)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-xl)'
          }}
        />
      </div>

      {/* Skills input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label>Your Current Core Skills</label>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Add a skill you already know (e.g. CSS Basics)"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ borderRadius: 'var(--radius-md)' }}
          />
          <button
            type="button"
            onClick={() => addSkill(skillInput)}
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              width: '44px',
              height: '44px',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="btn-press"
          >
            <Plus style={{ width: '20px', height: '20px' }} />
          </button>
        </div>

        {/* Skill Chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', minHeight: '32px' }}>
          {skills.map(skill => (
            <span
              key={skill}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-hover)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: 'var(--text-xs)',
                fontWeight: 600
              }}
            >
              {skill}
              <X 
                onClick={() => removeSkill(skill)}
                style={{ width: '12px', height: '12px', cursor: 'pointer', color: 'var(--text-muted)' }} 
              />
            </span>
          ))}
        </div>
      </div>

      {/* Experience Level & Timeline Goal */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="goal-setup-columns"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .goal-setup-columns {
              grid-template-columns: 1fr 1fr !important;
            }
          }
        `}} />

        {/* Experience levels */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label>Experience Tier</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { id: 'student', label: 'Student / Entry' },
              { id: '1-2yr', label: 'Junior (1-2 yrs)' },
              { id: '3-5yr', label: 'Mid-Level (3-5 yrs)' },
              { id: 'Senior', label: 'Senior+' }
            ].map(lvl => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => setLevel(lvl.id)}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: level === lvl.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: level === lvl.id ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                  color: level === lvl.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textAlign: 'center'
                }}
                className="btn-press"
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Timeline Radio cards */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label>Timeline Goal</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { id: '3 months', label: '⚡ Rapid Upskill (3 Months)' },
              { id: '6 months', label: '🧭 Strategic Growth (6 Months)' },
              { id: '1 year', label: '🏆 Career Transition (1 Year)' }
            ].map(time => (
              <button
                key={time.id}
                type="button"
                onClick={() => setTimeline(time.id)}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: timeline === time.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: timeline === time.id ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                  color: timeline === time.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textAlign: 'left'
                }}
                className="btn-press"
              >
                {time.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading || !goal.trim()}
        icon={<Compass style={{ width: '18px', height: '18px' }} />}
        style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}
      >
        Generate My Career Strategy Roadmap
      </Button>

    </form>
  );
};
export default GoalSetup;
