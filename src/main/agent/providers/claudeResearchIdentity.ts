/** A full approved ID is not a family alias. No guessed date/suffix mappings.
 * Synthetic host messages are not model replies and can never satisfy identity. */
export type IdentityPhase = 'init'|'assistant'|'result-modelUsage'
const printableId=/^(?:claude-(?:sonnet|opus|haiku|fable)-[0-9][a-z0-9.-]{0,60}(?:\[1m\])?|sonnet|opus|haiku|fable|opusplan|best|<synthetic>)$/
export function sanitizedModelId(value:unknown):string {
  if(value===undefined)return '<missing>'
  return typeof value==='string'&&printableId.test(value)?value:'<redacted-invalid-model-id>'
}
export class ResearchIdentityError extends Error {
  readonly code='RESEARCH_MODEL_IDENTITY_REJECTED'
  constructor(phase:IdentityPhase,requested:string,returned:unknown[],kind='identity-mismatch',status?:unknown){
    // Never include response text, arbitrary error strings, account data or credentials.
    const diagnostic={phase,kind,requested:sanitizedModelId(requested),returned:returned.slice(0,8).map(sanitizedModelId),truncated:returned.length>8,
      ...(Number.isInteger(status)&&Number(status)>=100&&Number(status)<=599?{httpStatus:status}:{})}
    super('Claude response rejected: '+JSON.stringify(diagnostic));this.name='ResearchIdentityError'
  }
}
export function requireResearchModel(phase:IdentityPhase,requested:string,returned:unknown):void {
  if(returned!==requested)throw new ResearchIdentityError(phase,requested,[returned])
}
export function checkResearchAssistant(requested:string,event:any):void {
  const returned=event.message?.model
  if(event.is_api_error_message===true||event.isApiErrorMessage===true||returned==='<synthetic>'){
    throw new ResearchIdentityError('assistant',requested,[returned],event.is_api_error_message===true||event.isApiErrorMessage===true?'host-api-error':'host-synthetic-message',event.api_error_status)
  }
  requireResearchModel('assistant',requested,returned)
}
