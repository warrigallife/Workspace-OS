const fs=require('fs'),ts=require('typescript'),cp=require('child_process');
function load(source,dep){const exports={};new Function('exports','require',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText)(exports,()=>dep);return exports}
const contract=load(fs.readFileSync('src/main/agent/researchContract.ts','utf8'));
const before=load(cp.execFileSync('git',['show','01541ff:src/main/agent/researchContext.ts'],{encoding:'utf8'}),contract),after=load(fs.readFileSync('src/main/agent/researchContext.ts','utf8'),contract);
const dir='docs/jufe-route-assessment/claude-thinking-live/ui/';const event=n=>JSON.parse(fs.readFileSync(dir+`event-${String(n).padStart(3,'0')}.json`)).data;
const catalog=[5,6].map(n=>{const r=event(n).result.result;return {record_id:r.record_id,total_lines:r.total_lines}});
const rows=[['dana',2],['dana',7],['nora',13],['nora',18]].map(([role,n])=>{
 function size(helper){const r=structuredClone(event(n));r.messages[0].content=helper.researchSystem(role,catalog);if(r.format)r.messages.at(-1).content=helper.researchFinalisation(role);return Buffer.byteLength(JSON.stringify(r))}
 const old=size(before),current=size(after);return {role,event:n,beforeBytes:old,afterBytes:current,reductionBytes:old-current}
});const result={comparison:'01541ff versus current prompts in identical saved request envelopes; historical evidence/schema held constant',rows,totalFullContextBytesRemoved:rows.reduce((n,r)=>n+r.reductionBytes,0),liveTokenSavings:'unmeasured; bytes are not tokens; no inference'};
fs.writeFileSync(__dirname+'/request-sizes.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
