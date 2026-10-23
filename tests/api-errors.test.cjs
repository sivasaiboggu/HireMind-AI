const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-error-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/api-errors.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { safeApiError } = require(path.join(output, 'api-errors.js'));
test('quota guidance does not recommend account rotation or enabling billing', () => {
  const error=safeApiError({status:429,message:'PRIVATE_RESUME quota failure'});
  assert.match(error.message,/usage limit/);
  assert.doesNotMatch(error.message,/PRIVATE|new account|billing|brand new|different account/i);
});
test('provider errors never return raw private details', () => {
  for(const input of [null,undefined,'secret',{message:'PRIVATE_RESUME body'},{status:403,message:'secret'},{status:404,message:'secret'}]) {
    assert.doesNotMatch(safeApiError(input).message,/secret|PRIVATE_RESUME/);
  }
});
test('permission and missing model failures keep distinct useful messages', () => {
  assert.match(safeApiError({status:403}).message,/authorize/);
  assert.match(safeApiError({status:404}).message,/model is unavailable/);
});
test('conversation failure is not silently presented as an AI reply', () => {
  const {readFileSync}=require('node:fs');
  const service=readFileSync('src/services/gemini.ts','utf8');
  const conversation=service.slice(service.indexOf('converseWithCandidate ='));
  assert.match(conversation,/throw safeApiError\(error\)/);
  assert.doesNotMatch(conversation,/return "I understand\. Please go ahead/);
});
