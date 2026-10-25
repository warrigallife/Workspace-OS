import { execFile } from 'child_process'
import net from 'net'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { ActionReply } from './actionBridge'
import type { AgentRunMeta, RunSink } from './launchRun'
import { launchRun } from './launchRun'
import type { ProviderId } from './modelPick'
import type { AgentActivity } from '../handlers/agent-activity'
import type { Artifact } from '../artifacts'
import type { AgentRunFailure } from '../../shared/agentRun'

/**
 * Bridge to The Gibson (https://github.com/mrhinkle/the-gibson), a governance
 * harness for coding-agent fleets — NOT an inference provider. It is located
 * only inside the one downloaded collection named below; this bridge never
 * searches anywhere else, and refuses to run if it isn't there.
 *
 * Two-stage connection, each stage using the tool already built for it:
 *   1. PLAN — ask Gibson's own `scripts/loop.sh --print-prompt` for the next
 *      rendered prompt. Confirmed by direct read of loop.sh: this mode writes
 *      the prompt to stdout and `exit 0`s BEFORE any claim/snapshot/runner
 *      step — no runner, broader-permission or otherwise, is ever invoked to
 *      produce it. `gibson/loop-state.md` self-initializes on first use
 *      (`ensure_loop_state()`) — no `playbooks/adopt.md` PR run is needed for
 *      this.
 *   2. EXECUTE — feed that exact prompt through Workspace OS's OWN launcher
 *      (`launchRun.ts`), the same path every ordinary dock/queue run already
 *      uses: its scoped safe/full permission lists (never Gibson's own
 *      hardcoded `--permission-mode acceptEdits`/`bypassPermissions`), its
 *      `--max-budget-usd` guard, and its real stream-json usage accounting
 *      (`AgentRunMeta`). Gibson's own claude-runner line
 *      (`scripts/loop.sh`, hardcoded `claude -p --output-format text
 *      --permission-mode acceptEdits`) is never invoked by this bridge.
 *
 * Default mode (above) is one bounded render+execute round-trip — no loop.
 *
 * `loop: true` mode (same-workspace only): Gibson's *own* `loop.sh` runs for
 * real, for up to `maxIterations` rounds, keeping its own state-advancement
 * and journaling fully intact (confirmed by direct read: that logic lives in
 * loop.sh's runner-agnostic snapshot → invoke → validate → journal sequence,
 * not in a specific runner). The per-iteration model call is routed through
 * launchRun() via loop.sh's own documented extension point — `--runner
 * hermes` + `HERMES_CMD` (the same env-hook pattern docs/11-solo-loop.md
 * uses for `DIGEST_CMD`) — never a rebuild of loop.sh's loop. `HERMES_CMD`
 * points at `gibsonHermesSocketClient.cjs`, a dependency-free forwarder: it
 * relays loop.sh's rendered prompt into a one-shot Unix socket this same
 * process is listening on, where `handleHermesConnection` calls the exact
 * same `execute` (realExecute → launchRun()) used above. Same-workspace
 * only: this works because `root` here is always the grant-bound workspace
 * root (never a caller path — see below), so launchRun()'s cwd
 * (getWorkspaceRoot()) and Gibson's target repo are necessarily the same
 * directory; there is still no per-call root override, and a Gibson repo
 * that is NOT the open workspace remains out of reach.
 *
 * Reviewer and release are two DIFFERENT requirements, deliberately not
 * conflated (an earlier pass here got this wrong):
 *
 *   - MODEL review: `playbooks/loop-step.md`'s reviewer section is a
 *     read-only multi-lens critique that ends in `VERDICT: APPROVE` or
 *     `VERDICT: REQUEST_CHANGES`, setting `next_hat` to `release` or back to
 *     `builder`/parked accordingly. This is a real, required step — never
 *     skipped, never silently answered by the same turn that wrote the code.
 *     It runs through `execute()`/`launchRun()` like any other hat, so
 *     Workspace's permissions/budget/usage accounting apply, and — the
 *     smallest supported controlled connection — it can be given a different
 *     `model`/`provider` than the run that produced the code
 *     (`GibsonLoopOpts.reviewerModel`/`reviewerProvider`, threaded through
 *     `GibsonExecute`/`launchRun()`'s existing `model`/`provider` fields —
 *     no env vars, no nested shell-out, no `REVIEWER_CMD`). The outcome
 *     records `reviewUsedDistinctModel: true/false`.
 *
 *     This flag is NOT Gibson's own independence verification and must never
 *     be presented as satisfying it. Gibson's actual contract
 *     (`docs/06-quality-gates.md`, `docs/delivery-receipt-v1.md`) defines a
 *     formal level called **E3** — "cross-vendor independent review:
 *     different provider AND identity, exact-head bound" — computed by
 *     `scripts/delivery-receipt.mjs`/`pr-review-evidence.mjs` from real
 *     GitHub evidence (the PR's review API, commit `Agent-Vendor:` trailers,
 *     reviewer identity at the exact head SHA). This bridge never commits,
 *     never opens a PR, never calls the GitHub API — it has no mechanism to
 *     produce that evidence, so it cannot claim E3 under any configuration.
 *     `reviewUsedDistinctModel` only means "this one call was configured
 *     with a different model/provider string" — a strictly weaker, merely
 *     informational signal, not independence as Gibson's own contract
 *     defines and requires it.
 *
 *   - GitHub ACCOUNT approval/merge authority, AND the only completion
 *     signal Gibson's own contract recognizes: a separate concern from
 *     model review, and the reason this bridge has no "done without
 *     release" connection to offer. `docs/delivery-receipt-v1.md` — Gibson's
 *     own installed completion contract — defines exactly one successful
 *     terminal disposition, `delivered`, and `delivered` unconditionally
 *     requires "the pull request is merged, and its base ref is the
 *     repository default branch" PLUS a review recorded at `independence
 *     E3` (above). Every other disposition — `parked` ("pull request open,
 *     otherwise"), `blocked`, `failed`, `incomplete` — is explicitly
 *     non-terminal or non-success; `parked` in particular is NOT a stand-in
 *     for "done," it is "still open, nothing wrong yet." There is no
 *     alternate completion path in Gibson's own contract that skips the
 *     merge — so none is connected here. Building one (e.g. treating an
 *     approved review or a `parked` state as a substitute "saved
 *     completion") would be exactly the invented-replacement-lifecycle this
 *     bridge does not build. `playbooks/release.md` separately ties
 *     `RELEASE_CMD` to a genuinely distinct GitHub identity (same-author
 *     approvals/merges are rejected by branch protection — L-015/L-021),
 *     and documents its own fallback — when `RELEASE_CMD` is unset — as the
 *     SAME session performing "merge → verify deploy → smoke" itself
 *     (`loop-step.md`'s release-hat section, confirmed by direct read). That
 *     is a real, destructive, repo-mutating action this bridge must never
 *     let happen. The `release` hat is therefore refused outright — never
 *     executed, by policy, not because no extension point exists — so an
 *     approved review can still be observed (`next_hat: release`) without
 *     the merge it would otherwise trigger ever running, even though that
 *     observation is not itself a Gibson-recognized completion.
 *     `REVIEWER_CMD`/`RELEASE_CMD` are never set for any hat's session
 *     either way (see `handleHermesConnection`'s `env` override, applied per
 *     call via `launchRun()`'s own `env` field — never a mutation of this
 *     process's own `process.env`, so concurrent calls cannot see or
 *     clobber each other's overrides).
 *
 * `maxIterations` is capped at `MAX_LOOP_ITERATIONS` — explicit and bounded,
 * never loop.sh's own unlimited-until-halt default.
 */

export const GIBSON_ACTIONS = ['gibson.run'] as const

const GIBSON_COLLECTION = path.join(os.homedir(), 'Desktop', 'AI-Agent-Resources')
const GIBSON_DIR = path.join(GIBSON_COLLECTION, 'the-gibson')
const LOOP_SCRIPT = path.join(GIBSON_DIR, 'scripts', 'loop.sh')

const ALLOWED_RUNNERS = ['grok', 'hermes', 'claude', 'codex'] as const

/** The full accepted hat enum (validate-loop-state.sh) is builder,
 *  test-engineer, reviewer, ux-evaluator, security, release, historian,
 *  decomposer, planner. Only `release` is refused outright — see
 *  RELEASE_EXIT_CODE below — because its own documented fallback performs a
 *  real merge. Every other hat, including `reviewer`, runs normally. */
const RELEASE_HAT = 'release'

/** Distinct from a real runner failure only for log legibility — loop.sh
 *  treats any nonzero exit identically (a counted failure against
 *  --error-budget), so refusing `release` still stops the whole loop
 *  deterministically once the budget is exhausted. */
const RELEASE_REFUSED_EXIT_CODE = 17

/** Explicit, bounded ceiling for loop mode — never loop.sh's own unlimited-
 *  until-halt default. */
const MAX_LOOP_ITERATIONS = 20

const HERMES_SOCKET_CLIENT = path.join(__dirname, 'gibsonHermesSocketClient.cjs')

export interface GibsonLoopOptions {
  runner: string
  /** Target repository to run the loop against (always the bound workspace
   *  root at the call site below — never a caller-supplied path). */
  repo: string
  /** Expected canonical origin, 'owner/repo' — Gibson's own --repo-slug check. */
  repoSlug: string
  maxIterations: number
  errorBudget: number
  runnerTimeoutSec: number
  once?: boolean
  /** Gibson's own "show actions without invoking runner". */
  dryRun?: boolean
  /** Gibson's own "render prompt only (no runner)" — exits before any
   *  claim/runner step. This bridge's PLAN stage always uses this one. */
  printPrompt?: boolean
}

function positiveInt(name: string, value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new Error(`Gibson ${name} must be a positive integer`)
  }
  return value
}

/**
 * Pure: builds loop.sh's exact argv. Every bound is required — this never
 * falls through to loop.sh's own "unlimited until halt" default.
 */
export function gibsonLoopArgs(opts: GibsonLoopOptions): string[] {
  if (!(ALLOWED_RUNNERS as readonly string[]).includes(opts.runner)) {
    throw new Error(`Unsupported Gibson runner: ${opts.runner}`)
  }
  if (!path.isAbsolute(opts.repo)) throw new Error('Gibson repo must be an absolute path')
  if (!/^[\w.-]+\/[\w.-]+$/.test(opts.repoSlug)) throw new Error('Gibson repo-slug must be owner/repo')
  const maxIterations = positiveInt('maxIterations', opts.maxIterations)
  const errorBudget = positiveInt('errorBudget', opts.errorBudget)
  const runnerTimeoutSec = positiveInt('runnerTimeoutSec', opts.runnerTimeoutSec)

  const args = [
    '--runner', opts.runner,
    '--repo', opts.repo,
    '--repo-slug', opts.repoSlug,
    '--max-iterations', String(maxIterations),
    '--error-budget', String(errorBudget),
    '--runner-timeout', String(runnerTimeoutSec),
  ]
  if (opts.once ?? true) args.push('--once')
  if (opts.dryRun) args.push('--dry-run')
  if (opts.printPrompt) args.push('--print-prompt')
  return args
}

const PUBLIC_ARG_KEYS = ['runner', 'repoSlug', 'runnerTimeoutSec', 'maxBudgetUsd', 'safeMode', 'planOnly', 'loop', 'maxIterations', 'errorBudget', 'reviewerModel', 'reviewerProvider']

function readArgs(args: unknown): Record<string, unknown> {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Gibson arguments must be an object')
  const a = args as Record<string, unknown>
  if (Object.keys(a).some((k) => !PUBLIC_ARG_KEYS.includes(k))) throw new Error('Unexpected Gibson argument')
  return a
}

export interface GibsonRunResult {
  args: string[]
  exitCode: number
  stdoutTail: string
  stderrTail: string
}

/** Swappable for tests — never actually spawns a process. `env` is an
 *  additive passthrough (e.g. HERMES_CMD for loop mode) — unset means
 *  identical behaviour to before this field existed. */
export type GibsonExec = (
  binary: string,
  args: string[],
  opts: { cwd: string; timeout: number; env?: Record<string, string> },
) => Promise<{ code: number; stdout: string; stderr: string }>

const realExec: GibsonExec = (binary, args, opts) =>
  new Promise((resolve) => {
    execFile(
      binary,
      args,
      {
        cwd: opts.cwd,
        env: { HOME: os.homedir(), PATH: '/opt/homebrew/bin:/usr/bin:/bin', LANG: 'en_US.UTF-8', ...opts.env },
        encoding: 'utf8',
        shell: false,
        timeout: opts.timeout,
        maxBuffer: 2 * 1024 * 1024,
        killSignal: 'SIGKILL',
      },
      (error, stdout, stderr) => {
        const code = (error as (NodeJS.ErrnoException & { code?: number }) | null)?.code
        resolve({ code: typeof code === 'number' ? code : error ? 1 : 0, stdout, stderr })
      },
    )
  })

const TAIL_BYTES = 4000
function tail(s: string): string {
  const buf = Buffer.from(s, 'utf8')
  return buf.length <= TAIL_BYTES ? s : buf.subarray(buf.length - TAIL_BYTES).toString('utf8')
}

export interface GibsonExecuteResult {
  exitCode: number
  output: string
  meta?: AgentRunMeta
  checkpointId: string | null
}

/** Swappable for tests — never actually calls launchRun / spawns a process.
 *  `model`/`provider` let a caller (reviewer independence) target a
 *  genuinely different model/vendor than the default run; `env` is an
 *  additive, per-call override (REVIEWER_CMD/RELEASE_CMD withheld) —
 *  threaded straight to launchRun()'s own same-named fields, never a mutation
 *  of this process's own process.env. */
export type GibsonExecute = (
  prompt: string,
  opts: {
    root: string
    maxBudgetUsd: number
    idleTimeoutMs: number
    safeMode: boolean
    model?: string
    provider?: ProviderId
    env?: Record<string, string | undefined>
  },
) => Promise<GibsonExecuteResult>

/**
 * EXECUTE stage, real implementation: routes the rendered prompt through
 * Workspace OS's own launcher — the same grants/checkpoint/permission-scope/
 * budget machinery every ordinary run already gets. No persona (agent:
 * null), 'all' capabilities (this action itself is already full-grant-only —
 * see actionBridge.ts — so the inner run is no broader than the context that
 * authorized it), and resumeId left unset (always a fresh, single turn).
 * `env`/`model`/`provider` pass straight through to launchRun()'s own
 * per-call fields — no shared mutable state, so concurrent calls (e.g. one
 * reviewer-model override alongside an ordinary builder call) cannot see or
 * clobber each other.
 */
export const realExecute: GibsonExecute = (prompt, opts) =>
  new Promise((resolve, reject) => {
    let settled = false
    let output = ''
    let meta: AgentRunMeta | undefined
    const sink: RunSink = {
      output: (text: string) => { output += text },
      meta: (m: AgentRunMeta) => { meta = m },
      activity: (_a: AgentActivity) => {},
      artifacts: (_list: Artifact[]) => {},
      artifact: (_filePath: string) => {},
      done: (code: number, checkpointId: string | null, _failure?: AgentRunFailure) => {
        if (settled) return
        settled = true
        resolve({ exitCode: code, output, meta, checkpointId })
      },
    }
    launchRun({
      runId: `gibson-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      prompt,
      contextFiles: [],
      activeFile: null,
      safeMode: opts.safeMode,
      agent: null,
      maxBudgetUsd: opts.maxBudgetUsd,
      idleTimeoutMs: opts.idleTimeoutMs,
      model: opts.model,
      provider: opts.provider,
      env: opts.env,
      capabilities: 'all',
      sink,
    }).catch((e) => { if (!settled) { settled = true; reject(e) } })
  })

/** Reads the hat the *upcoming* iteration will run as — loop.sh itself
 *  reads this same field (`next_hat`) at the top of each real iteration
 *  (confirmed by direct read), before the agent's own edit (if any) rewrites
 *  it. Returns null on a missing/unparseable file rather than throwing —
 *  the caller treats "unknown" as safe to proceed, since loop.sh's own
 *  ensure_loop_state()/validation is the authority on whether the file is
 *  usable at all. */
export function readNextHat(repo: string): string | null {
  try {
    const content = fs.readFileSync(path.join(repo, 'gibson', 'loop-state.md'), 'utf8')
    const m = /^next_hat:\s*(\S+)\s*$/m.exec(content)
    return m ? m[1] : null
  } catch {
    return null
  }
}

/**
 * Connects a genuinely cross-vendor reviewer's real verdict to Gibson's own
 * documented `owner-attested-review:v1` evidence format — never a rebuild of
 * Gibson's evaluator, never a guess at its shape. The exact format below
 * (marker name, field order, HTML-comment wrapper) is read directly from
 * `scripts/pr-review-evidence.mjs`'s `MARKER_FIELDS`/`parseBlock` and
 * confirmed against its own test fixture (`scripts/tests/pr-review-
 * evidence.test.sh:551`) — every unit test for this bridge imports and runs
 * Gibson's real `parseBlock` against the string this builds, rather than
 * re-implementing the parser's regex and trusting it matches.
 *
 * Every vendor this bridge's default run is reachable through is implicitly
 * `claude` (no code path here ever sets a non-default `provider` for a
 * non-reviewer hat) — so the ONLY way a reviewer session is genuinely
 * cross-vendor, as opposed to merely a different model tier of the SAME
 * vendor, is `reviewerProvider === 'codex'`. `reviewUsedDistinctModel`
 * (above) is true for a same-vendor different-MODEL review too; this
 * constant is deliberately stricter and is the only gate that may ever
 * produce `owner-attested-review:v1` evidence.
 */
export const CROSS_VENDOR_REVIEWER_PROVIDER = 'codex' as const

/**
 * Gibson's own required reviewer verdict line (`playbooks/loop-step.md`'s
 * reviewer section: "Exactly one of: VERDICT: APPROVE / VERDICT:
 * REQUEST_CHANGES"), parsed from the REAL review session's own output.
 * Returns null — never a guessed default — when the line is absent, or when
 * conflicting verdicts appear in the same output (ambiguous is refused, not
 * resolved by picking one). A rejected review (`fail`) is real evidence too
 * and is never suppressed — only an unparseable one is withheld.
 */
export function parseReviewVerdict(output: string): 'pass' | 'fail' | null {
  const matches = [...output.matchAll(/^VERDICT:\s*(APPROVE|REQUEST_CHANGES)\s*$/gim)]
  if (matches.length === 0) return null
  const distinct = new Set(matches.map((m) => m[1].toUpperCase()))
  if (distinct.size > 1) return null // conflicting verdicts in one output — refuse, never pick a winner
  return distinct.has('APPROVE') ? 'pass' : 'fail'
}

/**
 * Builds Gibson's exact `owner-attested-review:v1` HTML-comment block.
 * `headSha` must be a real, resolved 40-hex-char commit SHA — never a
 * branch name, a placeholder, or "HEAD" — matching the exact-head-SHA
 * binding Gibson's evaluator enforces. `reviewerVendor` must never be the
 * literal string `"independent"` — Gibson's own fixture (`og13`) proves the
 * owner cannot countersign as that vendor; it is refused as evidence, not
 * silently accepted.
 */
export function buildOwnerAttestedReviewComment(headSha: string, reviewerVendor: string, result: 'pass' | 'fail'): string {
  if (!/^[0-9a-f]{40}$/i.test(headSha)) {
    throw new Error(`owner-attested-review:v1 requires a resolved 40-char commit SHA, got: ${JSON.stringify(headSha)}`)
  }
  if (reviewerVendor === 'independent') {
    throw new Error('owner-attested-review:v1 cannot attest "independent" as the reviewer vendor — Gibson refuses this as evidence (fixture og13)')
  }
  return `<!-- owner-attested-review:v1\nhead-sha: ${headSha}\nreviewer-vendor: ${reviewerVendor}\nresult: ${result}\n-->`
}

/** Swappable for tests — never actually spawns `git`. */
export type GibsonGitHeadSha = (repo: string) => Promise<string>

const realGitHeadSha: GibsonGitHeadSha = (repo) =>
  new Promise((resolve, reject) => {
    execFile('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }, (err, stdout) => {
      if (err) reject(err)
      else resolve(stdout.trim())
    })
  })

/** Swappable for tests — never actually calls `gh` / posts anything. Real
 *  implementation is the ONLY GitHub write action this bridge ever performs,
 *  and only when the caller explicitly supplies a PR to post to (see
 *  `HermesConnectionOpts.reviewPr` below) — never auto-discovered, never
 *  automatic. */
export type GibsonPostComment = (repoSlug: string, prNumber: number, body: string) => Promise<void>

const realPostComment: GibsonPostComment = (repoSlug, prNumber, body) =>
  new Promise((resolve, reject) => {
    execFile('gh', ['pr', 'comment', String(prNumber), '--repo', repoSlug, '--body', body], (err) => {
      if (err) reject(err)
      else resolve()
    })
  })

export interface GibsonLoopIterationOutcome {
  hat: string | null
  action: 'executed' | 'blocked' | 'error'
  exitCode?: number
  meta?: AgentRunMeta
  checkpointId?: string | null
  error?: string
  /** Set only on the `reviewer` hat: true when the caller configured a
   *  different model/provider (reviewerModel/reviewerProvider) for this
   *  call; false when it ran as a fresh same-vendor session instead
   *  (Gibson's own weaker, still-real fallback). NOT Gibson's own E3
   *  independence verification (GitHub-evidenced cross-vendor + identity at
   *  the exact head SHA — see the top-of-file doc comment); this bridge has
   *  no mechanism to produce that evidence and never claims to. Always
   *  present for `reviewer` so neither case is ever silently conflated with
   *  the other, and never conflated with E3 either. */
  reviewUsedDistinctModel?: boolean
  /** Set only when action is 'blocked' (always the `release` hat today). */
  reason?: string
  /**
   * Set only for a `reviewer` iteration that was both genuinely cross-vendor
   * (`reviewerProvider === CROSS_VENDOR_REVIEWER_PROVIDER`) AND produced a
   * parseable `VERDICT:` line — i.e. exactly the evidence Gibson's own
   * `owner-attested-review:v1` format recognizes, never fabricated for a
   * same-vendor fallback or an ambiguous/missing verdict. `posted: false`
   * means the comment text was constructed and is ready, but no GitHub
   * write happened — the default, safe state unless the caller explicitly
   * supplies `reviewPr` (a real, already-open PR), which this bridge never
   * discovers or creates on its own.
   */
  ownerAttestedReview?: { headSha: string; reviewerVendor: string; result: 'pass' | 'fail'; comment: string; posted: boolean }
}

const REVIEWER_HAT = 'reviewer'

/** Never set for any hat this bridge drives — see the top-of-file doc
 *  comment on why REVIEWER_CMD/RELEASE_CMD are permanently withheld. Passed
 *  as launchRun()'s own per-call `env` field, not a process.env mutation. */
const WITHHOLD_CROSS_VENDOR_ENV = { REVIEWER_CMD: undefined, RELEASE_CMD: undefined } as const

export interface HermesConnectionOpts {
  maxBudgetUsd: number
  idleTimeoutMs: number
  safeMode: boolean
  /** Smallest supported controlled reviewer connection: when set, the
   *  `reviewer` hat's own session uses this model/provider instead of the
   *  default, giving it a genuinely independent judgement. Ignored for
   *  every other hat. */
  reviewerModel?: string
  reviewerProvider?: ProviderId
  /**
   * An already-open, real PR to post `owner-attested-review:v1` evidence
   * to, once a genuinely cross-vendor reviewer iteration produces a
   * parseable verdict. Omitted (the default) means the evidence comment is
   * still constructed and returned on the outcome (`posted: false`) but
   * never sent — this bridge never creates or discovers a PR on its own;
   * the caller must already have one open and explicitly name it here.
   */
  reviewPr?: { repoSlug: string; prNumber: number }
  /** DI seams for tests — default to the real `git rev-parse HEAD` / `gh pr
   *  comment` implementations below when omitted. */
  gitHeadSha?: GibsonGitHeadSha
  postComment?: GibsonPostComment
}

/**
 * One HERMES_CMD connection's worth of work.
 *   - `release`: refused outright, before `execute` is ever touched — its
 *     own documented fallback (`loop-step.md`, confirmed by direct read)
 *     performs a real merge when RELEASE_CMD is unset, which this bridge
 *     never sets. A real merge must never happen through this connection.
 *   - `reviewer`: routed through the same `execute` as every other hat, with
 *     `reviewerModel`/`reviewerProvider` applied if the caller configured
 *     them — the controlled, Workspace-routed path to a genuinely
 *     independent review, never REVIEWER_CMD.
 *   - everything else: routed through `execute` exactly like the default
 *     mode, with REVIEWER_CMD/RELEASE_CMD withheld regardless (defense in
 *     depth — no hat's session can reach either var through this bridge).
 * Exported standalone so this has fast, deterministic unit coverage without
 * a real socket or a real loop.sh invocation.
 */
export async function handleHermesConnection(
  prompt: string,
  repo: string,
  execute: GibsonExecute,
  opts: HermesConnectionOpts,
): Promise<{ outcome: GibsonLoopIterationOutcome; exitCode: number }> {
  const hat = readNextHat(repo)
  if (hat === RELEASE_HAT) {
    return {
      outcome: { hat, action: 'blocked', reason: "release is refused: its own fallback (RELEASE_CMD unset) performs a real merge, disabled by this bridge's policy, not a missing extension point" },
      exitCode: RELEASE_REFUSED_EXIT_CODE,
    }
  }
  const isReviewer = hat === REVIEWER_HAT
  const reviewerFields = isReviewer && (opts.reviewerModel || opts.reviewerProvider)
    ? { model: opts.reviewerModel, provider: opts.reviewerProvider }
    : {}
  const reviewUsedDistinctModel = isReviewer ? { reviewUsedDistinctModel: Boolean(opts.reviewerModel || opts.reviewerProvider) } : {}
  try {
    const r = await execute(prompt, { root: repo, maxBudgetUsd: opts.maxBudgetUsd, idleTimeoutMs: opts.idleTimeoutMs, safeMode: opts.safeMode, env: WITHHOLD_CROSS_VENDOR_ENV, ...reviewerFields })
    const ownerAttestedReview = isReviewer
      ? await buildOwnerAttestedReviewOutcome(repo, r.output, opts)
      : {}
    return { outcome: { hat, action: 'executed', exitCode: r.exitCode, meta: r.meta, checkpointId: r.checkpointId, ...reviewUsedDistinctModel, ...ownerAttestedReview }, exitCode: r.exitCode }
  } catch (e) {
    return { outcome: { hat, action: 'error', error: e instanceof Error ? e.message : String(e), ...reviewUsedDistinctModel }, exitCode: 1 }
  }
}

/**
 * The connection itself: only ever produces `owner-attested-review:v1`
 * evidence when the review was genuinely cross-vendor AND produced a real,
 * unambiguous verdict — both checked here, not assumed by the caller.
 * Never throws: a git/post failure is folded into the returned shape rather
 * than taking down the whole iteration, since the review itself already
 * genuinely happened by this point.
 */
async function buildOwnerAttestedReviewOutcome(
  repo: string,
  output: string,
  opts: HermesConnectionOpts,
): Promise<{ ownerAttestedReview?: GibsonLoopIterationOutcome['ownerAttestedReview'] }> {
  if (opts.reviewerProvider !== CROSS_VENDOR_REVIEWER_PROVIDER) return {} // same-vendor fallback — never attested
  const result = parseReviewVerdict(output)
  if (result === null) return {} // no unambiguous VERDICT line — never guessed
  const gitHeadSha = opts.gitHeadSha ?? realGitHeadSha
  let headSha: string
  try {
    headSha = await gitHeadSha(repo)
  } catch {
    return {} // can't bind to a head SHA — withhold, don't fabricate one
  }
  const comment = buildOwnerAttestedReviewComment(headSha, CROSS_VENDOR_REVIEWER_PROVIDER, result)
  let posted = false
  if (opts.reviewPr) {
    const postComment = opts.postComment ?? realPostComment
    await postComment(opts.reviewPr.repoSlug, opts.reviewPr.prNumber, comment)
    posted = true
  }
  return { ownerAttestedReview: { headSha, reviewerVendor: CROSS_VENDOR_REVIEWER_PROVIDER, result, comment, posted } }
}

/**
 * Starts the one-shot Unix socket `gibsonHermesSocketClient.cjs` forwards
 * each HERMES_CMD invocation to. Lives only for one gibson.run loop call —
 * closed and unlinked in the `finally` below, never left listening.
 */
function startHermesSocketServer(
  repo: string,
  execute: GibsonExecute,
  opts: HermesConnectionOpts,
): Promise<{ socketPath: string; iterations: GibsonLoopIterationOutcome[]; close: () => Promise<void> }> {
  const socketPath = path.join('/tmp', `gibson-hermes-${process.pid}-${Date.now()}-${Math.floor(Math.random() * 1e6)}.sock`)
  const iterations: GibsonLoopIterationOutcome[] = []
  // allowHalfOpen is required: the client half-closes (sock.end(prompt)) right
  // after sending, to signal "done sending, now waiting for your reply". With
  // the net.createServer default (false), Node auto-closes OUR write side the
  // instant that FIN arrives — before the async execute() below can ever send
  // the real EXIT:<code> — so the client always fell back to exit 1, and
  // loop.sh would check the file before the real (still in-flight) write even
  // happened. Caught via direct instrumentation, not assumed.
  const server = net.createServer({ allowHalfOpen: true }, (sock) => {
    const chunks: Buffer[] = []
    sock.on('error', () => {}) // the client (killed by loop.sh's own --runner-timeout, or just gone) may drop before a reply is ready — never an unhandled error
    sock.on('data', (d) => chunks.push(d))
    sock.on('end', () => {
      const prompt = Buffer.concat(chunks).toString('utf8')
      handleHermesConnection(prompt, repo, execute, opts).then(({ outcome, exitCode }) => {
        iterations.push(outcome)
        // execute() can resolve long after loop.sh's own wall-timeout has
        // already killed the client and torn down its end of the socket —
        // writing to a destroyed socket must not throw or leave this dangling.
        if (!sock.destroyed) sock.end(`EXIT:${exitCode}\n`)
      })
    })
    sock.on('error', () => {})
  })
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(socketPath, () => {
      resolve({
        socketPath,
        iterations,
        close: () =>
          new Promise<void>((done) => {
            server.close(() => {
              try { fs.unlinkSync(socketPath) } catch { /* already gone */ }
              done()
            })
          }),
      })
    })
  })
}

interface GibsonActionDeps {
  exec?: GibsonExec
  execute?: GibsonExecute
}

export interface GibsonLoopOpts {
  runner: string
  repoSlug: string
  runnerTimeoutSec: number
  maxBudgetUsd: number
  safeMode: boolean
  maxIterations: number
  errorBudget: number
  /** Smallest supported controlled reviewer connection — see HermesConnectionOpts. */
  reviewerModel?: string
  reviewerProvider?: ProviderId
  /** See HermesConnectionOpts.reviewPr — an already-open, real PR to post
   *  owner-attested-review:v1 evidence to. Omitted = constructed, never sent. */
  reviewPr?: { repoSlug: string; prNumber: number }
}

/**
 * Real loop.sh, real multiple iterations (`once: false`), `--runner hermes`
 * + `HERMES_CMD` pointed at the local socket bridge above. Returns `ok:true`
 * with the observed outcome even when loop.sh itself stopped on a failure
 * or a refused stage — exactly like the default mode's `stage: 'executed'`
 * already does for a nonzero inner exitCode; `loopExitCode`/`iterations`/
 * `releaseRefused` tell the caller what actually happened.
 */
async function runGibsonLoop(root: string, opts: GibsonLoopOpts, exec: GibsonExec, execute: GibsonExecute): Promise<ActionReply> {
  const loopArgs = gibsonLoopArgs({
    runner: opts.runner, repo: root, repoSlug: opts.repoSlug,
    maxIterations: opts.maxIterations, errorBudget: opts.errorBudget, runnerTimeoutSec: opts.runnerTimeoutSec,
    once: false,
  })
  let server: { socketPath: string; iterations: GibsonLoopIterationOutcome[]; close: () => Promise<void> }
  try {
    server = await startHermesSocketServer(root, execute, {
      maxBudgetUsd: opts.maxBudgetUsd,
      idleTimeoutMs: opts.runnerTimeoutSec * 1000,
      safeMode: opts.safeMode,
      reviewerModel: opts.reviewerModel,
      reviewerProvider: opts.reviewerProvider,
      reviewPr: opts.reviewPr,
    })
  } catch (e) {
    return { ok: false, error: 'Gibson loop could not start its local socket bridge: ' + (e instanceof Error ? e.message : String(e)) }
  }
  const hermesCmd = `node ${JSON.stringify(HERMES_SOCKET_CLIENT)} ${JSON.stringify(server.socketPath)}`
  const loopTimeoutMs = (opts.runnerTimeoutSec + 30) * opts.maxIterations * 1000 + 30_000
  let loopResult: { code: number; stdout: string; stderr: string }
  try {
    loopResult = await exec(LOOP_SCRIPT, loopArgs, { cwd: GIBSON_DIR, timeout: loopTimeoutMs, env: { HERMES_CMD: hermesCmd } })
  } catch (e) {
    await server.close()
    return { ok: false, error: 'Gibson loop stage failed or response unavailable: ' + (e instanceof Error ? e.message : String(e)) }
  }
  await server.close()
  // release is always refused (see handleHermesConnection) — flagged here so
  // a caller can tell "review was approved but the merge it would trigger
  // was withheld by policy" apart from a genuine failure.
  const releaseRefused = server.iterations.filter((it) => it.action === 'blocked').map((it) => ({ hat: it.hat, reason: it.reason }))
  // usedDistinctModel is NOT Gibson's own E3 independence — see the
  // top-of-file doc comment — only "a different model/provider was
  // configured for this call." ownerAttestedReview, when present, IS real,
  // Gibson-recognized evidence (see buildOwnerAttestedReviewOutcome) —
  // never fabricated for a same-vendor or unparseable-verdict review.
  const reviews = server.iterations
    .filter((it) => it.hat === REVIEWER_HAT)
    .map((it) => ({ usedDistinctModel: it.reviewUsedDistinctModel ?? false, ownerAttestedReview: it.ownerAttestedReview ?? null }))
  return {
    ok: true,
    result: {
      stage: 'looped',
      args: loopArgs,
      loopExitCode: loopResult.code,
      iterations: server.iterations,
      releaseRefused,
      reviews,
      stdoutTail: tail(loopResult.stdout),
      stderrTail: tail(loopResult.stderr),
    },
  }
}

/**
 * root is the grant-bound workspace root (the open Workspace OS folder) —
 * this NEVER takes a caller-supplied repo path. Gibson always runs against
 * whatever is currently open, exactly like every other wos-action.
 */
export async function gibsonAction(root: string, args: unknown, deps: GibsonActionDeps = {}): Promise<ActionReply> {
  const exec = deps.exec ?? realExec
  const execute = deps.execute ?? realExecute
  let runner: string, repoSlug: string, runnerTimeoutSec: number, maxBudgetUsd: number, safeMode: boolean, planOnly: boolean
  let loop: boolean, maxIterations: number, errorBudget: number
  let reviewerModel: string | undefined, reviewerProvider: ProviderId | undefined
  try {
    const a = readArgs(args)
    if (!path.isAbsolute(root) || fs.realpathSync(root) !== root) {
      throw new Error('Gibson requires a resolved workspace root')
    }
    if (!fs.existsSync(LOOP_SCRIPT)) {
      throw new Error(
        `Gibson is not present at ${GIBSON_DIR} (searched only inside ${GIBSON_COLLECTION}); nothing was downloaded or installed`,
      )
    }
    loop = a.loop === true
    planOnly = a.planOnly === true
    if (loop && planOnly) throw new Error('Gibson loop and planOnly are mutually exclusive')
    if (loop) {
      if (a.runner !== undefined && a.runner !== 'hermes') {
        throw new Error("Gibson loop mode always uses loop.sh's hermes runner slot (the only one with an override hook) — pass runner: 'hermes' or omit it")
      }
      runner = 'hermes'
    } else {
      runner = String(a.runner)
    }
    repoSlug = String(a.repoSlug)
    runnerTimeoutSec = positiveInt('runnerTimeoutSec', a.runnerTimeoutSec)
    safeMode = a.safeMode !== false
    if (planOnly) {
      maxBudgetUsd = 0 // never spent — the execute stage is skipped entirely
    } else {
      // No silent default here, unlike launchRun.ts's own optional field:
      // this caller must say so explicitly before this bridge spends anything.
      if (typeof a.maxBudgetUsd !== 'number' || !(a.maxBudgetUsd > 0)) {
        throw new Error('Gibson maxBudgetUsd must be a positive number unless planOnly is true')
      }
      maxBudgetUsd = a.maxBudgetUsd
    }
    if (loop) {
      maxIterations = positiveInt('maxIterations', a.maxIterations)
      if (maxIterations > MAX_LOOP_ITERATIONS) {
        throw new Error(`Gibson loop maxIterations must be <= ${MAX_LOOP_ITERATIONS} (explicit, bounded — never loop.sh's own unlimited-until-halt default)`)
      }
      errorBudget = positiveInt('errorBudget', a.errorBudget)
      if (a.reviewerModel !== undefined) {
        if (typeof a.reviewerModel !== 'string' || !a.reviewerModel) throw new Error('Gibson reviewerModel must be a non-empty string')
        reviewerModel = a.reviewerModel
      }
      if (a.reviewerProvider !== undefined) {
        if (a.reviewerProvider !== 'claude' && a.reviewerProvider !== 'codex') throw new Error("Gibson reviewerProvider must be 'claude' or 'codex'")
        reviewerProvider = a.reviewerProvider
      }
    } else {
      maxIterations = 1
      errorBudget = 1
      if (a.reviewerModel !== undefined || a.reviewerProvider !== undefined) {
        throw new Error('Gibson reviewerModel/reviewerProvider only apply in loop mode')
      }
    }
  } catch (e) {
    return { ok: false, error: 'Gibson request rejected: ' + (e instanceof Error ? e.message : String(e)) }
  }

  if (loop) {
    return runGibsonLoop(root, { runner, repoSlug, runnerTimeoutSec, maxBudgetUsd, safeMode, maxIterations, errorBudget, reviewerModel, reviewerProvider }, exec, execute)
  }

  // PLAN — render-only, no runner invoked (printPrompt: true, confirmed by
  // direct read of loop.sh to exit before any claim/runner step).
  const planArgs = gibsonLoopArgs({
    runner, repo: root, repoSlug,
    maxIterations: 1, errorBudget: 1, runnerTimeoutSec,
    once: true, printPrompt: true,
  })
  const planTimeoutMs = (runnerTimeoutSec + 60) * 1000
  let planResult: { code: number; stdout: string; stderr: string }
  try {
    planResult = await exec(LOOP_SCRIPT, planArgs, { cwd: GIBSON_DIR, timeout: planTimeoutMs })
  } catch (e) {
    return { ok: false, error: 'Gibson plan stage failed or response unavailable: ' + (e instanceof Error ? e.message : String(e)) }
  }
  if (planResult.code !== 0 || !planResult.stdout.trim()) {
    const diag: GibsonRunResult = { args: planArgs, exitCode: planResult.code, stdoutTail: tail(planResult.stdout), stderrTail: tail(planResult.stderr) }
    return { ok: false, error: 'Gibson did not render a prompt (plan stage): ' + JSON.stringify(diag) }
  }
  const prompt = planResult.stdout.trim()

  if (planOnly) {
    return { ok: true, result: { stage: 'plan', prompt, args: planArgs } }
  }

  // EXECUTE — via the existing Workspace launcher, never Gibson's own runner.
  try {
    const result = await execute(prompt, { root, maxBudgetUsd, idleTimeoutMs: runnerTimeoutSec * 1000, safeMode })
    return { ok: true, result: { stage: 'executed', prompt, ...result } }
  } catch (e) {
    return { ok: false, error: 'Gibson execute stage (via Workspace launcher) failed: ' + (e instanceof Error ? e.message : String(e)) }
  }
}
