const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('results grids use minmax(0, ...) so min-content cannot overflow a 390px viewport', () => {
  const css = fs.readFileSync('src/styles/globals.css', 'utf8');
  // Plain 1fr is minmax(auto, 1fr): the nowrap rewrite copy-button row sized
  // the track to 375px and the results page scrolled horizontally to 399px
  // whenever an analysis had rewrites. Verified live in headless Chrome.
  assert.match(css, /\.analysis-layout-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.analysis-layout-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*7fr\)\s+minmax\(0,\s*5fr\)/s);
  assert.match(css, /\.rewrite-compare-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.rewrite-compare-grid\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+auto\s+minmax\(0,\s*1fr\)/s);
});

test('the per-rewrite header row wraps so the copy button drops below its label on narrow screens', () => {
  const src = fs.readFileSync('src/components/resume/ResumeAnalysis.tsx', 'utf8');
  assert.match(src, /Rewrite \{idx \+ 1\} of \{analysis\.rewrites\.length\}/);
  const rowStart = src.indexOf('Rewrite {idx + 1}');
  const rowOpen = src.lastIndexOf("display: 'flex'", rowStart);
  const rowStyle = src.slice(rowOpen, rowStart);
  assert.match(rowStyle, /flexWrap: 'wrap'/);
});
