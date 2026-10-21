# Claude model identity — deterministic correction, 2026-10-21

Continues c66a79d. No live calls or workflow repetition.

## Installed contract findings

Read-only inspection of the installed Claude Code 2.1.267 binary verified the same SHA-256 as the saved control evidence. `installed-contract-evidence.json` records bounded code excerpts and byte offsets, not runtime/private data.

- Initialization reports the host session's `model`. Assistant messages have their own `message.model`; results expose per-model `modelUsage` keys. These are separate identity surfaces.
- The installed host resolves short selectors such as `sonnet` through its model-selection functions; that alias is not a stable synonym for a particular approved model. Our workflow requests the full ID `claude-sonnet-5`, which is explicitly present in the installed model constants. No evidence establishes an alternative dated response ID as equivalent for this approved route.
- The host also constructs assistant messages with the literal model sentinel `<synthetic>`, including API-error wrappers. Its wire contract carries `is_api_error_message` and an optional integer HTTP status. Such a message is host-generated, not evidence of a different inference model. The old comparison incorrectly called every such sentinel a model substitution.

**Conclusion:** exact equality is appropriate for the approved full-ID route. Generic alias→resolved-ID equivalence was not implemented before and is deliberately not inferred now. No suffix stripping, family matching, date guessing, fallback or model substitution is accepted. An actual alias route would require an independently verified, explicitly approved resolution before transmission; it is outside this task.

The c66a79d failure remains unresolved: its native event was lost. A synthetic API error is a demonstrated possible explanation from installed code, not an established cause of that run. We cannot reconstruct its returned ID, HTTP status or underlying provider error.

## Change

Added `claudeResearchIdentity.ts` and used it at initialization, each assistant event and result model-usage checks. Synthetic/error assistant events now fail as `host-synthetic-message` or `host-api-error`; missing assistant identity fails closed. Real mismatches still reject without retries. Invalid modelUsage structures also fail closed.

Rejection messages preserve a bounded JSON diagnostic: phase, kind, sanitized requested/returned IDs and (only when valid) HTTP status. Recognizable model identifiers and `<synthetic>` survive; arbitrary strings, control characters, oversized fields and objects are redacted. At most eight identifiers are retained, with an explicit truncation flag. Response bodies, account identifiers, credential values and raw provider error text are excluded. Existing coordinator error persistence saves this message in state, outcome and handover; no new source or grant is introduced.

## Verification and remaining limits

66 tests passed across four files with the Electron-compatible runtime. Tests cover exact IDs at all three surfaces; rejected aliases, dated IDs, other versions and context suffixes; synthetic/API errors; missing identities; mixed-model accounting; malformed or sensitive values; transport shutdown; persistence into outcome/handover; and the production live block. The deterministic persistence test uses a synthetic 403 solely as a fixture, not a claim about the failed live run.

Build passed; typecheck has no new errors (70 known /75 baseline). Five originals are preserved and SHA-256 verified. Existing research source/grant/runtime-limit files remain unchanged. No authentication calls, inference, credentials/billing edits, model substitutions or workflow reruns. Live execution remains blocked. Prior failures remain intact. A future live attempt requires new approval; this checkpoint does not authorize it.
