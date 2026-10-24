const {test}=require('node:test');const assert=require('node:assert/strict');
const {mkdtempSync,rmSync}=require('node:fs');const {tmpdir}=require('node:os');const path=require('node:path');const {execFileSync}=require('node:child_process');
const output=mkdtempSync(path.join(tmpdir(),'practice-selection-'));process.on('exit',()=>rmSync(output,{recursive:true,force:true}));
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'src/services/practice-selection.ts','src/services/mockQuestions.ts','--module','commonjs','--target','es2022','--skipLibCheck','--outDir',output]);
const {selectBundledQuestions:select}=require(path.join(output,'practice-selection.js'));
const {MOCK_DSA_QUESTIONS:dsa,MOCK_INTERVIEW_QUESTIONS:interview}=require(path.join(output,'mockQuestions.js'));
for(const [name,pools] of [['dsa',dsa],['interview',interview]])test(`${name} bundled pools never repeat prompts or mutate source`,()=>{
 for(const pool of Object.values(pools)){
  const before=JSON.stringify(pool);for(const count of [1,3,6,12,100]){
   const chosen=select(pool,count,()=>.5);assert.equal(new Set(chosen.map(q=>q.text.trim().replace(/\s+/g,' '))).size,chosen.length);
   assert.equal(chosen.length,Math.min(count,pool.length));assert.ok(chosen.every(q=>pool.includes(q)));
  }assert.equal(JSON.stringify(pool),before);
 }
});
test('missing tier fills with unused questions rather than repeating',()=>{
 const pool=[{id:'a',text:'A',difficulty:'easy'},{id:'b',text:'B',difficulty:'easy'},{id:'c',text:'C',difficulty:'medium'}];
 assert.equal(select(pool,6,()=>.5).length,3);
});
test('duplicate text under different IDs cannot inflate pool size',()=>{
 const pool=[{id:'a',text:'Prompt  here',difficulty:'easy'},{id:'b',text:' Prompt here ',difficulty:'hard'}];assert.equal(select(pool,6).length,1);
});
test('invalid counts and empty pools return no questions',()=>{
 for(const count of [0,-1,1.5,NaN,Infinity])assert.deepEqual(select(dsa.general,count),[]);assert.deepEqual(select([],6),[]);
});
