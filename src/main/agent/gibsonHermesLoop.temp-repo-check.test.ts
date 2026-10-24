/**
 * NOT part of the fast suite — run explicitly:
 *   npx vitest run src/main/agent/gibsonHermesLoop.temp-repo-check.test.ts
 *
 * Exercises the PRODUCTION gibson.run loop mode (gibsonAction.ts's `loop:
 * true` branch) end to end against real, disposable repos: real loop.sh,
 * multiple real iterations, the real HERMES_CMD socket bridge
 * (gibsonHermesSocketClient.cjs), and the real launchRun(). Only the model
 * itself is stubbed (CLAUDE_BIN) — zero live inference anywhere. Commits,
 * merges, pushes, and deployment are never exercised — the release hat is
 * refused before any runner call, by design (see gibsonAction.ts).
 *
 * Same-workspace case only: setWorkspaceRoot(repo) is applied to this test
 * process's own mocked-electron module state — the real app's persisted,
 * global workspace root (a separate running process) is never touched.
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
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'gibson-hermes-check-')))
  execFileSync('git', ['init', '-q'], { cwd: dir })
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: dir })
  execFileSync('git', ['config', 'user.name', 'Gibson Hermes Check'], { cwd: dir })
  fs.writeFileSync(path.join(dir, 'README.md'), '# disposable check repo\n')
  execFileSync('git', ['add', '.'], { cwd: dir })
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: dir })
  return dir
}

/** `git log --oneline` on the repo's OWN .git (never Workspace's separate
 *  shadow checkpoint repo under .workspace-os/) — the real, unambiguous
 *  check that no merge/commit ever landed on the actual repository. */
function realCommitCount(repo: string): number {
  return execFileSync('git', ['log', '--oneline'], { cwd: repo }).toString('utf8').trim().split('\n').filter(Boolean).length
}

/**
 * Stands in for a real agent's own file edit each iteration. Deterministic,
 * never a model judgement: the NEXT hat comes from a plan file the test
 * writes in advance (gibson/next-hat-plan.txt, one hat per line, consumed
 * one line per invocation; defaults to 'builder' once exhausted/absent).
 * `round` only advances on the reviewer step itself (real Gibson semantics —
 * loop.sh's own review-round cap reads this same field against a per-tier
 * limit; bumping it every iteration would trip that cap before this
 * bridge's own code ever runs). Every invocation appends one line to
 * gibson/env-checks.log recording the hat, the decided next hat, its own
 * full argv (so a --model override is independently verifiable), and
 * whether REVIEWER_CMD/RELEASE_CMD were visible in its own environment.
 */
function makeFakeClaudeBin(): string {
  const dir = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'fake-claude-hermes-'))
  const bin = path.join(dir, 'claude')
  fs.writeFileSync(
    bin,
    [
      '#!/bin/bash',
      'cat > /dev/null', // drain the prompt; never logged, never sent anywhere
      'mkdir -p gibson',
      'cur=$(grep "^next_hat:" gibson/loop-state.md 2>/dev/null | sed "s/next_hat:[[:space:]]*//")',
      'round=$(grep "^round:" gibson/loop-state.md 2>/dev/null | sed "s/round:[[:space:]]*//")',
      '[ -z "$cur" ] && cur=builder',
      '[ -z "$round" ] && round=0',
      'if [ -s gibson/next-hat-plan.txt ]; then',
      '  next=$(head -n1 gibson/next-hat-plan.txt)',
      '  tail -n +2 gibson/next-hat-plan.txt > gibson/next-hat-plan.tmp && mv gibson/next-hat-plan.tmp gibson/next-hat-plan.txt',
      'else',
      '  next=builder',
      'fi',
      'if [ "$cur" = "reviewer" ]; then newround=$((round + 1)); else newround=$round; fi',
      'envnote="REVIEWER_CMD=[${REVIEWER_CMD:-unset}] RELEASE_CMD=[${RELEASE_CMD:-unset}]"',
      // Flatten embedded newlines first: one of the real CLI args is the
      // multi-line system prompt, which would otherwise make one invocation
      // span many physical lines in the log and break line-based counting.
      'argsflat=$(printf \'%s\' "$*" | tr \'\\n\' \' \')',
      'echo "hat=$cur next=$next args=[$argsflat] $envnote" >> gibson/env-checks.log',
      'cat > gibson/loop-state.md <<EOF',
      '# Gibson loop state',
      'updated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")',
      'issue:',
      'pr:',
      "hat: $cur",
      'next_hat: $next',
      'round: $newround',
      'parked: false',
      'handoff:',
      'handoff_sha:',
      'next_action: stub run advanced state (gibsonHermesLoop.temp-repo-check.test.ts)',
      'notes: stub decision, not a real model',
      'EOF',
      'echo \'{"type":"result","subtype":"success","is_error":false,"num_turns":1,"duration_ms":10,"total_cost_usd":0.0002,"session_id":"00000000-0000-4000-8000-000000000001"}\'',
      'exit 0',
      '',
    ].join('\n'),
  )
  fs.chmodSync(bin, 0o755)
  return bin
}

function writePlan(repo: string, hats: string[]): void {
  fs.mkdirSync(path.join(repo, 'gibson'), { recursive: true })
  fs.writeFileSync(path.join(repo, 'gibson', 'next-hat-plan.txt'), hats.join('\n') + '\n')
}

function readEnvChecks(repo: string): string[] {
  const p = path.join(repo, 'gibson', 'env-checks.log')
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8').trim().split('\n').filter(Boolean) : []
}

function listLeakedSockets(before: Set<string>): string[] {
  return fs.readdirSync('/tmp').filter((f) => f.startsWith('gibson-hermes-') && !before.has(f))
}

describe.skipIf(!haveGibson)('temp-repo check: production gibsonAction() loop mode (real loop.sh, real socket bridge, stub model)', () => {
  it('runs multiple real iterations, advances state, journals, captures usage, stops cleanly at maxIterations, no leaked sockets', async () => {
    const repo = makeTempRepo()
    writePlan(repo, ['test-engineer', 'builder', 'test-engineer'])
    const fakeBin = makeFakeClaudeBin()
    const prevBin = process.env['CLAUDE_BIN']
    process.env['CLAUDE_BIN'] = fakeBin
    const beforeSockets = new Set(fs.readdirSync('/tmp').filter((f) => f.startsWith('gibson-hermes-')))
    try {
      vi.resetModules() // launchRun.ts caches the resolved binary at module scope
      const { setWorkspaceRoot } = await import('../workspace-root')
      setWorkspaceRoot(repo)
      const { gibsonAction } = await import('./gibsonAction')

      const reply = await gibsonAction(repo, {
        loop: true, repoSlug: 'local/temp-hermes-check',
        runnerTimeoutSec: 30, maxBudgetUsd: 1, maxIterations: 3, errorBudget: 2,
      })

      expect(reply.ok).toBe(true)
      if (!reply.ok) return
      const result = reply.result as { stage: string; loopExitCode: number; iterations: Array<{ hat: string | null; action: string; exitCode?: number; meta?: { costUsd: number } }>; releaseRefused: unknown[]; reviews: unknown[] }
      expect(result.stage).toBe('looped')
      expect(result.loopExitCode).toBe(0) // iterations exhausted cleanly, no failure
      expect(result.releaseRefused).toEqual([])
      expect(result.reviews).toEqual([])
      expect(result.iterations).toHaveLength(3)
      for (const it of result.iterations) {
        expect(it.action).toBe('executed')
        expect(it.exitCode).toBe(0)
        expect(it.meta).toMatchObject({ costUsd: 0.0002 })
      }
      expect(result.iterations.map((it) => it.hat)).toEqual(['builder', 'test-engineer', 'builder'])

      const state = fs.readFileSync(path.join(repo, 'gibson', 'loop-state.md'), 'utf8')
      const journal = fs.readFileSync(path.join(repo, 'gibson', 'journal.md'), 'utf8')
      expect(state).toMatch(/round:\s*0/) // never reached reviewer, round never advances
      expect(journal.match(/Driver completed iteration/g)?.length).toBe(3)
      expect(realCommitCount(repo)).toBe(1) // only the fixture's own "init" commit

      expect(listLeakedSockets(beforeSockets)).toEqual([])
    } finally {
      if (prevBin === undefined) delete process.env['CLAUDE_BIN']
      else process.env['CLAUDE_BIN'] = prevBin
      fs.rmSync(repo, { recursive: true, force: true })
    }
  }, 60_000)

  it('required review: a REQUEST_CHANGES verdict sends the loop back to builder for correction, not release', async () => {
    const repo = makeTempRepo()
    // builder -> test-engineer -> reviewer(rejects: next=builder) -> test-engineer
    writePlan(repo, ['test-engineer', 'reviewer', 'builder', 'test-engineer'])
    const fakeBin = makeFakeClaudeBin()
    const prevBin = process.env['CLAUDE_BIN']
    process.env['CLAUDE_BIN'] = fakeBin
    const beforeSockets = new Set(fs.readdirSync('/tmp').filter((f) => f.startsWith('gibson-hermes-')))
    try {
      vi.resetModules()
      const { setWorkspaceRoot } = await import('../workspace-root')
      setWorkspaceRoot(repo)
      const { gibsonAction } = await import('./gibsonAction')

      const reply = await gibsonAction(repo, {
        loop: true, repoSlug: 'local/temp-hermes-check',
        runnerTimeoutSec: 30, maxBudgetUsd: 1, maxIterations: 4, errorBudget: 2,
      })

      expect(reply.ok).toBe(true)
      if (!reply.ok) return
      const result = reply.result as { loopExitCode: number; iterations: Array<{ hat: string | null; action: string; reviewUsedDistinctModel?: boolean }>; releaseRefused: unknown[]; reviews: Array<{ usedDistinctModel: boolean }> }
      expect(result.loopExitCode).toBe(0) // all 4 ran; the rejection is not a failure, it's a normal correction cycle
      expect(result.iterations.map((it) => it.hat)).toEqual(['builder', 'test-engineer', 'reviewer', 'builder'])
      expect(result.iterations.every((it) => it.action === 'executed')).toBe(true)
      // The review genuinely ran — required, not skipped — before sending
      // the loop back for correction.
      expect(result.reviews).toEqual([{ usedDistinctModel: false }])
      expect(result.releaseRefused).toEqual([]) // release was never reached

      const state = fs.readFileSync(path.join(repo, 'gibson', 'loop-state.md'), 'utf8')
      expect(state).toMatch(/next_hat:\s*test-engineer/) // post-correction, the loop moved on from builder
      expect(realCommitCount(repo)).toBe(1)
      expect(listLeakedSockets(beforeSockets)).toEqual([])
    } finally {
      if (prevBin === undefined) delete process.env['CLAUDE_BIN']
      else process.env['CLAUDE_BIN'] = prevBin
      fs.rmSync(repo, { recursive: true, force: true })
    }
  }, 60_000)

  it('required review: an APPROVE verdict is a saved outcome, but the release it would trigger is refused — no merge ever happens', async () => {
    const repo = makeTempRepo()
    // builder -> test-engineer -> reviewer(approves: next=release) -> [release refused]
    writePlan(repo, ['test-engineer', 'reviewer', 'release'])
    const fakeBin = makeFakeClaudeBin()
    const prevBin = process.env['CLAUDE_BIN']
    process.env['CLAUDE_BIN'] = fakeBin
    const beforeSockets = new Set(fs.readdirSync('/tmp').filter((f) => f.startsWith('gibson-hermes-')))
    try {
      vi.resetModules()
      const { setWorkspaceRoot } = await import('../workspace-root')
      setWorkspaceRoot(repo)
      const { gibsonAction } = await import('./gibsonAction')

      const reply = await gibsonAction(repo, {
        loop: true, repoSlug: 'local/temp-hermes-check',
        runnerTimeoutSec: 30, maxBudgetUsd: 1, maxIterations: 5, errorBudget: 1,
      })

      expect(reply.ok).toBe(true)
      if (!reply.ok) return
      const result = reply.result as {
        loopExitCode: number
        iterations: Array<{ hat: string | null; action: string; exitCode?: number }>
        releaseRefused: Array<{ hat: string | null; reason?: string }>
        reviews: Array<{ usedDistinctModel: boolean }>
      }
      expect(result.loopExitCode).not.toBe(0) // error budget exhausted — the refusal stops the loop, by policy
      // 4 outcomes total: builder, test-engineer, reviewer all genuinely
      // executed; release is the 4th — refused, never run.
      expect(result.iterations).toHaveLength(4)
      expect(result.iterations.map((it) => it.hat)).toEqual(['builder', 'test-engineer', 'reviewer', 'release'])
      expect(result.iterations.map((it) => it.action)).toEqual(['executed', 'executed', 'executed', 'blocked'])
      expect(result.iterations.slice(0, 3).every((it) => it.exitCode === 0)).toBe(true)
      // The approved review is the saved outcome: it genuinely executed,
      // separate from — and before — the release attempt.
      expect(result.reviews).toEqual([{ usedDistinctModel: false }])
      expect(result.releaseRefused).toEqual([{ hat: 'release', reason: expect.stringContaining('real merge') }])

      const envChecks = readEnvChecks(repo)
      // builder, test-engineer, reviewer all ran (3 stub invocations); release never did.
      expect(envChecks).toHaveLength(3)
      expect(envChecks[2]).toMatch(/^hat=reviewer next=release/)

      const state = fs.readFileSync(path.join(repo, 'gibson', 'loop-state.md'), 'utf8')
      expect(state).toMatch(/next_hat:\s*release/) // the approval is recorded; release itself never ran
      expect(realCommitCount(repo)).toBe(1) // no merge, no new commit — the repo is untouched beyond "init"

      expect(listLeakedSockets(beforeSockets)).toEqual([])
    } finally {
      if (prevBin === undefined) delete process.env['CLAUDE_BIN']
      else process.env['CLAUDE_BIN'] = prevBin
      fs.rmSync(repo, { recursive: true, force: true })
    }
  }, 60_000)

  it('the smallest supported controlled reviewer connection: reviewerModel reaches the real spawned process for the reviewer hat only, and REVIEWER_CMD/RELEASE_CMD stay genuinely absent even when the host shell has them set', async () => {
    const repo = makeTempRepo()
    writePlan(repo, ['test-engineer', 'reviewer', 'builder'])
    const fakeBin = makeFakeClaudeBin()
    const prevBin = process.env['CLAUDE_BIN']
    const prevReviewerCmd = process.env['REVIEWER_CMD']
    const prevReleaseCmd = process.env['RELEASE_CMD']
    process.env['CLAUDE_BIN'] = fakeBin
    // Simulate "the host shell Workspace OS itself runs under happens to
    // have these set" — a real negative-presence check below, not just an
    // absence of ever having tried to set them.
    process.env['REVIEWER_CMD'] = 'echo THIS-MUST-NEVER-BE-VISIBLE-TO-THE-AGENT'
    process.env['RELEASE_CMD'] = 'echo THIS-MUST-NEVER-BE-VISIBLE-EITHER'
    const beforeSockets = new Set(fs.readdirSync('/tmp').filter((f) => f.startsWith('gibson-hermes-')))
    try {
      vi.resetModules()
      const { setWorkspaceRoot } = await import('../workspace-root')
      setWorkspaceRoot(repo)
      const { gibsonAction } = await import('./gibsonAction')

      const reply = await gibsonAction(repo, {
        loop: true, repoSlug: 'local/temp-hermes-check',
        runnerTimeoutSec: 30, maxBudgetUsd: 1, maxIterations: 3, errorBudget: 1,
        reviewerModel: 'opus',
      })

      expect(reply.ok).toBe(true)
      if (!reply.ok) return
      const result = reply.result as { reviews: Array<{ usedDistinctModel: boolean }> }
      expect(result.reviews).toEqual([{ usedDistinctModel: true }])

      const envChecks = readEnvChecks(repo)
      expect(envChecks).toHaveLength(3)
      // The real, structural check: --model opus appears in the ACTUAL
      // argv the spawned child received for the reviewer hat only.
      expect(envChecks[0]).toMatch(/^hat=builder /)
      expect(envChecks[0]).not.toMatch(/--model opus/)
      expect(envChecks[1]).toMatch(/^hat=test-engineer /)
      expect(envChecks[1]).not.toMatch(/--model opus/)
      expect(envChecks[2]).toMatch(/^hat=reviewer /)
      expect(envChecks[2]).toMatch(/--model opus/)
      // And REVIEWER_CMD/RELEASE_CMD were absent for every hat, reviewer included.
      for (const line of envChecks) expect(line).toMatch(/REVIEWER_CMD=\[unset\] RELEASE_CMD=\[unset\]/)

      // Host shell's own values were restored afterward — not left cleared.
      expect(process.env['REVIEWER_CMD']).toBe('echo THIS-MUST-NEVER-BE-VISIBLE-TO-THE-AGENT')
      expect(process.env['RELEASE_CMD']).toBe('echo THIS-MUST-NEVER-BE-VISIBLE-EITHER')

      expect(listLeakedSockets(beforeSockets)).toEqual([])
    } finally {
      if (prevBin === undefined) delete process.env['CLAUDE_BIN']
      else process.env['CLAUDE_BIN'] = prevBin
      if (prevReviewerCmd === undefined) delete process.env['REVIEWER_CMD']
      else process.env['REVIEWER_CMD'] = prevReviewerCmd
      if (prevReleaseCmd === undefined) delete process.env['RELEASE_CMD']
      else process.env['RELEASE_CMD'] = prevReleaseCmd
      fs.rmSync(repo, { recursive: true, force: true })
    }
  }, 60_000)

  it('concurrent-run environment isolation: two simultaneous execute() calls never see each other\'s model override or env, now that neither mutates process.env', async () => {
    const repo = makeTempRepo()
    const fakeBin = makeFakeClaudeBin()
    const prevBin = process.env['CLAUDE_BIN']
    process.env['CLAUDE_BIN'] = fakeBin
    try {
      vi.resetModules()
      const { setWorkspaceRoot } = await import('../workspace-root')
      setWorkspaceRoot(repo)
      const { handleHermesConnection, realExecute } = await import('./gibsonAction')
      fs.mkdirSync(path.join(repo, 'gibson'), { recursive: true })
      fs.writeFileSync(path.join(repo, 'gibson', 'loop-state.md'), 'hat: builder\nnext_hat: reviewer\nround: 0\n')

      // Two concurrent reviewer-hat connections against the same repo — one
      // with a distinct model, one without — run via Promise.all so their
      // spawns genuinely overlap, not just execute back-to-back.
      const [a, b] = await Promise.all([
        handleHermesConnection('prompt-a', repo, realExecute, { maxBudgetUsd: 1, idleTimeoutMs: 15_000, safeMode: true, reviewerModel: 'opus' }),
        handleHermesConnection('prompt-b', repo, realExecute, { maxBudgetUsd: 1, idleTimeoutMs: 15_000, safeMode: true }),
      ])

      expect(a.outcome).toMatchObject({ hat: 'reviewer', action: 'executed', exitCode: 0, reviewUsedDistinctModel: true })
      expect(b.outcome).toMatchObject({ hat: 'reviewer', action: 'executed', exitCode: 0, reviewUsedDistinctModel: false })

      const envChecks = readEnvChecks(repo)
      expect(envChecks).toHaveLength(2)
      const withModel = envChecks.filter((l) => l.includes('--model opus'))
      const withoutModel = envChecks.filter((l) => !l.includes('--model opus'))
      // Exactly one spawned process saw the override; the other genuinely
      // did not — no bleed-through between the two concurrent calls.
      expect(withModel).toHaveLength(1)
      expect(withoutModel).toHaveLength(1)
      for (const line of envChecks) expect(line).toMatch(/REVIEWER_CMD=\[unset\] RELEASE_CMD=\[unset\]/)
    } finally {
      if (prevBin === undefined) delete process.env['CLAUDE_BIN']
      else process.env['CLAUDE_BIN'] = prevBin
      fs.rmSync(repo, { recursive: true, force: true })
    }
  }, 30_000)
})
