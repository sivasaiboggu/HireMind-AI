const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const output = mkdtempSync(path.join(tmpdir(), 'hiremind-local-audit-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/local-audit.ts',
  '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { localAuditReason } = require(path.join(output, 'local-audit.js'));

test('fewer credits than the cost means the fallback was the credits', () => {
  assert.equal(localAuditReason(0, 10), 'credits');
  assert.equal(localAuditReason(5, 10), 'credits');
  assert.equal(localAuditReason(9, 10), 'credits');
});

test('enough credits means the AI itself was unavailable', () => {
  assert.equal(localAuditReason(10, 10), 'unavailable');
  assert.equal(localAuditReason(100, 10), 'unavailable');
});
