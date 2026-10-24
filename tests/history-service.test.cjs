const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const ts=require('typescript');
function service(fail){
 const source=fs.readFileSync('src/services/supabase.ts','utf8').replaceAll('import.meta.env.VITE_SUPABASE_URL',"'https://synthetic.supabase.co'").replaceAll('import.meta.env.VITE_SUPABASE_ANON_KEY',"'synthetic-key'");
 const context={exports:{},console:{error(){},warn(){}},require(){return {createClient(){return {from(){return {select(){return this},eq(){return this},async order(){return {data:[],error:fail?new Error('synthetic failure'):null}}}}}}}}};
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,context);
 return context.exports.supabaseService;
}
for(const method of ['fetchResumes','fetchInterviews','fetchRoadmaps'])test(`${method} distinguishes failed query from genuinely empty history`,async()=>{
 await assert.rejects(service(true)[method]('synthetic-user'),/synthetic failure/);
 assert.equal((await service(false)[method]('synthetic-user')).length,0);
});
