const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-ats-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/ats.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { analyzeResumeLocally, extractJobKeywords } = require(path.join(output, 'services/ats.js'));

const STRONG_RESUME = `
Sivasai Boggu
siva@example.com | +91 9573719115 | linkedin.com/in/sivasai-b

Summary
Software developer focused on AI agents and full-stack products.

Work Experience
Software Developer Intern — Whispry
- Built a React dashboard that served 1200 users and reduced load time by 40%.
- Automated reporting pipelines, saving 15 hours per week.
- Led migration of 3 services to Docker, improving deploy frequency by 2x.

Education
BTech Computer Science, IIIT Kottayam, 2023-2027

Skills
Python, TypeScript, React, LangGraph, LangChain, FastAPI, PostgreSQL, Docker

Projects
HireMind AI — React/TypeScript resume analysis app using Gemini.
`;

const JD = 'We need a Python and TypeScript developer with React, LangGraph and FastAPI experience, Docker and PostgreSQL.';

test('strong resume scores high and matches JD keywords', () => {
  const result = analyzeResumeLocally(STRONG_RESUME, JD);
  assert.ok(result.atsScore >= 70, `atsScore ${result.atsScore} should be >= 70`);
  assert.ok(result.overallScore >= 60);
  assert.ok(result.matchedKeywords.includes('python'));
  assert.ok(result.matchedKeywords.includes('react'));
  assert.equal(result.missingKeywords.length, 0);
  assert.ok(result.sections.every((s) => s.score === 100 || s.name === 'Certifications'));
});

test('empty resume scores 0 and recommends sections', () => {
  const result = analyzeResumeLocally('', JD);
  assert.equal(result.atsScore, 0);
  assert.equal(result.overallScore, 0);
  assert.ok(result.missingKeywords.length > 0);
  assert.ok(result.recommendations.some((r) => r.id === 'rec-empty'));
  assert.ok(result.recommendations.some((r) => r.id === 'rec-keywords'));
});

test('missing keywords are reported, never invented', () => {
  const result = analyzeResumeLocally('Jane Doe\nsiva@example.com\nWork Experience\nDid things.', 'Kubernetes Terraform AWS');
  assert.deepEqual(result.missingKeywords.sort(), ['aws', 'kubernetes', 'terraform']);
  assert.deepEqual(result.matchedKeywords, []);
  assert.deepEqual(result.rewrites, []);
});

test('deterministic: same input gives identical output', () => {
  const a = analyzeResumeLocally(STRONG_RESUME, JD);
  const b = analyzeResumeLocally(STRONG_RESUME, JD);
  assert.deepEqual(a, b);
});

test('keyword extraction drops stopwords and ranks by frequency', () => {
  const keywords = extractJobKeywords('Python Python Python and the team with React');
  assert.equal(keywords[0], 'python');
  assert.ok(!keywords.includes('the'));
  assert.ok(!keywords.includes('and'));
});

test('scores stay within 0-100 for pathological input', () => {
  const result = analyzeResumeLocally('x '.repeat(5000), 'a'.repeat(200));
  for (const key of ['atsScore', 'contentScore', 'formatScore', 'overallScore']) {
    assert.ok(result[key] >= 0 && result[key] <= 100, `${key}=${result[key]}`);
  }
});
