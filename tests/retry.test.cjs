const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-retry-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/retry.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--esModuleInterop', '--outDir', output]);
const { withRetry } = require(path.join(output, 'retry.js'));

test('retries transient 429 failures and then succeeds', async () => {
  let calls = 0;
  const result = await withRetry(async () => {
    calls++;
    if (calls < 3) throw new Error('429 Resource exhausted');
    return 'ok';
  });
  assert.equal(result, 'ok');
  assert.equal(calls, 3);
});

test('does not retry permanent auth errors', async () => {
  let calls = 0;
  await assert.rejects(
    () => withRetry(async () => {
      calls++;
      throw new Error('401 API key not valid');
    }),
    /401/,
  );
  assert.equal(calls, 1);
});

test('gives up after three attempts on persistent 503s', async () => {
  let calls = 0;
  await assert.rejects(
    () => withRetry(async () => {
      calls++;
      throw new Error('503 Service Unavailable');
    }),
    /503/,
  );
  assert.equal(calls, 3);
});
