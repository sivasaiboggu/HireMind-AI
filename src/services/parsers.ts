/**
 * Utility functions to clean up and parse JSON responses from Gemini
 */

export function parseGeminiJson<T>(rawText: string): T {
  let cleaned = rawText.trim();
  
  // If the model wrapped the JSON in markdown code blocks, strip them out
  if (cleaned.startsWith('```')) {
    // Match both ```json ... ``` and ``` ... ```
    cleaned = cleaned
      .replace(/^```json\s*/i, '') // Remove opening ```json
      .replace(/^```\s*/, '')     // Remove opening ```
      .replace(/\s*```$/, '');    // Remove closing ```
  }
  
  cleaned = cleaned.trim();
  
  try {
    return JSON.parse(cleaned) as T;
  } catch (error) {
    console.error('Failed to parse Gemini response as JSON. Cleaned text:', cleaned);
    console.error('Original raw text was:', rawText);
    throw new Error('API returned an invalid JSON response structure. Please retry.');
  }
}
