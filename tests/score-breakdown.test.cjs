const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(path.join(tmpdir(), 'hiremind-breakdown-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/ats.ts', 'src/services/score-breakdown.ts',
  '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { analyzeResumeLocally } = require(path.join(output, 'services/ats.js'));
const { buildScoreBreakdown } = require(path.join(output, 'services/score-breakdown.js'));

const JOB = `
We are hiring a software engineer. React, TypeScript, Node.js, PostgreSQL,
Docker, AWS, REST APIs, testing, CI/CD. Build full-stack products and ship
features with a small team. Experience with LangChain and RAG is a plus.
`;

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
React, TypeScript, Node.js, PostgreSQL, Docker, AWS, REST APIs, testing, CI/CD

Projects
HireMind AI — React and TypeScript resume analysis app with 126 tests.
`;

test('breakdown parts add up to the ATS score (within rounding)', () => {
  const analysis = analyzeResumeLocally(STRONG_RESUME, JOB);
  const { parts, totalPoints } = buildScoreBreakdown(analysis);
  assert.equal(parts.length, 4);
  assert.deepEqual(parts.map((p) => p.weight), [40, 25, 15, 20]);
  assert.ok(Math.abs(totalPoints - analysis.atsScore) <= 1,
    `parts total ${totalPoints} vs ATS score ${analysis.atsScore}`);
});

test('next fix points at missing keywords first — the heaviest driver', () => {
  const thin = analyzeResumeLocally('Jane Doe\njane@example.com\n\nSummary\nDeveloper.\n\nSkills\nPython', JOB);
  const { nextFix } = buildScoreBreakdown(thin);
  assert.ok(nextFix, 'expected a next fix for a thin resume');
  assert.match(nextFix.title, /keyword/i);
  assert.ok(thin.missingKeywords.length > 0);
});

test('no next fix when every driver is full', () => {
  const perfect = {
    atsScore: 100, contentScore: 100, formatScore: 100, overallScore: 100,
    sections: ['Contact', 'Summary', 'Experience'].map((name) => ({ name, score: 100, status: 'pass', feedback: [] })),
    recommendations: [],
    matchedKeywords: ['react', 'typescript'],
    missingKeywords: [],
    atsChecklist: [],
    rewrites: [],
  };
  const { nextFix, parts } = buildScoreBreakdown(perfect);
  assert.equal(nextFix, null);
  assert.ok(parts.every((p) => p.rate === 1));
});

test('blank resume breakdown is all zeros, not free points', () => {
  const analysis = analyzeResumeLocally('', JOB);
  const { parts, totalPoints, nextFix } = buildScoreBreakdown(analysis);
  assert.equal(totalPoints, 0);
  assert.ok(parts.every((p) => p.points === 0));
  assert.ok(nextFix);
});

test('keyword rate uses whole tokens, matching the audit', () => {
  // "javascript" must not credit "java": the audit and the breakdown agree.
  const analysis = analyzeResumeLocally(
    'Dev\ndev@example.com\n\nSkills\njavascript, react\n\nWork Experience\nBuilt things.',
    'We need java and react developers.',
  );
  const { parts } = buildScoreBreakdown(analysis);
  const keywords = parts.find((p) => p.label === 'Job keywords');
  assert.ok(!analysis.matchedKeywords.includes('java'));
  assert.equal(keywords.rate, analysis.matchedKeywords.length /
    (analysis.matchedKeywords.length + analysis.missingKeywords.length));
});

test('an AI score that disagrees with its drivers still breaks down honestly', () => {
  // The model's own atsScore is its judgement: with 0 of 10 keywords matched
  // the drivers add up to far less than the 82 the model claimed. The
  // breakdown must report the drivers as they are — not rescale them to
  // match the score, and not crash — so the UI can say the two differ
  // instead of printing a sum that contradicts the rings.
  const aiStyle = {
    atsScore: 82,
    contentScore: 70,
    formatScore: 80,
    overallScore: 78,
    sections: [
      { name: 'Contact Information', score: 100, status: 'pass', feedback: ['found'] },
      { name: 'Skills', score: 0, status: 'fail', feedback: ['missing'] },
    ],
    recommendations: [],
    matchedKeywords: [],
    missingKeywords: ['react', 'typescript', 'node', 'aws', 'docker', 'testing', 'graphql', 'redis', 'kafka', 'ci'],
    atsChecklist: [],
    rewrites: [],
  };
  const { parts, totalPoints, nextFix } = buildScoreBreakdown(aiStyle);
  assert.ok(totalPoints < aiStyle.atsScore, `drivers ${totalPoints} should sit below the AI score ${aiStyle.atsScore}`);
  assert.equal(parts.find((p) => p.label === 'Job keywords').points, 0);
  assert.ok(nextFix, 'a weakest driver still produces a next fix');
});
