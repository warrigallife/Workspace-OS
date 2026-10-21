import { LOCAL_RESEARCH_ROUTES, type ResearchRoutes, type ResearchRole, type ResearchRoute } from '../../../../shared/researchRoutes'
import { useEffect, useState } from 'react'
import type { BackgroundJob } from '../../types/workspace-api'
import styles from './LocalTeam.module.css'
export function LocalResearch():JSX.Element {
  const [routes,setRoutes]=useState<ResearchRoutes>(LOCAL_RESEARCH_ROUTES)
  const change=(role:ResearchRole,route:ResearchRoute):void=>setRoutes(old=>({...old,[role]:route}))
  const [jobs,setJobs]=useState<BackgroundJob[]>([]),[result,setResult]=useState(''),[error,setError]=useState('')
  useEffect(()=>{
    window.workspace.runs.list().then(setJobs).catch(e=>setError(String(e)))
    return window.workspace.runs.onUpdated(job=>setJobs(old=>[job,...old.filter(j=>j.id!==job.id)]))
  },[])
  const start=async(id?:string):Promise<void>=>{try{setError('');await window.workspace.research.enqueue(id,id?undefined:routes)}catch(e){setError(String(e))}}
  return <details className={styles.panel} data-testid="local-research">
    <summary>JUFE research — Dana → Nora</summary>
    <p>Report outstanding work recorded in the two approved JUFE coverage reports dated 11 October 2026. Select each role’s provider and exact model for this run. Cited findings require a separate review and saved handover. Original records remain read-only.</p>
    <p>Ollama uses installed local models only; the existing Llama 3.2 is not research-qualified. Claude requires separate live approval, Pro authentication and credits off; cloud execution remains blocked. Selection does not establish model availability or research suitability.</p>
    {(['dana','nora'] as const).map(role=><fieldset key={role}><legend>{role==='dana'?'Dana — specialist':'Nora — reviewer'}</legend>
      <label>Provider <select aria-label={`${role} provider`} value={routes[role].provider} onChange={e=>change(role,{provider:e.target.value as ResearchRoute['provider'],model:e.target.value==='claude'?'claude-sonnet-5':'llama3.2:latest'})}><option value="ollama-local">Ollama (local)</option><option value="claude">Claude (cloud; blocked)</option></select></label>
      <label>Exact model <input aria-label={`${role} model`} value={routes[role].model} maxLength={100} onChange={e=>change(role,{...routes[role],model:e.target.value})}/></label>
    </fieldset>)}
    <button onClick={()=>void start()} disabled={jobs.some(j=>j.label.startsWith('JUFE local research:')&&['queued','running'].includes(j.status))}>Run approved JUFE research</button>
    {error&&<p role="alert">{error}</p>}
    {jobs.filter(j=>j.label.startsWith('JUFE local research:')).map(job=><article key={job.id} data-testid="research-job">
      <strong>{job.status==='pending'?'Reviewed and saved':job.status}</strong><p>{job.id}</p><pre>{job.tail}</pre>
      {['queued','running'].includes(job.status)&&<button onClick={()=>void window.workspace.runs.cancel(job.id)}>Cancel research</button>}
      {['error','interrupted','cancelled'].includes(job.status)&&<button onClick={()=>void start(job.id)}>Retry research as new run</button>}
      <button onClick={()=>void window.workspace.research.result(job.id).then(setResult).catch(e=>setError(String(e)))}>View research report and handover</button>
    </article>)}
    {result&&<pre data-testid="research-result">{result}</pre>}
  </details>
}
