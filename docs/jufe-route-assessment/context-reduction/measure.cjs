// Offline character-based forecast, not a tokenizer or provider inference.
const fs=require('fs'),ts=require('typescript'),path=require('path');
const compiled={};function load(name){if(compiled[name])return compiled[name];const exports={};const code=ts.transpileModule(fs.readFileSync('src/main/agent/'+name+'.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;new Function('exports','require',code)(exports,n=>load(n.replace('./','')));return compiled[name]=exports}
const {researchSystem,researchFinalisation}=load('researchContext');
const root='docs/jufe-route-assessment/claude-thinking-live/ui/';const event=n=>JSON.parse(fs.readFileSync(root+`event-${String(n).padStart(3,'0')}.json`)).data;
const results=[5,6].map(n=>event(n).result.result),catalog=results.map(r=>({record_id:r.record_id,total_lines:r.total_lines}));
const reductions={};let mandatory=0;
for(const [role,n] of [['dana',7],['nora',18]]){
 const messages=event(n).messages,system=messages[0].content.length-researchSystem(role,catalog).length,final=messages.at(-1).content.length-researchFinalisation(role).length;
 reductions[role]={systemCharactersRemoved:system,finalisationCharactersRemoved:final,weightedCharactersRemoved:2*system+final};mandatory+=2*system+final;
}
// Illustrative surrounding context, not a prescribed retrieval plan or claim of adequacy.
const ranges=[[48,54],[56,65]];let narrowChars=0;
const narrowed=results.map((r,i)=>{const [start_line,end_line]=ranges[i];const out={...r,start_line,end_line,excerpt:r.excerpt.split('\n').slice(start_line-r.start_line,end_line-r.start_line+1).join('\n')};narrowChars+=JSON.stringify({ok:true,result:out}).length;return {record_id:r.record_id,start_line,end_line,excerptCharacters:out.excerpt.length}});
const originalTools=event(18).messages.filter(m=>m.role==='tool').reduce((n,m)=>n+m.content.length,0),conditional=originalTools-narrowChars;
const output={baselineTokens:32045,limit:24000,requiredSaving:8045,reductions,mandatoryWeightedCharacters:mandatory,conditionalNoraRetrievalCharacters:conditional,illustrativeNoraRanges:narrowed,forecasts:[3,4,5].map(charsPerToken=>({charsPerToken,instructionsOnlyTokens:Math.round(32045-mandatory/charsPerToken),withIllustrativeNarrowNoraTokens:Math.round(32045-(mandatory+conditional)/charsPerToken)})),assumptions:['Exactly two requests per stage, no correction or extra retrieval. Initial instruction reduction counted twice because persistent host context is charged on both responses.','Same host overhead, auxiliary activity and response tokens as the saved run; none are measured anew. JSON escaping and model tokenisation are not simulated.','Conditional Nora savings require sufficient narrower retrieval; prompt guidance cannot guarantee model choices or context sufficiency.','The current trusted-quotation contract copies complete lines. Increased draft/reviewer context relative to historical substring quotes is excluded; estimates are optimistic.','No hard reservation or budget increase introduced; existing shared 24000-token fail-closed boundary remains authoritative.']};
fs.writeFileSync(path.join(__dirname,'estimate.json'),JSON.stringify(output,null,2)+'\n');console.log(JSON.stringify(output,null,2));
