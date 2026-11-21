const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { mkdtempSync, rmSync } = require('node:fs');
const { execFileSync } = require('node:child_process');

function handler(file, name, context) {
  const source = fs.readFileSync(file, 'utf8');
  const start = source.indexOf(`  const ${name} =`);
  assert.ok(start >= 0, `${name} not found in ${file}`);
  const end = source.indexOf('\n  };', start) + 5;
  const code = ts.transpileModule(source.slice(start, end) + `\nexports.run=${name};`, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const c = { exports: {}, ...context };
  vm.runInNewContext(code, c);
  return c.exports.run;
}

// Real matcher, as used by the runner.
const out = mkdtempSync(path.join(tmpdir(), 'hiremind-round8-dsa-eval-'));
process.on('exit', () => rmSync(out, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/dsa-eval.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', out]);
const { matchesExpected } = require(path.join(out, 'dsa-eval.js'));

const TWO_SUM = 'function solve(nums, target) { for (let i = 0; i < nums.length; i++) for (let j = i + 1; j < nums.length; j++) if (nums[i] + nums[j] === target) return [i, j]; return []; }';
// A hidden case first: the old position-based chips showed this hidden
// case the first public case's verdict.
const CASES = [
  { hidden: true, args: [[3, 3], 6], expected: [0, 1], inputLabel: 'hidden' },
  { hidden: false, args: [[2, 7, 11, 15], 9], expected: [0, 1], inputLabel: 'public 1' },
  { hidden: false, args: [[3, 2, 4], 6], expected: [1, 2], inputLabel: 'public 2' },
];

function runnerContext(overrides = {}) {
  let results;
  return {
    ctx: {
      currentQuestion: { id: 'q', anyOrder: true, testCases: CASES },
      selectedLanguage: 'javascript',
      activeCode: TWO_SUM,
      setConsoleOutput: () => {},
      setTestCaseResults: (v) => { results = v; },
      setCompilerTab: () => {},
      matchesExpected,
      ...overrides,
    },
    getResults: () => results,
  };
}

test('public-only run tags results with their original case index', async () => {
  const { ctx, getResults } = runnerContext();
  const run = handler('src/pages/QuizPractice.tsx', 'runDsaCodeLocally', ctx);
  const results = await run(true);
  assert.equal(results.length, 2);
  assert.deepEqual(results.map((r) => r.caseIndex), [1, 2]);
  assert.deepEqual(results.map((r) => r.passed), [true, true]);
  assert.deepEqual(getResults().map((r) => r.caseIndex), [1, 2]);
});

test('full run includes the hidden case at its own index', async () => {
  const { ctx } = runnerContext();
  const run = handler('src/pages/QuizPractice.tsx', 'runDsaCodeLocally', ctx);
  const results = await run(false);
  assert.deepEqual(results.map((r) => r.caseIndex), [0, 1, 2]);
});

test('runner executes the override code, not the stale closure code', async () => {
  const { ctx } = runnerContext({ activeCode: 'function solve() { throw new Error("stale"); }' });
  const run = handler('src/pages/QuizPractice.tsx', 'runDsaCodeLocally', ctx);
  const results = await run(true, TWO_SUM);
  assert.deepEqual(results.map((r) => r.passed), [true, true]);
});

test('submit executes the passed code and saves that same code as the answer', async () => {
  let executed;
  let answer;
  let evaluation;
  let index;
  const run = handler('src/pages/QuizPractice.tsx', 'handleNextDsaQuestion', {
    runDsaCodeLocally: async (_all, code) => { executed = code; return [{ passed: true }]; },
    addToast: () => {},
    setUserAnswers: (fn) => { answer = fn({}); },
    setAiEvaluations: (fn) => { evaluation = fn({}); },
    setCurrentIdx: (v) => { index = v; },
    setQuizState: () => {},
    currentQuestion: { id: 'q' },
    currentIdx: 0,
    questions: [{}, {}],
    selectedLanguage: 'javascript',
    dsaSubmittingRef: { current: false },
  });
  await run('fresh code typed after the timer started');
  assert.equal(executed, 'fresh code typed after the timer started');
  assert.equal(answer.q, 'fresh code typed after the timer started');
  assert.equal(evaluation.q.passed, true);
  assert.equal(index, 1);
});

test('a second submit while one is running is dropped instead of advancing twice', async () => {
  let calls = 0;
  let finish;
  let advances = 0;
  const run = handler('src/pages/QuizPractice.tsx', 'handleNextDsaQuestion', {
    runDsaCodeLocally: async () => { calls++; return new Promise((resolve) => { finish = () => resolve([{ passed: true }]); }); },
    addToast: () => {},
    setUserAnswers: () => {},
    setAiEvaluations: () => {},
    setCurrentIdx: () => { advances++; },
    setQuizState: () => {},
    currentQuestion: { id: 'q' },
    currentIdx: 0,
    questions: [{}, {}],
    selectedLanguage: 'javascript',
    dsaSubmittingRef: { current: false },
  });
  const first = run('code');
  await run('code');
  assert.equal(calls, 1);
  finish();
  await first;
  assert.equal(calls, 1);
  assert.equal(advances, 1);
});

test('timer expiry submits the latest editor code from the ref, not the stale closure', async () => {
  let submitted;
  let notice;
  const run = handler('src/pages/QuizPractice.tsx', 'handleDsaTimeExpired', {
    currentQuestion: { id: 'q', title: 'Two Sum' },
    activeCodeRef: { current: 'latest code typed just before expiry' },
    handleNextDsaQuestion: async (code) => { submitted = code; },
    addToast: (_, s) => { notice = s; },
  });
  await run();
  assert.equal(submitted, 'latest code typed just before expiry');
  assert.match(notice, /Two Sum/);
});

test('the timer no longer calls the expiry handler from inside a state updater', () => {
  const quiz = fs.readFileSync('src/pages/QuizPractice.tsx', 'utf8');
  assert.doesNotMatch(quiz, /setSecondsLeft\(prev => \{[^}]*handleDsaTimeExpired/s);
  assert.match(quiz, /tickDsaTimer\(questionTimesRef\.current, currentQuestion\.id\)/);
});

test('dead Tailwind utilities in the quiz UI are now defined in CSS', () => {
  const css = fs.readFileSync('src/styles/globals.css', 'utf8');
  for (const cls of ['.relative', '.absolute', '.inset-0', '.rounded-full', '.border-4',
    '.border-cyan-subtle', '.border-t-cyan', '.border-cyan', '.animate-spin']) {
    assert.ok(css.includes(cls), `${cls} is not defined`);
  }
  assert.match(css, /\.animate-spin\s*\{[^}]*animation:/);
  const quiz = fs.readFileSync('src/pages/QuizPractice.tsx', 'utf8');
  assert.doesNotMatch(quiz, /bg-opacity-70/);
});
