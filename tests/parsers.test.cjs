const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-parser-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/parsers.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const { parseGeminiJson } = require(path.join(output, 'services/parsers.js'));
test('parses plain JSON and surrounding whitespace', () => {
  assert.deepEqual(parseGeminiJson('  {"score": 80}  '), { score: 80 });
});
test('parses JSON and generic markdown fences', () => {
  for (const prefix of ['```json', '```JSON', '```']) {
    assert.deepEqual(parseGeminiJson(prefix + '\n{"ok":true}\n```'), { ok: true });
  }
});
test('invalid JSON never logs or returns private response content', () => {
  const privateText = 'PRIVATE_RESUME_SENTINEL: invalid model response';
  const logged = [];
  const original = console.error;
  console.error = (...args) => logged.push(args.join(' '));
  try {
    assert.throws(() => parseGeminiJson(privateText), {
      message: 'API returned an invalid JSON response structure. Please retry.'
    });
    assert.deepEqual(logged, []);
  } finally { console.error = original; }
});

const {sanitizeRoadmap}=require(path.join(output,'services/parsers.js'));
test('roadmap resources reject executable, credential-bearing and invented links',()=>{
 const input=['javascript:alert(1)','data:text/html,hello','file:///etc/passwd','https://user:secret@example.test','not a url',null,'https://example.test/lesson'];
 const result=sanitizeRoadmap({phases:[{topics:[{resources:input.map(url=>({url}))}]}]});
 assert.deepEqual(result.phases[0].topics[0].resources.map(r=>r.url),['https://example.test/lesson']);
});
test('roadmap preserves zero percentages and bounds finite curriculum numbers',()=>{
 const result=sanitizeRoadmap({totalWeeks:Infinity,skillGaps:[{demandPercentage:0,gapPercentage:0},{demandPercentage:Infinity,gapPercentage:-1},{demandPercentage:200,gapPercentage:'25'}]});
 assert.equal(result.totalWeeks,12);
 assert.deepEqual(result.skillGaps.map(g=>[g.demandPercentage,g.gapPercentage]),[[0,0],[50,0],[100,25]]);
 assert.equal(sanitizeRoadmap({totalWeeks:-2}).totalWeeks,1);
});
