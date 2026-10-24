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

for(const result of [null,{compiled:true,testCaseResults:[{passed:true}]}])test(`AI code review ${result?'prediction':'failure'} never becomes executed test evidence`,async()=>{
 let output,results;const run=handler('src/pages/QuizPractice.tsx','runDsaCodeViaAi',{
  activeCode:'x'.repeat(100),selectedLanguage:'cpp',getCompilerRun:async()=>result,
  setConsoleOutput:v=>output=v,setCompilerTab:()=>{},setTestCaseResults:v=>results=v,
 });assert.equal(await run([{expected:1}]),null);assert.equal(results.length,0);assert.match(output,result?/unverified/:/No code was executed/);
});
for(const results of [null,[]])test(`missing executed tests ${results?'empty':'unavailable'} cannot submit or advance`,async()=>{
 let writes=0,notice;const run=handler('src/pages/QuizPractice.tsx','handleNextDsaQuestion',{
  runDsaCodeLocally:async()=>results,addToast:(_,s)=>notice=s,
  setUserAnswers:()=>writes++,setAiEvaluations:()=>writes++,setCurrentIdx:()=>writes++,setQuizState:()=>writes++,
 });await run('long code');assert.equal(writes,0);assert.match(notice,/No executed test results/);
});
test('real nonempty local test results still submit and advance',async()=>{
 let answer,evaluation,index;const run=handler('src/pages/QuizPractice.tsx','handleNextDsaQuestion',{
  runDsaCodeLocally:async()=>[{passed:true},{passed:false}],addToast:()=>{},currentQuestion:{id:'q'},currentIdx:0,questions:[{},{}],selectedLanguage:'javascript',
  setUserAnswers:fn=>answer=fn({}),setAiEvaluations:fn=>evaluation=fn({}),setCurrentIdx:v=>index=v,
 });await run('solve code');assert.equal(answer.q,'solve code');assert.equal(evaluation.q.passRate,.5);assert.equal(evaluation.q.passed,false);assert.equal(index,1);
});
test('mobile shell reserves safe-area space and practice controls can wrap',()=>{
 const layout=fs.readFileSync('src/components/layout/Layout.tsx','utf8');
 const quiz=fs.readFileSync('src/pages/QuizPractice.tsx','utf8');const css=fs.readFileSync('src/styles/globals.css','utf8');
 assert.match(layout,/paddingBottom: isMobile \? 'calc\(84px \+ env\(safe-area-inset-bottom, 0px\)\)'/);
 assert.match(layout,/height: 'calc\(60px \+ env\(safe-area-inset-bottom, 0px\)\)'/);
 assert.match(quiz,/className="practice-runner-footer"[^\n]*flexWrap: 'wrap'/);
 assert.match(css,/\.practice-runner-actions > button\s*\{[^}]*min-height: 44px/s);
});
