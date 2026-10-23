const {test}=require('node:test');
const assert=require('node:assert/strict');
const {store}=require('./store-fixture.cjs');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve()};
function setup(){
 const tasks=[];let event;const channels=[];let removed=0;
 const supabase={auth:{onAuthStateChange:fn=>{event=fn;return {data:{subscription:{unsubscribe(){}}}}}},removeChannel(){removed++},channel(name){const c={name,on(type,filter,fn){this.callback=fn;return this},subscribe(){channels.push(this);return this}};return c}};
 const f=store(true,false,{supabase,setTimeout:(fn,delay)=>{if(delay===0)tasks.push(fn)}});
 for(const name of ['getProfile','fetchResumes','fetchInterviews','fetchRoadmaps'])f.service[name]=async()=>name==='getProfile'?{credits:100}:[];
 const dispose=f.store.getState().initializeAuth();
 return {...f,channels,dispose,event:(user)=>event('TEST',user?{user:{id:user}}:null),run(){while(tasks.length)tasks.shift()()},removed:()=>removed};
}
test('auth callback returns synchronously and defers database calls',async()=>{const f=setup();let calls=0;f.service.getProfile=async()=>{calls++;return null};assert.equal(f.event('one'),undefined);assert.equal(calls,0);f.run();await flush();assert.equal(calls,1);assert.equal(f.store.getState().user.id,'one');});
test('a late account load cannot restore a signed-out workspace',async()=>{const f=setup();let finish;f.service.getProfile=()=>new Promise(resolve=>finish=resolve);f.event('one');f.run();await flush();f.event(null);f.run();await flush();finish({credits:90});await flush();assert.equal(f.store.getState().user,null);assert.equal(f.store.getState().resumeHistory.length,0);assert.equal(f.channels.length,0);});
test('newer account wins when older account load finishes last',async()=>{const f=setup();let finish;f.service.getProfile=id=>id==='one'?new Promise(resolve=>finish=resolve):Promise.resolve({credits:22});f.event('one');f.run();await flush();f.event('two');f.run();await flush();finish({credits:99});await flush();assert.equal(f.store.getState().user.id,'two');assert.equal(f.store.getState().credits,22);assert(f.channels.every(c=>c.name.endsWith('-two')));});
test('disposed auth work cannot update state or install channels',async()=>{const f=setup();let finish;f.service.getProfile=()=>new Promise(resolve=>finish=resolve);f.event('one');f.run();await flush();f.dispose();finish({credits:70});await flush();assert.equal(f.channels.length,0);assert.equal(f.store.getState().profile,null);});
test('late realtime history fetch cannot leak across sign-out',async()=>{const f=setup();f.event('one');f.run();await flush();const channel=f.channels.find(c=>c.name.startsWith('resumes'));let finish;f.service.fetchResumes=()=>new Promise(resolve=>finish=resolve);const pending=channel.callback();await flush();f.event(null);f.run();await flush();finish([{id:'private-one'}]);await pending;assert.equal(f.store.getState().user,null);assert.equal(f.store.getState().resumeHistory.length,0);});
