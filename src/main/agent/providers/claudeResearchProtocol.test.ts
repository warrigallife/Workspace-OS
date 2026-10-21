import {expect,it} from 'vitest'
import {classifyResearchEvent,ResearchProtocolError,protocolMetadata} from './claudeResearchProtocol'
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

it.each(['future_notice','api_retry','task_summary','a'.repeat(64)])('retains bounded subtype %s but still rejects unknown system events',subtype=>{
 expect(protocolMetadata({type:'system',subtype})).toEqual({type:'system',subtype})
 expect(()=>classifyResearchEvent({type:'system',subtype,content:'PRIVATE'})).toThrow('unsupported_system_event')
})
it.each(['a'.repeat(65),'private text','line\nbreak','escape\u001b[31m','/private/path','https://private.invalid','{"token":"SECRET"}','sk-ant-secret-value','秘密',null,42,{},[]])('redacts malformed or oversized subtype %j',subtype=>{
 const e=new ResearchProtocolError({type:'system',subtype,content:'PRIVATE',token:'SECRET'},'unsupported_system_event')
 expect(e.message).toContain('<redacted-unrecognized>');expect(e.message).not.toContain('SECRET');expect(e.message).not.toContain('PRIVATE');expect(e.message.length).toBeLessThan(200)
})
it('preserves absence and bounded control-request subtype without accepting control events',()=>{
 expect(protocolMetadata({type:'system'}).subtype).toBe('<absent>')
 expect(protocolMetadata({type:'control_request',request:{subtype:'future_control',token:'SECRET'}}).subtype).toBe('future_control')
 expect(()=>classifyResearchEvent({type:'control_request',request:{subtype:'future_control'}})).toThrow('control_or_tool_event_denied')
})
it.each([{estimated_tokens:0,estimated_tokens_delta:0},{estimated_tokens:100,estimated_tokens_delta:10,uuid:'fixture-event',session_id:'fixture-session',user_message_uuid:'fixture-user'}])('accepts only thinking progress metadata: %j',fields=>{
 expect(classifyResearchEvent({type:'system',subtype:'thinking_tokens',...fields})).toBe('lifecycle')
})
it.each([{estimated_tokens:undefined},{estimated_tokens:-1},{estimated_tokens:1.5},{estimated_tokens:Number.MAX_SAFE_INTEGER+1},{estimated_tokens_delta:undefined},{estimated_tokens_delta:-1},{estimated_tokens_delta:101},{session_id:{}},{user_message_uuid:'x'.repeat(129)},{request:{subtype:'can_use_tool'}},{content:'PRIVATE'}])('fails closed on malformed thinking notice: %j',extra=>{
 expect(()=>classifyResearchEvent({type:'system',subtype:'thinking_tokens',estimated_tokens:100,estimated_tokens_delta:10,...extra})).toThrow('invalid_lifecycle_event')
})
