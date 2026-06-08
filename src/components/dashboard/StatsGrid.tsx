import React from 'react';
import { FileText, Mic, Map, TrendingUp, Compass } from 'lucide-react';
import { Card } from '../ui/Card';
import { ProgressRing } from '../ui/ProgressRing';
import { useAppStore } from '../../store/appStore';
import '../../styles/globals.css';

export const StatsGrid: React.FC = () => {
  const { resumeHistory, activeResume, interviewHistory, activeRoadmap } = useAppStore();

  // 1. ATS Score (Last Resume Score)
  const lastAtsScore = activeResume ? activeResume.atsScore : (resumeHistory[0]?.atsScore || 0);

  // 2. Interviews completed
  const interviewsCount = interviewHistory.length;

  // 3. Skills Mapped
  const skillsCount = activeRoadmap ? activeRoadmap.skillGaps.length : 0;

  // 4. Readiness Calculation: (ATS score + Interview score * 10) / 2 or fallback to reasonable mock metrics if empty
  const avgInterviewScore = interviewHistory.length > 0 
    ? (interviewHistory.reduce((acc, curr) => acc + curr.overallScore, 0) / interviewHistory.length) * 10 
    : 0;
  
  let readinessPercentage = 0;
  if (lastAtsScore > 0 && avgInterviewScore > 0) {
    readinessPercentage = Math.round((lastAtsScore + avgInterviewScore) / 2);
  } else if (lastAtsScore > 0) {
    readinessPercentage = Math.round(lastAtsScore * 0.95);
  } else if (avgInterviewScore > 0) {
    readinessPercentage = Math.round(avgInterviewScore * 0.95);
  }

  return (
    <div 
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '24px',
        width: '100%'
      }}
    >
      {/* Card 1: ATS Score */}
      <Card hoverable glow={lastAtsScore > 0 ? 'amber' : 'none'} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--accent-secondary)' }}>
            <FileText style={{ width: '20px', height: '20px' }} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
            <TrendingUp style={{ width: '12px', height: '12px' }} />
            +8% ↑
          </span>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--accent-secondary)', lineHeight: 1, marginTop: '16px' }}>
            {lastAtsScore > 0 ? lastAtsScore : '—'}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>
            ATS SCORE (LAST RESUME)
          </div>
        </div>
      </Card>

      {/* Card 2: Interviews Done */}
      <Card hoverable style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0, 212, 170, 0.1)', color: 'var(--accent-primary)' }}>
            <Mic style={{ width: '20px', height: '20px' }} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
            <TrendingUp style={{ width: '12px', height: '12px' }} />
            +12% ↑
          </span>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--accent-primary)', lineHeight: 1, marginTop: '16px' }}>
            {interviewsCount}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>
            SESSIONS COMPLETED
          </div>
        </div>
      </Card>

      {/* Card 3: Skills Mapped */}
      <Card hoverable style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '160px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(129, 140, 248, 0.1)', color: 'var(--accent-purple)' }}>
            <Map style={{ width: '20px', height: '20px' }} />
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
            Stable
          </span>
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-3xl)', fontWeight: 700, fontFamily: 'var(--font-numeric)', color: 'var(--accent-purple)', lineHeight: 1, marginTop: '16px' }}>
            {skillsCount}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginTop: '6px', letterSpacing: '0.05em' }}>
            SKILLS IN ROADMAP
          </div>
        </div>
      </Card>

      {/* Card 4: Career Readiness */}
      <Card hoverable style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: '160px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(0, 212, 170, 0.05)', color: 'var(--accent-primary)', width: 'fit-content', marginBottom: '8px' }}>
            <Compass style={{ width: '20px', height: '20px' }} />
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CAREER READINESS
          </div>
        </div>
        <ProgressRing score={readinessPercentage > 0 ? readinessPercentage : 45} size={72} strokeWidth={6} />
      </Card>
    </div>
  );
};
