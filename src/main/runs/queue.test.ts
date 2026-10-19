import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { RunQueue, type BackgroundJob, type JobSink, type QueueEvent } from './queue'

let dir: string
let file: string
beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wos-queue-'))
  file = path.join(dir, 'runs-queue.json')
})
afterEach(() => fs.rmSync(dir, { recursive: true, force: true }))

/** A launcher that hands the test the sink so it can drive the run by hand. */
function fakeLauncher() {
  const sinks = new Map<string, JobSink>()
  const killed: string[] = []
  const launch = async (job: BackgroundJob, sink: JobSink) => {
    sinks.set(job.id, sink)
    return { kill: () => killed.push(job.id) }
  }
  return { launch, sinks, killed }
}

const tick = () => new Promise((r) => setTimeout(r, 0))

describe('RunQueue', () => {
  it('runs at most `concurrency` jobs; the rest wait in order', async () => {
    const f = fakeLauncher()
    const q = new RunQueue(file, f.launch, { concurrency: 2 })
    const a = q.enqueue({ prompt: 'a' })
    const b = q.enqueue({ prompt: 'b' })
    const c = q.enqueue({ prompt: 'c' })
    await tick()
    expect(q.get(a.id)?.status).toBe('running')
    expect(q.get(b.id)?.status).toBe('running')
    expect(q.get(c.id)?.status).toBe('queued')
    f.sinks.get(a.id)!.done(0, 'cp-1')
    await tick()
    expect(q.get(a.id)).toMatchObject({ status: 'pending', code: 0, checkpointId: 'cp-1' })
    expect(q.get(c.id)?.status).toBe('running')
  })

  it('records output tail, meta and artifacts on the job; exit code decides pending vs error', async () => {
    const f = fakeLauncher()
    const events: QueueEvent[] = []
    const q = new RunQueue(file, f.launch, { onEvent: (e) => events.push(e) })
    const j = q.enqueue({ prompt: 'write the report', label: 'Weekly report', origin: 'routine', routineId: 'r1' })
    await tick()
    const s = f.sinks.get(j.id)!
    s.output('hello ')
    s.output('world')
    s.meta({ costUsd: 0.12, turns: 3 })
    s.artifacts([{ path: '/ws/out.docx', name: 'out.docx', type: 'office' }])
    s.done(1, null)
    const done = q.get(j.id)!
    expect(done).toMatchObject({ status: 'error', code: 1, costUsd: 0.12, turns: 3, tail: 'hello world', label: 'Weekly report', origin: 'routine', routineId: 'r1' })
    expect(done.artifacts[0].name).toBe('out.docx')
    expect(events.some((e) => e.type === 'opened' && e.job.id === j.id)).toBe(true)
    expect(events.filter((e) => e.type === 'output').map((e) => e.text)).toEqual(['hello ', 'world'])
  })

  it('a launcher that throws lands the job as error, not as a stuck running job', async () => {
    const q = new RunQueue(file, async () => { throw new Error('no claude binary') })
    const j = q.enqueue({ prompt: 'x' })
    await tick()
    expect(q.get(j.id)).toMatchObject({ status: 'error', code: null })
    expect(q.get(j.id)!.tail).toContain('no claude binary')
  })

  it('cancel: a queued job is cancelled; a running one is killed and stays cancelled after done()', async () => {
    const f = fakeLauncher()
    const q = new RunQueue(file, f.launch, { concurrency: 1 })
    const a = q.enqueue({ prompt: 'a' })
    const b = q.enqueue({ prompt: 'b' })
    await tick()
    expect(q.cancel(b.id)).toBe(true)
    expect(q.get(b.id)?.status).toBe('cancelled')
    expect(q.cancel(a.id)).toBe(true)
    expect(f.killed).toEqual([a.id])
    f.sinks.get(a.id)!.done(143, null)
    expect(q.get(a.id)?.status).toBe('cancelled')
    expect(q.cancel(a.id)).toBe(false)
  })

  it('persists, and a run in flight at load is marked interrupted', async () => {
    const f = fakeLauncher()
    const q = new RunQueue(file, f.launch)
    const j = q.enqueue({ prompt: 'long task' })
    await tick()
    expect(q.get(j.id)?.status).toBe('running')
    q.flush()
    const again = new RunQueue(file, f.launch)
    expect(again.get(j.id)).toMatchObject({ status: 'interrupted', prompt: 'long task' })
    expect(again.get(j.id)!.finishedAt).not.toBeNull()
  })

  it('shutdown kills what is running, marks it interrupted and writes now', async () => {
    const f = fakeLauncher()
    const q = new RunQueue(file, f.launch)
    const j = q.enqueue({ prompt: 'x' })
    await tick()
    q.shutdown()
    expect(f.killed).toEqual([j.id])
    const onDisk = JSON.parse(fs.readFileSync(file, 'utf-8')) as BackgroundJob[]
    expect(onDisk[0]).toMatchObject({ id: j.id, status: 'interrupted' })
  })

  it('a corrupt file loads as an empty queue', () => {
    fs.writeFileSync(file, '{not json')
    expect(new RunQueue(file, fakeLauncher().launch).list()).toEqual([])
  })
})

describe('local team restart and shutdown', () => {
  it('marks running and queued local attempts interrupted, without executing on read', async () => {
    const f = fakeLauncher()
    const q = new RunQueue(file, f.launch, { concurrency: 1 })
    const localTeam = { task: { description: 'sum', cases: [{ input:[1], expected:1 }], reviewCriteria:'' } }
    const a = q.enqueue({ prompt:'sum', localTeam })
    const b = q.enqueue({ prompt:'sum', localTeam })
    await tick();q.flush()
    const recovered = new RunQueue(file, async () => { throw new Error('must not auto-start') })
    expect(recovered.get(a.id)?.status).toBe('interrupted')
    expect(recovered.get(b.id)?.status).toBe('interrupted')
    q.shutdown()
  })
  it('late child completion cannot overwrite interrupted state or start queued work', async () => {
    const f = fakeLauncher()
    const q = new RunQueue(file, f.launch, { concurrency:1 })
    const a = q.enqueue({prompt:'a'});const b = q.enqueue({prompt:'b'})
    await tick();q.shutdown();f.sinks.get(a.id)!.done(0,'cp')
    await tick()
    expect(q.get(a.id)?.status).toBe('interrupted')
    expect(f.sinks.has(b.id)).toBe(false)
  })
})

it('refuses to overwrite a corrupt strict local queue', () => {
  fs.writeFileSync(file, '{broken')
  expect(() => new RunQueue(file, fakeLauncher().launch, { strictPersistence:true })).toThrow(/cannot be read/)
  expect(fs.readFileSync(file,'utf8')).toBe('{broken')
})
