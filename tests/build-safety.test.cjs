const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync, readFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const output = mkdtempSync(path.join(tmpdir(), 'hiremind-build-tests-'));
process.on('exit', () => rmSync(output, { recursive: true, force: true }));
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'),
  'src/services/build-safety.ts', '--module', 'commonjs', '--target', 'es2022',
  '--skipLibCheck', '--outDir', output]);
const {assertSafeBrowserBuild}=require(path.join(output,'build-safety.js'));
test('all configured provider-key names block builds without leaking their values',()=>{
  for (const name of ['GEMINI_API_KEY','VITE_GEMINI_API_KEY','API_KEY']) {
    assert.throws(()=>assertSafeBrowserBuild('build',{[name]:'SYNTHETIC_DO_NOT_LEAK'}),e=>{
      assert.match(e.message,/Browser build stopped/);
      assert.doesNotMatch(e.message,/SYNTHETIC_DO_NOT_LEAK/);return true;
    });
  }
});
test('keyless builds and local development remain available',()=>{
  assert.doesNotThrow(()=>assertSafeBrowserBuild('build',{VITE_SUPABASE_ANON_KEY:'public-anon',API_KEY:' '}));
  assert.doesNotThrow(()=>assertSafeBrowserBuild('serve',{VITE_GEMINI_API_KEY:'local-only-synthetic'}));
});
test('Vite does not inject private process env keys',()=>{
  const config=readFileSync('vite.config.ts','utf8');
  assert.doesNotMatch(config,/define\s*:/);
  const service=readFileSync('src/services/gemini.ts','utf8');
  assert.doesNotMatch(service,/process\.env/);
  assert.match(service,/import\.meta\.env\.DEV/);
});
test('every CSS custom property used in src is defined in globals.css',()=>{
  // Two tokens shipped undefined for months (--text-md in 24 places,
  // --accent-warning in the local-audit banner and checklist), so headings
  // silently fell back to inherited sizes and warning accents to inherit.
  // This test fails the build if any var(--x) has no --x: definition.
  const {readdirSync}=require('node:fs');
  const css=readFileSync('src/styles/globals.css','utf8');
  const defined=new Set([...css.matchAll(/--([a-z0-9-]+)\s*:/g)].map(m=>m[1]));
  const used=new Map();
  const walk=(dir)=>{for(const e of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())walk(p);else if(/\.(ts|tsx|css)$/.test(e.name)){for(const m of readFileSync(p,'utf8').matchAll(/var\(--([a-z0-9-]+)\)/g)){if(!used.has(m[1]))used.set(m[1],p);}}}};
  walk('src');
  for(const [name,firstUse] of used){assert.ok(defined.has(name),`--${name} used in ${firstUse} has no definition in src/styles/globals.css`);}
  assert.ok(defined.has('text-md'));
  assert.ok(defined.has('accent-warning'));
});
