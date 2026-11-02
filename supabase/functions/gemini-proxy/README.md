# gemini-proxy (not yet deployed)

Keeps the Google AI key on the server. The browser sends the user's Supabase
access token; the function verifies it and forwards an allowlisted, non-
streaming generateContent request to Google with the server-side
GEMINI_API_KEY.

## Deploy (requires project owner action - currently blocked on Supabase
dashboard access)

1. `supabase functions deploy gemini-proxy`
2. `supabase secrets set GEMINI_API_KEY=<server-only key>`
3. Set `VITE_GEMINI_PROXY_URL=https://<project-ref>.functions.supabase.co/gemini-proxy`
   in the hosting environment and redeploy the frontend.

Resolution order in the app: signed-in + proxy configured -> proxy; otherwise
the visitor's own connected Google AI key (top bar); otherwise a plain
guidance error. Nothing here changes behavior until the proxy URL is set.
