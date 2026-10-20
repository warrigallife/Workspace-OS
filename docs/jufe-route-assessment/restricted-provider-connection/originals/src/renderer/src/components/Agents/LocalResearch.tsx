import { useEffect, useState } from 'react'
import type { BackgroundJob } from '../../types/workspace-api'
import styles from './LocalTeam.module.css'
export function LocalResearch():JSX.Element {
  const [jobs,setJobs]=useState<BackgroundJob[]>([]),[result,setResult]=useState(''),[error,setError]=useState('')
  useEffect(()=>{
    window.workspace.runs.list().then(setJobs).catch(e=>setError(String(e)))
    return window.workspace.runs.onUpdated(job=>setJobs(old=>[job,...old.filter(j=>j.id!==job.id)]))
  },[])
  const start=async(id?:string):Promise<void>=>{try{setError('');await window.workspace.research.enqueue(id)}catch(e){setError(String(e))}}
  return <details className={styles.panel} data-testid="local-research">
    <summary>JUFE local research — Dana → Nora</summary>
    <p>Report outstanding work recorded in the two approved JUFE coverage reports dated 11 October 2026. Local Llama 3.2 only; cited findings, separate review and saved handover. Original records remain read-only.</p>
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
