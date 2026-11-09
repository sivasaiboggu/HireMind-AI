const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-harness-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/python-harness.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { buildPythonHarness } = require(path.join(output, 'python-harness.js'));

const literalOf = (code) => {
  const match = /json\.loads\(("(?:[^"\\]|\\.)*")\)/.exec(code);
  assert.ok(match, 'arguments must be embedded as one JSON string literal');
  return match[1];
};

test('arguments with apostrophes, quotes, backslashes and newlines survive the harness', () => {
  const tricky = [["don't", 'say "hi"', 'back\\slash', 'line\nbreak', 'tab\there', 42, null, true]];
  for (const args of tricky) {
    const code = buildPythonHarness('def solve(*a):\n\treturn a', args);
    // The embedded literal must decode back to the exact serialized arguments.
    assert.equal(JSON.parse(literalOf(code)), JSON.stringify(args));
  }
});

test('no raw single-quote interpolation remains in the harness', () => {
  const code = buildPythonHarness('def solve(x):\n\treturn x', ["it's"]);
  assert.ok(!code.includes("json.loads('"), 'single-quoted splice would break on apostrophes');
  assert.match(code, /import json/);
  assert.match(code, /result = solve\(\*args\)/);
  assert.match(code, /def solve\(x\):/);
});
