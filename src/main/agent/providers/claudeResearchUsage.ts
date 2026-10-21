import {sanitizedModelId} from './claudeResearchIdentity'
export interface ModelUsage {
 model:string; attribution:'selected answer model'|'additional aggregate usage; purpose unattributed'
 inputTokens:number;outputTokens:number;cacheReadInputTokens:number;cacheCreationInputTokens:number;costUSD:number
}
export interface UsageSnapshot {basis:'cumulative per session';models:ModelUsage[];inputTokens:number;outputTokens:number;costUSD:number}
/** modelUsage includes query-pipeline internal calls. It does not identify their
 * purpose. Track monotonic cumulative totals, emit deltas for the run budget. */
export class ClaudeUsageTracker {
 private previous=new Map<string,ModelUsage>()
 private total={inputTokens:0,outputTokens:0,costUSD:0}
 constructor(private selected:string){}
 accept(value:unknown):{snapshot:UsageSnapshot;inputTokens:number;outputTokens:number} {
  const invalid=():never=>{throw new Error('Invalid required aggregate usage accounting')}
  if(!value||typeof value!=='object'||Array.isArray(value))return invalid()
  const entries=Object.entries(value)
  if(!entries.length||entries.length>16||!Object.hasOwn(value,this.selected))return invalid()
  const next=new Map<string,ModelUsage>()
  for(const [id,u] of entries){
   if(id.length>128||!u||typeof u!=='object'||Array.isArray(u))return invalid()
   const v=u as any
   for(const k of ['inputTokens','outputTokens','cacheReadInputTokens','cacheCreationInputTokens'])if(!Number.isSafeInteger(v[k])||v[k]<0)return invalid()
   if(typeof v.costUSD!=='number'||!Number.isFinite(v.costUSD)||v.costUSD<0)return invalid()
   const previous=this.previous.get(id)
   if(previous&&(['inputTokens','outputTokens','cacheReadInputTokens','cacheCreationInputTokens','costUSD'] as const).some(k=>v[k]<previous[k]))return invalid()
   next.set(id,{model:sanitizedModelId(id),attribution:id===this.selected?'selected answer model':'additional aggregate usage; purpose unattributed',inputTokens:v.inputTokens,outputTokens:v.outputTokens,cacheReadInputTokens:v.cacheReadInputTokens,cacheCreationInputTokens:v.cacheCreationInputTokens,costUSD:v.costUSD})
  }
  for(const id of this.previous.keys())if(!next.has(id))return invalid()
  const models=[...next.values()]
  const inputTokens=models.reduce((n,u)=>n+u.inputTokens+u.cacheReadInputTokens+u.cacheCreationInputTokens,0),outputTokens=models.reduce((n,u)=>n+u.outputTokens,0),costUSD=models.reduce((n,u)=>n+u.costUSD,0)
  if(!Number.isSafeInteger(inputTokens)||!Number.isSafeInteger(outputTokens)||!Number.isFinite(costUSD))return invalid()
  const delta={inputTokens:inputTokens-this.total.inputTokens,outputTokens:outputTokens-this.total.outputTokens}
  this.previous=next;this.total={inputTokens,outputTokens,costUSD}
  return {...delta,snapshot:{basis:'cumulative per session',models,inputTokens,outputTokens,costUSD}}
 }
}
