const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const GLOBALS = fs.readFileSync(path.join(ROOT, 'src/styles/globals.css'), 'utf8');

// WCAG relative luminance + contrast ratio, same maths as the audit that
// fixed the muted/accent values in round 10.
function luminance(hex) {
  const c = hex.replace('#', '');
  const f = (i) => {
    const v = parseInt(c.substr(i, 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(0) + 0.7152 * f(2) + 0.0722 * f(4);
}
function contrast(a, b) {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Pull the token block for a theme out of globals.css. The :root block
 * ends at the first closing brace; the light block is matched by selector. */
function themeBlock(selector) {
  const start = GLOBALS.indexOf(selector);
  assert.notEqual(start, -1, `missing ${selector} block`);
  const open = GLOBALS.indexOf('{', start);
  const close = GLOBALS.indexOf('\n}\n', open);
  return GLOBALS.slice(open + 1, close);
}

/** Last hex declared for each --token in the block. Tokens are declared
 * twice (hex fallback, then OKLCH), so the last hex is the fallback the
 * contrast numbers in tokens.json are computed from. */
function hexTokens(block) {
  const tokens = {};
  for (const [, name, hex] of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)) {
    tokens[name] = hex;
  }
  return tokens;
}

// Every colour that reaches the user as text or an icon, in both themes.
// These are the ratios recorded in src/styles/tokens.json; if a token
// changes, this test — not a screenshot — is what catches a regression.
const TEXT_TOKENS = ['text-primary', 'text-secondary', 'text-muted',
  'accent-primary', 'accent-secondary', 'accent-warning', 'accent-danger'];

for (const [name, selector] of [['dark', ':root'], ['light', "[data-theme='light']"]]) {
  test(`${name} theme: every text token passes WCAG AA (4.5:1) on the background`, () => {
    const tokens = hexTokens(themeBlock(selector));
    const bg = tokens['bg-base'];
    assert.ok(bg, `${name}: --bg-base missing`);
    for (const token of TEXT_TOKENS) {
      const ratio = contrast(tokens[token], bg);
      assert.ok(ratio >= 4.5,
        `${name} --${token} ${tokens[token]} on ${bg} is ${ratio.toFixed(2)}:1, below AA 4.5:1`);
    }
  });

  test(`${name} theme: text on the accent fill passes AA`, () => {
    const tokens = hexTokens(themeBlock(selector));
    const ratio = contrast(tokens['on-accent'], tokens['accent-primary']);
    assert.ok(ratio >= 4.5,
      `${name} --on-accent ${tokens['on-accent']} on accent ${tokens['accent-primary']} is ${ratio.toFixed(2)}:1`);
  });

  test(`${name} theme: accent tokens are declared in OKLCH with a hex fallback`, () => {
    const block = themeBlock(selector);
    for (const token of ['accent-primary', 'accent-secondary', 'accent-danger', 'bg-base', 'text-primary']) {
      const hex = new RegExp(`--${token}:\\s*#[0-9a-fA-F]{6};`).test(block);
      const oklch = new RegExp(`--${token}:\\s*oklch\\(`).test(block);
      assert.ok(hex && oklch, `${name} --${token} needs both a hex line and an oklch line`);
    }
  });
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function withoutComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1');
}

test('no indigo remnant and no glow token anywhere in src', () => {
  // The last purple-blue in the app was rgba(129, 140, 248, …) on the
  // skills icon, the info badge and a quiz chip; the glow box-shadows
  // (--glow-primary / --glow-amber) were replaced by 1px border emphasis.
  const hits = [];
  for (const file of walk(path.join(ROOT, 'src'))) {
    const text = withoutComments(fs.readFileSync(file, 'utf8'));
    if (text.includes('129, 140, 248')) hits.push(`${path.relative(ROOT, file)}: indigo rgba`);
    if (text.includes('--glow-')) hits.push(`${path.relative(ROOT, file)}: --glow- token`);
    if (text.includes('glow-primary') || text.includes('glow-amber')) {
      hits.push(`${path.relative(ROOT, file)}: glow-* reference`);
    }
  }
  assert.deepEqual(hits, [], `design-token regressions:\n${hits.join('\n')}`);
});

test('tokens.json contrast table matches the CSS fallbacks', () => {
  const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/styles/tokens.json'), 'utf8'));
  for (const [theme, selector] of [['dark', ':root'], ['light', "[data-theme='light']"]]) {
    const css = hexTokens(themeBlock(selector));
    for (const [token, entry] of Object.entries(tokens.color[theme])) {
      assert.equal(entry.hex.toLowerCase(), (css[token] || '').toLowerCase(),
        `tokens.json ${theme} ${token} ${entry.hex} != globals.css ${css[token]}`);
    }
  }
});

test('documented text and control contrast holds on all measured surfaces', () => {
  const { contrast: measured } = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/styles/tokens.json'), 'utf8'));
  for (const [theme, selector] of [['dark', ':root'], ['light', "[data-theme='light']"]]) {
    const css = hexTokens(themeBlock(selector));
    for (const [pair, recorded] of Object.entries(measured[theme])) {
      const [foreground, background] = pair.split(' / ');
      const minimum = foreground === 'border-active' ? 3 : 4.5;
      const ratio = contrast(css[foreground], css[background]);
      assert.equal(Number(ratio.toFixed(2)), recorded, `${theme} ${pair} has a stale ratio`);
      assert.ok(ratio >= minimum, `${theme} ${pair} is below ${minimum}:1`);
    }
  }
});
