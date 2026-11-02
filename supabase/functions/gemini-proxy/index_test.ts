import { handler } from './index.ts';
import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.224.0/assert/mod.ts';

const ENV: Record<string, string> = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'anon',
  GEMINI_API_KEY: 'server-secret-key'
};

interface Captured { url: string; init: RequestInit; }

function makeDeps(overrides: Partial<{
  verifyUser: (token: string) => Promise<string | null>;
  upstream: (url: string, init: RequestInit) => Promise<Response>;
  env: (name: string) => string | undefined;
  now: () => number;
}> = {}) {
  const captured: Captured[] = [];
  return {
    captured,
    deps: {
      verifyUser: overrides.verifyUser ?? (async () => 'user-1'),
      upstream: overrides.upstream ?? (async (url: string, init: RequestInit) => {
        captured.push({ url, init });
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }),
      env: overrides.env ?? ((name: string) => ENV[name]),
      now: overrides.now ?? (() => 1_000_000)
    }
  };
}

function post(body: string, token = 'tok', path = '/v1beta/models/gemini-2.5-flash:generateContent'): Request {
  return new Request(`https://fn.example${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body
  });
}

Deno.test('OPTIONS answers CORS preflight', async () => {
  const { deps } = makeDeps();
  const res = await handler(new Request('https://fn.example/x', { method: 'OPTIONS' }), deps);
  assertEquals(res.status, 200);
});

Deno.test('GET is rejected', async () => {
  const { deps } = makeDeps();
  const res = await handler(new Request('https://fn.example/x', { method: 'GET' }), deps);
  assertEquals(res.status, 405);
});

Deno.test('missing token is 401', async () => {
  const { deps } = makeDeps();
  const req = new Request('https://fn.example/v1beta/models/gemini-2.5-flash:generateContent', { method: 'POST', body: '{}' });
  assertEquals((await handler(req, deps)).status, 401);
});

Deno.test('unverifiable token is 401', async () => {
  const { deps } = makeDeps({ verifyUser: async () => null });
  assertEquals((await handler(post('{}'), deps)).status, 401);
});

Deno.test('missing server key is 503', async () => {
  const { deps } = makeDeps({ env: (n) => n === 'GEMINI_API_KEY' ? undefined : ENV[n] });
  assertEquals((await handler(post('{}'), deps)).status, 503);
});

Deno.test('disallowed model is 400', async () => {
  const { deps } = makeDeps();
  assertEquals((await handler(post('{}', 'tok', '/v1beta/models/gemini-ultra:generateContent'), deps)).status, 400);
});

Deno.test('streaming action is 400', async () => {
  const { deps } = makeDeps();
  assertEquals((await handler(post('{}', 'tok', '/v1beta/models/gemini-2.5-flash:streamGenerateContent'), deps)).status, 400);
});

Deno.test('oversized body is 413', async () => {
  const { deps } = makeDeps();
  assertEquals((await handler(post('x'.repeat(1_000_001)), deps)).status, 413);
});

Deno.test('invalid JSON body is 400', async () => {
  const { deps } = makeDeps();
  assertEquals((await handler(post('not json'), deps)).status, 400);
});

Deno.test('valid call forwards server key, not the user token, and clamps maxOutputTokens', async () => {
  const { deps, captured } = makeDeps();
  const body = JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 999999 } });
  const res = await handler(post(body), deps);
  assertEquals(res.status, 200);
  assertEquals(captured.length, 1);
  assertStringIncludes(captured[0].url, 'key=server-secret-key');
  assertStringIncludes(captured[0].url, 'gemini-2.5-flash');
  const headers = captured[0].init.headers as Record<string, string>;
  assertEquals(headers.Authorization, undefined);
  const sent = JSON.parse(captured[0].init.body as string);
  assertEquals(sent.generationConfig.maxOutputTokens, 8192);
});

Deno.test('per-user rate limit rejects the 31st hourly request', async () => {
  const { deps } = makeDeps();
  let last = 0;
  for (let i = 0; i < 31; i++) {
    last = (await handler(post('{}'), deps)).status;
  }
  assertEquals(last, 429);
});

Deno.test('upstream outage is 502', async () => {
  const { deps } = makeDeps({ verifyUser: async () => 'user-2', upstream: async () => { throw new Error('down'); } });
  assertEquals((await handler(post('{}'), deps)).status, 502);
});
