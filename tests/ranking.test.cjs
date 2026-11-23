const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-ranking-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/ranking.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--rootDir', 'src', '--outDir', output]);
const { rankCandidates, topCandidates } = require(path.join(output, 'services/ranking.js'));

const JD = 'We need a Python and FastAPI developer with React, LangGraph, Docker and PostgreSQL experience.';

const STRONG_RESUME = `
Priya Nair
priya@example.com | +91 9000000001 | linkedin.com/in/priya

Summary
Software developer focused on AI agents and full-stack products.

Work Experience
Software Developer Intern — Whispry
- Built a React dashboard that served 1200 users and reduced load time by 40%.
- Automated reporting pipelines with Python and FastAPI, saving 15 hours per week.
- Led migration of 3 services to Docker, improving deploy frequency by 2x.

Education
BTech Computer Science, IIIT Kottayam, 2023-2027

Skills
Python, TypeScript, React, LangGraph, LangChain, FastAPI, PostgreSQL, Docker

Projects
HireMind AI — React/TypeScript resume analysis app using Gemini.
`;

const MEDIUM_RESUME = `
Rahul Verma
rahul@example.com | +91 9000000002

Summary
Junior developer learning backend systems.

Work Experience
Intern — Local startup
- Built a small React page for internal use.
- Helped with Python scripts for data cleanup.

Education
BTech Computer Science, 2023-2027

Skills
Python, React, JavaScript
`;

test('ranks the strongest resume first and the empty resume last', () => {
  const ranked = rankCandidates([
    { id: 'c-weak', name: 'Zara Khan', resumeText: '' },
    { id: 'c-mid', name: 'Rahul Verma', resumeText: MEDIUM_RESUME },
    { id: 'c-strong', name: 'Priya Nair', resumeText: STRONG_RESUME },
  ], JD);
  assert.deepEqual(ranked.map((r) => r.name), ['Priya Nair', 'Rahul Verma', 'Zara Khan']);
  assert.deepEqual(ranked.map((r) => r.rank), [1, 2, 3]);
  assert.ok(ranked[0].overallScore > ranked[1].overallScore);
  assert.equal(ranked[2].overallScore, 0);
  assert.equal(ranked[2].atsScore, 0);
  assert.ok(ranked[0].matchedKeywords.includes('python'));
  assert.ok(ranked[0].matchedKeywords.includes('fastapi'));
});

test('ranking scores are the same audit as a single-resume analysis', () => {
  const ranked = rankCandidates([{ id: 'c1', name: 'Priya Nair', resumeText: STRONG_RESUME }], JD);
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].analysis.atsScore, ranked[0].atsScore);
  assert.equal(ranked[0].analysis.overallScore, ranked[0].overallScore);
  assert.deepEqual(ranked[0].analysis.matchedKeywords, ranked[0].matchedKeywords);
});

test('equal scores break ties by name, deterministically', () => {
  const a = rankCandidates([
    { id: 'c2', name: 'Zara Khan', resumeText: MEDIUM_RESUME },
    { id: 'c1', name: 'Asha Rao', resumeText: MEDIUM_RESUME },
  ], JD);
  const b = rankCandidates([
    { id: 'c1', name: 'Asha Rao', resumeText: MEDIUM_RESUME },
    { id: 'c2', name: 'Zara Khan', resumeText: MEDIUM_RESUME },
  ], JD);
  assert.deepEqual(a.map((r) => r.name), ['Asha Rao', 'Zara Khan']);
  assert.deepEqual(b.map((r) => r.name), ['Asha Rao', 'Zara Khan']);
  assert.equal(a[0].overallScore, a[1].overallScore);
});

test('topCandidates returns the first N in rank order', () => {
  const ranked = rankCandidates([
    { id: 'c-weak', name: 'Zara Khan', resumeText: '' },
    { id: 'c-mid', name: 'Rahul Verma', resumeText: MEDIUM_RESUME },
    { id: 'c-strong', name: 'Priya Nair', resumeText: STRONG_RESUME },
  ], JD);
  assert.deepEqual(topCandidates(ranked, 2).map((r) => r.name), ['Priya Nair', 'Rahul Verma']);
  assert.deepEqual(topCandidates(ranked, 0), []);
  assert.deepEqual(topCandidates(ranked, -1), []);
});

test('empty candidate list ranks to an empty list', () => {
  assert.deepEqual(rankCandidates([], JD), []);
});
