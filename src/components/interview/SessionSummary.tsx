import { ArrowRight, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { useCountUp } from '../../hooks/useCountUp';
import type { SavedInterview } from '../../types';

interface SessionSummaryProps {
  session: SavedInterview;
  onRetry: () => void;
  onDashboard: () => void;
}

export function SessionSummary({ session, onRetry, onDashboard }: SessionSummaryProps) {
  const { answers, config, overallScore } = session;
  const displayScore = useCountUp(overallScore * 10, 360) / 10;
  const categoryScores = new Map<string, { total: number; count: number }>();

  for (const { question, feedback } of answers) {
    const previous = categoryScores.get(question.category) || { total: 0, count: 0 };
    categoryScores.set(question.category, { total: previous.total + feedback.overallScore, count: previous.count + 1 });
  }

  const areas = [...new Set(answers.flatMap(({ feedback }) => feedback.improvements))].slice(0, 3);

  return (
    <div className="interview-review">
      <div className="review-overview">
        <dl className="review-score">
          <dt className="meta-label">Overall score</dt>
          <dd>
            <strong className="numeric" aria-hidden="true">{displayScore}<small>/10</small></strong>
            <span className="sr-only">{overallScore} out of 10</span>
            <p className="muted">{config.jobRole} · {config.difficulty} · {config.interviewType.replace('-', ' ')}</p>
          </dd>
        </dl>
        <dl className="interview-categories">
          {[...categoryScores].map(([category, { total, count }]) => (
            <div key={category}><dt>{category.replace('-', ' ')}</dt><dd>{(total / count).toFixed(1)} <span>/ 10</span></dd></div>
          ))}
        </dl>
      </div>
      <div className="review-columns">
        <section aria-labelledby="answers-title">
          <h2 id="answers-title" className="section-title">Answers</h2>
          {answers.length > 0 ? (
            <ol className="answer-ledger">
              {answers.map(({ question, feedback, userAnswer }, index) => (
                <li key={`${question.id}-${index}`}>
                  <details>
                    <summary><span>{question.text}</span><strong className="numeric">{feedback.overallScore}/10</strong></summary>
                    <div className="answer-details">
                      {userAnswer && <div><h3>Your answer</h3><p>{userAnswer}</p></div>}
                      {feedback.strengths.length > 0 && <div><h3>What worked</h3><ul>{feedback.strengths.map((item, position) => <li key={position}>{item}</li>)}</ul></div>}
                      {feedback.improvements.length > 0 && <div><h3>What to work on</h3><ul>{feedback.improvements.map((item, position) => <li key={position}>{item}</li>)}</ul></div>}
                      {feedback.modelAnswer && <div><h3>Example answer</h3><p>{feedback.modelAnswer}</p></div>}
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          ) : <p className="blank-note">This session has no saved answers.</p>}
        </section>
        <aside className="worksheet-note">
          <h2>For your next interview</h2>
          {areas.length ? <ul>{areas.map((area) => <li key={area}>{area}</li>)}</ul> : <p>No improvement notes were saved.</p>}
        </aside>
      </div>
      <div className="review-actions">
        <Button onClick={onRetry} icon={<RotateCcw size={16} aria-hidden="true" />}>New interview</Button>
        <Button variant="ghost" onClick={onDashboard}>Back to overview <ArrowRight size={16} aria-hidden="true" /></Button>
      </div>
    </div>
  );
}
