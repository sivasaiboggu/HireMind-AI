const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(path.join(tmpdir(), 'hiremind-readiness-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/readiness.ts',
  '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { careerReadiness } = require(path.join(output, 'readiness.js'));

test('both signals average equally', () => {
  assert.equal(careerReadiness(80, 7), 75);
  assert.equal(careerReadiness(90, 9), 90);
});

test('one signal alone counts as-is, with no invented discount', () => {
  // The old code multiplied a lone signal by 0.95 for no reason: an 80
  // ATS score read as 76 readiness.
  assert.equal(careerReadiness(80, 0), 80);
  assert.equal(careerReadiness(0, 7), 70);
});

test('no history is zero, not a number from nowhere', () => {
  assert.equal(careerReadiness(0, 0), 0);
});

test('rounding is to the nearest whole number', () => {
  assert.equal(careerReadiness(81, 8), 81); // (81 + 80) / 2 = 80.5 -> 81
});
