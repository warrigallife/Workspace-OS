import { useEffect, useState } from 'react'
import type { BackgroundJob } from '../../types/workspace-api'
import styles from './LocalTeam.module.css'

export function LocalTeam(): JSX.Element {
  const [description, setDescription] = useState('Return the sum of the numbers in the input list. Return 0 for an empty list.')
  const [checks, setChecks] = useState('[{"input":[1,2,3],"expected":6},{"input":[],"expected":0},{"input":[-2,5],"expected":3}]')
  const [criteria, setCriteria] = useState('Check the function follows the task and handles empty and negative inputs.')
  const [jobs, setJobs] = useState<BackgroundJob[]>([])
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    let active = true
    window.workspace.localTeam.list().then(list => { if (active) setJobs(list) }).catch(e => setError(String(e)))
    const off = window.workspace.localTeam.onUpdated(job => setJobs(old => [job, ...old.filter(j => j.id !== job.id)]))
    return () => { active = false; off() }
  }, [])
  const start = async (): Promise<void> => {
    setSubmitting(true);setError('')
    try { await window.workspace.localTeam.enqueue({ description, cases: JSON.parse(checks), reviewCriteria: criteria }) }
    catch (e) { setError(String(e)) }
    finally { setSubmitting(false) }
  }
  const retry = async (id: string): Promise<void> => {
    try { await window.workspace.localTeam.retry(id) } catch (e) { setError(String(e)) }
  }
  return <details className={styles.panel} data-testid="local-team">
    <summary>Local Python pilot — execute, review and save</summary>
    <p>Reid → Nora → Marguerite · installed Llama 3.2 only · one task at a time.</p>
    <p>Standalone Python function pilot. Each task produces <code>solve(value)</code> in a disposable evidence folder. No project files, archive access, tools or cloud fallback. Supply your own expected results; passing them does not prove general correctness.</p>
    <label>Task<textarea aria-label="Local team task" value={description} onChange={e => setDescription(e.target.value)} maxLength={4000}/></label>
    <label>Independent checks (JSON)<textarea aria-label="Local team checks" value={checks} onChange={e => setChecks(e.target.value)} maxLength={10000}/></label>
    <label>Review criteria<textarea aria-label="Local team review criteria" value={criteria} onChange={e => setCriteria(e.target.value)} maxLength={2000}/></label>
    <button onClick={() => void start()} disabled={submitting}>Run local team</button>
    {error && <p role="alert">{error}</p>}
    {jobs.map(job => <article key={job.id} data-testid="local-team-job" data-status={job.status}>
      <strong>{job.label}</strong><p>{job.status === 'pending' ? 'Reviewed and saved — inspect result' : job.status} · {job.id}</p>
      <pre>{job.tail}</pre>
      {(job.status === 'running' || job.status === 'queued') && <button onClick={() => void window.workspace.localTeam.cancel(job.id).catch(e => setError(String(e)))}>Cancel</button>}
      {['error','interrupted','cancelled'].includes(job.status) && <button onClick={() => void retry(job.id)}>Retry as new attempt</button>}
      <button onClick={() => void window.workspace.localTeam.result(job.id).then(setResult).catch(e => setError(String(e)))}>View result and evidence</button>
    </article>)}
    {result && <pre data-testid="local-team-result">{result}</pre>}
  </details>
}
