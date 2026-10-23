/** A shared provider secret must never be compiled into a public browser bundle. */
export function assertSafeBrowserBuild(command: string, env: Record<string, string | undefined>) {
  if (command !== 'build') return;
  const providerKeys = ['GEMINI_API_KEY', 'VITE_GEMINI_API_KEY', 'API_KEY'];
  if (providerKeys.some(key => env[key]?.trim())) {
    throw new Error('Browser build stopped: remove Gemini provider keys from build configuration. Use an authenticated server-side AI endpoint before public deployment.');
  }
}
