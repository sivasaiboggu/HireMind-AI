const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = fs.readFileSync('src/hooks/useCountUp.ts', 'utf8');
// React is only used inside the hook body; the decision helper never touches
// it, so a stub stands in for the module during the pure-function checks.
const context = { exports: {}, require() { return {}; } };
vm.runInNewContext(
  ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
  context
);
const { prefersReducedMotion } = context.exports;

test('reduced-motion preference is honored when the matcher says so', () => {
  assert.equal(prefersReducedMotion(() => ({ matches: true })), true);
  assert.equal(prefersReducedMotion(() => ({ matches: false })), false);
});

test('the exact media query matches the stylesheet rule', () => {
  let seen = '';
  prefersReducedMotion((query) => { seen = query; return { matches: false }; });
  assert.equal(seen, '(prefers-reduced-motion: reduce)');
});

test('no matcher and no browser matchMedia means animation stays on', () => {
  // Server render and old browsers: never silently swallow the animation.
  assert.equal(prefersReducedMotion(), false);
});
