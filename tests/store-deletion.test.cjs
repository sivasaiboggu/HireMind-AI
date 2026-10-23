const {test}=require('node:test');
const assert=require('node:assert/strict');
const {store}=require('./store-fixture.cjs');

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
