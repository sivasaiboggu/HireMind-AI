const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function store(configured=true,fail=false,options={}){
 const service={};for(const name of ['deleteResume','deleteInterview','deleteRoadmap'])service[name]=async()=>{if(fail)throw Error('synthetic');};
 const storage=new Map(Object.entries(options.saved||{}));
 const context={exports:{},require(name){
  if(name==='zustand')return require('zustand');
  if(name==='../services/supabase')return {supabase:options.supabase||{},supabaseService:service,hasSupabaseConfig:configured};
  throw Error(name);
 },localStorage:{getItem:k=>{if(options.readFails)throw Error('storage denied');return storage.get(k)||null},setItem:(k,v)=>{if(fail)throw Error('storage full');storage.set(k,v)}},document:{documentElement:{setAttribute(){}}},setTimeout:options.setTimeout||(()=>{}),window:{addEventListener(){},removeEventListener(){}},console};
 const code=ts.transpileModule(fs.readFileSync('src/store/appStore.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 vm.runInNewContext(code,context);
 return {store:context.exports.useAppStore,service,storage};
}
module.exports={store};
