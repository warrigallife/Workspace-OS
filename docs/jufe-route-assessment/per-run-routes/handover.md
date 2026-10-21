# Per-run research routes — 2026-10-22

Supersedes the pending Sonnet-specific proposal. Implementation only; no provider, authentication, metadata or model calls were made. No UI inference attempt, downloads, credentials, global profiles or installed-app replacement.

## Implemented

Agents → **JUFE research — Dana → Nora** now offers an independent provider and exact model field for each role. Only the existing Claude and loopback Ollama adapters are supported. The queue copies and freezes the selected routes; saved state, receipts, outcome and handover retain them. Explicit retries retain the old selection; restart recovery interrupts unfinished research as before. Legacy jobs preserve their original local/Claude defaults. There is no automatic fallback, model substitution or automatic retry.

Claude initialization and every research-answer event must match the selected full model ID exactly. Short aliases are rejected. Required answer identity cannot be inferred solely from result accounting. Additional aggregate model identifiers are sanitized and disclosed with their token/cost figures as **additional aggregate usage; purpose unattributed**. Their purpose is not established or whitelisted. Per-session cumulative accounting emits deltas into the existing run budget; repeated cumulative totals are not counted twice. Missing, malformed, decreasing or disappearing required accounting fails closed. Accounting cost is an estimate, not proof of billing. Disclosure is saved in usage.json, state/outcome and handover, and appears through the existing result display.

Ollama requires the exact selected installed name:tag, local GGUF metadata, no remote model/host metadata and a valid observed digest; the existing Llama 3.2 digest pin remains. Other installed local model digests are recorded at preflight, not asserted immutable thereafter. Returned answer model must match. No subscription or cloud spending preflight runs for an all-local selection. The existing Llama model is **not research-qualified**; selecting any model does not demonstrate availability, capability or quality. Non-GGUF or unverifiable metadata is unsupported and stops before chat.

## Governance and limitations

The two approved reports, grants, staging path, citation checks, independent Dana/Nora stage contexts, review gate, cancellation, deadlines, token/step limits and fail-closed persistence remain. Existing ordinary specialist launches and Liam–Ada are unchanged. Cloud/mixed runs remain hard-blocked before either stage; native Claude launch is separately blocked too. Cloud selection is not live approval. Pro authentication, credits-off/subscription-only confirmation, exact model availability and an explicit approved spending cap are still prerequisites for a separately authorised live test. Existing overage/protocol rejections remain. No claim that the CLI cost cap itself proves subscription-only billing.

Only deterministic fixtures verify the four provider pairings. No new live compatibility or research-quality claim is made. The existing unrestricted agent launch path is not used to bypass the research boundary. No other provider adapter or model-discovery UI was added.

## Verification and recovery

257 deterministic tests across 18 files passed using the Electron-compatible runtime. Coverage includes route snapshots and persisted recovery, both same-provider and mixed pairings, exact-answer mismatch, additional aggregate usage and cumulative deltas, malformed accounting, local missing/remote models, cloud live block, fabricated citations, reviewer rejection, cancellation, interruption, failed saves, grants and Liam–Ada regressions. Production build passed. Typecheck has no new errors (70 known against the unchanged 75 baseline). No UI/live calls.

16 pre-edit originals are SHA-256 verified against manifest.json. verification.json records unchanged source-boundary/grant/profile/normal-launch hashes; all earlier evidence remains. tests.txt, build.txt and typecheck.txt hold check output. This directory and the implementation are included in one local checkpoint; no push.

Next action: select the exact Dana/Nora routes in the research panel. A cloud or mixed live test requires fresh explicit approval of transmission/model/billing/spending terms after prerequisites are confirmed; this checkpoint cannot enable it. An all-local route uses only already-installed qualifying metadata, but model research suitability still requires evaluation. No automatic run is pending.
