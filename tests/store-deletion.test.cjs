const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');

function store(configured=true,fail=false){
 const service={};for(const name of ['deleteResume','deleteInterview','deleteRoadmap'])service[name]=async()=>{if(fail)throw Error('synthetic');};
 const storage=new Map();
 const context={exports:{},require(name){
  if(name==='zustand')return require('zustand');
  if(name==='../services/supabase')return {supabase:{},supabaseService:service,hasSupabaseConfig:configured};
  throw Error(name);
 },localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(fail)throw Error('storage full');storage.set(k,v)}},document:{documentElement:{setAttribute(){}}},setTimeout(){},console};
 const code=ts.transpileModule(fs.readFileSync('src/store/appStore.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,context);
 return {store:context.exports.useAppStore,service};
}
for(const [action,history,active,service] of [['deleteResumeAnalysis','resumeHistory','activeResume','deleteResume'],['deleteInterviewSession','interviewHistory','activeInterview','deleteInterview'],['deleteRoadmap','roadmapHistory','activeRoadmap','deleteRoadmap']]){
 test(action+' preserves record and shows only error on server failure',async()=>{
  const {store:s}=store(true,true);const row={id:'one'};s.setState({user:{id:'owner'},[history]:[row],[active]:row});
  await s.getState()[action]('one');assert.equal(s.getState()[history].length,1);assert.equal(s.getState()[active].id,'one');assert.deepEqual(Array.from(s.getState().toasts,t=>t.type),['error']);
 });
 test(action+' waits for server and preserves concurrent arrivals',async()=>{
  const {store:s,service:api}=store();let finish;api[service]=()=>new Promise(resolve=>{finish=resolve});const row={id:'one'};s.setState({user:{id:'owner'},[history]:[row],[active]:row});
  const pending=s.getState()[action]('one');assert.equal(s.getState()[history].length,1);
  s.setState({[history]:[row,{id:'two'}]});finish();await pending;
  assert.deepEqual(Array.from(s.getState()[history],r=>r.id),['two']);assert.equal(s.getState()[active].id,'two');assert.deepEqual(Array.from(s.getState().toasts,t=>t.type),['info']);
 });
 test(action+' preserves guest data if browser storage rejects write',async()=>{
  const {store:s}=store(false,true);s.setState({[history]:[{id:'one'}],[active]:{id:'one'}});await s.getState()[action]('one');assert.equal(s.getState()[history].length,1);assert.deepEqual(Array.from(s.getState().toasts,t=>t.type),['error']);
 });
}
