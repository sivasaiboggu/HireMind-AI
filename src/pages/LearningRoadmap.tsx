import React, { useState } from 'react';
import { GoalSetup } from '../components/roadmap/GoalSetup';
import { RoadmapTimeline } from '../components/roadmap/RoadmapTimeline';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore } from '../store/appStore';
import { SavedRoadmap } from '../types';
import { Compass, Activity, Terminal, Clock, Award, AlertTriangle, ArrowLeft } from 'lucide-react';
import '../styles/globals.css';
import '../styles/animations.css';

export const LearningRoadmap: React.FC = () => {
  const { 
    addRoadmap, 
    activeRoadmap, 
    setActiveRoadmap, 
    togglePhaseCompleted 
  } = useAppStore();

  const { execute: buildRoadmap, loading, error, reset } = useGemini(gemini.generateRoadmap, 10); // cost 10 credits

  const [currentGoal, setCurrentGoal] = useState('');
  const [currentTimeline, setCurrentTimeline] = useState('');

  const handleGenerate = async (goal: string, skills: string[], level: string, timeline: string) => {
    setCurrentGoal(goal);
    setCurrentTimeline(timeline);

    const result = await buildRoadmap(goal, skills, level, timeline);
    if (result) {
      const savedRoadmap: SavedRoadmap = {
        ...result,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        experienceLevel: level,
        currentSkills: skills,
        completedPhases: []
      };
      // Save in Zustand
      addRoadmap(savedRoadmap);
    }
  };

  const handleReset = () => {
    reset();
    setActiveRoadmap(null);
  };

  const displayRoadmap = activeRoadmap;

  // Derive topics count
  const totalTopicsCount = displayRoadmap
    ? displayRoadmap.phases.reduce((acc, curr) => acc + curr.topics.length, 0)
    : 0;

  // Calculate learning velocity recommendation based on timeline
  const getVelocityHrs = (timelineGoal: string) => {
    if (timelineGoal.includes('3')) return 15; // 3 months -> 15 hrs/week
    if (timelineGoal.includes('1 year') || timelineGoal.includes('12')) return 6; // 1 year -> 6 hrs/week
    return 10; // 6 months -> 10 hrs/week
  };

  const velocity = displayRoadmap ? getVelocityHrs(currentTimeline || '6 months') : 10;

  return (
    <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      {!loading && !displayRoadmap && (
        <div>
          <h2 style={{ fontSize: 'var(--text-3xl)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
            AI Learning Planner
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Map out a personalized learning path with resources based on current market demands and targets.
          </p>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', alignItems: 'center', justifyContent: 'center', padding: '60px 0', textAlign: 'center' }}>
          <Activity className="rotating-brain" style={{ width: '48px', height: '48px', color: 'var(--accent-purple)' }} />
          <div className="typing-cursor" style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--accent-purple)', letterSpacing: '0.05em' }}>
            CUSTOMIZING LEARNING TOPICS & CURATING STUDY MATERIALS...
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
            Evaluating prerequisite knowledge, technical dependencies, and industry demand spikes.
          </p>
          <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
            <Skeleton height={60} />
            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <Skeleton height={140} />
                <Skeleton height={140} />
              </div>
              <Skeleton height={300} />
            </div>
          </div>
        </div>
      )}

      {/* Input Form Setup */}
      {!loading && !displayRoadmap && (
        <Card hoverable={false} style={{ maxWidth: '800px', margin: '0 auto', width: '100%', padding: '32px' }}>
          <GoalSetup onGenerate={handleGenerate} loading={loading} />
        </Card>
      )}

      {/* Roadmap Output details */}
      {!loading && displayRoadmap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
          
          {/* Re-plan navigation */}
          <div>
            <button
              onClick={handleReset}
              style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '8px 16px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)'
              }}
              className="btn-press"
            >
              ← Back to Strategy setup
            </button>
          </div>

          {/* Heading info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h3 style={{ fontSize: 'var(--text-2xl)', fontWeight: 500, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>
              Your Pathway to: {displayRoadmap.role}
            </h3>
            <div style={{ display: 'flex', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
              <span>Timeline: {displayRoadmap.totalWeeks} Weeks</span>
              <span>•</span>
              <span>{totalTopicsCount} Core Curriculum Topics Mapped</span>
            </div>
          </div>

          {/* Core double layout */}
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr',
              gap: '32px',
              alignItems: 'start'
            }}
            className="roadmap-layout-grid"
          >
            <style dangerouslySetInnerHTML={{__html: `
              @media (min-width: 1024px) {
                .roadmap-layout-grid {
                  grid-template-columns: 7fr 5fr !important;
                }
              }
            `}} />

            {/* Left Timeline */}
            <RoadmapTimeline
              phases={displayRoadmap.phases}
              completedPhases={displayRoadmap.completedPhases || []}
              onToggleComplete={(phaseId) => togglePhaseCompleted(displayRoadmap.id, phaseId)}
            />

            {/* Right Sticky Side Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'sticky', top: '100px' }}>
              
              {/* 1. Skill Gap comparison */}
              <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Skill Gap & Market Demand
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {displayRoadmap.skillGaps.map((gap, idx) => (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 600 }}>
                        {gap.name}
                      </span>
                      
                      {/* Market demand line */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)' }}>
                          <span>Market Demand</span>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{gap.demandPercentage}%</span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: 'var(--accent-primary)', width: `${gap.demandPercentage}%` }} />
                        </div>
                      </div>

                      {/* Candidate Gap line */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)' }}>
                          <span>Your Skill Gap</span>
                          <span style={{ color: 'var(--accent-danger)', fontWeight: 700 }}>{gap.gapPercentage}%</span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: 'var(--accent-danger)', width: `${gap.gapPercentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* 2. Learning Velocity */}
              <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Clock style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
                  <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Learning Velocity Target
                  </h4>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  To achieve this timeline, dedicate approximately <strong className="text-purple">{velocity} hours per week</strong> to conceptual study and project builds.
                </p>
              </Card>

            </div>

          </div>

        </div>
      )}

      {/* Error state card */}
      {!loading && error && (
        <Card hoverable={false} style={{ borderColor: 'var(--accent-danger)', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--accent-danger)' }}>
            <AlertTriangle style={{ width: '24px', height: '24px' }} />
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Roadmap Generation Suspended</h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {error.message || 'An error occurred during roadmap assembly. Please verify connectivity and parameters.'}
          </p>
          <Button variant="danger" onClick={reset} style={{ width: 'fit-content' }}>
            Dismiss & Retry
          </Button>
        </Card>
      )}

    </div>
  );
};
export default LearningRoadmap;
