# Supported thinking-token progress notice — 2026-10-22

Continued from ea21aba. No live calls. The failed run bg-mviqojx1-tm4ont and its accepted Dana draft remain unchanged and unapproved by Nora.

## Established meaning

Static inspection of installed Claude 2.1.267 (SHA-256 a681f3008f0050029aeebcab3af51bb6a55ddeb625a3af3141a4416d43cd2558) establishes system/thinking_tokens as non-action progress metadata. The schema at byte offset 160981448 describes a live estimate derived from thinking_delta during redacted thinking. estimated_tokens is a running total for the current thinking block; estimated_tokens_delta is that frame's increment. Its documentation explicitly distinguishes approximate display progress from authoritative billed output_tokens. The producer at 172510238 emits this system notice from an estimate on a stream event; additional producers report the same progress. No tool, permission or control request is involved. Exact local snippets and offsets are in installed-contract.json.

This establishes the subtype's meaning, not every field of the historical rejected event: that event's payload was not retained. No guess about missing historical fields is made.

## Narrow handling

The classifier now recognizes this one subtype as lifecycle metadata when both estimates are nonnegative safe integers and delta does not exceed the current block total. It permits only the documented field names; optional identifiers are bounded nonempty strings when present. Missing/malformed estimates, contradictory values, unexpected fields or action payloads fail closed. These are conservative input checks; no requirement for progress to increase across frames, because repeats and new block resets are legitimate.

Existing lifecycle handling records only sanitized type/subtype/classification, discarding estimates and identifier payloads. It does not resolve a pending request, count a turn, change initialization/answer identity, execute any tool or update token/cost accounting. Authoritative aggregate result usage still supplies budget deltas. All other unsupported events and controls remain rejected. Native tools/MCP restrictions, exact selected models, source grants, citation validation, Nora review, budgets and the live block are unchanged.

## Verification/recovery

160 deterministic tests /5 files passed in the Electron-compatible runtime. Tests cover valid/zero/repeated/reset notices, malformed/missing/oversized values, action payload rejection, no answer resolution, no usage addition, no identifier leakage and rejection of a result without research-answer identity. Existing adapter/coordinator tests retain review rejection, failed saves, permissions, cancellation and live-block behaviour. Build passed; no new typecheck errors (70 known /75 baseline).

Five originals SHA-256 verified. verification.json records unchanged adapter, accounting, coordinator, budgets, sources/grants and ordinary launcher. No inference, downloads, purchases, permission expansion, budget increase or push. Live compatibility remains unverified; this task does not approve or run another UI attempt.
