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
