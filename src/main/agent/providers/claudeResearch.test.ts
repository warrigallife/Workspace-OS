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
 const result=(result:string,extra:any={})=>emit({type:'result',subtype:'success',result,usage:{input_tokens:10,output_tokens:20},...extra})
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
 const q=s.request({messages:[],format:{}},f.controller.signal);f.result('{"findings":[]}')
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
