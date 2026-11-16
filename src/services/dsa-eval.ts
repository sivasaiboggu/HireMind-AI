/**
 * DSA test-case comparison for the local JavaScript and Python runners.
 * Most answers are order-sensitive, but a question can declare `anyOrder`
 * when its statement says the returned elements may come in any order
 * (Two Sum's index pair, for example). For those, top-level arrays compare
 * as multisets; every other value still compares exactly.
 */
const canonical = (value: unknown): string => {
  const json = JSON.stringify(value);
  return json === undefined ? String(value) : json;
};

export function matchesExpected(actual: unknown, expected: unknown, anyOrder: boolean = false): boolean {
  if (anyOrder && Array.isArray(actual) && Array.isArray(expected)) {
    if (actual.length !== expected.length) return false;
    const remaining = expected.map(canonical);
    for (const item of actual) {
      const index = remaining.indexOf(canonical(item));
      if (index === -1) return false;
      remaining.splice(index, 1);
    }
    return true;
  }
  return JSON.stringify(actual) === JSON.stringify(expected);
}
