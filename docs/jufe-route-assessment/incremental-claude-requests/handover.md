# Incremental persistent Claude requests — 2026-10-22

Uses the completed 1de97a9 diagnosis: 49,519 tokens reconciled correctly, while repeated serialized histories and duplicated correction passages inflated actual context. No budget/accounting adjustment was justified or made. The saved correction's offline validation did not accept the failed run; it remains unchanged.

## Implementation

Each Claude role has its own in-memory transcript cursor and prior tools/format snapshot. The first request sends its initial messages. Later requests must preserve the exact known transcript prefix; a changed/truncated prefix is rejected rather than replayed. Only new messages are sent, excluding previous user/system messages and the host's own answers. Unchanged tools/format are omitted; explicit empty tools/null format clears previously supplied metadata. This changes the JSON content sent over the existing stream-json transport, not native host tool permissions. The transport instruction explains retention semantics.

The coordinator now retains the finalisation instruction once in its full transcript instead of reconstructing it on each draft attempt. Every local request event still contains the complete transcript and applicable schema; original/corrected draft artifacts and raw response events remain. Successful adapter responses additionally retain a clearly labelled workspace_os_request record showing the actual incremental payload, distinct from native host events. Prior failure sanitization is unchanged.

Correction feedback contains the precise validation error and relevant record/line references to successful earlier lookups. It does not duplicate those passages or the rejected draft, since both are already retained in the session. If no matching lookup exists, the reference list is empty; no new source/path is read or invented. Ollama remains stateless and still receives the complete local transcript with its original source passages. Dana and Nora use separate contexts; Nora receives its own initial review context and independently retrieves citations as before.

Full-transcript context bounds remain enforced even though the wire delta is smaller. Token accounting still includes cache creation/reads and cumulative deltas; spending, deadlines, action/step/response limits and the single-correction limit are unchanged. Validation, exact answer identities, native tool/MCP exclusions, grants, sources, review/save gates and live block unchanged. No fresh session, fallback or continuation after failure added.

## Verification and limitations

257 deterministic tests /12 files passed in Electron's compatible runtime; build passed; no new typecheck errors (70 known /75 baseline). Multi-turn tests inspect actual stdin: initial context once, new lookup results plus first finalisation request next, then error/reference-only correction without repeated draft, passages or schema. Changed history rejects; Nora starts independently. Integrated transport fixtures verify correction through separate review and full local transcript/draft preservation. Cancellation, persistent/unsupported citations, deadline/token/action/step exhaustion, accounting, grants, queue and Liam–Ada regressions pass.

Six originals SHA-256 verified. verification.json records unchanged validation/budget/accounting/access/normal-launch files. Earlier research failures and returned correction untouched. No live calls or model evaluation; reduced transmission duplication is deterministic, but actual token reduction, host retention performance and live research success remain unverified. Live execution stays blocked. Saved evidence and originals included in a recoverable local checkpoint; no push.
