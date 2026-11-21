const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-dsa-timer-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/dsa-timer.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { dsaQuestionSeconds, tickDsaTimer } = require(path.join(output, 'dsa-timer.js'));

test('question time is 20 / 35 / 50 minutes by difficulty, hard for unknown', () => {
  assert.equal(dsaQuestionSeconds('easy'), 1200);
  assert.equal(dsaQuestionSeconds('medium'), 2100);
  assert.equal(dsaQuestionSeconds('hard'), 3000);
  assert.equal(dsaQuestionSeconds(undefined), 3000);
  assert.equal(dsaQuestionSeconds('expert'), 3000);
});

test('a tick decrements only its own question and never mutates the input', () => {
  const before = { a: 1200, b: 60 };
  const tick = tickDsaTimer(before, 'a');
  assert.equal(tick.remaining, 1199);
  assert.equal(tick.expired, false);
  assert.deepEqual(tick.next, { a: 1199, b: 60 });
  assert.deepEqual(before, { a: 1200, b: 60 });
});

test('the tick at 1 second expires at 0 and stays expired at 0', () => {
  const first = tickDsaTimer({ a: 1 }, 'a');
  assert.deepEqual([first.remaining, first.expired], [0, true]);
  const again = tickDsaTimer(first.next, 'a');
  assert.deepEqual([again.remaining, again.expired], [0, true]);
});

test('an unknown question expires immediately instead of going negative', () => {
  const tick = tickDsaTimer({}, 'missing');
  assert.deepEqual([tick.remaining, tick.expired], [0, true]);
  assert.deepEqual(tick.next, { missing: 0 });
});
