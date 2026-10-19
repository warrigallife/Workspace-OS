# Local Python-function pilot

This is a restricted artifact workflow, **not a general-purpose agent team**. It accepts a description of one standalone Python `solve(value)` function plus 1–12 user-authored JSON input/expected checks. It cannot inspect or modify a repository, research arbitrary files, run a shell, install dependencies, or work on the canonical archive/manuscripts.

## Use the verified route

1. Double-click `~/Desktop/Workspace OS — Local Python Pilot.command`. Quit an already-open local Workspace OS instance first so it loads the current build.
2. Click **Enter → Agents → Local Python pilot — execute, review and save**.
3. Keep the supplied sum-list example for the verified pilot, or enter another task within the restricted function scope. Supply independent expected values, then click **Run local team**.
4. Open **View result and evidence**. Only **Reviewed and saved** means actual execution passed the supplied checks, Nora approved, and the handover and evidence checkpoint were saved. Inspect the result; passing examples is not proof of general correctness.

The Desktop launcher delegates to the repository's executable `Local Team Workspace OS.command`, which reuses `scripts/liam-ada/launch.sh`. It builds this checkout and uses the established `.workspace-os/liam-app-data` directory, its existing workspace setting and conversations. It never replaces `/Applications/Workspace OS.app`. Desktop launcher permissions were verified as 0755. `desktop-launch.json` records the actual app path/data/title and pilot-panel check. Normal specialist **Run** buttons remain separate existing provider routes; use the **Run local team** button for this local-only pilot. Liam–Ada remains available through its existing separate Run flow.

## What runs

The existing profiles are read and snapshotted for each attempt: **Reid — Warrigal Suite Keeper → Nora — Workspace Auditor → Marguerite — Continuity Keeper**. No profiles or grants were expanded, no agents were registered/spawned in Ruflo, and Liam received no delegation access. Project-profile precedence follows the existing Workspace OS profile loader.

The existing `launchRun` entry point branches into the pilot before cloud credentials, provider settings, memory recall or bridge grants are loaded. A separate instance of the existing persistent `RunQueue` serializes local tasks. It uses a fixed environment without inherited API keys, proxies, MCP configuration or WOS bridge credentials. The fixed endpoint is `http://127.0.0.1:11434`, redirects/proxies are disabled, and the installed `llama3.2:latest` digest is checked before work. There is no pull/download, cloud fallback or provider selection. Ollama structured-output schemas constrain response shapes; they do not establish correctness.

Ruflo's installed task handlers are reused directly for task IDs, status, progress and evidence-linked completion. They write only the attempt's `.claude-flow/tasks/store.json`. No MCP server, daemon or swarm is started. Dependencies are recorded and enforced by this sequential coordinator; the Ruflo task handlers are **not claimed to schedule dependencies themselves**. Other projects' ledgers are untouched. A missing/broken installed Ruflo handler blocks the attempt rather than silently substituting bookkeeping.

## Enforced worker boundaries

- Reid receives the task, input examples and saved persona, and can return only candidate text. The coordinator executes the candidate in a separate Python process with macOS Seatbelt: no user-file contents, writes, network or forks. Runtime files, the fixed worker script and filesystem metadata are permitted. Restricted Python AST and builtins additionally deny imports, file APIs, private attributes, recursion and arbitrary tools. This is independent of Safe/Full labels and persona prose.
- The worker has a two-second CPU limit, five-second wall timeout per check, limited AST/input/output sizes and no executable tool interface. macOS rejected a hard data-memory limit; **a hard RSS/address-space cap is not claimed**. This pilot is not appropriate for adversarial or resource-intensive programs.
- Nora receives task, candidate and actual execution evidence; no tools or write access. Her separate local inference must return an explicit approval. Rejection, malformed review, failed checks or missing evidence blocks completion. This is role separation using the same model, not model/provider diversity or a guarantee of review quality.
- Marguerite receives only task/results/review for a continuity note. The trusted coordinator, not the model, saves the handover and authoritative execution/status evidence. Model-authored notes are labeled as such.
- The app rechecks execution/review and artifact hashes before reporting success. Checkpoints reuse `CheckpointStore` against the disposable attempt folder, never the open project or archive. Initial task/profile snapshots and final evidence are retained there.

## Persistence and recovery

Queue: `.workspace-os/liam-app-data/local-team-queue.json`. Attempts: `.workspace-os/liam-app-data/local-team/bg-…/`. Each contains task/profile input, prompts and raw local replies, candidate, actual execution, review, state, handover when available, Ruflo records and a shadow Git checkpoint store. Writes to the queue use atomic rename; unreadable/corrupt local queues fail closed. Up to ten active/queued submissions are accepted; the existing queue retains its latest 100 cards, while attempt folders remain on disk.

**Cancel** stops the process group and prevents successful completion. On restart, previously running/queued local jobs become **interrupted** and do not restart automatically. **Retry as new attempt** preserves original evidence and records `recoveredFrom`; it re-executes the task instead of pretending to resume an unfinished model response. Changed tasks/checks are a new submission, not a silent repair. A parent-pipe watchdog also terminates the worker group when the app disappears; the live restart acceptance covered orderly shutdown, not a forced machine crash.

An interrupted attempt's last `state.json` can still say `running` if shutdown cut off its final write. The queue's `interrupted` status is authoritative for liveness. Cancelled/interrupted cards may initially lack a final checkpoint ID; the attempt's initial shadow checkpoint and retained files remain available. Do not interpret a stale stage snapshot or Ruflo row as completed work. Ollama may finish an already submitted inference after client cancellation; no subsequent workflow stage is authorised by that.

Recoverable originals are in `pre-team-recovery.tar.gz` with paths and SHA256 hashes; the parent Git checkpoint `a4a1bce` also preserves every previously tracked file. Existing app data was copied privately to `.workspace-os/local-team-recovery/app-data-before-pilot` after gracefully closing the old local instance. This private copy is ignored by Git and not indexed by Ada. To roll back, quit the local app, inspect/extract selected originals into an isolated copy, and restore only this integration's changes. Keep all attempt/evidence folders and earlier prototypes/checkpoints. Do not restore an entire old app-data directory over newer conversations. No rollback execution is claimed for this change.

## Verified results and limitations

See `implementation-log.md` and `acceptance/`. Real UI/local inference demonstrated a sum-list function passing three actual checks, Nora approval, saved handover and checkpoint; a second completed attempt was produced by restart recovery. Intentional incorrect expected output failed after the worker actually returned 6 versus expected 7. The rejection drill passed execution but Nora rejected it, blocking completion. Cancellation and restart/retry passed.

Earlier failures are deliberately retained: Llama treated integers as strings, produced an incomplete JSON response, and returned `print(1)` instead of a function. Providing typed input examples and a structured-output schema enabled the verified pilot, but arbitrary-task reliability remains unproven. There is no cloud fallback. Since the bounded-repair update below, generation/validation/execution failures may receive at most two local repairs; review rejection is never automatically retried. Expect explicit failures on unsupported syntax or weak local-model output. This is not ready for autonomous repository maintenance.

Repeat checks (native modules remain Electron-targeted):

```sh
python3 -B scripts/local-team/check.py
ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron node_modules/vitest/vitest.mjs run src/main/runs/queue.test.ts src/main/agent/localTeam.test.ts
npm run typecheck
npm run build
node scripts/local-team/live-check.mjs
```

The last command performs real **local** inference in disposable app data and writes acceptance evidence; it should be run deliberately, not as an automatic startup test. `--remaining` skips the initial successful pilot when reconciling partial acceptance. `node scripts/local-team/desktop-check.mjs` verifies the Desktop route without inference; first quit the existing local instance. No cloud tests, downloads, new credentials, dependency upgrades, pushes, canonical edits or installed-app replacement were performed.

Compiler check caveat for this checkout: the final node compiler returned 70 known diagnostics with exit status 1, which `npm run typecheck`'s existing wrapper rejects. Direct comparison against its unchanged 75-error baseline found zero new diagnostic counts, and the renderer check exited cleanly. This is a documented wrapper/baseline limitation, not a claim that the project type-checks with zero errors. Builds and the focused/runtime checks above passed.


## Bounded generator repair (2026-10-19)

The generator now receives a contract generated from the **same worker allowlists** used to validate and execute its code: exact builtins, methods and AST constructs, function shape, and limits. In particular, `set()` is allowed but `.add()` is not; the sandbox and permitted operations were not expanded. A candidate must parse and compile as Python, define exactly one `solve` function with one positional argument (the prompt uses `value`), and satisfy the existing restricted AST/call/attribute rules **before any execution subprocess is launched**. The worker repeats validation inside the sandbox.

`validation.json` contains diagnostic kinds, messages and line/column locations where available, and distinguishes validation from actual execution. Diagnostics include the denied call (for example `seen.add`), invalid syntax or missing function structure. These are visible in **View result and evidence** and the run output.

Each workflow allows one initial candidate plus **at most two local repairs**. Repair prompts include the unchanged task, worker contract, previous candidate and exact validation/execution failures. Only candidate code changes; user expected results remain unchanged. Every candidate, prompt, raw response, validation and any execution result is preserved under `attempts/attempt-0`, `attempt-1`, `attempt-2`. Root-level files show the latest candidate, while numbered attempts are retained. Accepted evidence hashes include those attempt artifacts. Missing service/model, cancellation and infrastructure failures do not trigger a model fallback; Nora rejection does not trigger another generation/review loop. The existing six-minute overall deadline still applies and can stop work before all repairs are used.

The original failed workflows `bg-mvey334q-dwptl6` and `bg-mvey7aeh-dl4ln8` remain untouched and are also preserved in `pre-bounded-repair-recovery.tar.gz`, together with the pre-change source/docs and a SHA256 manifest. `scripts/local-team/duplicate-removal-check.mjs` submits the first saved task through the Desktop-launched real UI, compares all four checks with both originals, retains the result, and never resubmits automatically after failure. See `duplicate-removal-verification/result.json` for the observed outcome, not a model's claim.

**Observed duplicate-removal outcome: blocked.** The real UI run `bg-mvezq8gz-aqya3i` preserved the original four checks but Llama generated denied `seen.add(item)` on all three candidates. Each was rejected before execution; review never ran. The task did not succeed. Detailed diagnostics and all candidates are saved in `duplicate-removal-verification/`; the failure checkpoint is recorded in `result.json`. No further model retries were made after this result. The repair mechanism is bounded and tested, but the installed model still cannot reliably satisfy this task's permitted-operation contract.
