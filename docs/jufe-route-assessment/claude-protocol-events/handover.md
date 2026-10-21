# Restricted Claude streaming event classification — 2026-10-21

Continues `0eb5708`. No inference, authentication session, UI retry or source-record reads performed.

## What the installed contract establishes

Static inspection of the installed Claude Code 2.1.267 binary (SHA-256 unchanged from saved evidence) establishes distinct streaming families: assistant/result data, lifecycle notifications, and tool/control events. `installed-contract.json` preserves selected embedded schema/producer excerpts and offsets.

The prior adapter accepted assistant/result/init, rejected every other non-system event with an undifferentiated error, and silently ignored every other system subtype. Both behaviours were too coarse. The installed contract explicitly describes `keep_alive` as a payload-free heartbeat receivers must ignore, `rate_limit_event` as a notice emitted when rate-limit state changes, system `status` values as `requesting`, `compacting` or null, and `informational` as a text banner. It separately exposes control requests, tool progress, permission retry and model-fallback notifications.

**The event that caused the saved 0eb5708 failure cannot be reconstructed.** Its type/subtype/body were not recorded. A valid lifecycle event could have caused that rejection, but no specific event type is established by the old evidence. These deterministic changes do not demonstrate that a live run will now succeed.

## Implemented boundary

The adapter now explicitly classifies a narrow supported lifecycle set: payload-free keep_alive; allowed/allowed_warning rate-limit notices without active overage; validated system status; and informational banners without a tool link or continuation block. These do not resolve a request, dispatch an action, alter grants, extend deadlines, start a retry, change a model, or alter authentication. Only sanitized type/subtype/classification is retained for them, not banner text, account fields or notice payloads.

Rate-limit rejection, active paid-overage indicators, continuation blocks, malformed notices, tool/control requests and tool progress fail closed. Unknown types and unsupported system subtypes also fail closed—including model_refusal_fallback, permission_retry, hook/task notifications and compaction-boundary payloads. Stream deltas, user echoes and authentication messages are not enabled by this change. No control reply is sent and no tool permission is granted. Native tool content checks, exact model checks, source grants, budgets and review gate remain intact.

Every parser/protocol rejection now includes safe event type, subtype (including recognized request subtype) and a fixed rejection reason. Known vocabulary survives; arbitrary/unrecognized strings become `<redacted-unrecognized>`, and absent fields are marked. Model-identity failures retain their existing sanitized diagnostic alongside this metadata. Malformed JSON errors no longer expose parser excerpts from model/event content. The existing coordinator persists the bounded error in state, outcome and handover before ending the run. Raw rejected payloads, tool inputs, credentials and research text are not included in these diagnostics. Supported lifecycle payloads are also excluded from native event evidence.

## Verification and limits

108 deterministic tests passed across five files under Electron. Fixtures cover the installed lifecycle forms, non-resolution until a real result, sanitization of lifecycle payloads, rejected controls/tools, system fallback/permission events, overage/rate limits, malformed values, exact identity checks, generic JSON rejection without content leakage, persisted control rejection in outcome/handover, cancellation, review/save gates and the live execution block. Fixture strings such as PRIVATE/SECRET are synthetic, not actual credentials or source passages.

Build passed; no new typecheck errors (70 known /75 baseline). Five originals were SHA-256 verified. Boundary files remain byte-identical to the prior checkpoint. Live execution remains blocked; no live attempt or inference is authorized by this checkpoint. Prior failed runs remain unchanged. No push.
