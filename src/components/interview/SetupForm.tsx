import React, { useState } from 'react';
import { Zap, Plus, X, Video, Mic, Briefcase, ListFilter, HelpCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { InterviewConfig } from '../../types';
import { useAppStore } from '../../store/appStore';
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
  const { profile } = useAppStore();
  const [jobRole, setJobRole] = useState(() => {
    return profile?.target_role || localStorage.getItem('hiremind_guest_role') || '';
  });
  const [techStack, setTechStack] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Senior'>('Intermediate');
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'system-design' | 'hr' | 'dsa'>('technical');
  const [questionCount, setQuestionCount] = useState(5);
  const [targetCompany, setTargetCompany] = useState('');
  
  // Custom Toggles
  const [mode, setMode] = useState<'full' | 'specific'>('full');
  const [videoMode, setVideoMode] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);

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
      interviewType: mode === 'full' ? 'full' : interviewType,
      questionCount,
      mode,
      videoMode,
      voiceMode,
      targetCompany: targetCompany.trim() || 'General'
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Simulation Mode Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
          Choose Simulation Mode
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }} className="mode-grid">
          <style dangerouslySetInnerHTML={{__html: `
            @media (min-width: 768px) {
              .mode-grid {
                grid-template-columns: 1fr 1fr !important;
              }
            }
          `}} />

          {/* Full Simulation */}
          <div
            onClick={() => setMode('full')}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: mode === 'full' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              backgroundColor: mode === 'full' ? 'var(--bg-hover)' : 'var(--bg-elevated)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <Briefcase style={{ width: '20px', height: '20px', color: mode === 'full' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Full Interview Loop</h4>
              {mode === 'full' && <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--accent-primary)', marginLeft: 'auto' }} />}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Simulates a comprehensive career interview. Questions progress through <strong>Technical ➔ Coding ➔ Behavioral ➔ HR</strong>, escalating in difficulty level from Easy to Hard.
            </p>
          </div>

          {/* Target Practice */}
          <div
            onClick={() => setMode('specific')}
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: mode === 'specific' ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              backgroundColor: mode === 'specific' ? 'var(--bg-hover)' : 'var(--bg-elevated)',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <ListFilter style={{ width: '20px', height: '20px', color: mode === 'specific' ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
              <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>Specific Practice Round</h4>
              {mode === 'specific' && <CheckCircle style={{ width: '16px', height: '16px', color: 'var(--accent-primary)', marginLeft: 'auto' }} />}
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Select a single focused round type (e.g. only coding challenges or behavioral STAR questions) to drill down and perfect specific concepts.
            </p>
          </div>
        </div>
      </div>

      {/* Target Configs (Job, Tech Stack, Experience) */}
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
              grid-template-columns: repeat(4, 1fr) !important;
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
            Defines the role context of the simulation.
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

        {/* Card 4: Target Company */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label>4. Target Company</label>
          <input
            type="text"
            placeholder="e.g. Google, Meta, Netflix (optional)"
            value={targetCompany}
            onChange={(e) => setTargetCompany(e.target.value)}
            style={{ backgroundColor: 'var(--bg-elevated)' }}
          />
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
            Tailors questions to this company's interview style.
          </span>
        </Card>
      </div>

      {/* Row 2: Select Focus Rounds OR Interactive Audio/Video Setup */}
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

        {/* Dynamic Focus Section */}
        {mode === 'specific' ? (
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label>Round Format type</label>
            <div 
              style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '12px' 
              }}
            >
              {(['technical', 'behavioral', 'system-design', 'hr', 'dsa'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInterviewType(type)}
                  style={{
                    padding: '16px 12px',
                    borderRadius: 'var(--radius-md)',
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
                    border: interviewType === type ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)'
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
        ) : (
          <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label>Round Outline Summary</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { name: '1. Technical Quiz Qs', desc: 'Core concept mapping & coding fundamentals (Easy)' },
                { name: '2. Real-time IDE Coding', desc: 'Code challenge implementation in the live IDE (Medium)' },
                { name: '3. System Design / STAR behavioral', desc: 'Architecture discussion & scenario-based prompts (Medium/Hard)' },
                { name: '4. HR & Culture Fit', desc: 'Goal alignment and values assessment (Hard)' }
              ].map(round => (
                <div key={round.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{round.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{round.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Audio / Video Options */}
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <label>Recruiter & Input Settings</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Video Mode Toggle */}
            <div 
              onClick={() => setVideoMode(!videoMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: videoMode ? 'rgba(0, 212, 170, 0.05)' : 'var(--bg-elevated)',
                border: videoMode ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              <Video style={{ width: '18px', height: '18px', color: videoMode ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>AI Video Recruiter</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Simulates visual feed and speaks questions</span>
              </div>
            </div>

            {/* Voice Mode Toggle */}
            <div 
              onClick={() => setVoiceMode(!voiceMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: voiceMode ? 'rgba(0, 212, 170, 0.05)' : 'var(--bg-elevated)',
                border: voiceMode ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                cursor: 'pointer',
                transition: 'all 150ms ease'
              }}
            >
              <Mic style={{ width: '18px', height: '18px', color: voiceMode ? 'var(--accent-primary)' : 'var(--text-secondary)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-primary)' }}>Hands-free Voice Mode</span>
                <span style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Speak response naturally without writing text</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Slider & Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label>Question Count</label>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--accent-primary)', fontFamily: 'var(--font-numeric)' }}>
              {questionCount}
            </span>
          </div>
          <input
            type="range"
            min={4}
            max={20}
            step={4}
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
            <span>4 Qs (Standard Loop)</span>
            <span>20 Qs (Exhaustive Loop)</span>
          </div>
        </Card>

        <Button
          type="submit"
          variant="primary"
          loading={loading}
          disabled={loading || !jobRole.trim()}
          icon={<Zap style={{ width: '16px', height: '16px' }} />}
          style={{ padding: '16px 20px', borderRadius: 'var(--radius-md)', width: '100%' }}
        >
          Generate Custom Interview Lab
        </Button>
      </div>

    </form>
  );
};
