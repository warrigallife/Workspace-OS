# Context reduction from the preserved 32,045-token run — 2026-10-22

Scope: offline implementation only. No inference, model/provider changes, budget increase, source edits or access changes. Live block remains intact. The original failed run and recovered report retain their status.

## Evidence and change

Baseline: `../claude-thinking-live/ui/event-002.json`, `event-007.json`, `event-013.json`, `event-018.json` and `../claude-thinking-live/per-stage-usage.json`. Dana consumed 15,527 tokens; Nora 16,518; combined 32,045 against 24,000. Both stages retrieved lines 1–80 from both records. Full saved profiles were 809 and 1,310 characters; their unavailable Git/edit/handover duties were then overridden in the same requests. Finalisation repeated structural schemas already sent separately in `format`.

The coordinator now sends concise run-specific specialist/reviewer instructions instead of full general-purpose personas plus overrides. Full profiles remain in local event evidence; global profiles are unchanged. It sends finalisation structure once through `format`, retaining all validator bounds in concise prose. Nora is instructed to start with exact trusted draft spans and request wider context whenever needed, rather than blanket ranges. No lookup content is truncated, no evidence is silently dropped, and no narrower range is enforced. Source hashes, grants, independent retrieval, semantic review, complete local transcripts and the span-only quotation contract remain unchanged.

## Expected reduction and limits

`measure.cjs` reproducibly compares saved requests to current helpers, without model calls. `estimate.json` records all assumptions. Across the same two requests per role, instruction reductions remove **5,935 weighted context characters** (initial context counted on both responses). At an illustrative 3–5 characters/token, this saves approximately **1,187–1,978 tokens**, leaving **30,067–30,858**.

A conditional example retains Nora coverage lines 48–54 and schedule lines 56–65, enclosing the historical quotation locations 51, 53 and 60 with neighboring text. It saves another 13,578 serialized tool-result characters. These ranges are an estimate, NOT a hardcoded plan or assertion of sufficient semantic context. Combined projected usage is **25,541–28,142 tokens** (27,167 at four characters/token). No tokenizer or provider measurement establishes these figures. Host overhead, auxiliary activity and response length are assumed unchanged; further reads/correction cost extra. Historical draft quotations were short substrings; the current contract copies complete lines, potentially enlarging Dana's response and Nora's input, excluded from this optimistic estimate.

**The evidence does not justify fitting the complete task into 24,000 tokens.** These changes reduce avoidable context but do not establish a guaranteed reviewer reserve or automatic completion. No fabricated per-role quota or accounting discount was introduced. The exact existing shared cap remains authoritative. Next action: decide on a smaller substantive task/evidence scope before another live attempt; no scope reduction or new approval is assumed here.

## Verification

61 deterministic tests passed in three focused suites under the Electron runtime. New checks cover compact request content, full lookup/hash retention, complete trusted draft delivery to Nora, independent-review instructions, limits retained outside provider grammar, and combined totals of 23,999 / 24,000 / 24,001: only the last fails, before saving review/completion. Existing focused tests exercise persistent multi-turn transport, one correction, cancellation, model identity, tool restrictions, failure handling and live block. Baseline typecheck passes (70 known errors against 75 baseline); diff whitespace check passes. Originals have a verified SHA-256 manifest. No broad regression-suite repetition or live calls.
