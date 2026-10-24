# Restricted Claude → Claude handover — 2026-10-21

Implemented following explicit workflow-only approval. Dana and Nora both select `claude / claude-sonnet-5`; each opens a fresh process/session, with no resume, fallback or shared transcript. This is separate-context review, not provider/model diversity. Global profiles and normal specialist routing are unchanged.

## Connection and boundary

`src/main/agent/providers/claudeResearch.ts` implements streaming JSON transport using the controls already documented in `../native-host-boundary/claude-help.txt` (Claude Code 2.1.267). Both sessions disable native tools (`--tools ''`), ambient customizations (`--safe-mode`, empty settings sources, disabled slash commands), and MCP connections (strict empty configuration). Restricted mode, no Chrome and no session persistence are explicit. The child environment is constructed without inherited cloud keys, bridge tokens, connector variables or proxy overrides. Existing Claude authentication is not modified.

Lookup intents are returned as JSON text and dispatched only by the existing coordinator through its exact grants. Final JSON still passes the existing save handler, source/quotation checks and independent review gate. Only approved staging outputs can be saved. The adapter rejects unexpected native tool/control events, nonempty initialized tools/connectors, model substitution, missing usage, malformed lookup output, truncation, oversized responses and interrupted sessions. Cancellation closes the process and escalates termination after two seconds. Normalized successful replies retain native event evidence in existing event records.

Existing action/step/deadline/context/token budgets remain unchanged. An explicit future dollar cap is required and divided equally between sessions using documented `--max-budget-usd`; test values are synthetic, not authorization. Token accounting remains the coordinator's post-response ceiling, not a promise that a provider can never overshoot a token ceiling within one response.

## Verified scope

- 99 deterministic tests in 11 files passed, including the new stream transport and end-to-end adapter/coordinator fixtures for success, rejection, fabricated quotation and failed handover save. Existing queue interruption, cancellation, failed-save, grant and citation regressions passed.
- 75 additional Liam–Ada tests in two files passed. Total: **174 tests / 13 files**.
- Build passed. Typecheck: no new errors (70 known; baseline 75, unchanged). `git diff --check` passed.
- Six preserved originals verified by SHA-256. Seven protected inputs (scope, contract, grants, permission definitions and Dana/Nora/Liam profiles) hash-identical.
- Zero live provider sessions, inference calls or research-content transmissions. No downloads, global permission/profile edits or pushes.

## Blocked / exact next action

Live execution is deliberately blocked both at the production research entrypoint and at the adapter's default launcher with `RESEARCH_LIVE_NOT_APPROVED`. There is no UI, queue, environment or IPC unlock. Only trusted test injection can exercise the transport today. The pinned installed binary path is dormant; this work did not start it.

Deterministic tests establish our protocol handling and coordinator boundaries, not actual host behavior, model availability, authentication, spending or semantic review quality. The saved control documentation supports the requested flags; installed runtime compatibility and exact model identity remain to be verified live. No alternative model is selected if unavailable.

Next action: obtain explicit approval for one bounded Claude → Claude UI test, transmission of the two already-approved records, and a numeric total USD ceiling. Then add the narrowly scoped live authorization connection, confirm the pinned host and exact model without substitutions, and perform that single test. Fail closed if the host cannot meet the controls or exact model. Do not present this checkpoint as a working live research team.

Recovery: `originals/manifest.json` identifies preserved pre-change files and hashes; `preservation-verification.json` records verification. Earlier checkpoints and failure evidence remain intact. Restore individual originals only if needed; do not overwrite later user work.


## 2026-10-21 — Authentication discovery correction

The restricted child environment now preserves `USER` alongside its four existing variables. No other environment inclusion or restriction changed. Normal Workspace OS inherits this metadata; the restricted adapter previously omitted it. Both executable paths resolve to the same Claude Code binary. Metadata-only comparisons established that adding USER alone restores discovery of the existing account; adding LOGNAME alone did not. Earlier unauthenticated results described the restricted environment, not the user's normal Claude account.

Verified after the fix using `claude auth status --json` outside the sandbox with the exact restricted environment: loggedIn=true, authMethod=claude.ai, apiProvider=firstParty, subscriptionType=pro. Saved evidence contains only those status fields and environment variable names. No inference, credential or billing changes occurred. This establishes authentication discovery, not model entitlement, paid-extra-usage settings or end-to-end inference compatibility.

68 focused deterministic tests passed across six files, including the exact environment allowlist, separate sessions, native tool rejection, cancellation, failed saves, grant/source checks and production live gate. Four pre-change originals were SHA-256 verified in [recovery evidence](../claude-user-auth/manifest.json). See [status metadata](../claude-user-auth/auth-status.json) and [test results](../claude-user-auth/tests.txt).

Live inference remains blocked. Before any live UI test, confirm exact model entitlement and billing controls and obtain specific content/spending approval. Correction to the prior spending wording: `--max-budget-usd` is a client-estimated stop threshold, not a guaranteed invoice ceiling; Anthropic documents possible overshoot (https://code.claude.com/docs/en/cli-reference). No new ceiling or billing setting is approved by this authentication fix.


## 2026-10-21 — Single approved subscription-only UI verification failed

Run `bg-mvhme2ov-p65r04` failed in Dana's first response with `Claude model substitution`. No accepted response, retrieval, draft or Nora review. The offending native model identifier was not retained by the failure path, so an identifier mismatch versus actual substitution cannot be distinguished from saved evidence. No retries or model substitutions were initiated. Subscription credits remained off per user confirmation; no billing/credential changes. Token/cost usage is unverified.

The UI used the existing local app/data directory and displayed the failure handover; reports and checked prior failures were unchanged. Run checkpoint: `9894f5b86720af2667920ca160ddb0c980de322a`. Temporary one-use routing was restored to the prior live-blocked source after the attempt. Detailed evidence and recovery copies: `docs/jufe-route-assessment/claude-live-once/` (including `handover.md`). Stopped after this one attempt.


## 2026-10-21 — Deterministic model-identity diagnostics

Installed Claude Code 2.1.267 inspection confirms full IDs and configurable short aliases are distinct, and host-generated assistant/API-error messages can report `<synthetic>`. The old adapter mislabelled that sentinel as substitution. No evidence establishes that this caused the c66a79d failure; its native event remains unavailable.

Exact approved `claude-sonnet-5` matching remains required. No alias/date/suffix normalization or fallback was added. Synthetic/error messages fail with accurate classifications, and sanitized bounded requested/returned IDs plus safe HTTP status now survive in state/outcome/handover. Missing identity also fails closed. Arbitrary error bodies and unsafe model strings are excluded.

66 deterministic tests passed across four files; build passed; no new typecheck errors (70 known /75 baseline). Five originals hash-verified. Live execution remains blocked; no calls or workflow repeat. Evidence: `docs/jufe-route-assessment/claude-model-identity/handover.md`, installed-contract excerpts, tests and recovery manifest.


## 2026-10-21 — Further approved attempt stopped before inference

From 8e3a940, the required preflight reported loggedIn=false / authMethod=none / firstParty / no subscription type in the restricted environment including USER, outside the sandbox. Required Claude Pro subscription-only execution could not be confirmed. Stopped before UI submission, inference or research transmission; no retry. Prior successful auth and the user's credits-off/zero-balance confirmation remain evidence, but do not override this failed preflight. Cause not diagnosed.

Live block remained unchanged, corrected identity diagnostics preserved, no runtime/credential/billing changes. Saved result and recovery copies: `docs/jufe-route-assessment/claude-live-identity-preflight/`. No automatic pending attempt.


## 2026-10-21 — Approved UI attempt after sign-in stopped on protocol event

Run `bg-mvhn6ipe-w74jo5` failed in Dana's first request: `Unexpected Claude protocol/control event`. No accepted response, retrieval, draft or Nora review. The generic failure path did not retain event type/body, so further cause is unproven; no retry was made. Corrected identity diagnostics remained intact. UI result/handover displayed; source reports and checked prior failures unchanged. Run checkpoint `ad65b230d9b1e7f501ba94cd30f97a4b0101a591`.

Before launch, 63 deterministic tests passed; typecheck had no new errors. Eight originals hash-verified; temporary runtime/UI routing restored and live-blocked app rebuilt. No billing/credential changes, automatic retries or alternate model selected. Usage totals unverified. Saved evidence: `docs/jufe-route-assessment/claude-live-after-signin/handover.md` and adjacent files. Stopped after one submission.


## 2026-10-21 — Deterministic Claude protocol classification and rejection evidence

Static installed-contract inspection confirms explicit non-action lifecycle events; the old adapter rejected non-system notices indiscriminately and silently ignored all system subtypes. Added narrow lifecycle handling (heartbeat, validated status/informational and allowed non-overage rate-limit notices). Controls/tools, unsupported system events, fallback/permission changes, blocked rate limits and active paid overage remain rejected. No grants, model policy, sources or budgets broadened.

Rejections now persist sanitized event type/subtype and fixed reason; corrected model-identity diagnostics retained. Event bodies, credentials/research content and JSON parser excerpts are excluded. The event behind 0eb5708 **cannot be reconstructed** from existing evidence; no live cause is claimed. 108 deterministic tests in five files passed; build passed; no new typecheck errors (70 known /75 baseline). Five originals hash-verified. No calls or UI retry; live block unchanged. See `docs/jufe-route-assessment/claude-protocol-events/handover.md` and evidence.


## 2026-10-21 — Single UI attempt from 7062aa9 rejected mixed-model usage

Run `bg-mvhxrby3-v7n62j` stopped on sanitized diagnostic: type=result, subtype=success, reason=model_identity_rejected, phase=result-modelUsage; requested claude-sonnet-5; returned usage IDs claude-haiku-4-5-20251001 and claude-sonnet-5. No alternate model selected by the application. Ancillary host use versus task-generation substitution is not established; no further calls or retry. No accepted lookup/draft or Nora review.

Pro authentication confirmed before submission; no billing/credential changes. Actual UI displayed the failed handover. Run checkpoint `fc419a91ab43797e74c29061a1a7c356be1c1904`. Reports and checked prior failures unchanged. 105 deterministic preflight tests passed; typecheck no new errors. Eight originals hash-verified; live-blocked source restored and rebuilt. Evidence: `docs/jufe-route-assessment/claude-live-protocol-check/handover.md` and adjacent files. Stopped after one submission; no push.


## 2026-10-22 — Per-run Claude/Ollama research routes (deterministic only)

Supersedes the pending Sonnet-only proposal. Dana and Nora now each have an explicit provider/model selection, snapshotted in the queue and saved outcome. Exact initialization/answer identity follows the selection. Additional aggregate usage is disclosed as unattributed in evidence, handover and result display, with cumulative deltas preventing double-counting. Malformed required accounting still fails closed. Only installed local GGUF metadata is accepted for Ollama; no subscription requirement on local-only runs. Llama 3.2 is not research-qualified.

257 deterministic tests /18 files passed, production build passed, typecheck no new errors (70 known /75 baseline). Original snapshots: 16/16 hash verified. Approved sources, grants, review/citation/persistence gates, profiles, Liam–Ada and normal launch path preserved. All cloud/mixed runs remain blocked before any stage; no live calls, model availability claims or UI inference verification. Subscription-only/credits-off, model-access and approved spending prerequisites remain for cloud. Full implementation/limitations/recovery: [per-run route handover](../per-run-routes/handover.md).


## 2026-10-22 — One selected-route Claude Pro UI attempt from fe8ada6

Authentication metadata confirmed Pro; reused the recorded two-report/subscription-only approval, credits-off confirmation and existing bounds. Selected Dana and Nora as Claude / claude-sonnet-5 in the configurable UI; no fixed-model policy, fallback or retries. Run `bg-mvikmp3b-xric67` failed in Dana after one accepted response and both report lookups (lines 1–80): `system/init/restrictions_mismatch` on the following request. No draft or Nora review. First accepted init had empty tools/MCP; repeated-init rejection is possible, but rejected fields are unavailable, so actual restriction drift is not established.

Additional Haiku aggregate usage was disclosed as unattributed. Accepted accounting totals: 3,405 input /97 output, estimated $0.009613; not billing proof or a complete total for rejected processing. Actual UI displayed failure handover. Source reports and seven earlier failed runs unchanged. 131 preflight tests and 66 restored boundary tests passed; typecheck no new errors. Eight originals verified, six runtime files restored byte-for-byte; live block rebuilt and one-use marker retained. No further calls. Evidence and specific next action: [selected-route UI handover](../claude-selected-routes-live/handover.md).


## 2026-10-22 — Repeated-init defect corrected deterministically

From 5b07a7b: first init accepted, then second-request init necessarily hit the old `initialized || ...` rejection before tools/MCP declarations could be checked. This is a demonstrated false rejection; actual rejected declarations are unavailable, so no claim that they were empty or that live success is assured. The working launcher does not reject repeated init but uses one-shot stdin / resume; importing its broader launch environment would violate this boundary. Existing restricted stream transport retained.

Every init now revalidates the selected model and empty tool/MCP arrays; repetition alone is accepted. Missing/malformed and nonempty declarations receive distinct safe reasons. All access/control/billing/citation/review gates and the live block remain. 142 deterministic tests /8 files passed, build passed, no new typecheck errors (70 known /75 baseline). Six originals hash-verified; prior failure preserved. No calls or retries. [Diagnosis, evidence and recovery](../repeated-init-fix/handover.md).


## 2026-10-22 — Single UI verification after repeated-init repair

From 9ed5b37, auth metadata confirmed Claude Pro. One approved UI submission with selected Claude / claude-sonnet-5 for Dana and Nora, recorded two-report and subscription-only bounds. Run `bg-mvimbs76-yofh6q` failed after one accepted response and both report lookups (1–80): `system / <redacted-unrecognized> / unsupported_system_event`. Raw subtype unavailable; no cause inferred. No draft or Nora review. UI failure handover displayed; stopped without retry or another repair cycle.

Six originals verified, four runtime/UI files restored byte-for-byte and live-blocked app rebuilt. Reports and eight checked earlier failures unchanged. Passed tests not repeated. No purchases, credits, fallback or broader access. [Saved outcome and sanitized diagnostics](../claude-reinit-live/handover.md).


## 2026-10-22 — Bounded unknown-subtype diagnostics

Diagnostic-only fix: safe lowercase snake-case subtype identifiers up to 64 characters now survive rejection; malformed, oversized and free-text values stay redacted, with no payload copied. Unknown events still stop; classifier and all access/live-block checks unchanged. Installed Claude contract was statically checked and the existing launcher compared; no new transport. The original bg-mvimbs76-yofh6q event cannot be recovered, and no identity is guessed. Live compatibility remains unverified.

132 focused deterministic tests passed, build passed, no new typecheck errors. Five originals hash-verified. No live calls or permission changes. [Evidence and handover](../subtype-diagnostics/handover.md).


## 2026-10-22 — One UI attempt with safe subtype diagnostics

From 061c10a, restricted-environment auth confirmed Claude Pro. Selected Claude / claude-sonnet-5 for Dana and Nora under the recorded two-report/subscription-only bounds. Run `bg-mvip8uzc-elb3nt` failed after two accepted Dana responses: `Structured finalisation rejected: save.findings[0].citation.quote: must match source verbatim`. No accepted draft or Nora review. Actual UI displayed the failure handover. No protocol-event rejection in this attempt; earlier subtype remains unknown. No retry or repair cycle.

Result, raw accepted responses, usage and diagnostics saved. Reports and nine checked prior failed runs unchanged. Six originals hash-verified; four runtime/UI files restored byte-for-byte and live-blocked app rebuilt. No permanent code changes, billing changes or broader access. [Saved outcome and recovery](../claude-subtype-live/handover.md).


## 2026-10-22 — One bounded Dana draft-validation correction

From 0b115b3: Dana may correct one invalid structured draft using exact validation feedback and already-retrieved passages. Original/corrected submissions preserved separately; both pass through unchanged validation/grants. Second failure stops; Nora reviews only a valid draft. Same session, token/action/step/time/spending budgets; no reviewer correction, source expansion or fresh-session retry. Permission/source/save/provider failures remain immediate stops.

159 deterministic tests /7 files passed, including corrected quote, persistent/unsupported citations, cancellation, deadline and exhausted budgets; build passed; no new typecheck errors. Five originals verified. Live execution still blocked, no calls made. [Implementation/recovery](../draft-correction/handover.md) and [prepared single UI test awaiting explicit approval](../draft-correction/live-test-preparation.md).


## 2026-10-22 — Approved single bounded-correction UI test

From 2a2bbe9, Claude Pro auth confirmed; selected Dana/Nora Claude / claude-sonnet-5 under existing two-report/subscription-only terms. Run `bg-mviq1kty-xiujnx`: original quote rejected, one correction requested and returned, then `Research token budget exceeded` at 49,519 accounted tokens against unchanged 24,000 limit. Third response saved but corrected draft not validated/accepted; no Nora review. Original and returned unvalidated correction, usage, exact failure and UI handover preserved. No further retries or repair.

Six originals verified; four runtime/UI files restored byte-for-byte and live block rebuilt. Reports and ten checked earlier failures unchanged. No broader access or billing changes. [Saved outcome and recovery](../claude-correction-live/handover.md).


## 2026-10-22 — Incremental Claude requests; complete local transcripts

Completed usage diagnosis showed correct accounting but repeated context. Persistent Claude roles now send only new messages and changed metadata after the initial request, rejecting changed history. Finalisation instructions stay once in local history; correction feedback uses exact errors and prior lookup references without copying passages/draft again. Complete local transcripts and both draft attempts remain preserved; actual wire payloads recorded on successful responses. Nora remains independent; stateless Ollama still gets full history.

257 deterministic tests /12 files passed, including three-turn transport/correction/review and retained safety boundaries; build passed; no new typecheck errors. Six originals verified. Validation, permissions, budgets, usage accounting and live block unchanged. No live calls; actual token savings/live compatibility unverified. [Implementation, tests and recovery](../incremental-claude-requests/handover.md).


## 2026-10-22 — Single incremental-context UI attempt

From 039ca48, Claude Pro auth confirmed and existing routes/scope/subscription-only limits reused. Run `bg-mviqojx1-tm4ont`: Dana draft passed application validation without correction; Nora then stopped on `system / thinking_tokens / unsupported_system_event`. No accepted Nora review or completed report. Actual UI displayed failure handover. Dana accepted usage 15,579 tokens; Nora usage unknown because no accepted accounting returned. Per-stage usage and full/incremental transcripts saved. No retry or repair.

Six originals verified; four runtime/UI files restored byte-for-byte and live-blocked app rebuilt. Sources and eleven checked earlier failures unchanged. Budgets, permissions and selected routes unchanged. [Saved result, per-stage usage and recovery](../claude-incremental-live/handover.md).


## 2026-10-22 — Supported system/thinking_tokens notice

Installed schema and producer establish this as approximate thinking-progress metadata, explicitly not authoritative billed output. Narrow lifecycle handling accepts well-formed estimate fields; malformed/action-bearing events still stop. Notices never count as research answers, execute tools or contribute usage. Sanitized type/subtype only retained; all access, review and budget checks/live block unchanged. Historical event payload remains unavailable.

160 focused deterministic tests passed, build passed, no new typecheck errors; five originals hash-verified. No live calls; live compatibility unverified. [Contract evidence, tests and recovery](../thinking-token-notice/handover.md).


## 2026-10-22 — One UI attempt after thinking-notice handling

From f197922, Claude Pro auth confirmed; existing two-report/selected-route/subscription-only approval reused. Run `bg-mviqvk8b-utpn8m`: Dana draft passed without correction; Nora retrieved evidence and returned a response, then unchanged run budget stopped validation/save at 32,045 tokens versus 24,000. Dana 15,527; Nora 16,518. No accepted review or completed report. No protocol rejection in this attempt; UI failure handover displayed. Raw returned review preserved as unvalidated. No retry or repair.

Per-stage accounting and diagnostics saved. Six originals verified; four runtime/UI files restored byte-for-byte and live-blocked app rebuilt. Sources and twelve checked prior failures unchanged. No billing/permission/budget changes. [Saved outcome, usage and recovery](../claude-thinking-live/handover.md).


## 2026-10-22 — Recovered useful output from 3094397

Saved recovered-report.md and recovered-handover.md in the approved staging directory for bg-mviqvk8b-utpn8m, labelled “Recovered from an over-budget run; draft and review passed validation.” Rendered from the preserved validated draft/review, with dated limitations and no scientific-proof or workflow-success claim. Original failed status, handover, raw responses and usage remain byte-identical; recovered copies hash-verified.

Existing result interface displays the fixed recovery filenames without changing failure/completion rules. Actual UI verified both artifacts and unchanged queue error, zero new jobs/inference. 49 tests passed; no new typecheck errors. Live block unchanged. [Recovery evidence and instructions](../recovered-overbudget-output/handover.md).


## 2026-10-22 — Recovered output and installed Qwen; benchmark pending

Checkpoint 46823db preserves recovered-report.md and recovered-handover.md for bg-mviqvk8b-utpn8m and verifies their display through Workspace OS. Original over-budget failure remains unchanged; offline draft/review validation does not mark automatic completion or independently prove scientific claims. Working capabilities include restricted retrieval, selected Claude routes, incremental requests, draft validation, separate reviewer execution, saved usage/evidence and recovery display. End-to-end automatic completion under the unchanged token budget remains unresolved (32,045 accounted versus 24,000); no completion claim.

Confirmed installed local model: `qwen2.5:7b-instruct-q4_K_M`, ID `845dbda0ea48`, 4.7 GB (4,683,087,332 bytes), GGUF Q4_K_M. Installation is not model-capability or coordination proof. Memory checked first: 18 GiB RAM, 40% memory-pressure free, approximately 5.6 GB swap used; no Ollama model loaded, 237 GiB disk available. The frozen four-call component benchmark is prepared separately, no retries/cloud/downloads; expected generation answers and review verdicts withheld. Results will be appended without altering earlier entries.


## 2026-10-22 — Qwen frozen benchmark complete: not suitable for unattended workflow

`qwen2.5:7b-instruct-q4_K_M` (845dbda0ea48, 4.7 GB) completed exactly four local calls, no retries/cloud/downloads. Frozen requests matched baseline apart from model; expected generation answers and review verdicts withheld, source hashes unchanged. Dana: three findings/both records, but 0/3 verbatim quotes; two quotes exceed the concise-excerpt instruction. Nora: quotation decisions 4/6, semantic verdicts 4/6, supported accepted 1/3, unsupported rejected 3/3, false acceptances 0. Both roles fail the frozen all-criteria standard. Raw outputs, scoring and manual semantic assessment preserved separately.

Installation/local execution confirmed, research qualification and end-to-end coordination not established. Recovered report at 46823db remains useful with its failure label; automatic completion/token-budget issue remains unresolved. One next action: evaluate a different locally runnable model against the same frozen benchmark before further local-team integration, separately approving any acquisition. Four-call budget exhausted; no prompt experiments continued. [Qwen assessment and evidence](../qwen-role-evaluation/assessment.md).


## 2026-10-22 — Trusted quotation extraction from saved snapshots

Dana selects only a retrieved record ID and inclusive line span; trusted code supplies quotation text from hashed per-run source snapshots. Original and snapshot integrity, receipt containment, both-record retrieval, grant/workspace/token checks, quotation limits and Nora's independent semantic review gate remain enforced. Raw selections are preserved separately from the resolved draft. Injected quotes, invented IDs, inaccessible ranges and altered/missing sources fail closed. No provider calls, changed permissions or budgets.

170 deterministic Electron tests passed across 11 suites; build and baseline typecheck passed. Qwen's failed benchmark is unchanged and does not qualify it as a semantic reviewer. Quotation correctness does not establish claim support; automatic completion/token-budget issue and live verification remain unresolved. Next action: review the deterministic evidence before any separately authorised bounded live verification. [Change, limits and verification](../trusted-quotations/handover.md).


## 2026-10-22 — Evidence-backed request context reduction; 24,000-token completion unproven

Used the saved 32,045-token run (Dana 15,527; Nora 16,518). Replaced full general-purpose personas plus overrides with compact run-specific instructions while retaining full profiles in local evidence. Removed duplicated finalisation schema prose; structure remains in format and all field bounds remain in prose/application validation. Nora starts with exact trusted citation spans and may retrieve wider context whenever needed; no evidence truncation or weakened independent review. Quotation selection, source integrity, grants, routes, budgets and live block unchanged.

61 focused deterministic tests passed, including unchanged shared budget boundaries at 23,999 / 24,000 / 24,001 and multi-turn request construction. Baseline typecheck passes. Instruction reduction: 5,935 weighted characters, roughly 1,187–1,978 tokens under a 3–5 characters/token assumption. Conditional narrower Nora reads project 25,541–28,142 total, optimistically excluding increased full-line quote context and further reads/corrections. Evidence does NOT justify fitting within 24,000 or claim automatic completion/reviewer reserve. Next action: decide on a smaller substantive task/evidence scope before another live attempt; no such scope change implemented. Original failed run, Qwen benchmark and recovery remain unchanged. [Evidence, assumptions and verification](../context-reduction/handover.md).


## 2026-10-22 — Existing executor comparison; no replacement integration justified

Traced existing Run dispatch/permissions, installed Agentic Kit supervised dependencies/structured handoffs, and downloaded CoWork-OS tool execution, access policies and durable handoffs using saved inventory paths. Both external projects contain actual execution code (MIT), but neither inspected path is a drop-in for approved stable IDs, hash-checked snapshots, independent retrieval/review and shared accounting. Workspace OS already connects the queue, separate stages, grants, Ruflo ledger and result display; ordinary Safe native tools are broader than this task. No missing handoff wire was demonstrated. Remaining gap: verified completion with adequate semantic review inside 24,000 tokens, not task tracking. No runtime changes or new framework. Reused existing deterministic results; no model calls or repeated suite runs. Next action: agree a smaller substantive task/evidence scope before a separately approved live attempt. [Single comparison handover and code evidence](../existing-executor-comparison/handover.md).


## 2026-10-22 — Pre-call reviewer reserve and visible partial results

Added evidence-derived pre-call checks: reserve 16,518 tokens while Dana runs and require that remaining capacity before Nora begins; estimate requests using full context bytes, observed input floors/previous input and the existing output allowance. All calls/corrections retain the shared 24,000 actual-usage cap, configurable routes and existing access/review checks. This is planning, not a guaranteed provider ceiling; complete-task fit remains unproven. Further prompt compaction measured 592 bytes removed across four saved full-context envelopes, not verified live token savings. Failed runs display saved validated draft/usage with an explicit incomplete-review label; no success promotion. Originals verified. 59 focused tests passed plus final five-test reserve check; baseline typecheck passed. No inference or budget increase. [Concise handover, evidence and limits](../cost-controls/handover.md).


## 2026-10-22 — Same-question hash-bound excerpt plan

Trusted grant-backed retrieval supplies coverage 47–59 and schedule 58–73 before Dana generation; Nora separately retrieves these complete support passages and every extra cited span. Removes two lookup-only model turns without changing RESEARCH_TASK, citations, source integrity or semantic review. Different questions/revisions retain existing retrieval. Insufficient context must be labelled/rejected; selected excerpts are not exhaustive.

Offline request envelopes: 55,763 → 24,260 bytes versus saved historical requests (31,503 fewer). Conditional forecast 16,301–19,296 tokens; with illustrative 2,048 contingency, 18,349–21,344. Live savings unverified. Explicit plan-specific allocation: 12,000 reserved for Nora, at least 10,000 estimated per request; other tasks retain 16,518 reserve. Shared actual limit unchanged at 24,000. Plausible fit only without unexpected host cost, correction or further evidence needs; no completion/model-qualification claim. 60 focused tests and baseline typecheck passed, originals hash-verified; no live calls. [Single handover and reproducible estimate](../planned-excerpts/handover.md).


## 2026-10-22 — Reduced-context live UI run completed; 169-token margin

One approved subscription-only UI attempt from 99915f0: bg-mvjgjpy9-2rgs1f completed with Dana/Nora selected Claude / claude-sonnet-5. Restricted auth confirmed Pro; recorded credits-off approval reused (auth is not a billing-setting check). Two responses, no correction/retry. Dana 11,663 tokens; Nora 12,168; total 23,831 / 24,000. Estimated USD 0.082489, not an invoice; additional aggregate model usage purpose remains unattributed. Actual usage exceeds forecast and leaves only 169 tokens, so no claim of robust spare capacity.

Draft validation, separate retrieval, Nora approval and automatic report/handover saves succeeded. Report did not open automatically; existing View research report and handover displayed it successfully. Three citations/source hashes verified, prior runs preserved. Source app and existing app-data route verified. Live block restored, temporary activation removed, consumed marker retained and blocked app rebuilt. No roster expansion or further attempt. [Result, usage, restoration and exact view clicks](../planned-excerpts-live/handover.md).


## 2026-10-23 — Explicit per-run approval replaces temporary unlocking

Existing research panel now displays selected routes, two-report evidence scope and unchanged limits, then opens a native main-process confirmation. Cloud/mixed approval requires Pro/credits-off attestation and restricted authentication metadata before inference; local execution has no subscription requirement. Single-use authority binds routes/task/workspace, expires, cannot be reconstructed from persisted IDs, and does not survive restart. Manual attempts require fresh approval; no automatic retry/fallback. Existing grants, citation/review gates, cancellation and saved/partial results remain.

110 deterministic tests passed; build and baseline typecheck passed. Unapproved/forged/replayed/expired authority remains blocked. Actual GUI approval and live execution through this permanent route remain unverified; no live call was made. Originals hash-verified. [Handover, limitations and exact panel steps](../per-run-approval/handover.md).


## 2026-10-23 — Everyday workspace integration and corrected current status

Recorded from the owner's pasted run artifacts, supplied source, local Terminal output and GUI screenshot in this session. Earlier entries remain historical; this entry supplies later observations without rewriting their evidence.

### Permanent approval route exercised; budget stop preserved

After checkpoint 20d1c2f, the owner opened the pilot, selected Claude / claude-sonnet-5 for Dana and Nora, and exercised the actual native single-run confirmation. Run bg-mvjqb2xu-qvnuit failed at Nora cost preflight: “Research cost preflight: insufficient capacity for request”. Dana returned one response and a draft with application-validated citations. Accounted usage was 19,083 tokens (15,329 input including cache creation, 3,754 output), leaving 4,917 of the unchanged 24,000 limit. Additional Haiku accounting was 4,229 tokens with purpose unattributed. Nora retrieved the planned passages but no reviewer model response or accepted semantic review was recorded. Draft, outcome, state, usage and handover were preserved; result checkpoint f3e7a4dc940225fc9c1443d487214a73eeffa890 is a run evidence checkpoint, not a confirmed source Git commit. The result button did not visibly open for the owner; files were subsequently read directly. That UI issue was not diagnosed or repaired.

This does not invalidate successful run bg-mvjgjpy9-2rgs1f at ababd0b (23,831 / 24,000 tokens); it demonstrates that reliable repeat completion with adequate headroom is not established. Saved dollar estimates are not invoices. Subscription-only/credits-off was the approved condition; neither authentication metadata nor these logs independently proves the account's billing configuration or explains an invoice.

### Budget diagnosis correction

Source inspection confirms pre-call estimates and reviewer reserves are planning checks, not guaranteed provider-enforced total-token allocations. The 12,000 reviewer reserve did not prevent Dana's actual returned usage from exceeding its planned share. Raising a forecast can stop known oversized work earlier, but does not reduce its cost or complete the task. Input/host overhead also matters; an output cap alone cannot make this observed input fit its planned share.

IMPORTANT CORRECTION: the assistant initially asserted that no 2,048-token output control was configured. The supplied claudeResearchAuth.ts already sets CLAUDE_CODE_MAX_OUTPUT_TOKENS='2048' and CLAUDE_CODE_MAX_RETRIES='0'. No conclusion that the host ignored that setting follows solely from aggregate usage, which can cover additional operations. Its exact coverage/enforcement remains unverified here. No budget, environment, model, billing or retry settings were changed by this integration.

### Integration installed into everyday workspace

The owner authorised reuse of the existing workflow in Desktop/WARRIGAL RESEARCH SUITE. The prepared change retains the pilot and permits these two explicit workspace roots only. Approvals, exact action grants, staging directories and result reads bind to the launching workspace. The native dialog identifies the workspace/output location. Cross-workspace retries and result reads reject. Evidence remains the same two read-only JUFE reports; no archive expansion, new agent persona or general-purpose job interface was added.

Six source/test files changed: researchScope.ts, ollamaResearchRun.ts, handlers/runs.ts, LocalResearch.tsx, researchScope.test.ts and handlers/researchApproval.test.ts. Offline handler/scope checks passed before delivery. Initial local installation stopped: backup test files were accidentally discovered and an added test reused a consumed fake run ID. These were package/test-fixture mistakes, not proof of a production approval failure. The owner ran a correction: backup moved outside the project to ~/Local Recovery/warrigal-integration-backup-20261023-035416-179381; test IDs made unique. Supplied final Terminal output confirms four suites / 77 tests passed, baseline typecheck passed (70 known errors against baseline 75; not zero errors), and build passed.

Desktop/Workspace OS — Warrigal.command was created, using the existing everyday app-data directory located by its persisted workspace root. Existing installed .app and pilot launcher were left untouched. The 04:08 screenshot confirms WARRIGAL RESEARCH SUITE and the research panel alongside existing agent cards. This verifies launch and panel visibility, not a newly completed research run in that workspace. No additional model calls, downloads, Git commit or push were performed by this installation procedure. A source Git checkpoint remains unconfirmed. Original code backups remain preserved.

### Existing agent coordination: do not duplicate or assume gaps

The implementation log already records Liam–Ada retrieval and a bounded Reid → Nora → Marguerite local Python pilot. The Dana → Nora research coordinator is also established. The executor comparison explicitly found no demonstrated missing handoff wire for the restricted research task. The assistant's later blanket claim that a shared handoff was missing was premature and is withdrawn; partial code inspection did not establish it. No additional handoff or roster expansion has been implemented. Qwen's frozen benchmark remains unchanged; this work does not qualify it as a semantic reviewer or claim full-team readiness.

### Next authorised work

For agent-coordination planning, read and reconcile these existing records and their referenced specific handovers with the actual implementation before proposing any change. Reuse documented working connections. Identify a concrete current task and a demonstrated missing capability, if any; do not infer a gap from agent names or disconnected-looking UI cards. Do not repeat the old report benchmark, add another coordinator, switch providers, expand permissions, download models or launch inference as a consequence of this documentation update. The owner wants coordinated real work with less manual relay and cloud consumption; do not turn that into an unsupported promise of zero computation or automatic full-team integration. Token-planning reliability and the reported result-opening problem remain unresolved. Preserve history and confirm Git status separately before claiming a source checkpoint.


## 2026-10-23 — Ordinary-agent context savings installed

After original-file hash checks and backups outside the repository, focused local tests, baseline typecheck and build passed. Claude launch guidance for metrics/collections was shortened by 1,232 static UTF-8 bytes (2,887 to 1,655), preserving command operations, live-link order and safety caveats. Workspace Codex no longer preloads the entire installed Office schema reference on every launch; guidance points to the existing SKILL.md and requires reading the relevant schema with permitted tools before Office generation, reporting unavailable references rather than guessing. Personas, recalled memory, grants, Safe/Full permissions, providers, model choices, review gates and research budgets are unchanged. Live token/billing savings are unmeasured; Office tasks may still read the schemas. This affects Workspace OS launches, not ChatGPT or the separate Codex CLI. No model calls, downloads, new launcher, commit or push. Dana's remaining input/host overhead and reliable completion within the research budget remain unresolved.


## 2026-10-23 — Workspace Beads task bridge installed

Added grant-checked beads.ready/show/create/update/close actions and an optional Beads Tasks capability. Actions bind to the active run workspace and its .beads/beads.db. Brief ready lists omit long task bodies; detail is read on demand. No provider calls, automatic queue execution, sync, task migration, profile edits or Ruflo mirroring. Ruflo research ledger, permissions for existing specialists, research approval, budgets and review gates remain unchanged. Task closure is not research completion. Local focused tests, baseline typecheck, build and native br brief-read check passed. A bridge GUI/model round trip and live token savings remain unverified. Setup uses existing br or an offline build of the downloaded source, never network dependencies. Backups and test logs are in Local Recovery. No commit or push.


## 2026-10-24 — Ordinary agent-launch path: three cost-control fixes, continuing the 2026-10-23 context-savings pass

Backups outside the repo first (`_WOS_AUTOFIX_BACKUP_20261024-155119/`). Traced one real saved dock session (`~/.claude/projects/-Users-liammcilmurray-Desktop-JUFE/fc2c5bb4-....jsonl`) rather than guessing: its `queue-operation` entries showed the renderer's `[Workspace-OS context]` preamble (root/surface/action-catalog, 2,943 bytes, byte-identical across turns) repeated on every turn of a 27-turn conversation, including resumed turns that already carry it via `--resume`. Three fixes, all in `src/main/agent/launchRun.ts` and `src/renderer/src/components/Terminal/TerminalAgentPane.tsx`, none touching personas, grants, providers, or the research-approval boundary:

1. **Context dedup.** `TerminalAgentPane.tsx`'s `submit()` now calls a new pure `groundedPrompt(contextBlock, prompt, isFirstTurn)` and only includes the preamble when `isFirstTurn` (`messages.length === 0` at submit time, added to the memoized callback's own deps). Mirrors the backend's existing, already-documented discipline (`launchRun.ts` skips re-appending its system prompt on `--resume` "to avoid bloat"); the backend already re-sends just the current open file on resume separately, so that signal isn't lost. Root/surface changing mid-conversation inside one tab is not separately handled — judged low-probability (a tab is anchored to the context it opened with) and left unresolved rather than engineered around.
2. **Per-task budget guard — now actually configured on the ordinary path.** `launchRun.ts` gained `budgetArgs(maxBudgetUsd)` / `DEFAULT_MAX_BUDGET_USD = 10` and now passes `--max-budget-usd` on every Claude-provider spawn (dock and queue alike); `LaunchRunOptions.maxBudgetUsd` lets a caller override the default. This is the same flag `claudeResearch.ts` already uses with test coverage — the ordinary path previously passed none at all. **Carrying forward this document's own prior correction, unchanged by this entry: `--max-budget-usd` is a client-estimated stop threshold, not a guaranteed invoice ceiling (Anthropic documents possible overshoot) — this is a backstop against a runaway/looping run, not a budgeting promise.** It is Claude-provider only.
3. **Memory-recall gate.** The automatic `searchMemory`/`memoryBlock` injection (previously unconditional for every run, already independently documented three times by prior Nora reports as reaching personas that cannot act on it) is now skipped when a persona declares capabilities that exclude `knowledge`. Mirrors the existing `inAppBrowserOnly` capability-check pattern in the same function. The common default/no-persona run and the legacy `'all'` grant are unaffected (`shouldRecallMemory`).

**Codex provider — read-only investigation, not fixed (no provider change in scope).** Delegated one specific question: `codexGuidance()` is rebuilt and resent in full on every turn **by design**, including resumed turns (`codexSession.ts` registers `developerInstructions` on both `thread/start` and `thread/resume`, with a comment stating this is deliberate) — the same waste as (1), but worse, and untouched here. No Codex equivalent of `--max-budget-usd` or a turn cap exists anywhere in source. `contextPreamble` itself is provider-agnostic (built in the renderer before the provider branch exists), so fix (1) already removes its duplication for Codex runs too; fixes (2) and (3) do not extend to Codex.

**Verified:** 13 new/extended vitest assertions (`launchRun.model.test.ts`: `shouldRecallMemory`, `budgetArgs`/`DEFAULT_MAX_BUDGET_USD`; new `TerminalAgentPane.test.ts`: `groundedPrompt`) — all pass, plus the 3 pre-existing tests in the same model-test file, unchanged. Baseline typecheck (`node scripts/typecheck.mjs`) is **flaky independent of this change** — confirmed by reverting both edited files to their pre-edit backup and re-running: the identical tsconfig.node.json project (unrelated test files: `browserControl.test.ts`, `bug-analyzer.test.ts`) passed once and failed twice across three runs of the untouched originals, the same pass/fail pattern seen with the edits applied; neither edited file ever appears in any failing run's error output. The broader `src/main/agent/` suite shows 11 pre-existing failures across 4 files (`ollamaResearchRun.test.ts`, `actionBridge.test.ts`, `actionBridge.socket.test.ts`, `nativeResearchBoundary.test.ts`) — confirmed unrelated by reverting `launchRun.ts` alone and reproducing the identical 8 `ollamaResearchRun.test.ts` failures; these files are part of the separate, already-in-progress uncommitted research-approval work this entry does not touch or repeat.

**Not done:** no change to Codex, personas, grants, capability catalog, providers, research-approval boundary, or any other file already modified uncommitted by other in-progress work (`actionBridge.ts`, `capabilityCatalog.ts`, `grants.ts`, `researchContext.ts`, `researchScope.ts`, etc. — left exactly as found). No install, download, new framework, live inference, Git commit, or push.


## 2026-10-24 — The Gibson connected as one bounded wos-action, full-grant only

Backup first (`_WOS_AUTOFIX_BACKUP_20261024-205731_gibson/agent/actionBridge.ts`), taken before touching the only file with other in-progress uncommitted work this entry needed to extend. Located Gibson only inside `~/Desktop/AI-Agent-Resources/the-gibson` — the one collection named for this task; nothing else was searched. Read its README/QUICKSTART and `scripts/loop.sh`'s own usage block (not the 2,929-line body) before writing anything.

**What Gibson is, read directly from its own docs, not assumed:** a governance harness for coding-agent fleets (claim tables, gates, CI, memory), not an inference provider itself — it drives an underlying runner CLI (grok/hermes/claude/codex). `scripts/loop.sh` already has native bounds: `--max-iterations` (default: **unlimited until halt**), `--error-budget` (default 5), `--runner-timeout` (default 1800s), plus `--dry-run` ("show actions without invoking runner") and `--once`. Its hardcoded claude-runner line (`loop.sh:2003`) calls `claude -p --output-format text --permission-mode acceptEdits` directly — outside Workspace OS's own `launchRun.ts`/grants/checkpoint path entirely, with no `--max-budget-usd` and no stream-json usage output.

**Connection, new file `src/main/agent/gibsonAction.ts`, mirroring `beadsAction.ts`'s exact shape (pure command-builder + thin DI-testable wrapper, no shell, no caller-supplied repo path):**
- `gibsonLoopArgs()` is pure and **requires** `maxIterations`, `errorBudget`, and `runnerTimeoutSec` as positive integers — it never falls through to loop.sh's own "unlimited" default; `--once` defaults on, `--dry-run` is opt-in per call.
- `gibsonAction(root, args)` always targets `root` — the grant-bound open Workspace folder — never a caller-supplied path, so there's nothing for a repo-path argument to smuggle. It refuses to run if Gibson isn't found at the one located path (no search elsewhere, no download). It also sets an outer `execFile` wall-clock `timeout` of `(maxIterations × runnerTimeoutSec) + 120s` as a backstop beyond loop.sh's own internal bounds, and caps captured stdout/stderr to a 4KB tail each.
- Wired into `actionBridge.ts` as **`gibson.run`**, dispatched the same way `beads.*` already is, but gated more strictly: **`grant.scope !== 'all'` is refused outright** — deliberately no entry was added to `grants.ts`'s `SURFACE_PREFIXES` table, so no scoped persona or routine capability, however broad (checked in the test against `beads-tasks`+`research`+`files`+`knowledge` together), can ever reach it — only a human's own plain full-grant dock run can. Zero lines changed in `grants.ts` or `capabilityCatalog.ts`; this is additive to the dispatch table only, the same way `beads.*` extended it, not a change to the permission model itself.

**Per-spawn vs. shared-task limits, kept distinct per the task's own framing:** `--runner-timeout` bounds each iteration's single runner invocation (per-spawn); `--max-iterations`/`--error-budget` bound the whole loop (shared-task). Both are required on every call here.

**Reused, not rebuilt:** Beads (`beads.*`, already wired) remains the task store — this bridge does not create its own tracking; a caller records Gibson's returned `{args, exitCode, stdoutTail, stderrTail}` into a Beads task itself, exactly as every other task in this record already does by hand. `--max-budget-usd` is reused conceptually (same flag, same "estimated stop, not a guaranteed ceiling" caveat as the prior entry) but **could not be wired into Gibson's own claude-runner call** — that line is hardcoded inside `loop.sh`, which upstream's own docs (`docs/18-fork-and-upstream.md`) ask not to be edited directly (customization belongs in `local/`, to keep receiving upstream updates); patching the vendored checkout was judged out of the "smallest compatible connection" and was not done.

**Limitations, reported rather than built around, per instruction:**
- No per-spawn dollar cap exists for whatever Gibson's loop spawns internally (claude/codex/grok/hermes) — only the shared-task iteration/failure/timeout bounds above are enforced from this side.
- No usage/token/cost figure can be captured from Gibson's own runner call — `loop.sh` requests plain text output, not stream-json, so there is nothing machine-readable to read even in principle without patching the vendored script.
- Gibson's own adapters run `--permission-mode acceptEdits` / `bypassPermissions` internally — broader than Workspace OS's own scoped safe/full allow-lists. This bridge does not touch that; it is disclosed, not patched, since doing so would mean editing the vendored checkout.
- `playbooks/adopt.md` (the PR-opening adoption flow) was read about, never run — explicitly out of scope ("don't execute adoption scripts that perform prohibited actions").
- Nothing here was ever executed for real, not even `--dry-run` against a live repo: Gibson's own docs describe dry-run as skipping only the runner invocation, not necessarily claim/worktree/branch side effects, and confirming that distinction safely was judged outside this task's scope. Verification is therefore argv-construction plus DI-mocked-exec tests only — the exact command this bridge would run has never actually been run.

**Verified:** 13 new vitest assertions across two new files (`gibsonAction.test.ts`: pure `gibsonLoopArgs` bound/validation cases, `gibsonAction` with a fake `GibsonExec` that is never a real process — confirms the exact argv, the computed outer timeout, and that validation failures never reach exec at all; `gibsonBridge.test.ts`: dispatch gating via the same `handleRequest`-DI pattern as `beadsBridge.test.ts`, confirming a scoped grant, an unrelated-workspace full grant, and a revoked grant are all refused before `gibson` is ever called, and that `gibson.run` is listed). Baseline typecheck: clean against baseline on this pass (two real issues this entry introduced — an unused type alias, a tuple-cast type error, a missing `invoke` field in the new dispatch test's deps object, mirroring `beadsBridge.test.ts`'s own shape — were fixed before this line was written; not the same pre-existing tsconfig.node.json flake noted in the prior entry, which was separately reproduced as unrelated). Full `src/main/agent/` suite: same 11 pre-existing failures across the same 4 files as the prior entry, reconfirmed unrelated by reverting `actionBridge.ts` alone and reproducing the identical `actionBridge.test.ts` "list" failure on the untouched original (that test's own fixture already predates the `beads.*` addition to the `list` output; this entry's `gibson.run` addition is one more line in an already-failing diff, not a new cause).

**Not done:** no change to Gibson's own checkout (read-only throughout), no adoption run, no capability-catalog or grants-table change, no live inference, no install, no commit or push. The `invoke` IPC action (renderer-facing "execute a UI action" plumbing) was not touched or used.


## 2026-10-24 — Gibson execution now routed through the existing Workspace launcher (completes the connection; one boundary remains)

Reopened to finish the above entry's partial state: planning was wired to Gibson, but execution was still only verified by DI mocks, not actually connected to `launchRun.ts`. Reused everything already found above — no rediscovery.

**Compatible, and now connected.** `gibsonAction.ts` is now a genuine two-stage bridge, not a single wrapped call:
1. **PLAN** — `scripts/loop.sh --print-prompt` (confirmed by direct read: exits 0 after `cat`-ing the rendered prompt, before any claim/snapshot/runner step — no runner, broader-permission or otherwise, is ever reached here).
2. **EXECUTE** — the rendered prompt is handed to the real, unmodified `launchRun()` (imported directly — same-process function call, not a new IPC/capability primitive, so this is *not* the not-yet-built agent-to-agent delegation Nora's 7 October check found missing). This gets the sub-run Workspace OS's own scoped safe/full permission lists (never Gibson's hardcoded `--permission-mode acceptEdits`), its `--max-budget-usd` guard, and real stream-json usage accounting. **Gibson's own broader-permission runner line is never invoked anywhere in this path — confirmed by code (it is simply never called) and by the execution check below.**

**Saved progress / Beads:** unchanged in mechanism from the prior entry — `gibson.run`'s result (`{stage, prompt, exitCode, output, meta, checkpointId}`) is handed back to the caller to record into a Beads task itself; this entry does not add automatic tracking, consistent with "keep Beads as the task store" rather than building a second one.

**Temporary-repository, no-model execution check — actually run, not merely designed:**
- Built a disposable `git init` repo in a tmp dir (no relation to any real project) and called the real PLAN stage against it. Result: `gibson/loop-state.md` **self-initialized** correctly with no adoption run, and loop.sh rendered a genuine, complete "Solo Loop Step" prompt — confirming `playbooks/adopt.md` is not a prerequisite for this connection, only for Gibson's own real multi-run claim/CI workflow.
- Built a 3-line fake `claude` binary (drains stdin, echoes one canned `stream-json` result line, exits 0 — no model, no network call anywhere) and pointed `CLAUDE_BIN` at it (an existing override `launchRun.ts` already checks first in `resolveClaudeBinary()` — no code change needed to redirect it). Called the real, unmodified `launchRun()` end to end: it completed (`done` fired, code 0) and **captured real usage accounting** — `{costUsd: 0.0001, turns: 1, durationMs: 10}` — which Gibson's own native claude line can never produce (it requests plain text, not stream-json). This is the concrete proof that "preserving... budget controls and usage records" is real here, not aspirational.
- Both runs are in `gibsonAction.temp-repo-check.test.ts` (new file, not part of the fast default sweep's intent despite living alongside it — ~1–2s, fully self-cleaning, no residue outside its own tmp dirs). Re-run directly: `npx vitest run src/main/agent/gibsonAction.temp-repo-check.test.ts`.

**One nuance surfaced by the real rendered prompt, disclosed rather than smoothed over:** the prompt itself documents that certain cross-vendor shell-outs (`REVIEWER_CMD`/`RELEASE_CMD`) assume `bypassPermissions`, not `acceptEdits` — i.e., Gibson's own playbooks are authored expecting a runner with broader trust than Workspace OS's scoped launcher grants. The common builder-hat case (read/edit/test files) is the one actually exercised and verified above; reviewer/release-hat steps that shell out to those two commands were not exercised and may not behave identically under Workspace's scoped permissions. Not patched — disclosed.

**The exact remaining boundary — stopped here, not built around:** Gibson's own multi-iteration loop (advancing `hat`/`next_hat`, journaling, claim/commit bookkeeping between rounds) all happens in `loop.sh`'s post-runner code path, which this connection never reaches, because reaching it means invoking the broader-permission runner it exists to avoid. **Each `gibson.run` call is one bounded render-then-execute round-trip, not a loop.** Making it a real multi-round loop would mean reimplementing loop.sh's own state-advancement logic on the Workspace OS side — judged substantial new infrastructure, not the smallest compatible connection, and explicitly not built. `maxIterations`/`errorBudget` as loop.sh's own flags are passed through the PLAN call (required, never defaulted) but do not bound anything across multiple `gibson.run` calls — that repetition, if wanted, is the caller's own choice today, with no automatic state advancement between calls. **This is not declared as full integration** — it is one bounded unit of work, connected and verified; a real autonomous multi-round Gibson loop is not implemented.

**Verified:** 17 vitest assertions in the rewritten `gibsonAction.test.ts` (plan-only path never calls execute; missing `runnerTimeoutSec`/`maxBudgetUsd` rejected before either stage runs; full plan→execute flow calls both in order with the right `idleTimeoutMs`/`safeMode`; a failed plan stage never reaches execute; a thrown execute surfaces as a structured reply) plus the 3 dispatch tests in `gibsonBridge.test.ts` (updated to the new args shape) — all pass. Plus the 2 real, no-mock execution-check assertions above. Baseline typecheck clean (one self-introduced unused import fixed before this line was written). Full `src/main/agent/` suite: same 11 pre-existing failures across the same 4 files as every prior entry in this record — reconfirmed, not re-litigated.

**Not done:** no change to Gibson's own checkout; no adoption run; no multi-iteration loop/state-advancement logic; no capability-catalog or grants-table change; no live inference; no install; no commit or push.

---

## 2026-10-24 — Checked for an existing extension point to preserve Gibson's own loop; found the gap behind it, stopped

Follow-up to the entry directly above, which left one boundary explicitly unresolved: Gibson's own multi-iteration loop (hat/next_hat advancement, journaling, claim/commit bookkeeping between rounds) only runs inside `loop.sh`'s own code, which the two-stage `gibson.run` bridge never reaches. This pass asked a narrower question: is there an *existing* adapter/extension point that lets `loop.sh` keep running its own real loop — state advancement and all — while every actual model invocation routes through `launchRun()`, instead of reimplementing that loop here? Pure investigation; no code changed.

**An extension point does exist, and it is a real, documented one.** `loop.sh`'s runner dispatch hardcodes `grok`/`claude`/`codex` to fixed binary invocations with no override, but the `hermes` branch checks `HERMES_CMD` first: if set, it runs that arbitrary shell command with the rendered prompt on stdin, under the exact same `run_with_wall_timeout "$RUNNER_TIMEOUT"` wrapper every other runner gets — nothing special-cased for Hermes. This is not an implementation accident: `docs/10-vendor-adapters.md` calls Hermes "model-agnostic (Nous/OpenRouter/Anthropic/OpenAI); the fleet's voice *and* a worker," and `docs/11-solo-loop.md` describes a second feature (`DIGEST_CMD`) as using "the same env-hook pattern as `HERMES_CMD`" — i.e. this is an established, reusable extension mechanism in Gibson's own doctrine, not a one-off hook I'd be leaning on past its intended use.

**Re-reading `loop.sh`'s post-runner code directly (lines ~2660–2920) changes the picture from the prior entry in one important way:** state advancement and journaling are not separate logic keyed to which native runner ran. The sequence is runner-agnostic by construction — snapshot `loop-state.md` before invoking whatever `$RUNNER` resolves to, run it, then validate the *live* file's schema and freshness, and journal success/no-progress/state-corrupt accordingly. The actual `hat`/`next_hat` advancement is written by the invoked agent itself, as one of its own file edits in the target repo, per the instructions in the rendered prompt — `loop.sh` only checks that the edit happened and was valid. So in principle, pointing `HERMES_CMD` at something that calls `launchRun()` would let Gibson's real loop run for real, with its own state advancement and journaling fully intact, exactly as asked — on the condition that the thing `HERMES_CMD` invokes can actually land file edits in the correct repo.

**That condition is where it breaks, and this is the exact missing interface:** `launchRun()` (`src/main/agent/launchRun.ts:173`) takes no per-call target-directory parameter anywhere in `LaunchRunOptions`. Its working directory is unconditionally `getWorkspaceRoot() ?? os.homedir()` — a single, global, persisted piece of application state. `src/main/workspace-root.ts` documents that state verbatim as "Single source of truth for the active workspace root... Every file-system validator scopes to this value" — i.e. it is the app's file-system security boundary, not a convenience default a caller can override per run. Gibson's target repo is essentially never the same directory as whatever folder a human happens to have open in Workspace OS at the time. Pointing one `launchRun()` call at Gibson's repo would require mutating that single global/persisted root for the duration of the call — which would race with any concurrently open human session using the same app instance, and would itself be a permission-model change (redefining what the security boundary points at), not a per-call extension. That is explicitly out of scope.

(Secondary, reinforcing finding, re-confirmed rather than re-derived: `launchRun`/`readAgentForRun` are also still only reachable via Electron IPC — human-triggered — or the Routines scheduler — time-triggered — never via `actionBridge.ts` or any standalone CLI. A `HERMES_CMD` shell-out is spawned by `loop.sh`, not by `launchRun()` itself, so even setting the target-directory question aside, it would have no existing credentialed entrypoint — no `AGENT_TOKEN_ENV`/`WOS_AGENT_SOCK` — to reach `launchRun()`'s machinery at all.)

**Exact missing interface, stated precisely:** a per-call target-directory/root parameter on `launchRun()`'s `LaunchRunOptions` (or an equivalent synchronous external entrypoint wrapping it), decoupled from the single global, persisted `getWorkspaceRoot()` state that `workspace-root.ts` defines as the app's security boundary. It does not exist today.

**Stopped here per instruction, not built around.** Adding that parameter would mean changing the security-boundary design itself (every file-system validator in the app scopes to `getWorkspaceRoot()`), and mutating the global root as a workaround carries the same problem under a different name — both are permission-model changes, which this task is explicitly not authorized to make. The `HERMES_CMD` extension point itself is real and would otherwise be exactly the right mechanism; the gap is entirely on the Workspace OS side, in `launchRun()`'s lack of a per-call root.

**Net effect on the prior entry's bridge:** unchanged. `gibsonAction.ts`'s two-stage PLAN+EXECUTE design still stands as one bounded round-trip, with permissions/budgets/usage recording verified exactly as before. This pass only answers, with a specific reason rather than a general one, why that round-trip cannot currently be upgraded into a real multi-iteration loop without a permission-model change.

**Verified:** by direct source read only — `scripts/loop.sh`'s runner-dispatch block and post-runner validation/journal code, `docs/10-vendor-adapters.md`, `docs/11-solo-loop.md`, `src/main/agent/launchRun.ts`, `src/main/workspace-root.ts`. No stub-model/temp-repo experiment was run this pass: the blocking fact (no per-call root parameter exists on `launchRun()`) is a static property of its parameter list, not a runtime behavior that empirical testing against a disposable repo would change or could falsify.

**Not done:** no change to `launchRun()`, `workspace-root.ts`, or `loop.sh`; no `HERMES_CMD` wiring attempted (would be pointless without the target-directory interface); no global-root mutation attempted or proposed as a workaround; no live inference; no commit or push.

---

## 2026-10-24 — Same-workspace correction: HERMES_CMD wired and verified for a real loop.sh loop through launchRun()

Follow-up to the entry directly above. The blocker found there assumed Gibson's target repo could be any arbitrary directory, unrelated to whatever folder a human has open in Workspace OS. That assumption was wrong for the case that actually matters: when Gibson targets the folder *already open in Workspace*, `launchRun()`'s cwd (`getWorkspaceRoot()`) and Gibson's target repo are the same directory already — no per-call root override is needed. Confirmed in production code, not assumed: `workspaceContext.ts`'s `root` is initialized to and falls back to `getWorkspaceRoot()`, the same function `launchRun.ts:173` reads for cwd; `actionBridge.ts`'s `gibson.run` dispatch requires `grant.root === ctx.root`; and `gibsonAction.ts` already requires its `root` argument to be that grant-bound workspace root, never an arbitrary caller path. So in the one case this task is scoped to, the two roots were never actually different.

With that correction, the question from the prior entry becomes answerable: **yes, for the same-workspace case, `HERMES_CMD` lets Gibson's real loop.sh keep its own state advancement and journaling while every per-iteration model call routes through the real `launchRun()`** — verified by actually running it, not just reasoning about it.

**What was built and run (stub models + a temporary repository only):**
- `gibsonHermesLoop.temp-repo-check.test.ts` (new, explicitly outside the fast sweep) builds a disposable `git init` repo standing in for "the folder already open," then runs Gibson's real, unmodified `scripts/loop.sh` for one real iteration (`--once`, **not** `--print-prompt`) with `--runner hermes`.
- `HERMES_CMD` is set to a small wrapper: it captures the real rendered prompt from stdin to a file (not relying on fd inheritance through nested process layers, which vitest's worker pool does not guarantee), then runs a second new file, `gibsonHermesRunner.manual.test.ts`, as a one-shot `npx vitest run` child in the same Workspace-OS checkout.
- That child sets *its own process's* `workspace-root` module state to the disposable repo (`setWorkspaceRoot(repo)`) — this is the same-workspace case being exercised for real, inside an isolated test process with electron mocked and `app.getPath('userData')` pointed at its own tmp dir. **The real app's persisted, global workspace root is never touched** — it lives in an entirely separate process.
- `CLAUDE_BIN` points at a 3-line stub (drains the prompt, writes a fresh, schema-valid `gibson/loop-state.md`, echoes one canned `stream-json` result line, exits 0 — zero model or network calls anywhere). The child calls the real, unmodified `launchRun()` with the real prompt and this stub as the resolved binary.

**Result:** `loop.sh` exited 0. `gibson/loop-state.md` shows `next_hat` advanced `builder → test-engineer` and `round` `0 → 1` — written by the stub (standing in for a real agent's own file edit) and *accepted by loop.sh's own unmodified post-run schema/freshness validation*, not by anything either test file wrote directly. `gibson/journal.md` picked up loop.sh's own real `## … · hat=builder · runner=hermes` / "Driver completed iteration" entry — Gibson's native journaling, untouched. `launchRun()`'s real usage accounting was captured in the same run (`{costUsd: 0.0002, turns: 1, durationMs: 10}`), showing budget/usage recording survives through the loop path, not only the single round-trip path proven in the prior entries.

**This confirms the mechanism concretely, not just in principle:** `loop.sh`'s snapshot → invoke-runner → validate → journal sequence is genuinely runner-agnostic, exactly as the prior entry's source read suggested — pointing `HERMES_CMD` at something that calls `launchRun()` is sufficient, with zero changes to Gibson's own scripts.

**Limits, disclosed rather than smoothed over:**
- **Same-workspace only.** If Gibson's target repo is ever not the folder open in Workspace, the prior entry's gap (no per-call root on `launchRun()`) still applies and is still unsolved — that boundary is unchanged, not reopened or fixed here.
- **One real iteration, not a stress-tested loop.** Verified with `--once`/`--max-iterations 1`; not run back-to-back across many rounds. The runner-agnostic design gives no specific reason multiple rounds would behave differently, but that is reasoning from the code, not a result from running it.
- **Nested model calls can still bypass Workspace entirely — this is the one that matters most.** `playbooks/loop-step.md`, `reviewer.md`, and `release.md` instruct the agent *itself* to shell out directly to `REVIEWER_CMD`/`RELEASE_CMD` (e.g. a raw `claude -p --permission-mode bypassPermissions`) for cross-vendor review/merge steps — as the agent's own bash tool call from inside its running session, per its prompt's own instructions. This is a structurally different mechanism from `--runner`/`HERMES_CMD`: it is not loop.sh choosing a runner, it is the agent choosing to shell out mid-session, and nothing in this connection intercepts it. Those two env vars were deliberately left unset in this check (a builder-hat iteration never triggers them), so **"every model invocation routes through Workspace" is demonstrated for the verified builder-hat case only — it is not a general guarantee.** A reviewer- or release-hat round with those vars set would make its cross-vendor call completely outside Workspace's launcher, budget, and usage recording. Leaving them unset avoids the bypass but is a behavior change (no cross-vendor escalation availed), not a routing fix, and was not undertaken as part of this connection.

**Verified:** the two new test files above pass; full `src/main/agent/` suite: same 11 pre-existing unrelated failures as every prior entry, 456 passed, 1 test (`gibsonHermesRunner.manual.test.ts`) correctly `describe.skipIf`-inert outside its `HERMES_CMD` invocation so it doesn't fail a plain directory-wide run. Typecheck clean against baseline (70 errors vs. 75 baseline).

**Not done:** no change to Gibson's own checkout; no change to `launchRun()` or `workspace-root.ts`; no global/persisted workspace-root mutated anywhere; no `REVIEWER_CMD`/`RELEASE_CMD` routing attempted; no multi-round stress run; no live inference; no commit or push.

---

## 2026-10-25 — Loop mode is now production code, verified end to end, one real bug found and fixed

Follow-up to the entry directly above, which proved the mechanism with a bespoke, hand-rolled test harness (a nested `npx vitest run` as the `HERMES_CMD` child). This entry promotes that into `gibsonAction.ts` itself as a real, callable mode of the production `gibson.run` action, then verifies *that* — not the throwaway harness — against stub models and disposable repos, covering multiple iterations, state advancement, journaling, the iteration/failure limits, usage capture, and explicit rejection of reviewer/release stages.

**What's built:** `gibsonAction(root, { loop: true, repoSlug, runnerTimeoutSec, maxBudgetUsd, maxIterations, errorBudget })` is a new mode alongside the existing single-round-trip default (unchanged, still the default when `loop` is omitted). It runs Gibson's real, unmodified `loop.sh` for real multiple iterations (`--runner hermes`, no `--once`), with `HERMES_CMD` pointed at a new, tiny, dependency-free file — `gibsonHermesSocketClient.cjs` — that relays each iteration's rendered prompt into a one-shot Unix socket this same process is listening on. The handler (`handleHermesConnection`, exported for direct unit testing) reads `gibson/loop-state.md`'s `next_hat` before doing anything else: `builder`/`test-engineer`/`ux-evaluator`/`security`/`decomposer`/`planner`/`historian` route through the *exact same* `execute()` (`realExecute` → `launchRun()`) the default mode already uses; `reviewer`/`release` are refused outright — a distinct exit code (17), which `loop.sh` counts as an ordinary runner failure against `--error-budget`, so the whole loop still stops deterministically on its own. `maxIterations` is capped at 20 (`MAX_LOOP_ITERATIONS`) and `errorBudget` is required — never `loop.sh`'s own unlimited-until-halt default. Still same-workspace only, exactly as established above.

**A real bug was found and fixed, not assumed away.** The socket server used `net.createServer()`'s default `allowHalfOpen: false`. The client signals "done sending" with `sock.end(prompt)` (a half-close); with the default, Node auto-closes *our* write side the instant that arrives — before the async `execute()`/`launchRun()` call could ever write back the real `EXIT:<code>`. The client always fell back to its hardcoded default (exit 1), and `loop.sh` would sometimes check the state file before the real, still in-flight write had landed. This produced two different-looking but same-root symptoms across runs: a bogus `runner exit 1`, or — depending on exact timing — a bogus `state-corrupt: stale updated` rejection, even though the underlying `execute()` call had genuinely succeeded both times. Caught by direct instrumentation of the client script and a standalone repro (logged timestamps end to end), not inferred from reading the code. Fixed with one `{ allowHalfOpen: true }` on the server, plus a guard so the handler never throws if the client is already gone (e.g. killed by `loop.sh`'s own `--runner-timeout`) by the time `execute()` resolves.

**Verified for real, against the production function** (`gibsonHermesLoop.temp-repo-check.test.ts`, rewritten to call the actual exported `gibsonAction()`, not a reimplementation):
- **Multiple iterations / state advancement / journaling / usage capture:** 3 real iterations against a disposable repo (`builder → test-engineer → builder`), each routed through the real `launchRun()` with a zero-model stub binary. `round` genuinely advanced `0→1→2→3`; `journal.md` picked up loop.sh's own 3 real "Driver completed iteration" entries; usage was captured every round (`{costUsd: 0.0002, turns: 1}` × 3); the run stopped cleanly on its own at `max iterations 3 reached` (exit 0) — the iteration-limit case.
- **Rejection of an unsupported stage / failure limit:** a reviewer-hat round reached naturally (`builder → test-engineer → reviewer`) was blocked before any runner call — confirmed by the distinct exit 17 in `loop.sh`'s own stderr and that `execute()` was never invoked for that connection. `loop.sh`'s own `--error-budget` (1) then stopped the whole run. `next_hat` stayed `reviewer` and `round` stayed unchanged afterward, confirming the blocked iteration genuinely never ran. (One side-finding along the way: `loop.sh` has its *own* built-in review-round cap reading the same `round:` field against a per-tier limit — a naive test fixture that bumped `round` on every iteration tripped *that* instead of exercising this bridge's own block logic; fixed the fixture, not the production code, once the real mechanism was understood.)
- **No leaked sockets/processes:** checked via a before/after `/tmp` directory diff around both real runs — empty both times.
- **Timeout limits:** not re-run under a live multi-minute race (slow, flaky, and would duplicate Gibson's own mechanism rather than this bridge's). `loop.sh`'s `--runner-timeout`/`run_with_wall_timeout` wraps the `hermes` branch identically to every other runner (confirmed by direct, unmodified code read) — preserved by construction, not separately re-proven under a clock.
- **Cancellation:** no cancellation API exists anywhere in Workspace OS's action system today — confirmed by checking `actionBridge.ts`; no action, Gibson included, has a signal/cancel concept, so none was added here (would be new, unscoped infrastructure). What *is* verified: if the outer `loop.sh` invocation itself fails or is killed (simulated via a DI'd `exec()` throwing, in the fast suite), the socket server is still closed and its socket file still removed — confirmed by extracting the embedded path from the captured `HERMES_CMD` and checking it's gone afterward.

**Also added:** 12 new fast, deterministic unit tests in `gibsonAction.test.ts` (`readNextHat`; `handleHermesConnection`'s block/execute/error paths; loop-mode argument validation — `loop`+`planOnly` mutual exclusion, non-`hermes` runner rejection, the 20-iteration cap, missing bounds; a fake-`exec` happy path confirming argv shape and clean socket teardown; the cleanup-on-rejection case) — none touch a real socket or `loop.sh`.

**Verified:** full `src/main/agent/` suite — same 11 pre-existing unrelated failures as every prior entry, 469 passed (up from 456; all net-new tests passing). Typecheck clean against baseline (70 vs. 75).

**The usable surface today:** `gibson.run` with `{loop: true, repoSlug, runnerTimeoutSec, maxBudgetUsd, maxIterations ≤ 20, errorBudget}` runs a real multi-round Gibson loop against the currently open Workspace folder, routing every supported hat's model call through Workspace's own launcher (permissions, `--max-budget-usd`, real usage accounting all preserved), and explicitly *refuses* — never silently degrades, never bypasses — any reviewer/release round. Omitting `loop` keeps the prior single-round-trip default unchanged.

**Remaining, disclosed limits:** same-workspace only (unchanged from the prior entry); reviewer/release stages are blocked outright, not routed — cross-vendor escalation is unavailable through this connection, by design; no cancellation API exists for any `wos-action` yet, Gibson included.

**Not done:** no change to Gibson's own checkout; no `REVIEWER_CMD`/`RELEASE_CMD` routing; no cancellation API added anywhere; no live inference; no downloads; no broader permissions; no commit or push.

---

## 2026-10-25 — Reviewer/release hats now run through Workspace too; the genuinely unconnectable part is now explained, not just blocked

Follow-up to the entry directly above. Asked to reconsider the reviewer/release hard-block: identify exactly which required operation is blocked, connect it through an existing Workspace extension point if one exists, and preserve Gibson's own review requirement rather than inventing a replacement stage. Targeted reads only — Gibson's own `playbooks/reviewer.md`/`release.md` contract for `REVIEWER_CMD`/`RELEASE_CMD`, and `launchRun.ts`'s `childEnv` construction.

**The extension point exists, unmodified:** `launchRun.ts`'s spawned-child environment is built as `childEnv = { ...process.env, ... }` — a direct, confirmed read. Whatever this bridge's own Node process has set on `process.env` reaches the agent's session untouched. No change to `launchRun.ts` was needed or made.

**What changed:** reviewer/release hats are no longer hard-blocked in `gibsonAction.ts`. `handleHermesConnection` now routes *every* hat — reviewer/release included — through the same `execute()` → `launchRun()` path as builder/test-engineer, so their primary session (whatever Gibson's rendered prompt has that hat actually do) gets Workspace's scoped permissions, `--max-budget-usd`, and real usage accounting, exactly like every other hat. The per-iteration outcome now carries `crossVendorUnavailable: true` on those two hats specifically, so a caller can always tell "ran Gibson's own single-vendor fallback" apart from a genuine independent review — never silently conflated.

**What stays permanently withheld, and the exact reason — read from Gibson's own docs, not inferred:** `release.md` ties `RELEASE_CMD`'s entire purpose to GitHub identity separation — *"GitHub refuses to let an account approve its own PR"* (L-015/L-021) — and documents its own invocation as needing `--permission-mode bypassPermissions`, deliberately broader than Workspace's scoped permission model. Looping `REVIEWER_CMD`/`RELEASE_CMD` back into this same bridge's own `launchRun()` would still be the *same single Workspace identity* as the builder that wrote the code being reviewed — GitHub would still reject it as same-author. That would make the connection *look* wired while silently failing Gibson's actual requirement — the exact invented-replacement-stage this task was told not to build, so it wasn't. Instead, `realExecute()` now unconditionally clears `REVIEWER_CMD` and `RELEASE_CMD` from `process.env` (saved, then restored once the call settles) around *every* `launchRun()` call, every hat — guaranteeing neither var is ever visible to a session this bridge drives, regardless of what the host shell Workspace OS itself runs under happens to have set. Gibson's own second, equally-documented valid path — single-vendor self-review / a direct merge, when these vars are unset — is therefore the only one this bridge can ever reach, by construction, not by chance.

**Verified for real against the production `gibsonAction()`** (stub model, disposable repo):
- A full `builder → test-engineer → reviewer → builder` sequence (4 real iterations) all executed through the real `launchRun()` — including the reviewer one (`exitCode: 0`, usage captured) — with `loopExitCode: 0`: nothing refused, nothing failed.
- **The real, structural check:** the stub recorded, every iteration, exactly what it saw in *its own* spawned environment for both vars. The test deliberately set bogus values for `REVIEWER_CMD`/`RELEASE_CMD` on the *test process's own* env beforehand — simulating "the host shell already has these set" — before calling `gibsonAction()`. The reviewer iteration's own logged line reads `REVIEWER_CMD=[unset] RELEASE_CMD=[unset]`, proving the clearing reached the spawned child itself, not merely that this test never tried to set them. The host process's own values were confirmed restored immediately afterward.
- `round:` advanced exactly once, on the reviewer step itself — matching real Gibson semantics (round tracks review cycles, not iterations).
- No leaked sockets.

**Also updated:** the 3 existing tests that encoded the old hard-block behavior (`handleHermesConnection`'s reviewer/release unit tests, the loop-mode happy-path's `blocked` field) now assert the new execute-through behavior and the renamed `crossVendorFallback` result field.

**Verified:** full `src/main/agent/` suite — same 11 pre-existing unrelated failures as every prior entry, 469 passed. Typecheck clean against baseline (70 vs. 75).

**The usable surface today:** every Gibson hat — including reviewer and release — now routes its primary session through Workspace's launcher when driven via `gibson.run`'s loop mode. The only thing categorically unavailable is a *genuine* cross-vendor reviewer/release identity, because Workspace is a single-identity system and cannot honestly satisfy GitHub's same-author restriction that feature exists to work around — not because no connection point was found, but because connecting it would mean faking the one thing it's actually for.

**Remaining, disclosed limits:** same-workspace only (unchanged); genuine cross-vendor reviewer/release escalation is categorically unavailable, for the identity reason above, not a temporary gap; no cancellation API exists for any `wos-action` yet, Gibson included (unchanged from the prior entry).

**Not done:** no change to Gibson's own checkout or `launchRun.ts`; no attempt to fake a cross-vendor identity through Workspace's own single identity; no cancellation API added; no live inference; no downloads; no broader permissions; no commit, push, or deployment.

---

## 2026-10-25 — Correction: review and release are not the same risk; release stays refused, reviewer gets a real controlled connection

The entry directly above contains a mistake, corrected here rather than silently amended: it treated independent **model** review and GitHub **account** approval/merge authority as the same unsatisfiable "cross-vendor identity" problem, and withheld `REVIEWER_CMD`/`RELEASE_CMD` by mutating this process's own global `process.env`. Both were wrong, for different reasons.

**The actual defect, found by re-reading `loop-step.md`'s release-hat section directly:** when `RELEASE_CMD` is unset, Gibson's own documented fallback is *"merge → verify deploy → smoke"*, performed by the same session. Letting `release` execute freely (as the prior entry did, alongside every other hat) risked a real, destructive, repo-mutating merge running through this bridge. Reviewer carries no such risk — its own fallback is a read-only critique, never a write. Treating both hats identically was the error, independent of the identity-separation reasoning (which is still correct, just not the relevant reason to withhold reviewer).

**Fixed, with the smallest supported controlled connection for each:**

- **`release` is now refused outright**, before any runner call — a distinct exit code, counted by `loop.sh` as an ordinary `--error-budget` failure so the loop still stops deterministically. This is refused *by policy* (merging stays disabled, per instruction), not because no extension point exists. Verified directly: `git log` on the real repo shows only its original `init` commit after every scenario below — no merge, ever.
- **`reviewer` now runs through the same `execute()`/`launchRun()` path as every other hat** — required, never skipped, never silently answered by the same turn that wrote the code — with a real, additive extension: `GibsonLoopOpts.reviewerModel`/`reviewerProvider` thread straight through to `launchRun()`'s own existing `model`/`provider` fields. No `REVIEWER_CMD`, no nested shell-out, no env var at all for this part — a genuinely different model/provider, routed through Workspace's own launcher like any ordinary run. Every reviewer outcome records `reviewIndependentModel: true/false`, so a caller can never mistake Gibson's weaker (still real) same-vendor-fresh-session fallback for a genuinely independent judgement.
- **Per-launch env isolation replaces the global `process.env` mutation.** `launchRun.ts` gained one small, additive, optional field — `LaunchRunOptions.env?: Record<string, string | undefined>` — merged into `childEnv` last (after the `process.env` spread and MCP secret injection), so a value of `undefined` means "absent from this one child's environment," without this process's own `process.env` ever being read or written. `REVIEWER_CMD`/`RELEASE_CMD` are withheld this way for every hat's call now. Concurrent calls each build and discard their own override object — nothing shared, nothing to clobber.

**Verified for real against the production `gibsonAction()`**, stub models + disposable repos, covering the exact sequence asked for:

- **builder → checks (test-engineer) → required review → REQUEST_CHANGES → correction:** the loop genuinely returned to `builder` and continued (`test-engineer` again); `loopExitCode: 0` (a normal correction cycle, not a failure); the review itself is recorded as having run (`reviews: [{independentModel: false}]`).
- **builder → checks → required review → APPROVE → release:** the approval is a real, saved outcome — the review executed, `exitCode: 0`, strictly before the release attempt — but release itself was refused (`releaseRefused: [{hat: 'release', reason: '...real merge...'}]`); `loopExitCode` nonzero (budget exhausted by the refusal, correctly distinguishable from a genuine failure, not conflated with one); the real repo's `git log` still shows only `init`.
- **`reviewerModel: 'opus'` reached the actual spawned process for the reviewer iteration only** — confirmed by the stub's own captured argv containing `--model opus` on exactly that line, absent on every other hat's line in the same run.
- **Concurrent-run isolation:** two simultaneous `execute()` calls against the same repo (one with `reviewerModel: 'opus'`, one without), run via `Promise.all` so their spawns genuinely overlap — each spawned process's own argv shows exactly its own intended override, never the other's; `REVIEWER_CMD`/`RELEASE_CMD` absent for both.
- No leaked sockets after any scenario.

**Verified:** full `src/main/agent/` suite — same 11 pre-existing unrelated failures as every prior entry, 473 passed (up from 469). Typecheck clean against baseline (70 vs. 75).

**Usable today:** `gibson.run` with `{loop: true, repoSlug, runnerTimeoutSec, maxBudgetUsd, maxIterations ≤ 20, errorBudget, reviewerModel?, reviewerProvider?}` runs a real multi-round Gibson loop against the open workspace folder. Every hat except `release` routes through Workspace's launcher with permissions/budget/usage intact; `reviewer` can optionally be given a genuinely distinct model/provider; `release` is always refused, never executed, so an approval is observable without the merge it would trigger ever running.

**Remaining, disclosed limits:** same-workspace only (unchanged); `release` is permanently refused by policy, not a temporary gap — merging through this connection is not planned; no cancellation API exists for any `wos-action` yet, Gibson included (unchanged).

**Not done:** no change to Gibson's own checkout; no commits, merges, pushes, or deployment anywhere in this connection; no live inference; no downloads; no broader permissions.

---

## 2026-10-25 — Finalizing: Gibson's own completion contract requires a merge; no workaround built, one honesty gap fixed instead

Asked, before finalizing: can reviewed work reach a valid saved terminal outcome without release/commits/merges/pushes/deployment? Targeted reads only — `docs/delivery-receipt-v1.md` (Gibson's own installed completion contract) and `docs/06-quality-gates.md` (the independence level it requires). No broad discovery; no code written for this question, since the answer is a hard no.

**The answer, decisive and from Gibson's own contract, not inferred:** `delivery-receipt-v1.md` defines exactly one successful terminal disposition, `delivered`, and it unconditionally requires *"the pull request is merged, and its base ref is the repository default branch"* plus a review recorded at independence `E3`. Every other disposition is explicitly non-terminal-success: `parked` is defined as *"pull request open, otherwise"* — not a stand-in for done, just "still open, nothing wrong yet" — and `blocked`/`failed`/`incomplete` are all worse than that. **There is no alternate path to a Gibson-recognized "done" that skips the merge.**

**Per instruction, nothing was built around this.** Treating an approved review, or a `parked` state, as a substitute "saved completion" would have been exactly the invented-replacement-lifecycle this task was told not to build. The exact incompatibility, stated plainly: this scope prohibits commits/merges/pushes/deployment, and Gibson's only completion signal requires one of those (merge). **This connection does not and will not reach a Gibson-recognized "done" — left genuinely incomplete, not worked around.** The review/correction loop (builder → checks → review → approve/reject, verified in the prior entry) remains real and useful on its own terms; it is simply not — and cannot be made to be, within these constraints — a substitute for Gibson's actual completion signal.

**A second, related finding from the same reads was applied to existing code, not left as a gap.** `E3` is defined precisely as *"cross-vendor independent review: different provider AND identity, exact-head bound,"* computed by `scripts/delivery-receipt.mjs`/`pr-review-evidence.mjs` from real GitHub evidence (the PR review API, commit `Agent-Vendor:` trailers, reviewer identity at the exact head SHA). The existing reviewer connection's `reviewIndependentModel` flag (added in the entry above) only ever meant "a different model/provider string was configured for this one call" — a self-reported signal with zero GitHub evidence behind it, nowhere close to `E3`, and the name invited exactly the false-independence reading this task warned against directly. **Renamed throughout** (`gibsonAction.ts`, both test files) to `reviewUsedDistinctModel` / result field `reviews: [{usedDistinctModel}]`, with an explicit doc comment stating plainly that this bridge never commits, never opens a PR, never calls the GitHub API, and therefore cannot produce `E3` evidence under any configuration — so the flag must never be read as satisfying Gibson's contract. No behavior changed; only the name and its documentation. The field's actual meaning was correct before — the risk was entirely in what the old name implied to a reader.

**Verified:** the fast suite (`gibsonAction.test.ts` + `gibsonBridge.test.ts`, 30 tests) and the real `gibsonHermesLoop.temp-repo-check.test.ts` suite (5 scenarios against the production `gibsonAction()`, stub models, disposable repos) all pass after the rename. Typecheck clean against baseline. No other behavior changed — `release` stays refused exactly as before, `reviewer` still routes through Workspace exactly as before, env isolation unchanged.

**Net result of this whole thread:** the review/correction loop is real, verified, and routed through Workspace's controls, with a correctly-named, non-overclaiming signal for whether a given review used a distinct model. A Gibson-recognized "done" is explicitly **not** reachable through this connection, by Gibson's own contract — reported as such, not approximated.

**Not done:** no new lifecycle or completion state invented; no broadened permissions; no commits, merges, pushes, or deployment anywhere; no live inference; no downloads.

---

## 2026-10-25 — Full delivery is blocked on external credentials, not on code; checked for real rather than assumed

Asked to prepare the Git/reviewer connection Gibson's own completion contract (`delivered` = merge + `E3` independent review — see the entry above) would need for a real, full delivery, and to check this machine's actual repository configuration and reviewer credentials — read-only, no secrets exposed — before asking for anything. No code was written this pass: the checks below show there is nothing safe to build yet, and building against a nonexistent credential would have been exactly the invented workaround this task ruled out.

**Checked, read-only, no values printed:**
- **Remote:** `origin` = `https://github.com/Clemens865/Workspace-OS.git`, default branch `master`.
- **Authenticated identity:** exactly one, anywhere on this machine — `warrigallife` (`gh auth status`). No second account, no second token, no bot identity found.
- **Access level:** `gh api repos/Clemens865/Workspace-OS` → `{"pull": true, "push": false}` for `warrigallife`. Read-only — this identity cannot push a branch to this repository.
- **Collaborators:** `gh api .../collaborators` → `403 "Must have push access to view repository collaborators"` — cannot even enumerate whether another collaborator already exists who might serve as a distinct reviewer.
- **Fork:** `gh api repos/warrigallife/Workspace-OS` → `404` — no fork exists under this identity to open a PR from instead.

**The exact remaining blocker:** two independent gaps, either one sufficient on its own to block delivery, both present simultaneously:
1. The builder identity itself cannot push to this repository and has no fork to push to instead — there is no way to even create the branch/PR a review would attach to.
2. There is categorically no second GitHub identity on this machine to serve as the distinct reviewer/release identity that both Gibson's own `E3` contract and GitHub's same-author branch-protection restriction require.

Both are external account/access facts, not a missing extension point in this bridge. Writing a real `RELEASE_CMD`/`REVIEWER_CMD`-invoking mechanism now would mean guessing a specification against credentials that don't exist, with nothing real available to verify it against — not done, per instruction.

**Concrete approval request, if full delivery is wanted (not another investigation prompt):**
- **Repository:** `Clemens865/Workspace-OS`, default branch `master`.
- **Operations:** (1) grant `warrigallife` push access on this repo, **or** create/confirm a fork under an account the user controls so a PR can be opened at all; (2) one real `git push` of a reviewed branch; (3) one real `gh pr create`; (4) one real review (`gh pr review --approve`/`--request-changes`) run under a **second, genuinely distinct** GitHub identity, at the exact head SHA; (5) one real `gh pr merge` run under that or another distinct identity.
- **Reviewer/release identity:** none exists today. A second identity (a separate personal account, or a dedicated bot/service account the user controls) must be created and authenticated by the user — doing that myself would be an account-permission change, out of scope here.
- **Expected usage:** one-time, live actions only (one push, one PR, one review call, one merge call) — not a recurring budget. If the second identity is itself an AI agent rather than a human, its own review session would need its own separate, explicit budget at that time.

**Not done, and not claimed complete:** no code changed; no credentials created, authenticated, or inspected beyond presence/permission-level; no commit, merge, push, or deployment attempted or performed. The existing review/correction connection (builder → checks → review → approve/reject, verified in the entries above) is unchanged and remains the full extent of what this bridge does today — full delivery stays explicitly unreachable until the approval above is granted.

---

## 2026-10-25 — Two corrections: the destination isn't invented, and the "second account" requirement above was overstated

Asked to resolve the repository destination from existing records rather than assuming Clemens865's repo was it, and to re-check whether Gibson's review requirement really needs a second GitHub account. Both corrections below come from an existing record and a direct code read — nothing invented, nothing rebuilt, no config/credential changes.

**1. Repository destination.** `docs/reports/Warrigal_Software_Integration_Inventory_2026-10-17.md` — a prior, independent audit, not written for this task — already documents: *"Workspace-OS | `github.com/Clemens865/Workspace-OS.git` | Separate upstream project (third-party/forked), **not a Warrigal repo**."* That settles the question the entry above left open: Clemens865's repo was never the delivery destination, it's upstream — exactly what `origin` already correctly represents. The same record's pattern (`warrigallife/warrigal-research-suite`, `warrigallife/JUFE`) suggests where a Warrigal-owned fork would live, but `gh repo list warrigallife` returns no Workspace-OS-named repo, and the earlier 404 on `warrigallife/Workspace-OS` stands. **No destination repository exists under the user's own control yet.** Per instruction, this is reported as a genuine gap, not filled by creating a fork or repointing `origin` to a guessed URL. `origin` is left exactly as configured; local history (`master`, 50 commits ahead of `origin/master`, plus uncommitted changes) and the upstream reference are both untouched.

**2. Gibson's review requirement, corrected — it does not require a second GitHub account.** Direct read of `scripts/pr-review-evidence.mjs` (not re-derived from memory): valid `E3` evidence is *"formal reviews… by a listed Bot identity, an App-authored `review-evidence:v1` comment… **or an owner-countersigned `owner-attested-review:v1` comment** for a vendor with no GitHub App on this repo (e.g. Codex, run locally) — refused only for a vendor that already has a real App reviewer identity."* The marker fields are `head-sha`, `reviewer-vendor`, `result` — **a single structured PR comment, postable under the same GitHub account.** No second account, no bot/App installation required. What *is* required: the review itself must genuinely come from a different model/vendor than the builder — exactly what `reviewerModel`/`reviewerProvider` (built and verified two entries ago) already provides — plus recording that verdict in this specific comment format. The entry two above should be read with this correction; it overstated the identity requirement.

**Reused, not rebuilt:** the existing reviewer connection (routes through Workspace's launcher, optional distinct model/provider, correctly-named `reviewUsedDistinctModel` flag) is unchanged and is exactly the piece this corrected requirement needs.

**Exact remaining gaps, both genuine:**
- No destination repository exists under the user's own control — external, not a code gap.
- The `owner-attested-review:v1` comment-posting step itself is not built in this bridge. Deliberately not built now: it needs a real PR on a real repo to construct and verify the comment against (head-SHA binding, exact marker fields), and creating/pushing to any repo is out of scope here — building it blind would be the premature workaround this task ruled out. Once a destination exists, this is a narrow, well-specified addition (one `gh`-posted comment, not a merge) reusing the same `execute()`-routed reviewer session.

**Not done:** no code, config, or credential changes; no repo created or forked; no commit, merge, push, or deployment.
