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

const resume=()=>({id:'resume',timestamp:1,jobRole:'Engineer',experienceLevel:'Beginner',atsScore:0,contentScore:0,formatScore:0,overallScore:0,sections:[],recommendations:[],matchedKeywords:[],missingKeywords:[],atsChecklist:[],rewrites:[]});
const interview=()=>({id:'interview',timestamp:1,config:{jobRole:'Engineer',techStack:[],difficulty:'Beginner',interviewType:'technical',questionCount:1},answers:[],overallScore:0});
const roadmap=()=>({id:'roadmap',timestamp:1,role:'Engineer',experienceLevel:'Beginner',currentSkills:[],totalWeeks:1,phases:[{id:'phase',title:'Start',weeks:'1',color:'#fff',topics:[]}],skillGaps:[]});
for(const [key,history,factory,breakRecord] of [
 ['hiremind_resume_v9','resumeHistory',resume,r=>r.sections=[{name:'bad',score:30,status:'pass',feedback:null}]],
 ['hiremind_interview_v9','interviewHistory',interview,r=>r.config=null],
 ['hiremind_roadmap_v9','roadmapHistory',roadmap,r=>r.phases[0].topics=null]
])test(`nested corrupt ${history} is excluded while valid records and raw bytes survive`,()=>{
 const good=factory(),bad=factory();breakRecord(bad);const raw=JSON.stringify([{},bad,good]);
 const f=store(false,false,{saved:{[key]:raw}});f.store.getState().initializeAuth();
 assert.equal(f.store.getState()[history].length,1);assert.equal(f.store.getState()[history][0].id,good.id);
 assert.doesNotThrow(()=>f.store.getState().getRecentActivity());assert.equal(f.storage.get(key),raw);
});
test('guest roadmap rejects unsafe stored resources and invalid completion containers',()=>{
 for(const mutate of [r=>r.completedPhases='phase',r=>r.completedPhases=['missing'],r=>r.phases[0].topics=[{id:'t',name:'Topic',level:'Beginner',description:'',whyItMatters:'',resources:[{type:'article',title:'Unsafe',url:'javascript:alert(1)'}]}]]){
  const r=roadmap();mutate(r);const raw=JSON.stringify([r]);const f=store(false,false,{saved:{hiremind_roadmap_v9:raw}});f.store.getState().initializeAuth();
  assert.equal(f.store.getState().roadmapHistory.length,0);assert.equal(f.storage.get('hiremind_roadmap_v9'),raw);
 }
});
test('valid nested interview feedback and roadmap resources remain usable',()=>{
 const i=interview();i.answers=[{question:{id:'q',text:'Question',category:'technical',difficulty:'easy',expectedTopics:[]},userAnswer:'Answer',timestamp:2,feedback:{overallScore:0,accuracy:0,clarity:0,depth:0,examples:0,strengths:[],improvements:[],modelAnswer:''}}];
 const r=roadmap();r.completedPhases=['phase'];r.phases[0].topics=[{id:'t',name:'Topic',level:'Beginner',description:'',whyItMatters:'',resources:[{type:'article',title:'Resource',url:'https://example.com/'}]}];
 const f=store(false,false,{saved:{hiremind_interview_v9:JSON.stringify([i]),hiremind_roadmap_v9:JSON.stringify([r])}});f.store.getState().initializeAuth();
 assert.equal(f.store.getState().interviewHistory.length,1);assert.equal(f.store.getState().roadmapHistory.length,1);
});
