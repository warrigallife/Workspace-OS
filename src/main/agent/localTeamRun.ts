import { app } from 'electron'
import { spawn, type ChildProcess } from 'child_process'
import fs from 'fs'
import { createHash } from 'crypto'
import path from 'path'
import { CheckpointStore } from '../checkpoint'
import { readAgentForRun } from '../handlers/agents'
import { validateLocalTask } from '../runs/localTeamTask'
import type { LaunchRunOptions } from './launchRun'

export const TEAM_PROFILES = {
  specialist: 'Reid — Warrigal Suite Keeper',
  reviewer: 'Nora — Workspace Auditor',
  continuity: 'Marguerite — Continuity Keeper',
} as const

/** Fixed environment: no inherited provider keys, proxy, MCP, bridge token or socket. */
export function localEnvironment(home: string): NodeJS.ProcessEnv {
  return { PATH: '/opt/homebrew/bin:/usr/bin:/bin', HOME: home, LANG: 'en_US.UTF-8', PYTHONDONTWRITEBYTECODE: '1' }
}
export function terminateLocalGroup(child: ChildProcess): void {
  if (!child.pid) return
  try { process.kill(-child.pid, 'SIGTERM') } catch { /* already ended */ }
  const timer = setTimeout(() => { try { process.kill(-child.pid!, 'SIGKILL') } catch { /* ended */ } }, 1500)
  timer.unref()
}

/** This path runs before the normal launcher can read secrets, memory or cloud settings. */
export async function launchLocalTeam(o: LaunchRunOptions): Promise<{ child: ChildProcess; checkpointId: string | null }> {
  const config = o.localTeam!
  const task = validateLocalTask(config.task)
  if (!/^bg-[a-z0-9-]{3,40}$/.test(o.runId)) throw new Error('Invalid local run ID')
  const directory = path.join(app.getPath('userData'), 'local-team', o.runId)
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 })
  const inputPath = path.join(directory, 'input.json')
  if (fs.existsSync(inputPath)) throw new Error('Attempt already exists; use retry to preserve evidence')
  const profiles: Record<string, unknown> = {}
  for (const [role, name] of Object.entries(TEAM_PROFILES)) {
    const profile = readAgentForRun(name)
    if (!profile || profile.name !== name) throw new Error(`Required existing profile missing: ${name}`)
    if (profile.persona.length > 10000) throw new Error('Profile exceeds bounded context')
    profiles[role] = profile
  }
  const input = { task, profiles, recoveredFrom: config.recoveredFrom ?? null }
  fs.writeFileSync(inputPath, JSON.stringify(input, null, 2), { mode: 0o600 })
  const cp = new CheckpointStore(() => directory)
  const initial = await cp.createCheckpoint('Local team: immutable task and profile snapshots')
  const script = path.join(app.getAppPath(), 'scripts/local-team/run.py')
  const child = spawn('/Library/Frameworks/Python.framework/Versions/3.14/bin/python3', ['-I', '-B', script], {
    cwd: directory, env: localEnvironment(directory), detached: true, stdio: ['pipe', 'pipe', 'pipe'],
  })
  const startedAt = Date.now()
  let settled = false
  let output = ''
  const send = (chunk: Buffer): void => {
    const text = chunk.toString('utf8'); output = (output + text).slice(-16000); o.sink.output(text)
  }
  child.stdout?.on('data', send)
  child.stderr?.on('data', send)
  child.stdin?.on('error', () => {})
  child.stdin?.write(JSON.stringify(input)+'\n')
  const timeout = setTimeout(() => terminateLocalGroup(child), 6 * 60_000)
  const abort = (): void => terminateLocalGroup(child)
  o.signal?.addEventListener('abort', abort, { once: true })
  if (o.signal?.aborted) abort()
  const finish = async (code: number | null): Promise<void> => {
    if (settled) return
    settled = true; clearTimeout(timeout); o.signal?.removeEventListener('abort', abort)
    fs.writeFileSync(path.join(directory, 'launcher.log'), output, { mode: 0o600 })
    let successful = false
    try {
      const state = JSON.parse(fs.readFileSync(path.join(directory, 'state.json'), 'utf8'))
      const read = (name: string): any => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'))
      const execution = read('execution.json'), review = read('review.json')
      successful = code === 0 && state.status === 'completed' && review.decision === 'approve' &&
        execution.passed === true && execution.checks?.length === task.cases.length && execution.checks.every((c: any) => c.passed === true && c.exit_code === 0) &&
        ['candidate.py','execution.json','review.json','handover.md'].every(name =>
          state.evidence?.[name] === createHash('sha256').update(fs.readFileSync(path.join(directory, name))).digest('hex'))
    } catch { /* failure stays explicit */ }
    let checkpointId = initial.id
    try { checkpointId = (await cp.createCheckpoint('Local team: execution, review and handover evidence')).id }
    catch { successful = false; o.sink.output('FAILED: final evidence checkpoint could not be saved\n') }
    const artifacts = ['handover.md', 'candidate.py', 'execution.json', 'review.json', 'state.json']
      .map(name => ({ path: path.join(directory, name), name, type: 'other' as const }))
      .filter(a => fs.existsSync(a.path))
    o.sink.artifacts(artifacts)
    o.sink.meta({ costUsd: 0, costKnown: true, turns: ['specialist','review','handover'].filter(s => fs.existsSync(path.join(directory, s+'.raw.json'))).length, durationMs: Date.now()-startedAt })
    o.sink.output(`Evidence: ${directory}\nCheckpoint: ${checkpointId}\n`)
    o.sink.done(successful ? 0 : 1, checkpointId)
  }
  child.on('error', () => { o.sink.output('FAILED: local worker could not start\n'); void finish(1) })
  child.on('close', code => void finish(code))
  return { child, checkpointId: initial.id }
}
