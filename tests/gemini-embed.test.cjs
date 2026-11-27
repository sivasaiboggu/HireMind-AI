const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');

// gemini.ts is a Vite module (import.meta.env) with a browser Google client,
// so bundle a temp copy with the client and Supabase stubbed, mirroring the
// proxy test harness. The fake model returns whatever vector the test sets,
// and records the text it was asked to embed.
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-embed-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));

writeFileSync(path.join(output, 'genai-stub.js'), `
class GoogleGenerativeAI {
  constructor(key) { this.key = key; }
  getGenerativeModel(opts) {
    return { embedContent: async (text) => {
      global.__embedCalls.push(text);
      const vector = global.__embedResponse;
      if (vector instanceof Error) throw vector;
      return { embedding: { values: vector } };
    } };
  }
}
module.exports = { GoogleGenerativeAI };
`);
writeFileSync(path.join(output, 'supabase-stub.js'), 'module.exports = { supabase: null };\n');

const stub = (name) => path.join(output, name).replace(/\\/g, '/');
const geminiSrc = require('node:fs').readFileSync(
  path.resolve(__dirname, '..', 'src', 'services', 'gemini.ts'),
  'utf8',
).split("from '@google/generative-ai'").join(`from '${stub('genai-stub.js')}'`)
  .split("from './supabase'").join(`from '${stub('supabase-stub.js')}'`);
// The copy sits next to the real module so its relative imports resolve; it
// is removed again once bundled.
const tempEntry = path.resolve(__dirname, '..', 'src', 'services', 'gemini-embed-test-entry.ts');
writeFileSync(tempEntry, geminiSrc);
process.on('exit', () => rmSync(tempEntry, { force: true }));

esbuild.buildSync({
  entryPoints: [tempEntry],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(output, 'gemini.cjs'),
  logLevel: 'silent',
  define: {
    'import.meta.env.VITE_GEMINI_PROXY_URL': '""',
    'import.meta.env.VITE_GEMINI_API_KEY': '"test-browser-key"',
    'import.meta.env.DEV': 'true',
    'import.meta.env.VITE_SUPABASE_URL': '""',
    'import.meta.env.VITE_SUPABASE_ANON_KEY': '""',
  },
});

// withRetry races every call against a 60s timeout timer that is never
// cleared; unref the timers so they cannot keep the test process alive.
const realSetTimeout = global.setTimeout;
global.setTimeout = (...args) => { const timer = realSetTimeout(...args); timer.unref?.(); return timer; };

const { GeminiService } = require(path.join(output, 'gemini.cjs'));
const service = new GeminiService();

function vector768(fill) {
  return Array.from({ length: 768 }, (_, index) => (fill ? fill(index) : index === 0 ? 1 : 0));
}

test('a blank or non-string input is rejected before any model call', async () => {
  global.__embedCalls = [];
  for (const input of ['', '   ', 42, null, undefined]) {
    await assert.rejects(service.embedText(input), /Nothing to embed/);
  }
  assert.deepEqual(global.__embedCalls, []);
});

test('a usable 768-dimension vector is returned and long text is capped at 8000 characters', async () => {
  global.__embedCalls = [];
  const vector = vector768();
  global.__embedResponse = vector;
  const result = await service.embedText(`${'x'.repeat(9000)}`);
  assert.deepEqual(result, vector);
  assert.equal(global.__embedCalls[0].length, 8000);
});

test('an unusable vector is never returned: wrong length, non-finite, or all zeros', async () => {
  for (const bad of [
    vector768().slice(0, 767),
    vector768((index) => (index === 3 ? NaN : 0.5)),
    vector768(() => 0),
    'not-a-vector',
    null,
  ]) {
    global.__embedResponse = bad;
    await assert.rejects(service.embedText('python internship'), /could not be completed/);
  }
});
