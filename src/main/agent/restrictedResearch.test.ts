import {afterEach,beforeEach,expect,it,vi} from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
const mock=vi.hoisted(()=>({directory:'',root:'',sources:{} as Record<string,string>,failSave:'',failCheckpoint:false,local:vi.fn()}))
vi.mock('./providers/ollamaLocal',()=>({localOllama:mock.local}))
vi.mock('../handlers/agents',()=>({readAgentForRun:(name:string)=>({name,persona:'Existing specialist profile.'})}))
vi.mock('../workspace-root',()=>({getWorkspaceRoot:()=>mock.root}))
vi.mock('../checkpoint',()=>({CheckpointStore:class{async createCheckpoint(label:string){if(mock.failCheckpoint&&label.includes('result'))throw new Error('Checkpoint unavailable');return {id:'stub-checkpoint'}}}}))
vi.mock('./researchScope',async()=>{
 const actual=await vi.importActual<any>('./researchScope')
 return {...actual,runDirectory:()=>mock.directory,ResearchScope:class extends actual.ResearchScope{
  constructor(dir:string){super(dir,mock.sources)}
  write(name:string,value:unknown){if(name===mock.failSave)throw new Error('Injected save failure: '+name);super.write(name,value)}
 }}
})
vi.mock('./actionBridge',()=>({invokeGrantedAction:async(req:any)=>{
 const {grants}=await import('./grants'),{researchAction}=await import('./researchScope')
 const g=grants.lookup(req.token)
 return g?.exactActions?.includes(req.actionId)?researchAction(g.runId,req.actionId,req.args):{ok:false,error:'not granted'}
}}))
import {launchOllamaResearch,launchResearchWithDriver} from './ollamaResearchRun'
import {RESEARCH_ROOT} from './researchScope'
import {RESEARCH_ROUTES,validateRestriction,restrictedHostPlan,type ResearchDriver,type ResearchRole,type ResearchRequest} from './researchProvider'
import {readResearchResult} from './researchResult'
import {grants} from './grants'
import {RunQueue} from '../runs/queue'
let dir:string
const ids=['jufe-coverage-2026-10-11','jufe-schedule-2026-10-11']
const quote='This dated fixture records an unresolved research question.'
beforeEach(()=>{
 dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'restricted-research-'))
 mock.directory=path.join(dir,'run');mock.root=RESEARCH_ROOT;mock.failSave='';mock.failCheckpoint=false;mock.local.mockReset()
 mock.sources=Object.fromEntries(ids.map((id,i)=>{const file=path.join(dir,`source-${i}.md`);fs.writeFileSync(file,quote+'\n');return [id,file]}))
})
afterEach(()=>{expect(mock.local).not.toHaveBeenCalled();expect(grants.size()).toBe(0);fs.rmSync(dir,{recursive:true,force:true})})
function setup(extra:any={}){
 let finish!:(code:number)=>void
 const result=new Promise<number>(r=>finish=r)
 const sink={output:vi.fn(),meta:vi.fn(),activity:vi.fn(),artifacts:vi.fn(),artifact:vi.fn(),done:vi.fn((code:number)=>finish(code))}
 const options:any={runId:'bg-restricted-test',prompt:'',contextFiles:[],activeFile:null,safeMode:true,agent:null,capabilities:[],research:{providerMode:'restricted-hosts'},sink,...extra}
 const calls:any[]=[]
 const ledger=vi.fn(async(action:string,args:any)=>{calls.push({action,args});return action==='task_create'?{taskId:'task-'+args.type}:{success:true}})
 const factory=vi.fn(()=>ledger)
 return {options,result,sink,ledger,factory,calls}
}
function driver(change:(role:ResearchRole,request:any,reply:any)=>any=(_r,_q,p)=>p){
 const closed:string[]=[],requests:any[]=[],opened:string[]=[]
 const host:ResearchDriver={kind:'restricted-hosts',preflight:vi.fn(async()=>{}),open:vi.fn(async (role:ResearchRole)=>{
  opened.push(role)
  return {receipt:{...RESEARCH_ROUTES[role],nativeTools:[],connectors:[],ambientContext:false as const,fallback:false as const,restrictionsEnforced:true as const},close:()=>closed.push(role),request:async(req:ResearchRequest,signal:AbortSignal)=>{
   requests.push({role,req})
   const content=role==='dana'?{findings:[ids[0],ids[1],ids[0]].map(id=>({statement:'The dated fixture records an unresolved question.',citation:{record_id:id,start_line:1,end_line:1,quote}})),limitations:'These are fixture observations, not current research conclusions.'}:{decision:'approve',reason:'Each fixture statement is supported by the independently retrieved excerpt.',checked_citations:[0,1,2]}
   const reply={done:true,...RESEARCH_ROUTES[role],inputTokens:100,outputTokens:50,message:req.format?{role:'assistant',content:JSON.stringify(content)}:{role:'assistant',tool_calls:ids.map(record_id=>({function:{name:'lookup',arguments:{record_id,start_line:1,end_line:1}}}))}}
   return change(role,{...req,signal},reply)
  }}
 })}
 return {host,closed,requests,opened}
}
const state=()=>JSON.parse(fs.readFileSync(path.join(mock.directory,'state.json'),'utf8'))
const outcome=()=>JSON.parse(fs.readFileSync(path.join(mock.directory,'outcome.json'),'utf8'))
it('runs both exact routes through retrieval/save/review, ledger and saved handover; result display shows report',async()=>{
 const s=setup(),d=driver();await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(0)
 expect(d.opened).toEqual(['dana','nora']);expect(d.requests.map(r=>r.role)).toEqual(['dana','dana','nora','nora'])
 expect(state().reads.nora).toHaveLength(2);expect(outcome().status).toBe('completed');expect(d.closed).toEqual(['dana','nora'])
 expect(s.calls.filter(c=>c.action==='task_complete').map(c=>c.args.taskId)).toEqual(['task-dana','task-nora','task-handover'])
 expect(readResearchResult(mock.directory,'pending')).toContain('report.md');expect(fs.existsSync(path.join(mock.directory,'handover.md'))).toBe(true)
 for(const file of Object.values(mock.sources))expect(fs.readFileSync(file,'utf8')).toBe(quote+'\n')
 expect(s.sink.meta).toHaveBeenCalledWith(expect.objectContaining({costKnown:false,turns:4}))
})
it('review rejection blocks final report and handover completion',async()=>{
 const s=setup(),d=driver((role,req,reply)=>{if(role==='nora'&&req.format){const v=JSON.parse(reply.message.content);v.decision='reject';reply.message.content=JSON.stringify(v)}return reply})
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(outcome().error).toContain('rejected')
 expect(fs.existsSync(path.join(mock.directory,'report.md'))).toBe(false);expect(s.calls.some(c=>c.action==='task_complete'&&c.args.taskId==='task-handover')).toBe(false)
 expect(s.calls).toContainEqual({action:'task_update',args:{taskId:'task-nora',status:'failed'}})
})
it('fabricated quotation fails before reviewer, preserves raw response and failure handover',async()=>{
 const s=setup(),d=driver((_role,req,reply)=>{if(req.format){const v=JSON.parse(reply.message.content);v.findings[0].citation.quote='An invented quotation absent from the source.';reply.message.content=JSON.stringify(v)}return reply})
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(outcome().error).toContain('match source verbatim');expect(d.opened).toEqual(['dana'])
 expect(fs.readdirSync(mock.directory).filter(n=>n.startsWith('event-')).map(n=>fs.readFileSync(path.join(mock.directory,n),'utf8')).join()).toContain('An invented quotation')
})
it.each(['draft.json','review.json','report.md','handover.md','outcome.json'])('failed %s never completes queue or publishes report',async name=>{
 mock.failSave=name;const s=setup(),d=driver();await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1)
 expect(readResearchResult(mock.directory,'error')).not.toMatch(/(?:^|\n\n)report\.md\n/);expect(s.sink.artifacts.mock.calls[0][0].some((a:any)=>a.name==='report.md')).toBe(false)
})
it('failed checkpoint is explicit in terminal outcome and suppresses otherwise generated report',async()=>{
 mock.failCheckpoint=true;const s=setup(),d=driver();await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1)
 expect(outcome()).toMatchObject({status:'failed',error:expect.stringContaining('Checkpoint unavailable')});expect(readResearchResult(mock.directory,'error')).not.toMatch(/(?:^|\n\n)report\.md\n/)
})
it('cancel closes uncooperative request, revokes grants and prevents reviewer',async()=>{
 let ready!:()=>void;const waiting=new Promise<void>(r=>ready=r)
 const d=driver(()=>{ready();return new Promise(()=>{})}),s=setup();const handle=await launchResearchWithDriver(s.options,d.host,s.factory);await waiting;handle.child.kill()
 expect(await s.result).toBe(1);expect(outcome().status).toBe('cancelled');expect(d.opened).toEqual(['dana']);expect(d.closed).toContain('dana');expect(grants.size()).toBe(0)
})
it('pre-aborted run does not preflight or open provider',async()=>{
 const abort=new AbortController();abort.abort();const s=setup({signal:abort.signal}),d=driver()
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(d.host.preflight).not.toHaveBeenCalled();expect(d.opened).toEqual([])
})
it.each(['nativeTools','connectors','ambientContext','restrictionsEnforced','fallback'])('fails closed on unverified %s before sending content',async field=>{
 const s=setup(),d=driver();const open=d.host.open
 d.host.open=async(role,signal)=>{const session=await open(role,signal);(session.receipt as any)[field]=field==='nativeTools'||field==='connectors'?['unexpected']:field==='restrictionsEnforced'?false:true;return session}
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(d.requests).toEqual([]);expect(outcome().error).toContain('restrictions')
})
it.each(['receipt','response'])('never substitutes model in %s',async where=>{
 const s=setup(),d=driver((_r,_q,p)=>({...p,model:where==='response'?'other':p.model}))
 if(where==='receipt'){const open=d.host.open;d.host.open=async(r,s)=>{const x=await open(r,s);x.receipt.model='other';return x}}
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(outcome().error).toMatch(/substitut|unavailable/)
})
it.each(['missing','exceeded'])('fails closed for %s token accounting',async mode=>{
 const s=setup(),d=driver((_r,_q,p)=>({...p,inputTokens:mode==='missing'?undefined:24001}))
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(outcome().error).toMatch(/token/);expect(d.requests).toHaveLength(1)
})
it('denies arbitrary model action requests',async()=>{
 const s=setup(),d=driver((_r,_q,p)=>({...p,message:{role:'assistant',tool_calls:[{function:{name:'memory.remember',arguments:{text:'not allowed'}}}]}}))
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(outcome().error).toContain('Only lookup')
})
it('production entrypoint refuses restricted execution before source staging or provider calls',async()=>{
 const s=setup();await expect(launchOllamaResearch(s.options)).rejects.toThrow('locked');expect(fs.existsSync(mock.directory)).toBe(false)
})
it('missing exact provider preflight stops before any model request',async()=>{
 const s=setup(),d=driver();d.host.preflight=async()=>{throw new Error('Exact model unavailable')}
 await launchResearchWithDriver(s.options,d.host,s.factory);expect(await s.result).toBe(1);expect(d.opened).toEqual([])
})
it('native launch plans do not inherit normal tools or enable model fallback',()=>{
 expect((restrictedHostPlan('dana').args as string[])).toEqual(expect.arrayContaining(['--tools','','--safe-mode','--strict-mcp-config']))
 expect(restrictedHostPlan('nora').thread).toMatchObject({allowProviderModelFallback:false,environments:[],dynamicTools:[]})
 expect(()=>validateRestriction('nora',undefined as any)).toThrow()
})
it('persistent restricted queue interrupts running/queued jobs, never auto-resumes, preserves route choice and failure evidence',async()=>{
 const file=path.join(dir,'queue.json'),s=setup(),d=driver(()=>new Promise(()=>{}));let started!:()=>void;const running=new Promise<void>(r=>started=r)
 const launch=vi.fn(async(job:any,sink:any)=>{const handle=await launchResearchWithDriver({...s.options,runId:job.id,sink:{...s.sink,output:sink.output,meta:sink.meta,artifacts:sink.artifacts,done:(c:number,p:string|null)=>{sink.done(c,p);s.sink.done(c)}}},d.host,s.factory);started();return {kill:()=>handle.child.kill()}})
 const queue=new RunQueue(file,launch,{concurrency:1,strictPersistence:true})
 const first=queue.enqueue({prompt:'fixture',research:{providerMode:'restricted-hosts'}});const second=queue.enqueue({prompt:'fixture',research:{providerMode:'restricted-hosts',recoveredFrom:'old'}})
 await running;queue.shutdown();await s.result
 const recoveredLauncher=vi.fn();const recovered=new RunQueue(file,recoveredLauncher,{strictPersistence:true})
 expect(recovered.get(first.id)?.status).toBe('interrupted');expect(recovered.get(second.id)?.status).toBe('interrupted');expect(recovered.get(first.id)?.research?.providerMode).toBe('restricted-hosts');expect(recoveredLauncher).not.toHaveBeenCalled()
 expect(fs.existsSync(path.join(mock.directory,'handover.md'))).toBe(true)
})
