/** Convert provider failures to useful messages without leaking request details. */
export function safeApiError(error: unknown): Error {
  const candidate = error as { status?: unknown; message?: unknown } | null;
  const message = typeof candidate?.message === 'string' ? candidate.message.toLowerCase() : '';
  const status = typeof candidate?.status === 'number' ? candidate.status : null;
  if (status === 429 || /\b429\b|quota|rate.limit|resource exhausted/.test(message)) {
    return new Error('The AI service has reached a usage limit. Try again later or check the provider usage dashboard.');
  }
  if (status === 401 || status === 403 || /\b(401|403)\b|permission|access denied|api key not valid/.test(message)) {
    return new Error('The AI service could not authorize this request. Check the configured access and provider restrictions.');
  }
  if (status === 404 || /\b404\b|model.*not found/.test(message)) {
    return new Error('The requested AI model is unavailable. Check the model configuration and try again.');
  }
  return new Error('The AI request could not be completed. Please try again.');
}
