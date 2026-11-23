const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');

const source = readFileSync('src/services/hiring.ts', 'utf8');
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const context = { exports: {}, require, Date };
runInNewContext(outputText, context);
const { canSchedule, findCandidates, nextStages, parseInterviewTime, scheduledCandidates, updateHiring } = context.exports;

const now = Date.UTC(2026, 10, 22, 9, 0);
const hour = 3_600_000;

function register() {
  let rows = [];
  let sequence = 0;
  function apply(action, at = now) {
    const id = `event-${++sequence}`;
    rows = updateHiring(rows, action, id, at).candidates;
    return id;
  }
  function candidate(id) { return rows.find((row) => row.id === id); }
  function change(id, action, at = now) { apply({ id, revision: candidate(id).revision, ...action }, at); }
  function add(name = 'Dana Cho', role = 'Platform Engineer') { return apply({ type: 'add', name, role, evidence: '  Built a migration plan.  ' }); }
  function advance(id) {
    change(id, { type: 'move', stage: 'Review' });
    change(id, { type: 'review', recommendation: 'Advance', notes: 'Relevant migration work.' });
  }
  function schedule(id, start = now + hour, duration = 30) { change(id, { type: 'schedule', start, duration, topic: 'System design' }); }
  return { apply, add, advance, schedule, change, candidate, rows: () => rows };
}

test('register validates and trims fields and searches by both role and name', () => {
  const r = register();
  assert.throws(() => r.add('  '), /candidate name/);
  const dana = r.add('  Dana Cho  ');
  r.add('Ellis Kent', 'Product Designer');
  assert.equal(r.candidate(dana).name, 'Dana Cho');
  assert.equal(r.candidate(dana).evidence, 'Built a migration plan.');
  assert.deepEqual(Array.from(findCandidates(r.rows(), 'Applied', '  dAna    engineer  '), ({ id }) => id), [dana]);
  assert.equal(findCandidates(r.rows(), 'Closed', 'engineer').length, 0);
});

test('an Advance review and a completed interview unlock the Offer stage', () => {
  const r = register();
  const id = r.add();
  assert.throws(() => r.change(id, { type: 'move', stage: 'Offer' }), /unavailable/);
  assert.throws(() => r.change(id, { type: 'review', recommendation: 'Advance', notes: 'Good fit' }), /move the candidate to review/i);
  r.change(id, { type: 'move', stage: 'Review' });
  assert.throws(() => r.change(id, { type: 'review', recommendation: 'Advance', notes: '  ' }), /review notes/);
  r.change(id, { type: 'review', recommendation: 'Hold', notes: 'Ask for work sample.' });
  assert.equal(canSchedule(r.candidate(id)), false);
  assert.throws(() => r.schedule(id), /Advance/);
  r.change(id, { type: 'review', recommendation: 'Advance', notes: 'Work sample received.' });
  r.schedule(id);
  assert.equal(r.candidate(id).stage, 'Interview');
  assert.match(r.candidate(id).activity[0].description, /scheduled and moved/);
  assert.equal(r.candidate(id).activity[2].notes, 'Ask for work sample.');
  assert.throws(() => r.change(id, { type: 'complete' }), /start time/);
  r.change(id, { type: 'complete' }, now + hour);
  assert.ok(nextStages(r.candidate(id)).includes('Offer'));
  r.change(id, { type: 'move', stage: 'Offer' });
  assert.equal(r.candidate(id).stage, 'Offer');
  assert.equal(scheduledCandidates(r.rows()).length, 0);
});

test('the scheduling rules reject conflicts and allow adjacent bookings and rescheduling', () => {
  const r = register();
  const first = r.add();
  const second = r.add('Ellis Kent');
  r.advance(first);
  r.advance(second);
  r.schedule(first);
  assert.throws(() => r.schedule(second, now), /future/);
  assert.throws(() => r.schedule(second, now + hour + 15 * 60_000), /Dana Cho/);
  assert.equal(r.candidate(second).stage, 'Review');
  r.schedule(second, now + hour + 30 * 60_000);
  r.schedule(first, now + hour + 5 * 60_000, 15);
  assert.match(r.candidate(first).activity[0].description, /rescheduled/);
  assert.deepEqual(Array.from(scheduledCandidates(r.rows()), ({ id }) => id), [first, second]);
});

test('stage changes cancel the booking, reopening starts a fresh review, and old activity remains', () => {
  const r = register();
  const id = r.add();
  r.advance(id);
  r.schedule(id);
  r.change(id, { type: 'move', stage: 'Closed' });
  assert.equal(r.candidate(id).interview.status, 'Cancelled');
  assert.equal(r.candidate(id).activity[0].interview.start, now + hour);
  assert.equal(scheduledCandidates(r.rows()).length, 0);
  r.change(id, { type: 'move', stage: 'Review' });
  assert.equal(r.candidate(id).review, undefined);
  assert.equal(r.candidate(id).interview, undefined);
  assert.equal(r.candidate(id).activity.length, 6);
  r.change(id, { type: 'remove' });
  assert.equal(r.rows().length, 0);
});

test('stale edits cannot replace a newer record or remove it', () => {
  const r = register();
  const id = r.add();
  const stale = r.candidate(id).revision;
  r.advance(id);
  assert.throws(() => r.apply({ type: 'remove', id, revision: stale }), /another view/);
  assert.equal(r.candidate(id).review.recommendation, 'Advance');
});

test('local time parser rejects invalid, rolled-over, and offset-bearing values', () => {
  assert.equal(parseInterviewTime('2028-02-29T12:00'), new Date(2028, 1, 29, 12).getTime());
  for (const value of ['', '2027-02-29T12:00', '2028-02-29T12:00Z', '2028-02-29T12:00:00']) {
    assert.ok(Number.isNaN(parseInterviewTime(value)), value);
  }
});

test('cancelling frees the slot for others, blocks a second cancel, and allows rescheduling', () => {
  const r = register();
  const first = r.add();
  const second = r.add('Ellis Kent');
  r.advance(first);
  r.advance(second);
  r.schedule(first);
  assert.throws(() => r.change(second, { type: 'cancel' }), /no scheduled interview/);
  r.change(first, { type: 'cancel' });
  assert.equal(r.candidate(first).interview.status, 'Cancelled');
  assert.equal(r.candidate(first).activity[0].description, 'Interview cancelled');
  assert.equal(scheduledCandidates(r.rows()).length, 0);
  assert.throws(() => r.change(first, { type: 'cancel' }), /no scheduled interview/);
  // The freed slot no longer conflicts, and a fresh booking reads as scheduled, not rescheduled.
  r.schedule(second);
  assert.equal(r.candidate(second).interview.start, now + hour);
  r.schedule(first, now + hour + 30 * 60_000);
  assert.equal(r.candidate(first).activity[0].description, 'Interview scheduled');
  assert.deepEqual(Array.from(scheduledCandidates(r.rows()), ({ id }) => id), [second, first]);
});

test('field length limits reject oversized names, roles, notes, and evidence', () => {
  const r = register();
  assert.throws(() => r.add('x'.repeat(101)), /100 characters or fewer/);
  assert.throws(() => r.add('Dana Cho', 'x'.repeat(101)), /100 characters or fewer/);
  assert.throws(
    () => r.apply({ type: 'add', name: 'Dana Cho', role: 'Platform Engineer', evidence: 'x'.repeat(4001) }),
    /4000 characters or fewer/,
  );
  const id = r.add();
  r.change(id, { type: 'move', stage: 'Review' });
  assert.throws(
    () => r.change(id, { type: 'review', recommendation: 'Advance', notes: 'x'.repeat(2001) }),
    /2000 characters or fewer/,
  );
  r.change(id, { type: 'review', recommendation: 'Advance', notes: 'Work sample received.' });
  assert.throws(
    () => r.apply({ id, revision: r.candidate(id).revision, type: 'schedule', start: now + hour, duration: 30, topic: 'x'.repeat(101) }),
    /100 characters or fewer/,
  );
});
