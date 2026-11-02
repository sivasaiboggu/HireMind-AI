// Authenticated Gemini proxy for HireMind.
//
// The browser never sees the provider key: signed-in users call this function
// with their Supabase access token, the function verifies it, then forwards
// the request to Google's Gemini API with the server-side GEMINI_API_KEY.
//
// Abuse and cost controls:
//   - only POST, only non-streaming generateContent, only allowlisted models
//   - request body capped at 1 MB
//   - maxOutputTokens clamped to MAX_OUTPUT_TOKENS so a caller cannot request
//     unbounded generation
//   - best-effort per-user rate limit (per function instance; a durable
//     counter can replace it later without changing callers)
//
// Required secrets (Supabase function environment):
//   GEMINI_API_KEY            server-only Google AI key
//   SUPABASE_URL              injected automatically by Supabase
//   SUPABASE_ANON_KEY         injected automatically by Supabase

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const GOOGLE_BASE = 'https://generativelanguage.googleapis.com';
const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash'
]);
const MAX_BODY_BYTES = 1_000_000;
const MAX_OUTPUT_TOKENS = 8192;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 30;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Best-effort per-instance limiter: user id -> recent request timestamps.
const recentRequests = new Map<string, number[]>();

function rateLimited(userId: string, now: number): boolean {
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (recentRequests.get(userId) || []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) {
    recentRequests.set(userId, hits);
    return true;
  }
  hits.push(now);
  recentRequests.set(userId, hits);
  return false;
}

type VerifyUser = (token: string) => Promise<string | null>;
type UpstreamFetch = (url: string, init: RequestInit) => Promise<Response>;

interface ProxyDeps {
  verifyUser: VerifyUser;
  upstream: UpstreamFetch;
  env: (name: string) => string | undefined;
  now: () => number;
}

async function defaultVerifyUser(token: string): Promise<string | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  if (!supabaseUrl || !anonKey) return null;
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user }, error } = await authClient.auth.getUser();
  return error || !user ? null : user.id;
}

const liveDeps: ProxyDeps = {
  verifyUser: defaultVerifyUser,
  upstream: (url, init) => fetch(url, init),
  env: (name) => Deno.env.get(name),
  now: () => Date.now()
};

export async function handler(req: Request, deps: ProxyDeps = liveDeps): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Sign in to use AI features.' }, 401);

  if (!deps.env('SUPABASE_URL') || !deps.env('SUPABASE_ANON_KEY')) {
    return json({ error: 'Authentication is not configured on the server.' }, 503);
  }
  const geminiKey = deps.env('GEMINI_API_KEY') || '';
  if (!geminiKey) return json({ error: 'AI is not configured on the server yet.' }, 503);

  const userId = await deps.verifyUser(token);
  if (!userId) return json({ error: 'Sign in again to use AI features.' }, 401);

  if (rateLimited(userId, deps.now())) {
    return json({ error: 'Too many AI requests. Try again later.' }, 429);
  }

  const url = new URL(req.url);
  const match = url.pathname.match(/\/v1beta\/models\/([a-z0-9.\-]+):generateContent$/);
  if (!match || !ALLOWED_MODELS.has(match[1])) {
    return json({ error: 'This model or action is not supported.' }, 400);
  }

  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413);

  // Clamp generation length so one request cannot spend unbounded tokens.
  let outbound = body;
  try {
    const parsed = JSON.parse(body);
    parsed.generationConfig = parsed.generationConfig || {};
    if (
      typeof parsed.generationConfig.maxOutputTokens !== 'number' ||
      parsed.generationConfig.maxOutputTokens > MAX_OUTPUT_TOKENS
    ) {
      parsed.generationConfig.maxOutputTokens = MAX_OUTPUT_TOKENS;
    }
    outbound = JSON.stringify(parsed);
  } catch {
    return json({ error: 'Request body must be valid JSON.' }, 400);
  }

  let upstreamResp: Response;
  try {
    upstreamResp = await deps.upstream(
      `${GOOGLE_BASE}/v1beta/models/${match[1]}:generateContent?key=${geminiKey}`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: outbound }
    );
  } catch {
    return json({ error: 'The AI provider could not be reached.' }, 502);
  }

  const text = await upstreamResp.text();
  return new Response(text, {
    status: upstreamResp.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

if (import.meta.main) {
  serve((req) => handler(req));
}
