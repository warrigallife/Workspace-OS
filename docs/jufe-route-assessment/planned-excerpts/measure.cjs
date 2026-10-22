const fs=require('fs'),ts=require('typescript'),crypto=require('crypto');
function compile(name,deps={}){const exports={};new Function('exports','require',ts.transpileModule(fs.readFileSync('src/main/agent/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,n=>{if(n in deps)return deps[n];throw Error(n)});return exports}
const contract=compile('researchContract'),context=compile('researchContext',{'./researchContract':contract}),plan=compile('researchExcerpts'),cost=compile('researchCost',{'./researchProvider':{RESEARCH_BUDGET:{tokens:24000}}});
const root='docs/jufe-route-assessment/claude-thinking-live/ui/';const event=n=>JSON.parse(fs.readFileSync(root+`event-${String(n).padStart(3,'0')}.json`)).data;
const saved=[5,6].map(n=>event(n).result.result),sources=Object.fromEntries(saved.map(r=>[r.record_id,{hash:r.sha256,lines:Array(r.total_lines).fill('')}]));
const ranges=plan.plannedResearchExcerpts(sources),catalog=saved.map(r=>({record_id:r.record_id,total_lines:r.total_lines}));
const results=ranges.map(r=>{const s=saved.find(s=>s.record_id===r.record_id);return {ok:true,result:{...s,...r,excerpt:s.excerpt.split('\n').slice(r.start_line-s.start_line,r.end_line-s.start_line+1).join('\n')}}});
const draft=JSON.parse(fs.readFileSync(root+'draft.json'));draft.findings.forEach((f,i)=>{const line=[51,53,60][i],s=saved.find(s=>s.record_id===f.citation.record_id);f.citation={record_id:s.record_id,start_line:line,end_line:line,quote:s.excerpt.split('\n')[line-1]}});
const code=fs.readFileSync('src/main/agent/ollamaResearchRun.ts','utf8'),task=/export const RESEARCH_TASK='([^']+)'/.exec(code)[1];
const note=/messages.push\(\{role:'user',content:'(The coordinator retrieves[^']+)'\}\)/.exec(code)[1];
const bytes=r=>Buffer.byteLength(JSON.stringify(r));
const requests=['dana','nora'].map(role=>({messages:[{role:'system',content:context.researchSystem(role,catalog)},{role:'user',content:task+(role==='nora'?'\nDraft to independently review: '+JSON.stringify(draft):'')},{role:'user',content:note},...results.map(r=>({role:'tool',tool_name:'lookup',content:JSON.stringify(r)})),{role:'user',content:context.researchFinalisation(role)}],format:contract.providerOutputSchema(contract.researchTools(role,sources,true)[1].function.parameters)}));
const original=[2,7,13,18].map(n=>{const r=event(n);return {messages:r.messages,...(r.format?{format:r.format}:{tools:r.tools})}});
// New context is compared with the former final requests. Skipped lookup-only
// responses remove their measured usage entirely, not a bytes/token estimate.
const finalOld=[original[1],original[3]],oldInput=[11556,11666],oldOutput=[412,154];
const outputDelta=bytes(draft)-bytes(JSON.parse(fs.readFileSync(root+'draft.json')));
const forecasts=[3,4,5].map(charsPerToken=>{
 const stages=requests.map((r,i)=>Math.ceil(oldInput[i]-(bytes(finalOld[i])-bytes(r))/charsPerToken+oldOutput[i]+(i===0?Math.max(0,outputDelta)/charsPerToken:0)));
 const combined=stages.reduce((a,b)=>a+b,0);return {charsPerToken,stages,combined,headroom:24000-combined,with2048Contingency:combined+2048,headroomAfterContingency:24000-combined-2048,danaFitsPlanned12000Allocation:stages[0]<=12000}
});
const output={baselineTokens:32045,removedMeasuredLookupResponseTokens:3559+4698,questionUnchanged:true,sourceRanges:ranges,oldRequestBytes:original.map(bytes),newRequestBytes:requests.map(bytes),totalBytesRemoved:original.reduce((a,r)=>a+bytes(r),0)-requests.reduce((a,r)=>a+bytes(r),0),forecast:forecasts,firstCallPlans:requests.map((r,i)=>cost.researchCostPlan(i?'nora':'dana',0,r,0,true,true)),assumptions:['Two generation/review responses only; no corrections, wider retrieval, retries or model changes.','Final input reductions estimated at 3–5 UTF-8 bytes/token; historical host/cache/auxiliary overhead and outputs otherwise held fixed.','Dana full-line draft output increase included; reviewer receives complete trusted draft. Host overhead can change, so this is not an upper bound.','2048 contingency is illustrative, not enough to guarantee a full extra context-bearing call. Hash-bound plan reserves 12000 for Nora and forecasts at least 10000 per call; other routes keep reserve 16518.']};
fs.writeFileSync(__dirname+'/request-estimate.json',JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
