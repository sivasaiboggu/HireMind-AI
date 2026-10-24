const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function handler(path,name,context){
 const source=fs.readFileSync(path,'utf8');const start=source.indexOf(`  const ${name} =`);
 assert.ok(start>=0);const end=source.indexOf('\n  };',start)+5;
 const code=ts.transpileModule(source.slice(start,end)+`\nexports.run=${name};`,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const c={exports:{},...context};vm.runInNewContext(code,c);return c.exports.run;
}
for(const result of [null,{overallScore:0}])test(`interview ${result?'successful zero':'unavailable'} assessment does not invent a score`,async()=>{
 let answers=[],feedback,state='answering';let calls=0;
 const run=handler('src/pages/InterviewPractice.tsx','handleSubmitAnswer',{
  currentIdx:0,questions:[{text:'Q',expectedTopics:[]}],activeConfig:{jobRole:'Engineer'},evaluatingAnswer:false,sessionState:'answering',
  setSessionState:v=>state=v,evaluateAns:async()=>{calls++;return result},setAnswersList:fn=>answers=fn(answers),setCurrentFeedback:v=>feedback=v,
 });
 await run('Original answer');assert.equal(calls,1);
 if(result){assert.equal(answers.length,1);assert.equal(answers[0].feedback.overallScore,0);assert.equal(answers[0].userAnswer,'Original answer');assert.equal(state,'viewing_feedback')}
 else{assert.equal(answers.length,0);assert.equal(feedback,null);assert.equal(state,'answering')}
});
for(const result of [null,{overallScore:0}])test(`quiz ${result?'successful zero':'unavailable'} assessment has no fallback scorecard`,async()=>{
 let feedback,output;const run=handler('src/pages/QuizPractice.tsx','handleReviewAnswer',{
  writtenAnswer:'Original answer',evalLoading:false,currentQuestion:{text:'Q',expectedTopics:[]},jobRole:'Engineer',evaluateAnswer:async()=>result,
  setConsoleOutput:v=>output=v,setAiEvaluation:v=>feedback=v,
 });await run();
 assert.equal(feedback,result);if(!result)assert.match(output,/Assessment unavailable/);
});
