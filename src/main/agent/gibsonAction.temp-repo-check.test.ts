/**
 * NOT part of the fast suite — run explicitly:
 *   npx vitest run src/main/agent/gibsonAction.temp-repo-check.test.ts
 *
 * This is the "temporary-repository, no-model execution check": it actually
 * runs Gibson's real scripts/loop.sh --print-prompt against a disposable,
 * throwaway git repo (never a real project), and then actually runs the real
 * launchRun() against that same repo with CLAUDE_BIN pointed at a fake stub
 * binary that never calls any model or network API. Nothing here invokes a
 * real model. Depends on the local Gibson checkout actually being present at
 * the fixed collection path, and may depend on network/`gh` behavior inside
 * loop.sh's own render_prompt — that dependency is exactly what this check
 * is for, and is reported, not assumed.
 */
import { describe, it, expect, vi } from 'vitest'
import { execFileSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

vi.mock('electron', () => ({
  app: { getPath: () => fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'wos-userdata-')) },
  BrowserWindow: { getFocusedWindow: () => null, getAllWindows: () => [] },
}))

const GIBSON_DIR = path.join(os.homedir(), 'Desktop', 'AI-Agent-Resources', 'the-gibson')
const LOOP_SCRIPT = path.join(GIBSON_DIR, 'scripts', 'loop.sh')
const haveGibson = fs.existsSync(LOOP_SCRIPT)

function makeTempRepo(): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'gibson-check-')))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 'Gibson Check'], { cwd: dir })
  fs.writeFileSync(path.join(dir, 'README.md'), '# disposable check repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir })
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir })
  return dir
}

function makeFakeClaudeBin(): string {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'fake-claude-'))
  const bin = path.join(dir, 'claude')
  // Drains stdin (the prompt, never logged) and prints one minimal, valid
  // stream-json result line. No model, no network call, ignores every flag.
  fs.writeFileSync(
    bin,
    '#!/bin/bash\ncat > /dev/null\necho \'{"type":"result","subtype":"success","is_error":false,"num_turns":1,"duration_ms":10,"total_cost_usd":0.0001,"session_id":"00000000-0000-4000-8000-000000000000"}\'\nexit 0\n',
  )
  fs.chmodSync(bin, 0o755)
  return bin
}

describe.skipIf(!haveGibson)('temp-repo check: PLAN stage against real loop.sh (no runner invoked)', () => {
  it('either renders a real prompt, or fails with a specific, reportable reason — never invokes a runner', async () => {
    const { gibsonAction } = await import('./gibsonAction')
    const repo = makeTempRepo()
    const reply = await gibsonAction(repo, { runner: 'claude', repoSlug: 'local/temp-check', runnerTimeoutSec: 30, planOnly: true })
    // eslint-disable-next-line no-console
    console.log('[gibson temp-repo check] PLAN reply:', JSON.stringify(reply, null, 2).slice(0, 2000))
    if (reply.ok) {
      expect(reply.result).toMatchObject({ stage: 'plan' })
      expect(typeof (reply.result as { prompt: string }).prompt).toBe('string')
      // Confirms gibson/loop-state.md self-initialized in the disposable repo.
      expect(fs.existsSync(path.join(repo, 'gibson', 'loop-state.md'))).toBe(true)
    } else {
      // A specific, informative failure (e.g. missing `gh`, no network) is an
      // acceptable, reportable outcome of this check — an uncaught exception
      // or a hang is not. Either way nothing here ever reaches a runner.
      expect(typeof reply.error).toBe('string')
    }
    fs.rmSync(repo, { recursive: true, force: true })
  }, 45_000)
})

describe('temp-repo check: EXECUTE stage via the real launchRun(), fake CLAUDE_BIN (no model)', () => {
  it('runs a real prompt through the real Workspace launcher end to end with zero model calls', async () => {
    const repo = makeTempRepo()
    const fakeBin = makeFakeClaudeBin()
    const prevBin = process.env['CLAUDE_BIN']
    process.env['CLAUDE_BIN'] = fakeBin
    try {
      vi.resetModules() // launchRun.ts caches the resolved binary at module scope
      const { launchRun } = await import('./launchRun')
      const chunks: string[] = []
      let meta: unknown
      let doneArgs: [number, string | null] | undefined
      const done = new Promise<void>((resolve) => {
        launchRun({
          runId: 'gibson-check-' + Date.now(),
          prompt: 'say hello',
          contextFiles: [],
          activeFile: null,
          safeMode: true,
          agent: null,
          maxBudgetUsd: 1,
          capabilities: 'all',
          sink: {
            output: (t: string) => chunks.push(t),
            meta: (m: unknown) => { meta = m },
            activity: () => {},
            artifacts: () => {},
            artifact: () => {},
            done: (code: number, checkpointId: string | null) => { doneArgs = [code, checkpointId]; resolve() },
          },
        }).then(async ({ child }) => {
          // getWorkspaceRoot() (not overridden here) decides cwd for the real
          // launchRun path; this check only needs the child process itself to
          // run the fake binary to completion, which it will regardless.
          void child
        }).catch(resolve)
      })
      await done
      // eslint-disable-next-line no-console
      console.log('[gibson temp-repo check] EXECUTE done:', doneArgs, 'meta:', meta, 'output:', chunks.join('').slice(0, 500))
      expect(doneArgs?.[0]).toBe(0)
      expect(meta).toMatchObject({ costUsd: 0.0001, turns: 1 })
    } finally {
      if (prevBin === undefined) delete process.env['CLAUDE_BIN']
      else process.env['CLAUDE_BIN'] = prevBin
      fs.rmSync(repo, { recursive: true, force: true })
    }
  }, 30_000)
})
