const {test}=require('node:test');
const assert=require('node:assert/strict');
const {store}=require('./store-fixture.cjs');
for(const [action,history,active,method] of [['addResumeAnalysis','resumeHistory','activeResume','insertResume'],['addInterviewSession','interviewHistory','activeInterview','insertInterview'],['addRoadmap','roadmapHistory','activeRoadmap','insertRoadmap']]){
 test(action+' rejects failed server save without claiming persistence',async()=>{
  const {store:s,service}=store();service[method]=async()=>{throw Error('synthetic');};s.setState({user:{id:'one'}});
  await s.getState()[action]({id:'local'});assert.equal(s.getState()[history].length,0);assert.equal(s.getState()[active],null);assert.deepEqual(Array.from(s.getState().toasts,t=>t.type),['error']);
 });
 test(action+' retains server ID and concurrent arrivals',async()=>{
  const {store:s,service}=store();let finish;service[method]=()=>new Promise(resolve=>{finish=resolve});s.setState({user:{id:'one'}});
  const pending=s.getState()[action]({id:'local'});s.setState({[history]:[{id:'concurrent'}]});finish({id:'database-uuid'});await pending;
  assert.deepEqual(Array.from(s.getState()[history],r=>r.id),['database-uuid','concurrent']);assert.equal(s.getState()[active].id,'database-uuid');
 });
 test(action+' discards late results after account switch',async()=>{
  const {store:s,service}=store();let finish;service[method]=()=>new Promise(resolve=>{finish=resolve});s.setState({user:{id:'one'}});
  const pending=s.getState()[action]({id:'local'});s.setState({user:{id:'two'},[history]:[{id:'account-two'}]});finish({id:'account-one-record'});await pending;
  assert.deepEqual(Array.from(s.getState()[history],r=>r.id),['account-two']);assert.equal(s.getState().toasts.length,0);
 });
 test(action+' preserves state if guest storage is full',async()=>{
  const {store:s}=store(false,true);await s.getState()[action]({id:'local'});assert.equal(s.getState()[history].length,0);assert.deepEqual(Array.from(s.getState().toasts,t=>t.type),['error']);
 });
 test(action+' fails closed when server omits the persisted ID',async()=>{
  const {store:s,service}=store();service[method]=async()=>({});s.setState({user:{id:'one'}});await s.getState()[action]({id:'local'});assert.equal(s.getState()[history].length,0);assert.deepEqual(Array.from(s.getState().toasts,t=>t.type),['error']);
 });
}
for(const [action,history,method] of [['deleteResumeAnalysis','resumeHistory','deleteResume'],['deleteInterviewSession','interviewHistory','deleteInterview'],['deleteRoadmap','roadmapHistory','deleteRoadmap']]){
 test(action+' cannot remove a matching ID from a newly selected account',async()=>{
  const {store:s,service}=store();let finish;service[method]=()=>new Promise(resolve=>{finish=resolve});s.setState({user:{id:'one'},[history]:[{id:'same'}]});const pending=s.getState()[action]('same');s.setState({user:{id:'two'},[history]:[{id:'same'}]});finish();await pending;assert.equal(s.getState()[history].length,1);assert.equal(s.getState().toasts.length,0);
 });
}
