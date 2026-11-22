import { PhaseCard } from './PhaseCard';
import type { Phase } from '../../types';

interface RoadmapTimelineProps {
  phases: Phase[];
  completedPhases: string[];
  onToggleComplete: (phaseId: string) => void;
}

export function RoadmapTimeline({ phases = [], completedPhases = [], onToggleComplete }: RoadmapTimelineProps) {
  const nextPhase = phases.find((phase) => !completedPhases.includes(phase.id));

  return (
    <ol className="study-timeline" aria-label="Study phases">
      {phases.map((phase) => {
        const completed = completedPhases.includes(phase.id);
        return (
          <li key={phase.id} aria-current={phase.id === nextPhase?.id ? 'step' : undefined}>
            <PhaseCard phase={phase} completed={completed} onToggleComplete={() => onToggleComplete(phase.id)} />
          </li>
        );
      })}
    </ol>
  );
}

export default RoadmapTimeline;
