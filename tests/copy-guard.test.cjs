const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const FILES = [
  ...walk(path.join(ROOT, 'src')),
  path.join(ROOT, 'index.html'),
  path.join(ROOT, 'README.md'),
];

// Words the product never says about itself. Word-boundary matching, so
// the --bg-elevated CSS token and the word "elevated" do not trip it.
const BANNED_WORDS = [
  'seamless', 'supercharge', 'elevate', 'unlock', 'revolution',
  'game-changer', 'ai-powered', 'cutting-edge', 'next-gen',
  'world-class', 'superpower',
];

// Text glyphs that are not words: checkmarks, crosses, arrows, key symbols.
// Scanned only in UI files, not in .ts services — ats.ts legitimately
// lists bullet glyphs (• – — · › → ▪) in a regex that detects them.
const DECORATIVE_SYMBOLS = ['✓', '✗', '➔', '←', '→', '↑', '↓', '↵', '★', '■', '◆', '●'];

// Emoji ranges: emoticons, pictographs, transport, flags, dingbats.
// Arrows are not in this pattern: ats.ts legitimately lists arrow glyphs
// in a regex that detects bullets, and arrows in UI text are caught by
// the decorative-symbols test below.
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

/** Drop code that is not user-facing copy before scanning: import
 * statements (lucide icon names such as Unlock) and JSX tags (component
 * names and props). What is left is string literals, JSX text and comments.
 */
function userFacingText(source) {
  return source
    .replace(/import[\s\S]*?from\s+['"][^'"]+['"];?/g, '')
    .replace(/import\s+['"][^'"]+['"];?/g, '')
    .replace(/<[^>]*>/gs, '');
}

test('no emoji in user-facing files', () => {
  const hits = [];
  for (const file of FILES) {
    const text = fs.readFileSync(file, 'utf8');
    // Service files may legitimately list symbol glyphs inside regex
    // character classes (ats.ts detects bullets and decorative symbols);
    // there, only string literals can reach the user, so only those are
    // scanned. UI files are scanned whole.
    const scanned = file.endsWith('.ts') && !file.endsWith('.tsx')
      ? (text.match(/'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g) || []).join('\n')
      : text;
    const match = scanned.match(EMOJI);
    if (match) hits.push(`${path.relative(ROOT, file)}: ${match[0]}`);
  }
  assert.deepEqual(hits, [], `emoji found:\n${hits.join('\n')}`);
});

test('no banned marketing words in user-facing text', () => {
  const hits = [];
  for (const file of FILES) {
    const text = userFacingText(fs.readFileSync(file, 'utf8'));
    for (const word of BANNED_WORDS) {
      const pattern = new RegExp(`\\b${word.replace('-', '[- ]')}\\b`, 'i');
      if (pattern.test(text)) hits.push(`${path.relative(ROOT, file)}: ${word}`);
    }
  }
  assert.deepEqual(hits, [], `banned marketing words found:\n${hits.join('\n')}`);
});

test('no decorative text symbols in UI files', () => {
  const uiFiles = FILES.filter((f) => /\.(tsx|html|md)$/.test(f));
  const hits = [];
  for (const file of uiFiles) {
    const text = userFacingText(fs.readFileSync(file, 'utf8'));
    for (const symbol of DECORATIVE_SYMBOLS) {
      if (text.includes(symbol)) hits.push(`${path.relative(ROOT, file)}: ${symbol}`);
    }
  }
  assert.deepEqual(hits, [], `decorative symbols found:\n${hits.join('\n')}`);
});

// Structural slop patterns the design playbook forbids outright. Comments
// are stripped first: a comment explaining a removal must not fail the
// build for naming the thing that was removed.
const STRUCTURAL_PATTERNS = [
  // Frosted surfaces: top bars, sidebars, tooltips, drawers, overlays.
  'backdrop-filter',
  'backdropFilter',
  // Radial glows and dot-pattern backgrounds.
  'radial-gradient',
  // Staggered entrances (per-item delays) and their keyframes.
  'stagger',
  'staggerRise',
  // Animated shimmer skeletons, floating icons, pulsing dots/rings.
  'skeletonShimmer',
  'floatIcon',
  'pulseDot',
  'hmPulseRing',
  'floating-icon',
  'logo-pulse-dot',
  // Coloured glow shadows: emphasis is a 1px accent-tinted border now.
  'glow-primary',
  'glow-amber',
];

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

test('no frosted surfaces, radial glows, staggered entrances or decorative motion', () => {
  const hits = [];
  for (const file of FILES) {
    // README is prose, not code: its changelog may name a removed pattern.
    if (file.endsWith('README.md')) continue;
    const text = withoutComments(fs.readFileSync(file, 'utf8'));
    for (const pattern of STRUCTURAL_PATTERNS) {
      if (text.includes(pattern)) hits.push(`${path.relative(ROOT, file)}: ${pattern}`);
    }
  }
  assert.deepEqual(hits, [], `playbook violations found:\n${hits.join('\n')}`);
});
