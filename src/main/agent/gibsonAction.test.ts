import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {
  gibsonLoopArgs, gibsonAction, readNextHat, handleHermesConnection,
  parseReviewVerdict, buildOwnerAttestedReviewComment, CROSS_VENDOR_REVIEWER_PROVIDER,
  type GibsonExec, type GibsonExecute,
} from './gibsonAction'

const GIBSON_DIR = path.join(os.homedir(), 'Desktop', 'AI-Agent-Resources', 'the-gibson')
const PR_REVIEW_EVIDENCE = path.join(GIBSON_DIR, 'scripts', 'pr-review-evidence.mjs')
const haveGibson = fs.existsSync(PR_REVIEW_EVIDENCE)
const REAL_SHA = 'a'.repeat(40)

// os.tmpdir() is itself a symlink on macOS (/var -> /private/var); gibsonAction
// requires an already-resolved path (same convention as beadsAction), so the
// fixture must be realpath'd too, not the raw tmpdir() string.
const REPO = fs.realpathSync(os.tmpdir())

describe('gibsonLoopArgs — pure argv builder', () => {
  const base = { runner: 'claude', repo: REPO, repoSlug: 'acme/app', maxIterations: 1, errorBudget: 1, runnerTimeoutSec: 60 }

  it('builds the exact bounded argv, defaulting to --once', () => {
    expect(gibsonLoopArgs(base)).toEqual([
      '--runner', 'claude', '--repo', REPO, '--repo-slug', 'acme/app',
      '--max-iterations', '1', '--error-budget', '1', '--runner-timeout', '60', '--once',
    ])
  })

  it('adds --print-prompt when requested (the PLAN stage flag)', () => {
    expect(gibsonLoopArgs({ ...base, printPrompt: true })).toEqual([
      '--runner', 'claude', '--repo', REPO, '--repo-slug', 'acme/app',
      '--max-iterations', '1', '--error-budget', '1', '--runner-timeout', '60', '--once', '--print-prompt',
    ])
  })

  it('rejects a runner outside the known set', () => {
    expect(() => gibsonLoopArgs({ ...base, runner: 'gpt-5-rogue' })).toThrow(/Unsupported Gibson runner/)
  })

  it('rejects a non-absolute repo path', () => {
    expect(() => gibsonLoopArgs({ ...base, repo: 'relative/path' })).toThrow(/absolute path/)
  })

  it('rejects a malformed repo-slug', () => {
    expect(() => gibsonLoopArgs({ ...base, repoSlug: 'not-a-slug' })).toThrow(/owner\/repo/)
  })

  it('requires maxIterations, errorBudget, and runnerTimeoutSec to be positive integers', () => {
    for (const bad of [0, -1, 1.5, NaN, Infinity]) {
      expect(() => gibsonLoopArgs({ ...base, maxIterations: bad })).toThrow(/maxIterations must be a positive integer/)
      expect(() => gibsonLoopArgs({ ...base, errorBudget: bad })).toThrow(/errorBudget must be a positive integer/)
      expect(() => gibsonLoopArgs({ ...base, runnerTimeoutSec: bad })).toThrow(/runnerTimeoutSec must be a positive integer/)
    }
  })
})

describe('gibsonAction — two-stage bridge (DI-injected fakes; never spawns a process or calls launchRun)', () => {
  const okPlanExec: GibsonExec = vi.fn(async () => ({ code: 0, stdout: 'rendered prompt text\n', stderr: '' }))

  it('rejects a request missing runnerTimeoutSec before any exec/execute is called', async () => {
    const exec = vi.fn()
    const execute = vi.fn()
    const reply = await gibsonAction(REPO, { runner: 'claude', repoSlug: 'acme/app', maxBudgetUsd: 1 }, { exec, execute })
    expect(reply.ok).toBe(false)
    expect(exec).not.toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
  })

  it('requires an explicit positive maxBudgetUsd unless planOnly is true — rejected before exec/execute', async () => {
    const exec = vi.fn()
    const execute = vi.fn()
    const reply = await gibsonAction(REPO, { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60 }, { exec, execute })
    expect(reply.ok).toBe(false)
    if (!reply.ok) expect(reply.error).toMatch(/maxBudgetUsd/)
    expect(exec).not.toHaveBeenCalled()
    expect(execute).not.toHaveBeenCalled()
  })

  it('rejects an unexpected argument key before exec is ever called', async () => {
    const exec = vi.fn()
    const reply = await gibsonAction(
      REPO,
      { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 1, bypassPermissions: true },
      { exec },
    )
    expect(reply.ok).toBe(false)
    expect(exec).not.toHaveBeenCalled()
  })

  it('planOnly: renders the prompt via --print-prompt and returns without ever calling execute', async () => {
    const execute = vi.fn()
    const reply = await gibsonAction(
      REPO,
      { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60, planOnly: true },
      { exec: okPlanExec, execute },
    )
    expect(reply.ok).toBe(true)
    if (reply.ok) expect(reply.result).toMatchObject({ stage: 'plan', prompt: 'rendered prompt text' })
    expect(execute).not.toHaveBeenCalled()
    const [binary, argv] = (okPlanExec as ReturnType<typeof vi.fn>).mock.calls.at(-1) as [string, string[]]
    expect(binary).toContain(path.join('the-gibson', 'scripts', 'loop.sh'))
    expect(argv).toContain('--print-prompt')
  })

  it('a failed plan stage (non-zero exit) is reported and execute is never called', async () => {
    const exec: GibsonExec = vi.fn(async () => ({ code: 1, stdout: '', stderr: 'next_hat missing or empty' }))
    const execute = vi.fn()
    const reply = await gibsonAction(
      REPO,
      { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60, planOnly: true },
      { exec, execute },
    )
    expect(reply.ok).toBe(false)
    if (!reply.ok) expect(reply.error).toMatch(/did not render a prompt/)
    expect(execute).not.toHaveBeenCalled()
  })

  it('full run: plans then executes the rendered prompt via the injected execute (standing in for launchRun), never via a Gibson runner', async () => {
    const execute: GibsonExecute = vi.fn(async (prompt) => ({
      exitCode: 0,
      output: `handled: ${prompt}`,
      meta: { costUsd: 0.01, turns: 1, durationMs: 500 },
      checkpointId: 'cp-1',
    }))
    const reply = await gibsonAction(
      REPO,
      { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 2 },
      { exec: okPlanExec, execute },
    )
    expect(reply.ok).toBe(true)
    if (reply.ok) {
      expect(reply.result).toMatchObject({
        stage: 'executed',
        prompt: 'rendered prompt text',
        exitCode: 0,
        output: 'handled: rendered prompt text',
        checkpointId: 'cp-1',
      })
    }
    expect(execute).toHaveBeenCalledWith('rendered prompt text', { root: REPO, maxBudgetUsd: 2, idleTimeoutMs: 60_000, safeMode: true })
  })

  it('safeMode defaults true and can be explicitly disabled', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: '', checkpointId: null }))
    await gibsonAction(REPO, { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 30, maxBudgetUsd: 1, safeMode: false }, { exec: okPlanExec, execute })
    expect(execute).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ safeMode: false }))
  })

  it('surfaces a failed execute stage as a structured, non-throwing reply', async () => {
    const execute: GibsonExecute = vi.fn(async () => { throw new Error('boom') })
    const reply = await gibsonAction(REPO, { runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 1 }, { exec: okPlanExec, execute })
    expect(reply.ok).toBe(false)
    if (!reply.ok) expect(reply.error).toMatch(/boom/)
  })
})

describe('readNextHat — pure file read, no loop.sh involved', () => {
  it('returns null when loop-state.md is missing', () => {
    expect(readNextHat(fs.mkdtempSync(path.join(REPO, 'no-state-')))).toBeNull()
  })

  it('parses next_hat from a real file', () => {
    const dir = fs.mkdtempSync(path.join(REPO, 'has-state-'))
    fs.mkdirSync(path.join(dir, 'gibson'))
    fs.writeFileSync(path.join(dir, 'gibson', 'loop-state.md'), '# Gibson loop state\nhat: builder\nnext_hat: reviewer\nround: 2\n')
    expect(readNextHat(dir)).toBe('reviewer')
  })
})

describe('handleHermesConnection — the one decision per HERMES_CMD connection', () => {
  function repoWithNextHat(hat: string): string {
    const dir = fs.mkdtempSync(path.join(REPO, 'hermes-conn-'))
    fs.mkdirSync(path.join(dir, 'gibson'))
    fs.writeFileSync(path.join(dir, 'gibson', 'loop-state.md'), `hat: builder\nnext_hat: ${hat}\nround: 0\n`)
    return dir
  }

  const withheld = { REVIEWER_CMD: undefined, RELEASE_CMD: undefined }

  it('routes a reviewer-hat connection through execute() like any other hat, flagged reviewUsedDistinctModel:false when no distinct model/provider was configured', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: '', meta: { costUsd: 0.001, turns: 1, durationMs: 5 }, checkpointId: 'cp-r' }))
    const repo = repoWithNextHat('reviewer')
    const { outcome, exitCode } = await handleHermesConnection('prompt', repo, execute, { maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true })
    expect(execute).toHaveBeenCalledWith('prompt', { root: repo, maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true, env: withheld })
    expect(outcome).toEqual({ hat: 'reviewer', action: 'executed', exitCode: 0, meta: { costUsd: 0.001, turns: 1, durationMs: 5 }, checkpointId: 'cp-r', reviewUsedDistinctModel: false })
    expect(exitCode).toBe(0)
  })

  it('uses reviewerProvider/reviewerModel for a reviewer-hat connection when configured, flagged reviewUsedDistinctModel:true', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: '', checkpointId: 'cp-r2' }))
    const repo = repoWithNextHat('reviewer')
    const { outcome } = await handleHermesConnection('prompt', repo, execute, { maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true, reviewerProvider: 'codex', reviewerModel: 'gpt-5-codex' })
    expect(execute).toHaveBeenCalledWith('prompt', { root: repo, maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true, env: withheld, model: 'gpt-5-codex', provider: 'codex' })
    expect(outcome).toMatchObject({ hat: 'reviewer', action: 'executed', reviewUsedDistinctModel: true })
  })

  it('refuses a release-hat connection outright, before execute is ever touched — merging stays disabled', async () => {
    const execute = vi.fn()
    const { outcome, exitCode } = await handleHermesConnection('prompt', repoWithNextHat('release'), execute, { maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true })
    expect(execute).not.toHaveBeenCalled()
    expect(outcome).toMatchObject({ hat: 'release', action: 'blocked' })
    expect(outcome.reason).toMatch(/real merge/)
    expect(exitCode).not.toBe(0)
  })

  it('routes every other hat through the injected execute (standing in for launchRun), with REVIEWER_CMD/RELEASE_CMD withheld and no reviewUsedDistinctModel flag', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: '', meta: { costUsd: 0.001, turns: 1, durationMs: 5 }, checkpointId: 'cp-x' }))
    const repo = repoWithNextHat('test-engineer')
    const { outcome, exitCode } = await handleHermesConnection('the prompt', repo, execute, { maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true })
    expect(execute).toHaveBeenCalledWith('the prompt', { root: repo, maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true, env: withheld })
    expect(outcome).toEqual({ hat: 'test-engineer', action: 'executed', exitCode: 0, meta: { costUsd: 0.001, turns: 1, durationMs: 5 }, checkpointId: 'cp-x' })
    expect(exitCode).toBe(0)
  })

  it('a thrown execute is recorded as a non-crashing "error" outcome, never an unhandled rejection', async () => {
    const execute: GibsonExecute = vi.fn(async () => { throw new Error('launchRun exploded') })
    const { outcome, exitCode } = await handleHermesConnection('p', repoWithNextHat('builder'), execute, { maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true })
    expect(outcome).toMatchObject({ hat: 'builder', action: 'error', error: expect.stringContaining('launchRun exploded') })
    expect(exitCode).toBe(1)
  })
})

describe('gibsonAction — loop mode argument validation (DI-injected fakes; no real loop.sh)', () => {
  it('rejects loop + planOnly together, before exec/execute', async () => {
    const exec = vi.fn()
    const execute = vi.fn()
    const reply = await gibsonAction(REPO, { loop: true, planOnly: true, repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 1, maxIterations: 2, errorBudget: 1 }, { exec, execute })
    expect(reply.ok).toBe(false)
    expect(exec).not.toHaveBeenCalled()
  })

  it('rejects an explicit non-hermes runner in loop mode', async () => {
    const exec = vi.fn()
    const reply = await gibsonAction(REPO, { loop: true, runner: 'claude', repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 1, maxIterations: 2, errorBudget: 1 }, { exec })
    expect(reply.ok).toBe(false)
    if (!reply.ok) expect(reply.error).toMatch(/hermes/)
    expect(exec).not.toHaveBeenCalled()
  })

  it('requires maxIterations and errorBudget in loop mode, rejected before exec', async () => {
    const exec = vi.fn()
    const reply = await gibsonAction(REPO, { loop: true, repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 1 }, { exec })
    expect(reply.ok).toBe(false)
    expect(exec).not.toHaveBeenCalled()
  })

  it('caps maxIterations — never loop.sh\'s own unlimited-until-halt default', async () => {
    const exec = vi.fn()
    const reply = await gibsonAction(REPO, { loop: true, repoSlug: 'acme/app', runnerTimeoutSec: 60, maxBudgetUsd: 1, maxIterations: 21, errorBudget: 1 }, { exec })
    expect(reply.ok).toBe(false)
    if (!reply.ok) expect(reply.error).toMatch(/<= 20/)
    expect(exec).not.toHaveBeenCalled()
  })

  it('happy path with a fake exec: builds --runner hermes argv (no --once), starts and cleanly closes its socket', async () => {
    let capturedEnv: Record<string, string> | undefined
    const exec: GibsonExec = vi.fn(async (_bin, _args, opts) => { capturedEnv = opts.env; return { code: 0, stdout: '', stderr: '' } })
    const execute = vi.fn()
    const reply = await gibsonAction(REPO, { loop: true, repoSlug: 'acme/app', runnerTimeoutSec: 30, maxBudgetUsd: 1, maxIterations: 3, errorBudget: 2 }, { exec, execute })
    expect(reply.ok).toBe(true)
    if (reply.ok) expect(reply.result).toMatchObject({ stage: 'looped', loopExitCode: 0, iterations: [], releaseRefused: [], reviews: [] })
    const [, argv] = (exec as ReturnType<typeof vi.fn>).mock.calls.at(-1) as [string, string[]]
    expect(argv).toEqual(['--runner', 'hermes', '--repo', REPO, '--repo-slug', 'acme/app', '--max-iterations', '3', '--error-budget', '2', '--runner-timeout', '30'])
    expect(argv).not.toContain('--once')
    expect(capturedEnv?.HERMES_CMD).toContain('gibsonHermesSocketClient.cjs')
    // Nothing ever actually connects (exec is faked), so execute must never run either.
    expect(execute).not.toHaveBeenCalled()
    // The socket path embedded in HERMES_CMD must be cleaned up once exec resolves.
    const m = /"([^"]+\.sock)"/.exec(capturedEnv?.HERMES_CMD ?? '')
    expect(m).not.toBeNull()
    if (m) expect(fs.existsSync(m[1])).toBe(false)
  })

  it('cancellation/robustness: when exec rejects (loop.sh killed or timed out), the socket is still closed and removed', async () => {
    let capturedEnv: Record<string, string> | undefined
    const exec: GibsonExec = vi.fn(async (_bin, _args, opts) => { capturedEnv = opts.env; throw new Error('killed') })
    const reply = await gibsonAction(REPO, { loop: true, repoSlug: 'acme/app', runnerTimeoutSec: 30, maxBudgetUsd: 1, maxIterations: 3, errorBudget: 2 }, { exec })
    expect(reply.ok).toBe(false)
    if (!reply.ok) expect(reply.error).toMatch(/killed/)
    const m = /"([^"]+\.sock)"/.exec(capturedEnv?.HERMES_CMD ?? '')
    expect(m).not.toBeNull()
    if (m) expect(fs.existsSync(m[1])).toBe(false)
  })
})

describe('parseReviewVerdict — pure, never guesses', () => {
  it('reads a trailing VERDICT: APPROVE line as pass', () => {
    expect(parseReviewVerdict('Some review prose.\n\nVERDICT: APPROVE')).toBe('pass')
  })
  it('reads VERDICT: REQUEST_CHANGES as fail', () => {
    expect(parseReviewVerdict('Findings here.\nVERDICT: REQUEST_CHANGES\n')).toBe('fail')
  })
  it('is case-insensitive on the keyword but not the enum typo-tolerant', () => {
    expect(parseReviewVerdict('verdict: approve')).toBe('pass')
  })
  it('returns null when no VERDICT line is present — never defaults', () => {
    expect(parseReviewVerdict('A review with no formal verdict at all.')).toBeNull()
  })
  it('returns null on conflicting verdicts in the same output — never picks a winner', () => {
    expect(parseReviewVerdict('VERDICT: APPROVE\n...\nVERDICT: REQUEST_CHANGES')).toBeNull()
  })
  it('accepts a repeated IDENTICAL verdict (not a conflict)', () => {
    expect(parseReviewVerdict('VERDICT: APPROVE\n...\nVERDICT: APPROVE')).toBe('pass')
  })
})

describe('buildOwnerAttestedReviewComment — exact format, validated against Gibson\'s own real parser', () => {
  it('builds the exact marker block Gibson documents', () => {
    const comment = buildOwnerAttestedReviewComment(REAL_SHA, 'codex', 'pass')
    expect(comment).toBe(`<!-- owner-attested-review:v1\nhead-sha: ${REAL_SHA}\nreviewer-vendor: codex\nresult: pass\n-->`)
  })

  it('rejects a non-SHA head reference — never a branch name or placeholder', () => {
    expect(() => buildOwnerAttestedReviewComment('HEAD', 'codex', 'pass')).toThrow(/resolved 40-char commit SHA/)
    expect(() => buildOwnerAttestedReviewComment('main', 'codex', 'pass')).toThrow(/resolved 40-char commit SHA/)
  })

  it('rejects "independent" as the attested vendor — Gibson\'s own fixture (og13) refuses it', () => {
    expect(() => buildOwnerAttestedReviewComment(REAL_SHA, 'independent', 'pass')).toThrow(/cannot attest "independent"/)
  })

  describe.skipIf(!haveGibson)('against the real scripts/pr-review-evidence.mjs parser', () => {
    it('a pass comment parses exactly as Gibson\'s own parseBlock expects', async () => {
      const { parseBlock, MARKER_FIELDS } = await import(PR_REVIEW_EVIDENCE)
      const comment = buildOwnerAttestedReviewComment(REAL_SHA, 'codex', 'pass')
      const parsed = parseBlock(comment, 'owner-attested-review:v1', MARKER_FIELDS['owner-attested-review:v1'])
      expect(parsed).toEqual({ 'head-sha': REAL_SHA, 'reviewer-vendor': 'codex', result: 'pass' })
    })

    it('a fail comment parses exactly as Gibson\'s own parseBlock expects', async () => {
      const { parseBlock, MARKER_FIELDS } = await import(PR_REVIEW_EVIDENCE)
      const comment = buildOwnerAttestedReviewComment(REAL_SHA, 'codex', 'fail')
      const parsed = parseBlock(comment, 'owner-attested-review:v1', MARKER_FIELDS['owner-attested-review:v1'])
      expect(parsed).toEqual({ 'head-sha': REAL_SHA, 'reviewer-vendor': 'codex', result: 'fail' })
    })
  })
})

describe('handleHermesConnection — owner-attested-review:v1 evidence, only when genuinely earned', () => {
  function repoWithNextHat(hat: string): string {
    const dir = fs.mkdtempSync(path.join(REPO, 'hermes-oar-'))
    fs.mkdirSync(path.join(dir, 'gibson'))
    fs.writeFileSync(path.join(dir, 'gibson', 'loop-state.md'), `hat: builder\nnext_hat: ${hat}\nround: 0\n`)
    return dir
  }
  const gitHeadSha = vi.fn(async () => REAL_SHA)

  it('cross-vendor reviewer + APPROVE verdict -> evidence constructed but NOT posted by default', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: 'Looks good.\nVERDICT: APPROVE', checkpointId: null }))
    const postComment = vi.fn()
    const { outcome } = await handleHermesConnection('p', repoWithNextHat('reviewer'), execute, {
      maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true,
      reviewerProvider: CROSS_VENDOR_REVIEWER_PROVIDER, gitHeadSha, postComment,
    })
    expect(postComment).not.toHaveBeenCalled()
    expect(outcome.ownerAttestedReview).toEqual({
      headSha: REAL_SHA, reviewerVendor: 'codex', result: 'pass',
      comment: buildOwnerAttestedReviewComment(REAL_SHA, 'codex', 'pass'),
      posted: false,
    })
  })

  it('cross-vendor reviewer + REQUEST_CHANGES verdict -> real negative evidence, never suppressed', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: 'Needs work.\nVERDICT: REQUEST_CHANGES', checkpointId: null }))
    const { outcome } = await handleHermesConnection('p', repoWithNextHat('reviewer'), execute, {
      maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true,
      reviewerProvider: CROSS_VENDOR_REVIEWER_PROVIDER, gitHeadSha,
    })
    expect(outcome.ownerAttestedReview).toMatchObject({ result: 'fail', reviewerVendor: 'codex', posted: false })
  })

  it('cross-vendor reviewer + a real PR supplied -> postComment IS called, posted:true', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: 'VERDICT: APPROVE', checkpointId: null }))
    const postComment = vi.fn(async () => {})
    const { outcome } = await handleHermesConnection('p', repoWithNextHat('reviewer'), execute, {
      maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true,
      reviewerProvider: CROSS_VENDOR_REVIEWER_PROVIDER, gitHeadSha, postComment,
      reviewPr: { repoSlug: 'warrigallife/Workspace-OS', prNumber: 7 },
    })
    expect(postComment).toHaveBeenCalledWith('warrigallife/Workspace-OS', 7, buildOwnerAttestedReviewComment(REAL_SHA, 'codex', 'pass'))
    expect(outcome.ownerAttestedReview?.posted).toBe(true)
  })

  it('no VERDICT line -> no evidence, even cross-vendor -- never guessed', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: 'I reviewed it. Seems fine I guess.', checkpointId: null }))
    const { outcome } = await handleHermesConnection('p', repoWithNextHat('reviewer'), execute, {
      maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true,
      reviewerProvider: CROSS_VENDOR_REVIEWER_PROVIDER, gitHeadSha,
    })
    expect(outcome.ownerAttestedReview).toBeUndefined()
  })

  it('same-vendor review (reviewerModel only, no reviewerProvider) -> never fabricated, even with a clean verdict', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: 'VERDICT: APPROVE', checkpointId: null }))
    const { outcome } = await handleHermesConnection('p', repoWithNextHat('reviewer'), execute, {
      maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true,
      reviewerModel: 'opus', gitHeadSha,
    })
    expect(outcome.reviewUsedDistinctModel).toBe(true) // model-level signal still fires
    expect(outcome.ownerAttestedReview).toBeUndefined() // but never conflated with real evidence
  })

  it('a non-reviewer hat never produces owner-attested-review evidence, regardless of provider/output', async () => {
    const execute: GibsonExecute = vi.fn(async () => ({ exitCode: 0, output: 'VERDICT: APPROVE', checkpointId: null }))
    const { outcome } = await handleHermesConnection('p', repoWithNextHat('test-engineer'), execute, {
      maxBudgetUsd: 1, idleTimeoutMs: 1000, safeMode: true,
      reviewerProvider: CROSS_VENDOR_REVIEWER_PROVIDER, gitHeadSha,
    })
    expect(outcome.ownerAttestedReview).toBeUndefined()
  })
})
