/** Select bundled practice without repeating a prompt to fill missing tiers. */
export function selectBundledQuestions<T extends { id: string; text: string; difficulty: 'easy' | 'medium' | 'hard' }>(
  source: T[], requested: number, random: () => number = Math.random,
): T[] {
  if (!Number.isInteger(requested) || requested <= 0) return [];
  const seen = new Set<string>();
  const unique = source.filter(question => {
    const key = question.text.trim().replace(/\s+/g, ' ');
    if (!key || seen.has(key)) return false;
    seen.add(key); return true;
  });
  const shuffled = [...unique];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const count = Math.min(requested, shuffled.length);
  const selected: T[] = [];
  const targets = [Math.floor(count / 3) + (count % 3 >= 1 ? 1 : 0),
    Math.floor(count / 3) + (count % 3 >= 2 ? 1 : 0), Math.floor(count / 3)];
  (['easy', 'medium', 'hard'] as const).forEach((tier, index) => {
    selected.push(...shuffled.filter(q => q.difficulty === tier).slice(0, targets[index]));
  });
  // A short tier can use a different unused question, never a duplicate.
  for (const question of shuffled) {
    if (selected.length === count) break;
    if (!selected.includes(question)) selected.push(question);
  }
  return selected;
}
