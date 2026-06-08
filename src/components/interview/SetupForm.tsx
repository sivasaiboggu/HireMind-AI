import React, { useState } from 'react';
import { Zap, Plus, X } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { InterviewConfig } from '../../types';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface SetupFormProps {
  onGenerate: (config: InterviewConfig) => void;
  loading: boolean;
}

export const SetupForm: React.FC<SetupFormProps> = ({
  onGenerate,
  loading
}) => {
  const [jobRole, setJobRole] = useState('');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Senior'>('Intermediate');
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'system-design' | 'hr'>('technical');
  const [questionCount, setQuestionCount] = useState(5);

  const presetTags = ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'AWS', 'System Design', 'Git'];

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !techStack.includes(trimmed)) {
      setTechStack([...techStack, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTechStack(techStack.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobRole.trim()) return;
    onGenerate({
      jobRole,
      techStack: techStack.length > 0 ? techStack : ['General'],
      difficulty,
      interviewType,
      questionCount
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* 3 Config Cards Grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="setup-grid"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 1024px) {
            .setup-grid {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
        `}} />

        {/* Card 1: Job Role */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>1. Target Job Role</label>
          <input
            type="text"
            required
            placeholder="e.g. Frontend Developer"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Specifies the theme of interview simulation.
          </span>
        </Card>

        {/* Card 2: Tech Stack */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>2. Tech Stack & Skills</label>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              placeholder="Add skill (e.g. React)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ backgroundColor: 'var(--bg-elevated)', paddingRight: '36px' }}
            />
            <button
              type="button"
              onClick={() => addTag(tagInput)}
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                width: '40px',
                height: '40px',
                color: 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              className="btn-press"
            >
              <Plus style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          {/* Tags list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', minHeight: '32px' }}>
            {techStack.map(tag => (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(0, 212, 170, 0.1)',
                  border: '1px solid rgba(0, 212, 170, 0.2)',
                  color: 'var(--accent-primary)',
                  fontSize: '10px',
                  fontWeight: 600
                }}
              >
                {tag}
                <X 
                  onClick={() => removeTag(tag)}
                  style={{ width: '10px', height: '10px', cursor: 'pointer' }} 
                />
              </span>
            ))}
          </div>

          {/* Presets */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {presetTags.slice(0, 5).map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => addTag(tag)}
                style={{
                  fontSize: '9px',
                  color: 'var(--text-secondary)',
                  padding: '2px 6px',
                  backgroundColor: 'var(--bg-hover)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '4px'
                }}
                className="btn-press"
              >
                +{tag}
              </button>
            ))}
          </div>
        </Card>

        {/* Card 3: Seniority */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>3. Experience Level</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {(['Beginner', 'Intermediate', 'Senior'] as const).map(lvl => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficulty(lvl)}
                style={{
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  border: difficulty === lvl ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                  backgroundColor: difficulty === lvl ? 'var(--bg-hover)' : 'var(--bg-elevated)',
                  color: difficulty === lvl ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  textAlign: 'left'
                }}
                className="btn-press"
              >
                {lvl} Level
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: Focus Round Type & Question Slider */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr',
          gap: '24px',
        }}
        className="setup-grid-row2"
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .setup-grid-row2 {
              grid-template-columns: 7fr 5fr !important;
            }
          }
        `}} />

        {/* Interview Focus Type */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label>Round Format type</label>
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
              gap: '12px' 
            }}
          >
            {(['technical', 'behavioral', 'system-design', 'hr'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setInterviewType(type)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid transparent',
                  backgroundColor: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textTransform: 'uppercase',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  boxShadow: interviewType === type ? 'var(--glow-primary)' : 'none',
                  borderRight: interviewType === type ? '1px solid var(--accent-primary)' : 'none',
                  borderLeft: interviewType === type ? '1px solid var(--accent-primary)' : 'none',
                  borderTop: interviewType === type ? '1px solid var(--accent-primary)' : 'none',
                  borderBottom: interviewType === type ? '1px solid var(--accent-primary)' : 'none'
                }}
                className="btn-press"
              >
                <span style={{ color: interviewType === type ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                  {type.replace('-', ' ')}
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Question Count Slider */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Question Count</label>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-numeric)' }}>
              {questionCount}
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={20}
            step={1}
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            style={{ 
              cursor: 'pointer',
              height: '4px',
              backgroundColor: 'var(--bg-elevated)',
              borderRadius: '2px',
              padding: 0
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-muted)', fontWeight: 600 }}>
            <span>5 Qs (Quick)</span>
            <span>20 Qs (Exhaustive)</span>
          </div>
        </Card>
      </div>

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        disabled={loading || !jobRole.trim()}
        icon={<Zap style={{ width: '16px', height: '16px' }} />}
        style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)' }}
      >
        Generate Custom Interview Lab
      </Button>

    </form>
  );
};
