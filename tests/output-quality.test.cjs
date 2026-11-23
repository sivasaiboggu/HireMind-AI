const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-output-quality-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/output-quality.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--rootDir', 'src', '--outDir', output]);
const { improveOutput, scoreRoadmap } = require(path.join(output, 'services/output-quality.js'));

const FULL_ROADMAP = {
  role: 'AI Engineer',
  totalWeeks: 12,
  phases: [
    {
      id: 'p1', title: 'Phase 1: Foundations', weeks: 'Weeks 1-4', color: '#818CF8',
      topics: [
        { id: 't1', name: 'Python', level: 'Beginner', description: 'Core Python for data work.', whyItMatters: 'Every ML tool is Python-first.', resources: [] },
        { id: 't2', name: 'SQL', level: 'Beginner', description: 'Querying relational data.', whyItMatters: 'Data lives in databases.', resources: [] },
      ],
    },
    {
      id: 'p2', title: 'Phase 2: Agents', weeks: 'Weeks 5-12', color: '#00D4AA',
      topics: [
        { id: 't3', name: 'LangGraph', level: 'Intermediate', description: 'Multi-step agent graphs.', whyItMatters: 'Agents need state and tools.', resources: [] },
      ],
    },
  ],
  skillGaps: [{ name: 'LangGraph', demandPercentage: 80, gapPercentage: 70 }],
};

test('a first draft above the bar is returned after one attempt, unrefined', async () => {
  let refineCalls = 0;
  const result = await improveOutput({
    generate: async () => 'good draft',
    evaluate: async () => ({ score: 90, issues: [] }),
    refine: async (draft) => { refineCalls += 1; return `${draft} refined`; },
  });
  assert.equal(result.output, 'good draft');
  assert.equal(result.attempts, 1);
  assert.equal(result.improved, false);
  assert.equal(refineCalls, 0);
  assert.deepEqual(result.evaluations, [{ score: 90, issues: [] }]);
});

test('a low-scoring draft is refined and the improved output is returned', async () => {
  const scores = new Map([['weak draft', 40], ['strong draft', 85]]);
  const result = await improveOutput({
    generate: async () => 'weak draft',
    evaluate: async (draft) => ({ score: scores.get(draft), issues: scores.get(draft) < 70 ? ['too thin'] : [] }),
    refine: async () => 'strong draft',
  });
  assert.equal(result.output, 'strong draft');
  assert.equal(result.attempts, 2);
  assert.equal(result.improved, true);
  assert.deepEqual(result.evaluations.map((e) => e.score), [40, 85]);
});

test('a draft that never improves stops at maxAttempts and keeps the best seen', async () => {
  const result = await improveOutput({
    generate: async () => 'draft v1',
    evaluate: async () => ({ score: 30, issues: ['thin'] }),
    refine: async (draft, evaluation) => `${draft}+`,
    maxAttempts: 3,
  });
  assert.equal(result.attempts, 3);
  assert.equal(result.evaluations.length, 3);
  assert.equal(result.output, 'draft v1');
  assert.equal(result.improved, false);
});

test('a failed refinement keeps the best output instead of losing it', async () => {
  const result = await improveOutput({
    generate: async () => 'original draft',
    evaluate: async () => ({ score: 50, issues: ['thin'] }),
    refine: async () => { throw new Error('provider down'); },
  });
  assert.equal(result.output, 'original draft');
  assert.equal(result.attempts, 1);
  assert.equal(result.evaluations.length, 1);
});

test('scoreRoadmap: a complete roadmap scores 100 with no issues', () => {
  const result = scoreRoadmap(FULL_ROADMAP);
  assert.equal(result.score, 100);
  assert.deepEqual(result.issues, []);
});

test('scoreRoadmap: a phase with no topics loses points and names the gap', () => {
  const thin = { ...FULL_ROADMAP, phases: [{ ...FULL_ROADMAP.phases[0], topics: [] }, FULL_ROADMAP.phases[1]] };
  const result = scoreRoadmap(thin);
  assert.ok(result.score < 100);
  assert.ok(result.issues.some((issue) => issue.includes('no topics')));
});

test('scoreRoadmap: no phases scores low and says so', () => {
  const result = scoreRoadmap({ ...FULL_ROADMAP, phases: [] });
  assert.ok(result.score < 50);
  assert.ok(result.issues.some((issue) => issue.includes('no phases')));
});

test('scoreRoadmap: missing timeline and skill gaps are named', () => {
  const result = scoreRoadmap({ ...FULL_ROADMAP, totalWeeks: 0, skillGaps: [] });
  assert.ok(result.score < 100);
  assert.ok(result.issues.some((issue) => issue.includes('timeline')));
  assert.ok(result.issues.some((issue) => issue.includes('skill gaps')));
});
