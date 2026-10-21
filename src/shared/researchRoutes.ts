/** Research-only selections. No global profile or normal agent routing changes. */
export type ResearchRole = 'dana'|'nora'
export type ResearchRoute = Readonly<{provider:'claude'|'ollama-local';model:string}>
export type ResearchRoutes = Readonly<Record<ResearchRole,ResearchRoute>>
export const LOCAL_RESEARCH_ROUTES:ResearchRoutes=Object.freeze({
 dana:Object.freeze({provider:'ollama-local',model:'llama3.2:latest'}),
 nora:Object.freeze({provider:'ollama-local',model:'llama3.2:latest'}),
})
export const LEGACY_CLAUDE_ROUTES:ResearchRoutes=Object.freeze({
 dana:Object.freeze({provider:'claude',model:'claude-sonnet-5'}),
 nora:Object.freeze({provider:'claude',model:'claude-sonnet-5'}),
})
export function snapshotResearchRoutes(value:unknown):ResearchRoutes {
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join()!=='dana,nora')throw new Error('Select exactly Dana and Nora research routes')
 const route=(role:ResearchRole):ResearchRoute=>{
  const r=(value as any)[role]
  if(!r||typeof r!=='object'||Array.isArray(r)||Object.keys(r).sort().join()!=='model,provider')throw new Error('Route requires only provider and model')
  if(!['claude','ollama-local'].includes(r.provider)||typeof r.model!=='string'||r.model.length>100)throw new Error('Unsupported research provider/model')
  // Full Claude identifiers only: aliases cannot silently move between models.
  if(r.provider==='claude'?!/^claude-(?:sonnet|opus|haiku|fable)-[0-9][a-z0-9.-]*$/.test(r.model):!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*:[a-zA-Z0-9._-]+$/.test(r.model))throw new Error('Use an exact Claude model ID or explicit installed Ollama name:tag')
  return Object.freeze({provider:r.provider,model:r.model})
 }
 return Object.freeze({dana:route('dana'),nora:route('nora')})
}
export function hasCloudRoute(routes:ResearchRoutes):boolean {return Object.values(routes).some(r=>r.provider==='claude')}
