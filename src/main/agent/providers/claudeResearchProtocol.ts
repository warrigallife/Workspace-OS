/** Only explicit non-action lifecycle messages may be ignored. No event can
 * grant a tool, change a model, alter settings, retry, or authenticate here. */
const types=new Set(['system','assistant','result','keep_alive','rate_limit_event','auth_status','stream_event','user','control_request','control_response','control_cancel_request','tool_progress','tool_use_summary','update_environment_variables','session_notice','queued_notification'])
const subtypes=new Set(['init','success','error_during_execution','error_max_turns','error_max_budget_usd','error_max_structured_output_retries','status','informational','compact_boundary','notification','model_refusal_fallback','permission_retry','stop_hook_summary','hook_started','hook_progress','hook_response','task_started','task_progress','task_notification','turn_duration','initialize','can_use_tool','set_model','set_permission_mode','interrupt','mcp_message','apply_flag_settings','set_max_thinking_tokens'])
function label(value:unknown,known:Set<string>):string {
  return value===undefined?'<absent>':typeof value==='string'&&known.has(value)?value:'<redacted-unrecognized>'
}
export function protocolMetadata(event:any):{type:string;subtype:string} {
  return {type:label(event?.type,types),subtype:label(event?.subtype??event?.request?.subtype,subtypes)}
}
export type ProtocolReason = 'malformed_event'|'unsupported_event'|'unsupported_system_event'|'control_or_tool_event_denied'|'invalid_lifecycle_event'|'rate_limit_rejected'|'paid_overage_denied'|'continuation_denied'|'restrictions_mismatch'|'init_tools_invalid'|'init_tools_not_empty'|'init_mcp_invalid'|'init_mcp_not_empty'|'native_tool_action_denied'|'result_without_verified_request'|'incomplete_response'|'invalid_token_usage'|'invalid_lookup_intents'|'invalid_event_or_response_json'|'model_identity_rejected'|'response_size_limit'
export class ResearchProtocolError extends Error {
  readonly code='RESEARCH_PROTOCOL_REJECTED'
  constructor(event:unknown,reason:ProtocolReason,identityDiagnostic?:string){
    super('Claude protocol rejected: '+JSON.stringify({...protocolMetadata(event),reason})+(identityDiagnostic?' '+identityDiagnostic:''));this.name='ResearchProtocolError'
  }
}
export function classifyResearchEvent(event:any):'data'|'lifecycle' {
  const deny=(reason:ProtocolReason):never=>{throw new ResearchProtocolError(event,reason)}
  if(!event||typeof event!=='object'||Array.isArray(event))return deny('malformed_event')
  if(['assistant','result'].includes(event.type)||event.type==='system'&&event.subtype==='init')return 'data'
  if(['control_request','control_response','control_cancel_request','tool_progress','tool_use_summary','update_environment_variables'].includes(event.type))return deny('control_or_tool_event_denied')
  if(event.type==='keep_alive'){
    if(Object.keys(event).some(k=>k!=='type'))return deny('invalid_lifecycle_event')
    return 'lifecycle'
  }
  if(event.type==='rate_limit_event'){
    const info=event.rate_limit_info
    if(!info||!['allowed','allowed_warning','rejected'].includes(info.status))return deny('invalid_lifecycle_event')
    for(const key of ['isUsingOverage','overageInUse']){
      if(info[key]===true)return deny('paid_overage_denied')
      if(info[key]!==undefined&&info[key]!==false)return deny('invalid_lifecycle_event')
    }
    if(info.rateLimitType==='overage')return deny('paid_overage_denied')
    if(info.status==='rejected')return deny('rate_limit_rejected')
    return 'lifecycle'
  }
  if(event.type==='system'){
    if(event.subtype==='status'){
      if(![null,'requesting','compacting'].includes(event.status))return deny('invalid_lifecycle_event')
      return 'lifecycle'
    }
    if(event.subtype==='informational'){
      if(event.prevent_continuation===true)return deny('continuation_denied')
      if(event.tool_use_id!==undefined)return deny('control_or_tool_event_denied')
      if(!['info','notice','suggestion','warning'].includes(event.level)||typeof event.content!=='string'||event.prevent_continuation!==undefined&&event.prevent_continuation!==false)return deny('invalid_lifecycle_event')
      return 'lifecycle'
    }
    return deny('unsupported_system_event')
  }
  return deny('unsupported_event')
}
