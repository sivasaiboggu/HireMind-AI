/**
 * Builds the Pyodide harness for one DSA test case. The serialized arguments
 * used to be spliced between single quotes, so a value like "don't" or a
 * backslash broke the Python source before the candidate's code ever ran.
 * Embedding them as a JSON string literal (also a valid Python literal) keeps
 * every apostrophe, quote, backslash and newline intact.
 */
export function buildPythonHarness(activeCode: string, args: unknown): string {
  const argsJson = JSON.stringify(args);
  return `
import json
${activeCode}

args = json.loads(${JSON.stringify(argsJson)})
result = solve(*args)
json.dumps(result)
`;
}
