const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(path.join(tmpdir(), 'hiremind-numbers-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/numbers.ts',
  '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { clamp } = require(path.join(output, 'numbers.js'));

test('clamp keeps in-range values as-is', () => {
  assert.equal(clamp(50, 0, 100), 50);
  assert.equal(clamp(0, 0, 100), 0);
  assert.equal(clamp(100, 0, 100), 100);
});

test('clamp pulls out-of-range values back to the ends', () => {
  // A ring fed 140 used to draw past full; a bar fed -5 a negative width.
  assert.equal(clamp(140, 0, 100), 100);
  assert.equal(clamp(-5, 0, 100), 0);
  assert.equal(clamp(7, 5, 10), 7);
  assert.equal(clamp(3, 5, 10), 5);
  assert.equal(clamp(12, 5, 10), 10);
});

test('clamp falls back to min on non-finite input', () => {
  assert.equal(clamp(NaN, 0, 100), 0);
  assert.equal(clamp(Infinity, 0, 100), 0);
  assert.equal(clamp(-Infinity, 0, 100), 0);
});
