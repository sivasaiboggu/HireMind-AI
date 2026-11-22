import { PageHeading, WorkSheet } from '../components/ui/PageHeading';
import React, { useState } from 'react';
import { GoalSetup } from '../components/roadmap/GoalSetup';
import { RoadmapTimeline } from '../components/roadmap/RoadmapTimeline';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { ProgressiveLoader } from '../components/ui/ProgressiveLoader';
import { Button } from '../components/ui/Button';
import { useGemini } from '../hooks/useGemini';
import { gemini } from '../services/gemini';
import { useAppStore, generateId } from '../store/appStore';
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
        id: generateId(),
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
    <div className="container tool-page page-enter">
      <PageHeading
        title={displayRoadmap ? displayRoadmap.role : 'Study plan'}
        action={displayRoadmap && !loading && <Button variant="ghost" onClick={handleReset}><ArrowLeft size={16} aria-hidden="true" /> New plan</Button>}
      >
        {displayRoadmap ? `${displayRoadmap.totalWeeks} weeks · ${totalTopicsCount} topics` : 'Turn a target role into a week-by-week plan you can work through.'}
      </PageHeading>

      {/* Loading Skeletons */}
      {loading && (
        <div style={{ width: '100%' }}>
          <ProgressiveLoader 
            messages={[
              "Mapping the path to the target role...",
              "Finding the skill gaps...",
              "Looking up learning resources...",
              "Building the week-by-week plan...",
              "Finishing the roadmap..."
            ]}
            subtitle="This usually takes a few seconds."
            iconColor="var(--accent-purple)"
          />
          <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '20px' }}>
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
        <WorkSheet note={
          <>
            <h2>How the plan works</h2>
            <p>List the skills you already know. The plan puts gaps first and links to resources for each phase.</p>
            <p>Mark phases complete as you go. Your progress is saved with the plan.</p>
          </>
        }>
          <GoalSetup onGenerate={handleGenerate} loading={loading} />
        </WorkSheet>
      )}

      {/* Roadmap Output details */}
      {!loading && displayRoadmap && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
          
          <div className="roadmap-layout-grid">
            {/* Left Timeline */}
            <RoadmapTimeline
              phases={displayRoadmap.phases}
              completedPhases={displayRoadmap.completedPhases || []}
              onToggleComplete={(phaseId) => togglePhaseCompleted(displayRoadmap.id, phaseId)}
            />

            {/* Right Sticky Side Panel */}
            <div className="roadmap-notes">
              
              {/* 1. Skill Gap comparison */}
              <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Skills to work on
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
                          <span>Estimated demand</span>
                          <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{gap.demandPercentage}%</span>
                        </div>
                        <div style={{ height: '4px', backgroundColor: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', backgroundColor: 'var(--accent-primary)', width: `${gap.demandPercentage}%` }} />
                        </div>
                      </div>

                      {/* Candidate Gap line */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: 'var(--text-secondary)' }}>
                          <span>Your gap</span>
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
                    Weekly study time
                  </h4>
                </div>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  For this timeline, set aside about <strong className="text-purple">{velocity} hours per week</strong> for study and projects.
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
            <h4 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Couldn’t make a study plan</h4>
          </div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
            {error.message || 'Check your connection and try again.'}
          </p>
          <Button variant="danger" onClick={reset} style={{ width: 'fit-content' }}>
            Dismiss
          </Button>
        </Card>
      )}

    </div>
  );
};
export default LearningRoadmap;
