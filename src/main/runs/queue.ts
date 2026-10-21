import { selectedResearchRoutes, type ResearchOptions } from '../agent/researchProvider'
import type { LocalTeamOptions } from './localTeamTask'
import fs from 'fs'
import path from 'path'

/**
 * BACKGROUND RUNS — runs that belong to the app, not to a window.
 *
 * A dock run is owned by its tab: the renderer opens it in the review store
 * and patches it as events arrive. Close the window and nobody is listening.
 * A routine (M3) has no tab, and unattended work must survive the window
 * going away. So the queue lives in main: it launches, records every event on
 * the job itself, persists the record, and forwards the same events to the
 * window whenever one is there.
 *
 * Two rules:
 *  - CONCURRENCY IS SMALL. Two at once; the rest wait. An unattended agent
 *    that fans out into ten is a bill nobody approved.
 *  - A RUN IN FLIGHT AT QUIT IS "INTERRUPTED", NOT LOST. On load, anything
 *    still marked running becomes interrupted, so the feed can say so.
 *
 * The launcher is injected, so the queue is unit-tested with a fake one and
 * never spawns a process in tests.
 */

export type JobStatus = 'queued' | 'running' | 'pending' | 'error' | 'interrupted' | 'cancelled'
export type JobOrigin = 'routine' | 'background'

export interface JobArtifact {
  path: string
  name: string
  type: string
}

export interface BackgroundJob {
  research?: ResearchOptions
  localTeam?: LocalTeamOptions
  id: string
  /** A short human label — "Morning sift", or the prompt's first line. */
  label: string
  prompt: string
  agentName: string | null
  origin: JobOrigin
  /** The routine that enqueued it, when one did. */
  routineId?: string
  contextFiles: string[]
  /** What the run may reach through wos-action (capability ids). Empty = nothing. */
  capabilities: string[]
  /** The workspace root the run belonged to; null = none open. */
  root: string | null
  status: JobStatus
  enqueuedAt: number
  startedAt: number | null
  finishedAt: number | null
  code: number | null
  checkpointId: string | null
  costUsd: number
  provider?: string
  costKnown?: boolean
  inputTokens?: number
  outputTokens?: number
  cachedInputTokens?: number
  turns: number
  artifacts: JobArtifact[]
  /** The last few KB of output, for the card and for debugging a silent run. */
  tail: string
}

export interface JobInput {
  research?: ResearchOptions
  localTeam?: LocalTeamOptions
  prompt: string
  label?: string
  agentName?: string | null
  origin?: JobOrigin
  routineId?: string
  contextFiles?: string[]
  capabilities?: string[]
  root?: string | null
}

/** What the launcher reports back. Mirrors the agent RunSink, minus session ids. */
export interface JobSink {
  output(text: string): void
  meta(meta: { costUsd: number; turns: number; provider?: string; costKnown?: boolean; inputTokens?: number; outputTokens?: number; cachedInputTokens?: number }): void
  artifacts(list: JobArtifact[]): void
  done(code: number, checkpointId: string | null): void
}

/** Starts a job; resolves once the child exists. `kill` ends it early. */
export type JobLauncher = (job: BackgroundJob, sink: JobSink) => Promise<{ kill: () => void }>

export type QueueEvent = { type: 'opened' | 'updated' | 'output'; job: BackgroundJob; text?: string }

const TAIL_MAX = 4000
const KEEP_MAX = 100

export class RunQueue {
  private stopping = false
  private jobs: BackgroundJob[] = []
  private live = new Map<string, { kill: () => void }>()
  private readonly concurrency: number
  private readonly now: () => number
  private saveTimer: ReturnType<typeof setTimeout> | null = null

  constructor(
    private readonly file: string,
    private readonly launch: JobLauncher,
    private readonly opts: { concurrency?: number; strictPersistence?: boolean; onEvent?: (ev: QueueEvent) => void; now?: () => number } = {},
  ) {
    this.concurrency = Math.max(1, opts.concurrency ?? 2)
    this.now = opts.now ?? Date.now
    this.load()
  }

  /** Reads the persisted list; anything still "running" was interrupted by a quit. */
  private load(): void {
    try {
      const parsed = JSON.parse(fs.readFileSync(this.file, 'utf-8')) as unknown
      if (!Array.isArray(parsed)) { if (this.opts.strictPersistence) throw new Error('Invalid queue file'); return }
      this.jobs = parsed
        .filter((j): j is BackgroundJob => typeof (j as BackgroundJob)?.id === 'string' && typeof (j as BackgroundJob)?.prompt === 'string')
        .map((j) => ((j.status === 'running' || ((j.localTeam || j.research) && j.status === 'queued')) ? { ...j, status: 'interrupted' as const, finishedAt: j.finishedAt ?? this.now() } : j))
    } catch {
      if (this.opts.strictPersistence && fs.existsSync(this.file)) throw new Error('Local queue cannot be read; preserve the file and recover it before running')
      this.jobs = []
    }
  }

  private save(): void {
    if (this.saveTimer) return
    this.saveTimer = setTimeout(() => {
      this.saveTimer = null
      this.flush()
    }, 150)
  }

  /** Writes now. Called on shutdown so an interrupted mark hits disk. */
  flush(required = false): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
    try {
      fs.mkdirSync(path.dirname(this.file), { recursive: true })
      fs.writeFileSync(this.file + '.tmp', JSON.stringify(this.jobs.slice(0, KEEP_MAX), null, 2), { encoding: 'utf-8', mode: 0o600 })
      fs.renameSync(this.file + '.tmp', this.file)
    } catch {
      if (required) throw new Error('Could not persist local queue; execution withheld')
      /* best-effort — the in-memory list is still authoritative for this session */
    }
  }

  private emit(type: QueueEvent['type'], job: BackgroundJob, text?: string): void {
    this.opts.onEvent?.({ type, job, text })
  }

  list(): BackgroundJob[] {
    return this.jobs.slice()
  }

  get(id: string): BackgroundJob | undefined {
    return this.jobs.find((j) => j.id === id)
  }

  /** Enqueue and start pumping. Returns the job as recorded. */
  enqueue(input: JobInput): BackgroundJob {
    const prompt = input.prompt.trim()
    const job: BackgroundJob = {
      id: `bg-${this.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      label: (input.label ?? prompt.split('\n')[0]).trim().slice(0, 80) || 'Background run',
      prompt,
      ...(input.research ? {research:{...input.research,routes:selectedResearchRoutes(input.research)}} : {}),
      ...(input.localTeam ? { localTeam: input.localTeam } : {}),
      agentName: input.agentName ?? null,
      origin: input.origin ?? 'background',
      contextFiles: input.contextFiles ?? [],
      capabilities: input.capabilities ?? [],
      root: input.root ?? null,
      status: 'queued',
      enqueuedAt: this.now(),
      startedAt: null,
      finishedAt: null,
      code: null,
      checkpointId: null,
      costUsd: 0,
      turns: 0,
      artifacts: [],
      tail: '',
    }
    if (input.routineId) job.routineId = input.routineId
    this.jobs = [job, ...this.jobs].slice(0, KEEP_MAX)
    this.save()
    this.emit('updated', job)
    if (input.localTeam || input.research) this.flush(true)
    void this.pump()
    return job
  }

  /** Ends a queued or running job. */
  cancel(id: string): boolean {
    const job = this.get(id)
    if (!job) return false
    if (job.status === 'queued') {
      this.patch(id, { status: 'cancelled', finishedAt: this.now() })
      return true
    }
    if (job.status === 'running') {
      this.live.get(id)?.kill()
      // The launcher's done() will land; mark now so a second cancel is a no-op.
      this.patch(id, { status: 'cancelled', finishedAt: this.now() })
      return true
    }
    return false
  }

  private patch(id: string, patch: Partial<BackgroundJob>): BackgroundJob | undefined {
    let out: BackgroundJob | undefined
    this.jobs = this.jobs.map((j) => {
      if (j.id !== id) return j
      out = { ...j, ...patch }
      return out
    })
    if (out) {
      this.save()
      this.emit('updated', out)
    }
    return out
  }

  private runningCount(): number {
    return this.jobs.filter((j) => j.status === 'running').length
  }

  /** Starts queued jobs while there is room. Never throws. */
  private async pump(): Promise<void> {
    while (!this.stopping && this.runningCount() < this.concurrency) {
      const next = [...this.jobs].reverse().find((j) => j.status === 'queued')
      if (!next) return
      const started = this.patch(next.id, { status: 'running', startedAt: this.now() })
      if (!started) return
      this.emit('opened', started)
      try {
        if (started.localTeam || started.research) this.flush(true)
        const handle = await this.launch(started, this.sinkFor(started.id))
        if (this.get(started.id)?.status === 'running') this.live.set(started.id, handle)
        else handle.kill()
      } catch (err) {
        this.finish(started.id, null, null, `\n[error] ${(err as Error).message}\n`)
      }
    }
  }

  private sinkFor(id: string): JobSink {
    return {
      output: (text) => {
        const job = this.get(id)
        if (!job || !text) return
        const tail = (job.tail + text).slice(-TAIL_MAX)
        this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, tail } : j))
        this.save()
        this.emit('output', this.get(id)!, text)
      },
      meta: (m) => void this.patch(id, m),
      artifacts: (list) => void this.patch(id, { artifacts: list }),
      done: (code, checkpointId) => this.finish(id, code, checkpointId),
    }
  }

  private finish(id: string, code: number | null, checkpointId: string | null, note = ''): void {
    this.live.delete(id)
    const job = this.get(id)
    if (!job || this.stopping || job.status === 'interrupted') return
    // A cancelled job keeps its status; everything else lands by exit code.
    const status: JobStatus = job.status === 'cancelled' ? 'cancelled' : code === 0 ? 'pending' : 'error'
    this.patch(id, {
      status,
      code,
      checkpointId: checkpointId ?? job.checkpointId,
      finishedAt: this.now(),
      tail: (job.tail + note).slice(-TAIL_MAX),
    })
    void this.pump()
  }

  /** App quit: end what is running, mark it interrupted, write to disk now. */
  shutdown(): void {
    this.stopping = true
    this.jobs = this.jobs.map(j => j.status === 'running' ? { ...j, status: 'interrupted', finishedAt: this.now() } : j)
    for (const [id, h] of this.live) {
      try {
        h.kill()
      } catch {
        /* already gone */
      }
      this.jobs = this.jobs.map((j) => (j.id === id ? { ...j, status: 'interrupted', finishedAt: this.now() } : j))
    }
    this.live.clear()
    this.flush()
  }
}
