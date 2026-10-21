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
