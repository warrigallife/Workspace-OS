import {expect,it,vi} from 'vitest'
import {EventEmitter} from 'events'
import {PassThrough} from 'stream'
import type {ChildProcess} from 'child_process'
import {createClaudeResearchDriver} from './claudeResearch'
const model='claude-sonnet-5'
function fixture(){
 const children:any[]=[]
 const launch=vi.fn(()=>{const c=Object.assign(new EventEmitter(),{stdin:new PassThrough(),stdout:new PassThrough(),stderr:new PassThrough(),kill:vi.fn(()=>true)});children.push(c);return c as unknown as ChildProcess})
 const driver=createClaudeResearchDriver({directory:'/tmp/staging',maxBudgetUsd:0.1,launch})
 const controller=new AbortController()
 const emit=(event:any)=>children.at(-1).stdout.write(JSON.stringify(event)+'\n')
 const init=()=>emit({type:'system',subtype:'init',model,tools:[],mcp_servers:[]})
 let count=0
 const result=(result:string,extra:any={})=>{count++;emit({type:'assistant',message:{model,content:[{type:'text',text:result}]}});emit({type:'result',subtype:'success',result,usage:{input_tokens:10,output_tokens:20},modelUsage:{[model]:{inputTokens:count*10,outputTokens:count*20,cacheReadInputTokens:0,cacheCreationInputTokens:0,costUSD:count*0.001}},...extra})}
 return {driver,controller,children,launch,emit,init,result}
}
it('production adapter cannot launch or transmit without separate approval',async()=>{
 const d=createClaudeResearchDriver({directory:'/tmp',maxBudgetUsd:1})
 await expect(d.preflight(new AbortController().signal)).rejects.toMatchObject({code:'RESEARCH_LIVE_NOT_APPROVED'})
 await expect(d.open('dana',new AbortController().signal)).rejects.toMatchObject({code:'RESEARCH_LIVE_NOT_APPROVED'})
})
it('uses separate fresh restricted sessions, explicit caps, sanitized environment and no fallback',async()=>{
 const f=fixture(),a=await f.driver.open('dana',f.controller.signal),b=await f.driver.open('nora',f.controller.signal)
 expect(f.children).toHaveLength(2)
 for(const [args,opts] of f.launch.mock.calls as unknown as [string[],any][]){
  expect(args).toEqual(expect.arrayContaining(['--tools','','--safe-mode','--strict-mcp-config','--no-session-persistence','--max-budget-usd','0.05']))
  expect(args).not.toContain('--resume');expect(args).not.toContain('--fallback-model')
  expect(opts.env.USER).toBe(process.env.USER)
  expect(Object.keys(opts.env).sort()).toEqual(['CLAUDE_CODE_MAX_OUTPUT_TOKENS','HOME','LANG','PATH','USER'])
 }
 expect(a.receipt).toEqual(b.receipt)
 await expect(f.driver.open('dana',f.controller.signal)).rejects.toThrow('already opened')
 a.close();b.close()
})
it('translates only lookup intents and passes final JSON to existing application validation',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const p=s.request({messages:[{role:'user',content:'fixture only'}],tools:[]},f.controller.signal);f.init()
 f.result(JSON.stringify({lookups:[{record_id:'fixture',start_line:1,end_line:2}]}))
 expect((await p).message.tool_calls?.[0].function).toEqual({name:'lookup',arguments:{record_id:'fixture',start_line:1,end_line:2}})
 const q=s.request({messages:[{role:'user',content:'fixture only'},(await p).message],format:{}},f.controller.signal);f.result('{"findings":[]}')
 expect(await q).toMatchObject({provider:'claude',model,inputTokens:10,outputTokens:20,message:{content:'{"findings":[]}'}})
 s.close()
})
it.each([
 ['tools',{type:'system',subtype:'init',model,tools:['Read'],mcp_servers:[]}],
 ['connectors',{type:'system',subtype:'init',model,tools:[],mcp_servers:['filesystem']}],
 ['model',{type:'system',subtype:'init',model:'different',tools:[],mcp_servers:[]}],
 ['native action',{type:'assistant',message:{content:[{type:'tool_use',name:'Read'}]}}],
 ['permission request',{type:'control_request',request:{subtype:'can_use_tool'}}],
 ['missing init',{type:'result',subtype:'success',result:'{}',usage:{input_tokens:1,output_tokens:1}}],
])('fails closed on %s',async(_name,event)=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const p=s.request({messages:[],format:{}},f.controller.signal),assertion=expect(p).rejects.toThrow()
 f.emit(event);await assertion;expect(f.children[0].kill).toHaveBeenCalledWith('SIGTERM')
})
it.each([
 ['usage',{usage:undefined}],['negative usage',{usage:{input_tokens:-1,output_tokens:1}}],
 ['truncation',{stop_reason:'max_tokens'}],['provider failure',{subtype:'error_during_execution'}],
 ['substitution',{modelUsage:{other:{}}}],
])('rejects %s before save',async(_name,extra)=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const p=s.request({messages:[],format:{}},f.controller.signal),assertion=expect(p).rejects.toThrow()
 f.init();f.result('{}',extra);await assertion
})
it('rejects arbitrary actions, malformed JSON and oversized output',async()=>{
 for(const content of ['{"save":{}}','not JSON','x'.repeat(70000)]){
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal),p=s.request({messages:[],tools:[]},f.controller.signal),assertion=expect(p).rejects.toThrow()
 f.init();f.result(content);await assertion
 }
})
it('cancels pending work and refuses further requests',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal),p=s.request({messages:[]},f.controller.signal),assertion=expect(p).rejects.toThrow('cancelled')
 f.controller.abort();await assertion
 await expect(s.request({messages:[]},new AbortController().signal)).rejects.toThrow('closed')
})
it('fails on interruption and refuses overlapping requests',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal),p=s.request({messages:[]},f.controller.signal),assertion=expect(p).rejects.toThrow('exited')
 await expect(s.request({messages:[]},f.controller.signal)).rejects.toThrow('Concurrent')
 f.children[0].emit('exit',1);await assertion
})
it.each([
 ['<synthetic>',{is_api_error_message:true,api_error_status:403},'host-api-error'],
 ['claude-sonnet-5-20260630',{},'identity-mismatch'],
 ['private credential text',{},'<redacted-invalid-model-id>'],
])('preserves sanitized requested/returned identity on rejection: %s',async(returned,extra,expected)=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const p=s.request({messages:[],format:{}},f.controller.signal),assertion=expect(p).rejects.toThrow(expected)
 f.init();f.emit({type:'assistant',message:{model:returned,content:[{type:'text',text:'DO NOT RECORD PRIVATE BODY'}]},...extra})
 await assertion
 try{await p}catch(e){const text=(e as Error).message;expect(text).toContain('"requested":"claude-sonnet-5"');expect(text).not.toContain('DO NOT RECORD PRIVATE BODY');expect(text).not.toContain('private credential text')}
 expect(f.children[0].kill).toHaveBeenCalledWith('SIGTERM')
})
it('accepts lifecycle events without resolving a response or exposing their payloads',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 let resolved=false
 const p=s.request({messages:[],format:{}},f.controller.signal).then(r=>{resolved=true;return r})
 f.emit({type:'keep_alive'});f.emit({type:'rate_limit_event',rate_limit_info:{status:'allowed',privateField:'PRIVATE'}});f.init()
 f.emit({type:'system',subtype:'status',status:'requesting'});f.emit({type:'system',subtype:'informational',level:'notice',content:'PRIVATE'})
 await Promise.resolve();expect(resolved).toBe(false)
 f.result('{}');const r=await p;expect(r.done).toBe(true);expect(JSON.stringify(r.nativeEvidence)).not.toContain('PRIVATE');s.close()
})
it('preserves event metadata on malformed response rejection without copying the response',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const p=s.request({messages:[],tools:[]},f.controller.signal),assertion=expect(p).rejects.toThrow('invalid_event_or_response_json')
 f.init();f.result('PRIVATE SECRET invalid JSON');await assertion
 try{await p}catch(e){expect((e as Error).message).toContain('"type":"result"');expect((e as Error).message).toContain('"subtype":"success"');expect((e as Error).message).not.toContain('PRIVATE')}
})
it('launches and verifies a selected non-Sonnet model without affecting defaults',async()=>{
 const f=fixture(),selected='claude-opus-5'
 const routes={dana:{provider:'claude' as const,model:selected},nora:{provider:'claude' as const,model:'claude-haiku-4-5-20251001'}}
 const d=createClaudeResearchDriver({directory:'/tmp',maxBudgetUsd:0.1,launch:f.launch,routes})
 routes.dana.model='claude-sonnet-5' // caller changes cannot redirect a snapshotted run
 const s=await d.open('dana',f.controller.signal)
 expect((f.launch.mock.calls as unknown as [string[],unknown][])[0][0]).toContain(selected)
 const p=s.request({messages:[],format:{}},f.controller.signal)
 f.emit({type:'system',subtype:'init',model:selected,tools:[],mcp_servers:[]})
 f.emit({type:'assistant',message:{model:selected,content:[{type:'text',text:'{}'}]}})
 const u={inputTokens:10,outputTokens:20,cacheReadInputTokens:0,cacheCreationInputTokens:0,costUSD:0.01}
 f.emit({type:'result',subtype:'success',result:'{}',usage:{input_tokens:10,output_tokens:20},modelUsage:{[selected]:u,'claude-haiku-4-5-20251001':u}})
 const r=await p;expect(r.model).toBe(selected);expect(r.inputTokens).toBe(20);expect(r.aggregateUsage?.models[1].attribution).toContain('unattributed');s.close()
})
it('does not accept a result without an observed answer identity',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal),p=s.request({messages:[],format:{}},f.controller.signal),assertion=expect(p).rejects.toThrow('result_without_verified_request')
 f.init();f.emit({type:'result',subtype:'success',result:'{}',usage:{input_tokens:1,output_tokens:1}});await assertion
})

it('accepts revalidated initialization on request two without restarting the session or resetting accounting',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const first=s.request({messages:[],format:{}},f.controller.signal);f.init();f.result('{}');await first
 const second=s.request({messages:[(await first).message],format:{}},f.controller.signal);f.init();f.result('{}')
 expect(await second).toMatchObject({model,inputTokens:10,outputTokens:20})
 expect(f.launch).toHaveBeenCalledTimes(1);s.close()
})
it.each([
 [{tools:undefined},'init_tools_invalid'],[{tools:{}},'init_tools_invalid'],
 [{tools:['PRIVATE TOOL']},'init_tools_not_empty'],
 [{mcp_servers:undefined},'init_mcp_invalid'],[{mcp_servers:{}},'init_mcp_invalid'],
 [{mcp_servers:['PRIVATE CONNECTOR']},'init_mcp_not_empty'],
 [{model:'claude-opus-5'},'model_identity_rejected'],
])('revalidates a later init and preserves safe specific rejection: %j',async(extra,reason)=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal)
 const first=s.request({messages:[],format:{}},f.controller.signal);f.init();f.result('{}');await first
 const second=s.request({messages:[(await first).message],format:{}},f.controller.signal),assertion=expect(second).rejects.toThrow(reason)
 f.emit({type:'system',subtype:'init',model,tools:[],mcp_servers:[],...extra});await assertion
 try{await second}catch(e){expect((e as Error).message).not.toContain('PRIVATE');expect((e as Error).message).toContain('"subtype":"init"')}
 expect(f.children[0].kill).toHaveBeenCalledWith('SIGTERM')
})
it('sends only new messages and changed controls across three turns; retains wire evidence and session isolation',async()=>{
 const f=fixture(),s=await f.driver.open('dana',f.controller.signal),sent:any[]=[]
 f.children[0].stdin.on('data',(c:any)=>sent.push(JSON.parse(JSON.parse(c.toString()).message.content)))
 const initial=[{role:'system',content:'PERSONA'},{role:'user',content:'TASK'}]
 const a=s.request({messages:initial,tools:[{name:'lookup'}]},f.controller.signal);f.init();f.result('{"lookups":[{"record_id":"a","start_line":1,"end_line":1}]}');const ar=await a
 const evidence={role:'tool',content:'SOURCE PASSAGE'}
 const history=[...initial,ar.message,evidence,{role:'user',content:'FINALISE'}]
 const b=s.request({messages:history,format:{type:'object'}},f.controller.signal);f.init();f.result('{"draft":"bad"}');const br=await b
 const correction={role:'user',content:'Precise validation error and prior lookup reference'}
 const c=s.request({messages:[...history,br.message,correction],format:{type:'object'}},f.controller.signal);f.init();f.result('{"draft":"corrected"}');const cr=await c
 expect(sent[0].messages).toEqual(initial)
 expect(sent[1]).toEqual({messages:[evidence,{role:'user',content:'FINALISE'}],tools:[],format:{type:'object'}})
 expect(sent[2]).toEqual({messages:[correction]})
 expect(JSON.stringify(sent[2])).not.toContain('SOURCE PASSAGE');expect(JSON.stringify(sent[2])).not.toContain('draft')
 expect(cr.nativeEvidence?.[0]).toEqual({type:'workspace_os_request',request:sent[2]})
 expect(cr.inputTokens).toBe(10);expect(f.launch).toHaveBeenCalledTimes(1)
 await expect(s.request({messages:[...initial,{role:'user',content:'changed history'}],format:{}},f.controller.signal)).rejects.toThrow('transcript changed')
 const n=await f.driver.open('nora',f.controller.signal);let wire:any
 f.children[1].stdin.on('data',(c:any)=>{wire=JSON.parse(JSON.parse(c.toString()).message.content)})
 const np=n.request({messages:[{role:'system',content:'NORA'},{role:'user',content:'DRAFT TO REVIEW'}],format:{}},f.controller.signal);f.init();f.result('{}');await np
 expect(wire.messages).toHaveLength(2);expect(JSON.stringify(wire)).not.toContain('PERSONA');s.close();n.close()
})
it('thinking notices neither resolve an answer nor contribute usage, including repeats and block resets',async()=>{
 const f=fixture(),s=await f.driver.open('nora',f.controller.signal);let resolved=false
 const p=s.request({messages:[],format:{}},f.controller.signal).then(r=>{resolved=true;return r})
 const notice=(n:number,d:number)=>f.emit({type:'system',subtype:'thinking_tokens',estimated_tokens:n,estimated_tokens_delta:d,user_message_uuid:'PRIVATE IDENTIFIER'})
 notice(100,100);f.init();notice(100,0);notice(5,5)
 await Promise.resolve();expect(resolved).toBe(false)
 f.result('{}');const r=await p
 expect(r.inputTokens).toBe(10);expect(r.outputTokens).toBe(20)
 const notices=(r.nativeEvidence as any[]).filter(e=>e.subtype==='thinking_tokens')
 expect(notices).toHaveLength(3);expect(notices.every(e=>e.classification==='lifecycle')).toBe(true)
 expect(JSON.stringify(notices)).not.toContain('estimated_tokens');expect(JSON.stringify(notices)).not.toContain('PRIVATE')
 s.close()
})
it('thinking progress cannot replace research answer identity',async()=>{
 const f=fixture(),s=await f.driver.open('nora',f.controller.signal)
 const p=s.request({messages:[],format:{}},f.controller.signal),assertion=expect(p).rejects.toThrow('result_without_verified_request')
 f.init();f.emit({type:'system',subtype:'thinking_tokens',estimated_tokens:100,estimated_tokens_delta:10})
 f.emit({type:'result',subtype:'success',result:'{}'});await assertion
 expect(f.children[0].kill).toHaveBeenCalledWith('SIGTERM')
})
