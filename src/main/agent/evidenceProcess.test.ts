import { afterAll, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
const state = vi.hoisted(() => ({ script: '', error: null as any }))
vi.mock('child_process', async (original) => {
  const actual = await original<typeof import('child_process')>()
  return { ...actual, execFile: (file: string, args: string[], opts: any, cb: any) =>
    actual.execFile(file, [...args.slice(0, 3), state.script], { ...opts, cwd: path.dirname(state.script) }, (err, out, stderr) => {
      state.error = err; cb(err, out, stderr)
    }) }
})
import { evidenceAction } from './evidenceAction'
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ada-process-'))
afterAll(() => fs.rmSync(dir, { recursive: true, force: true }))
describe('real subprocess enforcement (isolated backend fixtures)', () => {
  it.each([
    ['missing backend', null, 'exit'],
    ['timeout', 'import time; time.sleep(30)', 'SIGKILL'],
    ['output overflow', 'import sys; sys.stdout.write("x" * 300000)', 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER'],
  ])('%s fails safely', async (_name, code, reason) => {
    state.script = path.join(dir, `${reason}.py`)
    if (code) fs.writeFileSync(state.script, code)
    const result = await evidenceAction({ question: 'governance' })
    expect(result.ok).toBe(false)
    expect(state.error).toBeTruthy()
    if (reason === 'SIGKILL') expect(state.error.signal).toBe('SIGKILL')
    if (reason.startsWith('ERR_')) expect(state.error.code).toBe(reason)
  }, 15000)
})
