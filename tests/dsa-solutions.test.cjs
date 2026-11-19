const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-dsa-solutions-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/dsa-eval.ts', 'src/services/mockQuestions.ts',
  '--module', 'commonjs', '--target', 'es2022', '--skipLibCheck', '--outDir', output]);
const { matchesExpected } = require(path.join(output, 'dsa-eval.js'));
const { MOCK_DSA_QUESTIONS } = require(path.join(output, 'mockQuestions.js'));

// Every bundled DSA question ships a reference JavaScript solution and its own
// test cases. If an edit makes them disagree, candidates silently practice
// against broken expectations, so each reference solution must pass every one
// of its question's cases (public and hidden) under the same matcher the
// runners use. The Python snippets are not executed here; they need Pyodide.
test('every bundled reference solution passes all of its own test cases', () => {
  let cases = 0;
  for (const [category, questions] of Object.entries(MOCK_DSA_QUESTIONS)) {
    for (const question of questions) {
      assert.ok(question.testCases.length > 0, `${question.id} has no test cases`);
      let solveFn;
      try {
        solveFn = new Function(`${question.codeSnippet}\nreturn solve;`)();
      } catch (error) {
        assert.fail(`${category}/${question.id} "${question.title}" reference solution does not compile: ${error.message}`);
      }
      for (const testCase of question.testCases) {
        cases++;
        const args = JSON.parse(JSON.stringify(testCase.args));
        let actual;
        try {
          actual = solveFn(...args);
        } catch (error) {
          assert.fail(`${category}/${question.id} "${question.title}" reference solution threw on ${testCase.inputLabel}: ${error.message}`);
        }
        assert.ok(
          matchesExpected(actual, testCase.expected, !!question.anyOrder),
          `${category}/${question.id} "${question.title}" fails ${testCase.inputLabel}: expected ${JSON.stringify(testCase.expected)}, got ${JSON.stringify(actual)}`
        );
      }
    }
  }
  assert.ok(cases > 100, `expected the bundled bank to cover over 100 cases, ran ${cases}`);
});

test('every bundled question keeps at least one hidden case for scoring', () => {
  for (const [category, questions] of Object.entries(MOCK_DSA_QUESTIONS)) {
    for (const question of questions) {
      assert.ok(
        question.testCases.some((testCase) => testCase.hidden),
        `${category}/${question.id} "${question.title}" has no hidden test case`
      );
    }
  }
});
