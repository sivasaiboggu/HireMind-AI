const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, writeFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const esbuild = require('esbuild');

// Deno is not installed in this VM, so the proxy is verified here instead:
// bundle index.ts with esbuild, stubbing the two remote imports (the Deno
// std server and the Supabase client — neither is touched when the handler
// runs with injected deps), then exercise the real handler with undici
// Requests, including a chunked body that carries no Content-Length.
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-proxy-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));

writeFileSync(path.join(output, 'std-server-stub.js'), 'module.exports = { serve: () => {} };\n');
writeFileSync(path.join(output, 'supabase-stub.js'), 'module.exports = { createClient: () => { throw new Error("stub client must not be called"); } };\n');

// Plugins cannot be used with the synchronous esbuild API, so bundle a temp
// copy of the proxy with its two remote imports rewritten to local stubs.
// The stubs are never touched when the handler runs with injected deps.
const proxySrc = require('node:fs').readFileSync(
  path.resolve(__dirname, '..', 'supabase', 'functions', 'gemini-proxy', 'index.ts'),
  'utf8',
).replace(
  "from 'https://deno.land/std@0.224.0/http/server.ts'",
  "from './std-server-stub.js'",
).replace(
  "from 'https://esm.sh/@supabase/supabase-js@2'",
  "from './supabase-stub.js'",
);
writeFileSync(path.join(output, 'proxy-src.ts'), proxySrc);

esbuild.buildSync({
  entryPoints: [path.join(output, 'proxy-src.ts')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: path.join(output, 'proxy.cjs'),
  logLevel: 'silent',
});

const { handler } = require(path.join(output, 'proxy.cjs'));

const ENV = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  GEMINI_API_KEY: 'server-secret-key',
};

function makeDeps(overrides = {}) {
  const captured = [];
  return {
    captured,
    deps: {
      verifyUser: overrides.verifyUser ?? (async () => 'user-1'),
      upstream: overrides.upstream ?? (async (url, init) => {
        captured.push({ url, init });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
      env: overrides.env ?? ((name) => ENV[name]),
      now: overrides.now ?? (() => 1_000_000),
    },
  };
}

function post(body, token = 'tok') {
  return new Request('https://fn.example/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body,
  });
}

test('chunked oversized body without Content-Length is 413 and never reaches upstream', async () => {
  const { deps, captured } = makeDeps();
  const big = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('x'.repeat(1_000_001)));
      controller.close();
    },
  });
  const req = new Request('https://fn.example/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
    body: big,
    duplex: 'half',
  });
  const res = await handler(req, deps);
  assert.equal(res.status, 413);
  assert.equal(captured.length, 0);
});

test('oversized body with Content-Length is still 413', async () => {
  const { deps, captured } = makeDeps();
  assert.equal((await handler(post('x'.repeat(1_000_001)), deps)).status, 413);
  assert.equal(captured.length, 0);
});

test('small chunked body passes through and maxOutputTokens is clamped', async () => {
  const { deps, captured } = makeDeps();
  const small = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 999999 },
      })));
      controller.close();
    },
  });
  const req = new Request('https://fn.example/v1beta/models/gemini-3.8-flash:generateContent', {
    method: 'POST',
    headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
    body: small,
    duplex: 'half',
  });
  const res = await handler(req, deps);
  assert.equal(res.status, 200);
  assert.equal(captured.length, 1);
  assert.match(captured[0].url, /key=server-secret-key/);
  assert.equal(JSON.parse(captured[0].init.body).generationConfig.maxOutputTokens, 8192);
});

test('deprecated gemini-2.5-flash is rejected and never reaches upstream', async () => {
  const { deps, captured } = makeDeps();
  const req = new Request('https://fn.example/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: { Authorization: 'Bearer tok', 'Content-Type': 'application/json' },
    body: '{}',
  });
  const res = await handler(req, deps);
  assert.equal(res.status, 400);
  assert.equal(captured.length, 0);
});
