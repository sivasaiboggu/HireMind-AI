import { useId, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { ResourceLinks } from './ResourceLinks';
import type { Phase } from '../../types';

interface PhaseCardProps {
  phase: Phase;
  completed: boolean;
  onToggleComplete: () => void;
}

export function PhaseCard({ phase, completed, onToggleComplete }: PhaseCardProps) {
  const [expanded, setExpanded] = useState(true);
  const details = useId();
  const Icon = expanded ? ChevronUp : ChevronDown;

  return (
    <article className="phase-sheet">
      <div className="phase-heading">
        <label className="phase-check" title={completed ? 'Mark incomplete' : 'Mark complete'}>
          <input type="checkbox" checked={completed} onChange={onToggleComplete} aria-label={`Mark ${phase.title} complete`} />
        </label>
        <h3>
          <button type="button" aria-expanded={expanded} aria-controls={details} onClick={() => setExpanded(!expanded)}>
            <span><small>{phase.weeks}</small>{phase.title}</span>
            <Icon size={18} aria-hidden="true" />
          </button>
        </h3>
      </div>
      <div id={details} hidden={!expanded}>
        {phase.topics.map((topic) => (
          <section key={topic.id} className="phase-topic">
            <div><h4>{topic.name}</h4><span className="meta-label">{topic.level}</span></div>
            <p>{topic.description}</p>
            <p>{topic.whyItMatters}</p>
            {topic.resources?.length > 0 && <ResourceLinks resources={topic.resources} />}
          </section>
        ))}
      </div>
    </article>
  );
}

export default PhaseCard;
