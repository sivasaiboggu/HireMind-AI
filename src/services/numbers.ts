/**
 * Clamp a number into [min, max]. Non-finite input (NaN, ±Infinity) falls
 * back to `min` instead of leaking into a width, an SVG offset or an
 * aria value: a ring fed 140 used to draw past full, and a bar fed a
 * negative value rendered a negative width.
 */
export function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}
