const {test}=require('node:test');
const assert=require('node:assert/strict');
const {mkdtempSync,rmSync}=require('node:fs');
const path=require('node:path');
const {tmpdir}=require('node:os');
const {execFileSync}=require('node:child_process');
const output=mkdtempSync(path.join(tmpdir(),'hiremind-generation-'));
process.on('exit',()=>rmSync(output,{recursive:true,force:true}));
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'src/services/generation.ts','--module','commonjs','--target','es2022','--skipLibCheck','--outDir',output]);
const {generateThenCharge}=require(path.join(output,'generation.js'));
test('failed AI requests never deduct credits',async()=>{
  let charges=0;
  await assert.rejects(generateThenCharge(async()=>{throw Error('synthetic failure')},()=>true,async()=>{charges++;return true}),/synthetic failure/);
  assert.equal(charges,0);
});
test('successful requests charge exactly once after generation',async()=>{
  const order=[];
  assert.equal(await generateThenCharge(async()=>{order.push('generate');return 'result'},()=>true,async()=>{order.push('charge');return true}),'result');
  assert.deepEqual(order,['generate','charge']);
});
test('insufficient credits prevent generation',async()=>{
  let calls=0;
  await assert.rejects(generateThenCharge(async()=>{calls++;},()=>false,async()=>{calls++;return true}),/Insufficient/);
  assert.equal(calls,0);
});
test('changed credit balance does not return a falsely accounted result',async()=>{
  await assert.rejects(generateThenCharge(async()=>'result',()=>true,async()=>false),/credits changed/);
});
