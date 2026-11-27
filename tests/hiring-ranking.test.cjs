const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(path.join(tmpdir(), 'hiremind-hiring-ranking-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/hiring-ranking.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--rootDir', 'src', '--outDir', output]);
const { rankRegisterCandidates, registerSignature } = require(path.join(output, 'services/hiring-ranking.js'));

const JD = 'We need a Python and FastAPI developer with React, Docker and PostgreSQL experience.';

function candidate(id, name, evidence, revision = 0, stage = 'Applied') {
  return {
    id, revision, name, role: 'Software Engineer', evidence, stage,
    activity: [{ id: `${id}-a`, at: 1, description: 'Application added' }],
  };
}

const STRONG = candidate('c-strong', 'Priya Nair',
  'Python and FastAPI developer. Built React dashboards used by 1200 people. Shipped Docker images and PostgreSQL schemas for reporting pipelines.');
const MEDIUM = candidate('c-medium', 'Rahul Verma',
  'React developer with some Python. Built a small dashboard.');
const EMPTY = candidate('c-empty', 'Asha Rao', '');

test('ranks register candidates on their application notes against the job', () => {
  const ranked = rankRegisterCandidates([MEDIUM, EMPTY, STRONG], JD);
  assert.deepEqual(ranked.map((entry) => entry.id), ['c-strong', 'c-medium', 'c-empty']);
  assert.deepEqual(ranked.map((entry) => entry.rank), [1, 2, 3]);
  // The ranked ids are the register ids, so the UI can open the record.
  assert.equal(ranked[0].name, 'Priya Nair');
  assert.ok(ranked[0].overallScore > ranked[1].overallScore);
  assert.ok(ranked[0].matchedKeywords.length > 0);
});

test('a candidate with no application notes scores 0 and ranks last', () => {
  const ranked = rankRegisterCandidates([EMPTY, MEDIUM], JD);
  assert.equal(ranked[1].id, 'c-empty');
  assert.equal(ranked[1].atsScore, 0);
  assert.equal(ranked[1].overallScore, 0);
  assert.deepEqual(ranked[1].matchedKeywords, []);
});

test('a blank job description returns no ranking', () => {
  assert.deepEqual(rankRegisterCandidates([STRONG, MEDIUM], ''), []);
  assert.deepEqual(rankRegisterCandidates([STRONG, MEDIUM], '   '), []);
});

test('an empty register returns no ranking', () => {
  assert.deepEqual(rankRegisterCandidates([], JD), []);
});

test('ranking is deterministic across runs', () => {
  const first = rankRegisterCandidates([MEDIUM, STRONG, EMPTY], JD);
  const second = rankRegisterCandidates([MEDIUM, STRONG, EMPTY], JD);
  assert.deepEqual(
    first.map((entry) => [entry.id, entry.overallScore]),
    second.map((entry) => [entry.id, entry.overallScore]),
  );
});

test('register signature is stable until a candidate changes', () => {
  const register = [STRONG, MEDIUM];
  const signature = registerSignature(register);
  assert.equal(registerSignature([STRONG, MEDIUM]), signature);
  assert.notEqual(registerSignature([{ ...STRONG, revision: 1 }, MEDIUM]), signature);
  assert.notEqual(registerSignature([MEDIUM, STRONG]), signature);
  assert.notEqual(registerSignature([STRONG]), signature);
  assert.equal(registerSignature([]), '');
});
