const {test}=require('node:test');const assert=require('node:assert/strict');
const {store}=require('./store-fixture.cjs');
for(const raw of ['null','{}','"bad"','[null]','[1]','[[]]'])test(`guest history rejects incompatible JSON ${raw} without deleting bytes`,()=>{
 const saved={hiremind_resume_v9:raw,hiremind_interview_v9:raw,hiremind_roadmap_v9:raw};
 const f=store(false,false,{saved});f.store.getState().initializeAuth();
 for(const key of ['resumeHistory','interviewHistory','roadmapHistory'])assert.equal(f.store.getState()[key].length,0);
 for(const [key,value]of Object.entries(saved))assert.equal(f.storage.get(key),value);
});
test('guest preferences reject wrong types and negative credits',()=>{
 const f=store(false,false,{saved:{hiremind_credits_v9:'-1',hiremind_guest_v9:'"true"',hiremind_collapsed_v9:'[]',hiremind_theme_v9:'invalid'}});
 assert.equal(f.store.getState().credits,85);assert.equal(f.store.getState().guestMode,false);assert.equal(f.store.getState().sidebarCollapsed,false);assert.equal(f.store.getState().theme,'dark');
});
test('denied storage reads do not crash store construction or guest initialization',()=>{
 const f=store(false,false,{readFails:true});f.store.getState().initializeAuth();
 assert.equal(f.store.getState().theme,'dark');assert.equal(f.store.getState().resumeHistory.length,0);
});
