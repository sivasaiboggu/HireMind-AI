/**
 * User-connected Google AI key. Public builds must never bake a provider key
 * into the bundle, so people connect their own free key once; it is stored
 * only in this browser's localStorage and sent only to Google's API.
 */
export const GEMINI_KEY_STORAGE = 'hiremind_gemini_api_key';

const clean = (value?: string | null): string =>
  typeof value === 'string' ? value.trim() : '';

/**
 * Picks the usable key. Local development prefers the env key; the connected
 * browser key is the fallback there and the only source in public builds.
 */
export function resolveGeminiApiKey(opts: {
  isDev: boolean;
  devKey?: string | null;
  storedKey?: string | null;
}): string {
  if (opts.isDev) {
    const dev = clean(opts.devKey);
    if (dev) return dev;
  }
  return clean(opts.storedKey);
}

export function readStoredGeminiKey(storage?: Pick<Storage, 'getItem'>): string {
  try {
    return clean((storage ?? localStorage).getItem(GEMINI_KEY_STORAGE));
  } catch {
    return '';
  }
}

export function saveStoredGeminiKey(key: string, storage?: Pick<Storage, 'setItem'>): void {
  const value = clean(key);
  if (!value) return;
  try {
    (storage ?? localStorage).setItem(GEMINI_KEY_STORAGE, value);
  } catch { /* storage unavailable; key simply will not persist */ }
}

export function clearStoredGeminiKey(storage?: Pick<Storage, 'removeItem'>): void {
  try {
    (storage ?? localStorage).removeItem(GEMINI_KEY_STORAGE);
  } catch { /* ignore */ }
}
