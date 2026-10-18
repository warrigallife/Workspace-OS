# Ada–Workspace OS Implementation Log
Date: 18 October 2026 — Australia/Brisbane
Status: Bounded local integration accepted; limited 15-file retrieval expansion verified. Broader deployment limitations remain.
Authoritative copy: ~/Desktop/Workspace-OS/docs/liam-ada/implementation-log.md. Ada-directory copy is a non-indexed mirror.
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

## Limited source expansion — 18 October 2026

The user explicitly authorized adding existing Liam–Ada integration records to retrieval. This supersedes the earlier six-source-only scope for this limited change. It does not authorize additional agents, broader tool privileges, whole-directory indexing, or archive writes. The authoritative integration implementation-log copy is `~/Desktop/Workspace-OS/docs/liam-ada/implementation-log.md`; the Ada-directory file is a maintained mirror and is NOT indexed.

Preserved recoverable originals before editing: service v0.3, saved Liam profile, README, profile copy and both implementation-log copies, with source paths and SHA256 hashes in `pre-source-expansion-recovery.tar.gz`. The updated external service has a Git-tracked recovery/deployment copy at `docs/liam-ada/ada_evidence_service_v03.py`. Existing Ada checkpoints, v0.4 retrieval algorithm, checker, specification, contract and all six original source files were left unchanged.

### Exact added paths and provenance

Paths relative to `~/Desktop/ruflo-test/ada/`:
- ADA_WORKSPACE_OS_INTEGRATION_SPEC_v0.1_DRAFT.md — draft_specification.
- ADA_WORKSPACE_OS_EVIDENCE_CONTRACT_v0.1_DRAFT.md — draft_contract.

Paths relative to `~/Desktop/Workspace-OS/docs/liam-ada/`:
- implementation-log.md — implementation_record (one authoritative copy).
- README.md — operating_instructions.
- launcher-permissions.json — test_observation.
- live-launch.json — test_observation.
- live-bridge-response.json — test_observation, a historical raw response, not a fresh source query.
- live-liam-response.md — agent_interpretation, observed model output, not independently validated claims.

Saved profile: `~/.claude/agents/liam.md` — saved_profile. The profile copy in docs is NOT indexed.

The original six paths remain first in the allowlist, followed by these nine files, for 15 distinct files. No globs, directory scans, archives, source-code files, credentials, tokens, duplicate log/profile copies, or new acceptance-report files are indexed. Historical bridge response excerpts repeat earlier source text as test evidence; provenance labels prevent treating that record as a fresh observation of those documents.

### Sensitive-content review and meaning of records

Reviewed the candidate Markdown and structured JSON files before inclusion. Acceptance JSON contains local paths, permission names, model/usage metadata and boolean tokenPresent/socketPresent fields, but no token values, credentials, raw environment dumps or private keys. Pattern checks for credential assignments, bearer values and common private-key/token formats also found no matches. This is a bounded review of these records, not a guarantee against future sensitive edits. These files remain live on-disk sources; review content before adding future secrets to them.

New-source entries have additive `record_kind` and `record_note` provenance fields. Existing original-source entries and top-level schema are unchanged. Labels distinguish historical unadopted drafts, dated implementation claims, instructions, test observations and model interpretations. They do not establish truth or make old test results current. The draft contract remains a historical interface proposal; its old statement that integration is unimplemented is not silently updated or adopted. Later dated implementation records report the implemented behavior.

Liam now explicitly explains that bridge token identity, capability grants and workspace binding are technically enforced, while Safe mode's independent Write/Edit tools remain writable. Persona no-write instructions are behavioral constraints, not a technical filesystem sandbox. A fresh conversation loads the updated profile. Existing provider limitations remain unchanged; no OpenAI dependency or credential was introduced.

### Validation

`python3 -B scripts/liam-ada/source-check.py` verifies the exact 15-path list, distinct resolved paths, sensitive-pattern scan, retrieval of each of the nine additions through the installed Python adapter, provenance metadata, retrieval-only invariants, all six original files still retrievable from the expanded corpus, and 116 byte-identical original excerpt sections with unchanged rankings when restricted to the original six-source corpus. All approved content hashes remain unchanged across the checks. Expanded-corpus top-five rankings can differ; no claim of identical global ranking is made.

`python3 scripts/liam-ada/adapter-check.py` verifies five returned excerpts, nine invalid requests, missing backend behavior, unchanged Ada directory inventory and unchanged content hashes of all 15 approved source files. The evidence/grant/bridge regression selection passed all 46 tests across five files under Electron's runtime, preserving the installed native ABI. Electron emitted task_name_for_pid diagnostics in the restricted environment; the tests completed successfully. Detailed results are retained in `source-expansion-checks.json`; the demonstration question and retrieval response are in `source-expansion-response.json`. Neither new evidence file is automatically added to retrieval.

Recovery for this limited change: extract `pre-source-expansion-recovery.tar.gz` to a separate directory, verify its manifest hashes, and restore the listed service/profile/docs originals after checking for intervening edits. This restores the six-source service without removing the previously verified bridge integration. No recovery archive is indexed. Changes are checkpointed locally; nothing is pushed.

## User-facing unknown-action diagnosis and routing fix — 19 October 2026

The user reported `{ "ok": false, "error": "unknown action: evidence.query" }`. Earlier isolated tests did not establish that the installed application used by the user contained the integration. Diagnosis resumed from the existing two-socket finding; the integration and source expansion were not restarted.

### Cause and chain of evidence

- Failed Claude session: `ebc4ea2d-ea53-4492-9e40-b24ef09953fc`; exact tool error recorded at `2026-10-18T04:41:50.958Z`, cwd `~/Desktop/WARRIGAL RESEARCH SUITE`.
- The normal app-data conversation map binds `dock-convo-agent-1792298299009-2` to that session. No matching entry exists in the persistent local Liam map. Thus the failed run belongs to the normal installed-app session, not the local verification instance.
- Installed app PID at diagnosis: 48826, `/Applications/Workspace OS.app/Contents/MacOS/Workspace OS`; app bundle `/Applications/Workspace OS.app/Contents/Resources/app.asar`. Its extracted main bundle has no evidence.query string/handler. SHA256: `113dfceae8cb8c13a0184cbb7baa2e8913cc8fdb0b65ca14b17ce578239df549`.
- Its socket owner was PID 48826 at `~/Library/Application Support/workspace-os/wos-agent.sock`. A read-only socket context request confirmed Agents surface and Warrigal workspace. Normal app data: `~/Library/Application Support/workspace-os`.
- Local app PID at diagnosis: 48190, repository Electron executable, project-directory app path, `.workspace-os/liam-app-data/wos-agent.sock`, scratch workspace `.workspace-os/liam-workspace`. Its compiled main contained evidence.query. The prior local main hash was `e9f0a50f2e54c26630b223d21b0f2406ef37ce9c87bce5a8db26e0909fd03fa1`.
- Both apps could display the global Liam profile. That does not add a main-process handler to the older installed bundle. The unknown-action reply was therefore caused by launching the wrong app/build, not by Ada sources, models, missing credentials or the verified local handler.

### Fix and preservation

Added executable `~/Desktop/Workspace-OS/Liam Workspace OS.command`, delegating to the existing `scripts/liam-ada/launch.sh`. The launcher still builds the local source and uses the same persistent local app-data directory. It prints the target and sets a local-launch flag. That flag labels the actual window `Workspace OS — Liam (Local)` and gives its Dock icon a Liam badge. The normal installed app is not modified, replaced, redirected or claimed to support Ada. Normal app data and conversations are not migrated or edited. No providers, models, integrations or bridge privileges were added.

Before changes, selected source/docs originals were preserved with SHA256 manifest in `pre-routing-fix-recovery.tar.gz`. Existing local app data was also copied privately to `.workspace-os/liam-routing-recovery` (transient sockets/caches excluded); it is ignored by Git and not indexed. The existing local Electron instance was quit gracefully to restart it with the new label; the installed app remained untouched.

### Actual user-facing acceptance, not just IPC harness

`node scripts/liam-ada/user-run.mjs` executed the exact named launcher with the existing persistent `.workspace-os/liam-app-data`. It clicked the startup Enter button, Settings → Safe → Close, Agents → Liam → Run, filled the real dock prompt (`Ask the agent — @ file, / skill…`) and pressed Enter. No direct agent.run call, fake CLI, temporary userData, token minting or provider override was used. Playwright supplied temporary inspector flags solely for UI automation; ordinary launcher use does not enable them.

Verified process PID: 53097. Actual app path: `~/Desktop/Workspace-OS`; title: `Workspace OS — Liam (Local)`; socket: `.workspace-os/liam-app-data/wos-agent.sock`; workspace: `.workspace-os/liam-workspace`. Verified main-bundle SHA256: `6b244858abe6b4761d68713177a33706b33f830c479370a5a584779f1fa42f37`.

User-facing run `dockrun-1792346604053-132554`, conversation `dock-convo-agent-1792346604010-2`, Claude session `87459acd-084d-4a30-bd79-b88a88302ce0` completed with code 0. The transcript's actual tool response returned five excerpts with VERIFIED_MATCH, null answer, RETRIEVAL_ONLY and UNRESOLVED. Every excerpt was independently compared to its source lines. Sources included the saved profile, README and implementation log, addressing bridge grants versus broader Write/Edit access. Provider-reported metadata: two turns, 23.690 seconds, $0.2133166, claude-haiku-4-5-20251001 + claude-sonnet-5. These are reported labels, not a backend-vendor audit.

Sanitized identity/correlation report: `routing-verification.json`. Actual evidence reply: `user-run-bridge-response.json`. Private screenshot, UI output, identity and conversation correlation artifacts are in `.workspace-os/liam-user-run`. Neither new report is added to Ada's allowlist. No tokens or credentials are recorded in the retained reports.

Initial UI-driver attempts stopped before a provider call: one did not click the splash Enter button; one looked for the legacy console's prompt rather than the current dock's prompt. The successful driver uses the real current controls. The roster dock takes its mode from Settings, so Safe was selected there; the saved profile supplies Claude/Sonnet. This corrects earlier ambiguous instructions about a per-tab Safe/model selector.

Build succeeded through the actual launcher. Typecheck still passes against the unchanged baseline (70 existing errors, baseline 75). Shell/JavaScript syntax checks and diff whitespace checks passed. Existing adapter/permission tests were not rerun unnecessarily because the handler, grants and retrieval code were unchanged; the end-to-end user-facing evidence response is the acceptance for this routing change.

Unambiguous launch: open `~/Desktop/Workspace-OS/Liam Workspace OS.command`; use the window titled `Workspace OS — Liam (Local)`, then Enter → Agents → Liam → Run. Safe is now selected in this local app's Settings. Do not use the installed `/Applications/Workspace OS.app` for Liam–Ada; it remains the older build. All earlier source-boundary, writable Safe-mode and dependency limitations remain. This fix is checkpointed locally without pushing.
