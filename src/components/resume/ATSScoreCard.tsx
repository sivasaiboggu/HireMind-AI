import { useCountUp } from '../../hooks/useCountUp';

interface ATSScoreCardProps {
  atsScore: number;
  contentScore: number;
  formatScore: number;
}

function Score({ label, score }: { label: string; score: number }) {
  const displayScore = useCountUp(score, 360);
  return (
    <div className="review-score">
      <dt>{label}</dt>
      <dd>
        <strong aria-hidden="true" className="numeric">{displayScore}<small>/100</small></strong>
        <span className="sr-only">{score} out of 100</span>
        <meter min={0} max={100} value={score} aria-label={label} />
        <span className="muted">{score >= 80 ? 'Strong' : score >= 60 ? 'On track' : 'Needs work'}</span>
      </dd>
    </div>
  );
}

export function ATSScoreCard({ atsScore, contentScore, formatScore }: ATSScoreCardProps) {
  return (
    <dl aria-label="Resume scores" className="review-scores">
      <Score label="ATS score" score={atsScore} />
      <Score label="Content" score={contentScore} />
      <Score label="Formatting" score={formatScore} />
    </dl>
  );
}
