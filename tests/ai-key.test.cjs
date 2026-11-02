const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-aikey-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/ai-key.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { resolveGeminiApiKey, readStoredGeminiKey, saveStoredGeminiKey, clearStoredGeminiKey, GEMINI_KEY_STORAGE } = require(path.join(output, 'ai-key.js'));

const fakeStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
    map
  };
};

test('dev prefers the env key and falls back to the stored key', () => {
  assert.equal(resolveGeminiApiKey({ isDev: true, devKey: ' dev-key ', storedKey: 'stored' }), 'dev-key');
  assert.equal(resolveGeminiApiKey({ isDev: true, devKey: ' ', storedKey: 'stored' }), 'stored');
  assert.equal(resolveGeminiApiKey({ isDev: true, devKey: '', storedKey: null }), '');
});

test('public builds never use the env key, only the connected browser key', () => {
  assert.equal(resolveGeminiApiKey({ isDev: false, devKey: 'BAKED_SECRET', storedKey: '' }), '');
  assert.equal(resolveGeminiApiKey({ isDev: false, devKey: 'BAKED_SECRET', storedKey: ' user-key ' }), 'user-key');
});

test('stored key round-trips through storage and clears', () => {
  const storage = fakeStorage();
  assert.equal(readStoredGeminiKey(storage), '');
  saveStoredGeminiKey('  abc123  ', storage);
  assert.equal(storage.map.get(GEMINI_KEY_STORAGE), 'abc123');
  assert.equal(readStoredGeminiKey(storage), 'abc123');
  saveStoredGeminiKey('   ', storage);
  assert.equal(readStoredGeminiKey(storage), 'abc123');
  clearStoredGeminiKey(storage);
  assert.equal(readStoredGeminiKey(storage), '');
});

test('broken storage reads as no key instead of throwing', () => {
  const hostile = { getItem: () => { throw new Error('denied'); } };
  assert.equal(readStoredGeminiKey(hostile), '');
});
