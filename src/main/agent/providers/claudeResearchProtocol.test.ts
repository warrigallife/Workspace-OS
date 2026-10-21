import {expect,it} from 'vitest'
import {classifyResearchEvent,ResearchProtocolError} from './claudeResearchProtocol'
it.each([
 {type:'keep_alive'},
 {type:'rate_limit_event',rate_limit_info:{status:'allowed'}},
 {type:'rate_limit_event',rate_limit_info:{status:'allowed_warning',isUsingOverage:false,overageInUse:false}},
 ...[null,'requesting','compacting'].map(status=>({type:'system',subtype:'status',status})),
 {type:'system',subtype:'informational',level:'notice',content:'PRIVATE BANNER'},
])('classifies documented non-action lifecycle: %j',event=>{expect(classifyResearchEvent(event)).toBe('lifecycle')})
it.each(['control_request','control_response','control_cancel_request','tool_progress','tool_use_summary','update_environment_variables'])('denies %s without dispatch',type=>{
 expect(()=>classifyResearchEvent({type,request:{subtype:'can_use_tool',input:{secret:'PRIVATE'}}})).toThrow('control_or_tool_event_denied')
})
it.each(['model_refusal_fallback','permission_retry','hook_started','hook_progress','hook_response','stop_hook_summary','task_started','task_notification','compact_boundary','unknown'])('never silently ignores system subtype %s',subtype=>{
 expect(()=>classifyResearchEvent({type:'system',subtype})).toThrow('unsupported_system_event')
})
it.each([
 {type:'rate_limit_event',rate_limit_info:{status:'rejected'}},
 {type:'rate_limit_event',rate_limit_info:{status:'allowed',isUsingOverage:true}},
 {type:'rate_limit_event',rate_limit_info:{status:'allowed',overageInUse:true}},
 {type:'rate_limit_event',rate_limit_info:{status:'allowed',rateLimitType:'overage'}},
 {type:'rate_limit_event',rate_limit_info:{status:'allowed',isUsingOverage:'false'}},
 {type:'system',subtype:'informational',level:'notice',content:'x',prevent_continuation:true},
 {type:'system',subtype:'informational',level:'notice',content:'x',tool_use_id:'secret'},
 {type:'system',subtype:'status',status:'unknown'},
 {type:'keep_alive',request:{subtype:'can_use_tool'}},
])('stops invalid, blocked or overage lifecycle: %j',event=>{expect(()=>classifyResearchEvent(event)).toThrow()})
it.each(['auth_status','user','stream_event','session_notice','unrecognized'])('fails closed for unsupported %s',type=>{
 expect(()=>classifyResearchEvent({type,content:'PRIVATE'})).toThrow('unsupported_event')
})
it('redacts unknown type/subtype and never serializes content or credentials',()=>{
 const e=new ResearchProtocolError({type:'credential-secret',subtype:'private-research',content:'PRIVATE',request:{token:'SECRET'}},'unsupported_event')
 expect(e.message).toContain('redacted-unrecognized');for(const value of ['credential-secret','private-research','PRIVATE','SECRET'])expect(e.message).not.toContain(value)
 expect(e.message.length).toBeLessThan(250)
})
it('preserves safe control subtype and stable reason, not payload',()=>{
 const e=new ResearchProtocolError({type:'control_request',request:{subtype:'can_use_tool',input:{secret:'SECRET'}}},'control_or_tool_event_denied')
 expect(e.message).toContain('"type":"control_request"');expect(e.message).toContain('"subtype":"can_use_tool"');expect(e.message).not.toContain('SECRET')
})
