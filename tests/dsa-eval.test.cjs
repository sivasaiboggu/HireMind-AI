const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-dsa-eval-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/dsa-eval.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { matchesExpected } = require(path.join(output, 'dsa-eval.js'));

test('default comparison is exact and order-sensitive', () => {
  assert.equal(matchesExpected([0, 1], [0, 1]), true);
  assert.equal(matchesExpected([1, 0], [0, 1]), false);
  assert.equal(matchesExpected(5, 5), true);
  assert.equal(matchesExpected(5, 6), false);
  assert.equal(matchesExpected('ab', 'ab'), true);
  assert.equal(matchesExpected(true, true), true);
  assert.equal(matchesExpected(null, null), true);
  assert.equal(matchesExpected([0, 1], [0, 1, 2]), false);
});

test('anyOrder accepts a reversed index pair, as Two Sum allows', () => {
  assert.equal(matchesExpected([1, 0], [0, 1], true), true);
  assert.equal(matchesExpected([2, 1], [1, 2], true), true);
  assert.equal(matchesExpected([0, 1], [0, 1], true), true);
});

test('anyOrder still compares as a multiset, not a set', () => {
  assert.equal(matchesExpected([0, 0], [0, 1], true), false);
  assert.equal(matchesExpected([0, 1], [0, 0], true), false);
  assert.equal(matchesExpected([0, 1, 1], [0, 1], true), false);
  assert.equal(matchesExpected([0, 1], [0, 1, 1], true), false);
});

test('anyOrder never widens non-array comparisons', () => {
  assert.equal(matchesExpected(5, 5, true), true);
  assert.equal(matchesExpected(5, 6, true), false);
  assert.equal(matchesExpected('[0,1]', [0, 1], true), false);
  assert.equal(matchesExpected([0, 1], '[0,1]', true), false);
  assert.equal(matchesExpected({ 0: 0, 1: 1 }, [0, 1], true), false);
});

test('anyOrder array elements still compare by exact value', () => {
  assert.equal(matchesExpected([0, 2], [0, 1], true), false);
  assert.equal(matchesExpected(['1', 0], [0, 1], true), false); // no type coercion
  assert.equal(matchesExpected([[1, 2], [3]], [[3], [1, 2]], true), true);
  assert.equal(matchesExpected([[2, 1], [3]], [[3], [1, 2]], true), false); // nested order kept
});
