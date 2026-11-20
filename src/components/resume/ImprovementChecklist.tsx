import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { ScoreBar } from '../ui/ScoreBar';
import type { ChecklistItem, Recommendation } from '../../types';
import { ListChecks, Check } from 'lucide-react';
import '../../styles/globals.css';
import '../../styles/animations.css';

interface ImprovementChecklistProps {
  /** Stable id of the saved analysis, so progress survives a page reload. */
  analysisId?: string;
  recommendations: Recommendation[];
  atsChecklist: ChecklistItem[];
}

interface Step {
  id: string;
  title: string;
  description: string;
  priority: 'HIGH' | 'MED' | 'LOW';
}

/**
 * Guided improvement checklist: every recommendation and every failed ATS
 * checklist item becomes one concrete step the user can tick off. Progress
 * is the user's own work — it never changes a score — and it is saved in
 * localStorage per analysis so a reload does not lose it.
 */
export const ImprovementChecklist: React.FC<ImprovementChecklistProps> = ({
  analysisId,
  recommendations,
  atsChecklist,
}) => {
  const steps: Step[] = useMemo(() => {
    const fromRecs: Step[] = recommendations.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      priority: r.priority,
    }));
    const fromChecklist: Step[] = atsChecklist
      .filter((c) => !c.checked)
      .map((c) => ({
        id: `checklist:${c.label}`,
        title: c.label,
        description: 'This ATS check failed on the current resume. Fix it, then re-run the audit to confirm.',
        priority: 'HIGH' as const,
      }));
    // Recommendations first (they carry the explanations), then checklist gaps.
    const seen = new Set<string>();
    return [...fromRecs, ...fromChecklist].filter((s) => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    });
  }, [recommendations, atsChecklist]);

  const storageKey = analysisId ? `hiremind:fix-checklist:${analysisId}` : null;
  const [done, setDone] = useState<Set<string>>(() => {
    if (!storageKey) return new Set();
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...done]));
    } catch {
      // Storage full or unavailable — progress just stays in memory.
    }
  }, [storageKey, done]);

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const doneCount = steps.filter((s) => done.has(s.id)).length;
  const allDone = steps.length > 0 && doneCount === steps.length;

  if (steps.length === 0) {
    return (
      <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ListChecks style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Your improvement checklist</h3>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Nothing to fix — every recommendation is clear and every ATS check passed.
        </p>
      </Card>
    );
  }

  const priorityColor = (p: Step['priority']) =>
    p === 'HIGH' ? 'var(--accent-danger)' : p === 'MED' ? 'var(--accent-warning)' : 'var(--accent-secondary)';

  return (
    <Card hoverable={false} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ListChecks style={{ width: '18px', height: '18px', color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>Your improvement checklist</h3>
        </div>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
          Work through these in order — highest impact first. Tick each one off as you fix it in
          your resume, then re-run the audit to see the new score.
        </p>
      </div>

      <ScoreBar value={doneCount} max={Math.max(steps.length, 1)} label={`${doneCount} of ${steps.length} fixes done`} />

      {allDone && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--accent-primary)', fontWeight: 600, lineHeight: 1.5 }}>
          All fixes ticked off — re-run the audit on the updated resume to confirm the new score.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((step, index) => {
          const isDone = done.has(step.id);
          return (
            <label
              key={step.id}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '14px 16px',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                opacity: isDone ? 0.65 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => toggle(step.id)}
                aria-label={step.title}
                style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--accent-primary)', flexShrink: 0, cursor: 'pointer' }}
              />
              <span style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                  {index + 1}. {step.title}
                </span>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {step.description}
                </span>
                <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: priorityColor(step.priority) }}>
                  {step.priority === 'HIGH' ? 'High impact' : step.priority === 'MED' ? 'Medium impact' : 'Low impact'}
                </span>
              </span>
              {isDone && <Check style={{ width: '16px', height: '16px', color: 'var(--accent-primary)', flexShrink: 0, marginTop: '2px' }} />}
            </label>
          );
        })}
      </div>
    </Card>
  );
};
export default ImprovementChecklist;
