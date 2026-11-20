/**
 * Bounded retry with a per-attempt timeout, for provider calls.
 *
 * A request that hangs forever is worse than a fast failure: every attempt
 * is capped, and transient failures (rate limits, 5xx, network blips) are
 * retried with exponential backoff. Permanent errors (bad key, unknown
 * model, malformed response) are thrown immediately — retrying them only
 * burns quota and time.
 */

export const REQUEST_TIMEOUT_MS = 60_000;
export const MAX_ATTEMPTS = 3;

const RETRYABLE =
  /429|500|502|503|504|rate.?limit|quota|resource exhausted|fetch failed|network|timed? ?out|ECONNRESET|ETIMEDOUT/i;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  const status = (error as { status?: unknown } | null)?.status;
  return (
    RETRYABLE.test(message) ||
    status === 429 ||
    (typeof status === 'number' && status >= 500)
  );
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      return await Promise.race([
        fn(),
        sleep(REQUEST_TIMEOUT_MS).then(() => {
          throw new Error('The AI request timed out after 60 seconds. Please try again.');
        }),
      ]);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS - 1 && isRetryableError(error)) {
        await sleep(500 * 2 ** attempt);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}
