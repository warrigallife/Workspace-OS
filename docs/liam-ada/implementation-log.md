# Ada–Workspace OS Implementation Log
Date: 18 October 2026 — Australia/Brisbane
Status: Bounded local integration acceptance completed; broader deployment limitations remain.
The initial implementation record below is historical; see continuation results at the end.
Original integration specification remains DRAFT — NOT ADOPTED.

## Decisions and scope
The user selected a new saved global specialist named Liam.
Role: query Ada, report sourced evidence and limitations, and separate interpretation from evidence.
This work implements the initial single-specialist connection.
No swarm configuration, delegation, PRF-specific role or automatic archival write-back was added.
Liam is not technically exclusive: legacy all-grant runs can access evidence.query.

## Saved specialist
Path: ~/.claude/agents/liam.md
Mode: safe
Capability: evidence
Home surface: knowledge
Safe mode and persona instructions do not enforce read-only access across all agent tools.
A saved persona does not establish continuous operation or persistent conversational memory.

## Recovery snapshot
~/Desktop/ruflo-test/ada/workspace-integration-backup-20261018-120131/
Contains originals of capabilityCatalog.ts, grants.ts, actionBridge.ts and liam.md,
plus a manifest recording source paths, Git revision and working-tree status.

## Implementation
Modified in ~/Desktop/Workspace-OS/:
- src/main/agent/capabilityCatalog.ts: registered evidence and command guidance.
- src/main/agent/grants.ts: mapped evidence to the evidence. prefix.
- src/main/agent/actionBridge.ts: routed evidence.query after authorization checks;
  added an evidence-specific matching-open-workspace check.

Created:
- src/main/agent/evidenceAction.ts
- src/main/agent/evidencePermissions.test.ts
- src/main/agent/evidenceAction.test.ts
- ~/Desktop/ruflo-test/ada/ada_workspace_adapter_v01.py

Updated ~/.claude/agents/liam.md with capability and bridge instructions.
Existing Ada service, retrieval code, checker, contracts and checkpoints were not
edited by the implementation commands. No archival write-back was implemented.

## Interface and initial limits
Action: evidence.query
Input: object containing only a nonempty question string.
Question limit: 4000 UTF-8 bytes.
Python adapter request limit: 8192 bytes.
Process output limit: 256 KiB; timeout: 10 seconds; termination signal: SIGKILL.
Fixed Python interpreter:
 /Library/Frameworks/Python.framework/Versions/3.14/bin/python3
Fixed adapter location: ~/Desktop/ruflo-test/ada/ada_workspace_adapter_v01.py
Invocation uses -B -E -s, stdin JSON and no shell.
Adapter calls ada_evidence_service_v03.research(question).
Response preserves schema ada.evidence_response.v0.1, null answer,
UNRESOLVED semantic support and RETRIEVAL_ONLY status.
VERIFIED_MATCH establishes excerpt matching, not truth or governance adoption.

## Verification observed
1. Direct Python adapter query returned parseable evidence JSON with five
   source entries reporting VERIFIED_MATCH and source paths/line ranges.
2. TypeScript compiler availability confirmed: version 5.9.3.
3. Dependency-backed typecheck reported no regressions:
   70 known errors against baseline 75. The project is not type-error-free.
4. git diff --check reported no issues at the recorded check.
5. Macro validation passed.
6. Four targeted test files passed: 42 tests total.
   - Existing grants: 3.
   - Existing bridge: 12.
   - Evidence permissions: 9.
   - Evidence action handler: 18.
7. Permission tests covered authorized routing, missing token, missing grant,
   revoked token, wrong workspace, no open workspace, missing authorization
   dependency, narrow evidence prefixes and legacy all-grant access.
8. Handler tests covered input rejection, fixed invocation/limits, malformed
   responses, retrieval-contract checks and simulated process failures.
   Simulations do not demonstrate actual timeout or output-limit enforcement.
9. App build completed.
10. Electron preview launched after runtime installation and native rebuild.
11. Liam appeared in the specialist roster.
12. Live UI showed wos-action run evidence.query for the governance question.
    Liam reported five VERIFIED_MATCH sources and preserved retrieval-only
    limitations while separating interpretation.
    Raw live tool-response JSON was not independently inspected.
    The visible workspace indicator remained WARRIGAL RESEARCH SUITE;
    a switch to ruflo-test was requested but not confirmed.

## Environment issues and corrections
Initial typecheck success was unreliable while node_modules was absent.
The wrapper can mistake compiler failures without error TS lines for success.
The baseline was not intentionally accepted or changed.
npm ci initially failed on the React-plugin/Vite peer conflict.
npm ci --include=dev --legacy-peer-deps installed 982 packages.
Peer compatibility remains a maintenance issue.
npm reported 44 vulnerabilities: 14 moderate, 29 high, 1 critical.
Install-script warnings were reported; approvals were not comprehensively reviewed.
Electron runtime was missing and installed using its packaged install.js.
Preview then encountered a better-sqlite3 ABI mismatch (147 versus required 146).
npm run rebuild:electron completed; two native addons were signed and verified.
Subsequent startup log did not show that mismatch.
Node-based native tests may require rebuilding back for Node.
The modified preview build has not replaced the installed application.

## Reporting issue
Liam formatted some paraphrases as blockquotes.
Pending instruction refinement: reserve quotations/blockquotes for exact text;
label summaries as paraphrases and retain the original source references.

## Remaining acceptance work
- Inspect and retain raw live bridge response and run/provider details.
- Confirm actual specialist grant issuance and workspace binding in the launcher.
- Test real timeout, output overflow, missing backend and invalid adapter requests.
- Verify no unintended adapter writes; -B alone is not a filesystem sandbox.
- Run broader relevant regression tests and document results.
- Demonstrate rollback in an isolated copy.
- Review source boundary weaknesses, including parent symlinks and filesystem races.
- Verify Codex provider support; do not infer it from the observed Claude run.
- Review dependency vulnerabilities, peer conflict and install-script state.
- Fix the typecheck wrapper's handling of compiler execution failures.
- Review full diff, preserve a local Git checkpoint and reconcile specification status.
- No full acceptance, production-readiness or broader deployment claim is made.

## Rollback plan — not demonstrated
Stop preview. Restore the three modified Workspace OS files and Liam profile
from the recorded snapshot. Remove only the newly added integration and test
files listed above after reviewing intervening changes. Rebuild and rerun checks.
Preserve Ada prototypes/checkpoints, original contracts and the canonical archive.
Dependency installation and runtime/native rebuilds are separate environment changes.

## Continuation results — 18 October 2026, 14:15 AEST

User explicitly authorized completing integration, profile edits, checks, isolated rollback and a recoverable local Git checkpoint. The original specification and evidence contract remain unchanged planning records; this implementation log records acceptance, not adoption of those drafts. No agents, swarms, sources, privileges, OpenAI dependencies or credentials were added. No push/publication, installed-app replacement, dependency upgrade or canonical archive write was performed.

Preserved pre-continuation originals before editing. Recovery copies are now included in Workspace-OS/docs/liam-ada/pre-continuation-recovery.tar.gz and pre-integration-recovery.tar.gz; both include manifests. External profile and adapter copies are also retained there for Git recovery. The original 12:01 snapshot remains untouched.

### Defects corrected
- Actual Claude launcher previously minted unbound grants even though tests supplied bound tokens. launchRun now binds Claude and Codex grants to the launch workspace. evidence.query rejects unbound tokens and requires the matching open workspace. This narrows access; no grants were expanded.
- Typecheck now invokes installed TypeScript directly and fails on compiler execution failure instead of treating missing error-TS lines as success. An isolated missing-compiler check returned failure as required. Baseline unchanged.
- Liam profile now reserves quotation marks/blockquotes for exact text and labels summaries as paraphrases with references. Default is claude:sonnet so global Codex settings do not silently select it (explicit UI selection still overrides the profile). Use a fresh conversation.

### Acceptance evidence
- 150 broader agent/permission tests passed with local socket access.
- 216 tests across 25 files passed under Electron's Node runtime: agent, agent-permissions and memory regressions, including real subprocess failures. Native modules remain Electron-compatible; no Node rebuild was done.
- Real subprocess timeout killed the 30-second fixture with SIGKILL at the production 10-second deadline. Actual output overflow reported ERR_CHILD_PROCESS_STDIO_MAXBUFFER. Missing script failed safely. Fixtures were isolated; production Ada was not replaced.
- Python adapter check passed nine invalid inputs, an isolated missing backend, five exact source/line comparisons, and retrieval-only contract assertions. Ada directory hashes and all six approved source content hashes stayed unchanged across the checks. This is observed behavior, not a filesystem sandbox guarantee. No parent symlinks were present for returned sources; source containment and TOCTOU prevention remain unresolved.
- Real Electron UI IPC loaded saved Liam and launched Claude with the exact Safe allowlist: Read, Glob, Grep, Write, Edit, Bash(wos-gen:*), Bash(wos-action:*). Token/socket presence and cwd were captured without recording the token.
- A deterministic child probe through that actual launcher/socket successfully queried evidence, rejected a missing token, denied browser.navigate, and rejected the same token after the workspace context changed. Report: launcher-permissions.json.
- Live Claude run succeeded: two turns, CLI-reported models claude-sonnet-5 and claude-haiku-4-5-20251001, cost metadata $0.1719384, code 0. Raw bridge JSON independently extracted and retained in live-bridge-response.json; all five excerpts independently matched their referenced files/lines. answer=null, RETRIEVAL_ONLY and UNRESOLVED preserved.
- New live response used the exact sentence from Constitution line 40 as a quotation and labelled subsequent prose as a paraphrase. Retained in live-liam-response.md. This corrects the presentation going forward; old chat history remains historical, not verified quotation evidence.
- Missing grant, revoked token, wrong workspace, no open workspace, no authorization dependency, unbound token and legacy all behavior are covered by permission tests. Legacy all access remains available to workspace-bound runs; Liam is not exclusive. memory.search remains an existing baseline permission.
- Rollback demonstrated in an isolated source copy using preserved originals, including original profile and adapter removal in the copy; 15 original bridge/grant tests passed. Live files were not rolled back. Repeated using committed recovery archives, not reliance on temporary recovery paths.
- Build and macro validation passed. Typecheck: 70 known errors / baseline 75; no new regressions, not type-error-free. git diff --check clean.

### Test harness corrections and launch verification
Initial sandbox socket tests failed with EPERM; rerun with socket access passed. An early backup beneath the repository was accidentally discovered as a test suite; it was moved out and archived before the clean run. Live harness initially assumed ~/.local/bin/claude; actual binary is /opt/homebrew/bin/claude. Canonicalized macOS /var versus /private/var paths in the harness. Direct launch of out/main/index.js missed resource installation, causing wos-action command-not-found; corrected to launch the project directory. A first permission probe half-closed its socket too early; fixed to wait for the asynchronous response. These failed harness attempts are not counted as successful acceptance.

Verified repeatable launch: `cd ~/Desktop/Workspace-OS && sh scripts/liam-ada/launch.sh`. The script built successfully, loaded Electron native modules and opened the local app using separate `.workspace-os/liam-app-data` and `.workspace-os/liam-workspace`. Updater reported disabled for unpackaged development. Select Liam, Safe, Claude/Sonnet, and start a fresh chat. Detailed instructions and commands: Workspace-OS/docs/liam-ada/README.md.

### Provider and maintenance limitations
Ada uses local Python without provider dependencies. Liam's verified route uses existing Claude CLI/auth; no OpenAI runtime credential or dependency was added. Existing Codex text helpers strip WOS_AGENT_TOKEN; existing interactive Codex sessions instead expose a grant-checked structured workspace_action callback. Existing unit regressions passed, but live Codex–Ada was not exercised and is not promised. CLI model labels do not independently establish the backend vendor. Provider parity is not an acceptance claim.

Safe mode still permits file writing; source text remains a prompt-injection risk. No new source sandbox, parent-symlink containment or race elimination was introduced. No comprehensive all-application regression claim is made beyond the relevant 216 tests.

Dependency review: installed @vitejs/plugin-react 4.7.0 supports Vite 4–7; installed Vite is 8.0.16. Build passed with compatibility/deprecation warnings. Previous 44-vulnerability installation report remains unresolved; offline npm audit returned zero but cannot establish current advisory clearance. ignore-scripts=false; lockfile flags install scripts for better-sqlite3, node-pty, esbuild and fsevents (two versions). No dependency or install-script remediation was attempted. No external-provider or advisory freshness claim is made.

### Local checkpoint
All source changes, repeatable checks, corrected profile/adapter copies, raw response evidence and recovery archives are included in the local Git checkpoint titled `Complete bounded Liam-Ada integration and acceptance checks`. No push. The external log mirrors this record; use Git history to identify the checkpoint hash, avoiding a self-referential hash in its own contents.
