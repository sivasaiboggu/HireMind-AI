// Authenticated Gemini proxy for HireMind.
//
// The browser never sees the provider key: signed-in users call this function
// with their Supabase access token, the function verifies it, then forwards
// the request to Google's Gemini API with the server-side GEMINI_API_KEY.
// Only non-streaming generateContent calls for allowlisted models pass.
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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Sign in to use AI features.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
  if (!supabaseUrl || !anonKey) return json({ error: 'Authentication is not configured on the server.' }, 503);
  if (!geminiKey) return json({ error: 'AI is not configured on the server yet.' }, 503);

  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user }, error: authError } = await authClient.auth.getUser();
  if (authError || !user) return json({ error: 'Sign in again to use AI features.' }, 401);

  const url = new URL(req.url);
  const match = url.pathname.match(/\/v1beta\/models\/([a-z0-9.\-]+):generateContent$/);
  if (!match || !ALLOWED_MODELS.has(match[1])) {
    return json({ error: 'This model or action is not supported.' }, 400);
  }

  const body = await req.text();
  if (body.length > MAX_BODY_BYTES) return json({ error: 'Request too large.' }, 413);

  let upstream: Response;
  try {
    upstream = await fetch(`${GOOGLE_BASE}/v1beta/models/${match[1]}:generateContent?key=${geminiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  } catch {
    return json({ error: 'The AI provider could not be reached.' }, 502);
  }

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
});
