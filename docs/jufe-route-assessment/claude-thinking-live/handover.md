# Single UI verification after thinking-notice handling — 2026-10-22

**Failed at the unchanged run token limit; stopped without retry or repair.** Base f197922. Run `bg-mviqvk8b-utpn8m`; queue error; run checkpoint `0e0ce43d06c8e036b6ceada682a3328cdca7df21`.

Restricted-environment metadata confirmed Claude Pro (loggedIn=true / claude.ai / firstParty / pro). Dana and Nora selected visibly as Claude / claude-sonnet-5 in the configurable UI. Reused the recorded two-report transmission/subscription-only approval and user's credits-off/zero-balance confirmation. No purchases, credits, billing/credential changes, fallback or expanded access. Auth metadata does not independently verify credits. Existing 24,000-token, six-minute, stage/action limits and $0.50 estimated per-role threshold unchanged; estimates are not invoice guarantees. One existing draft correction permitted, none needed. No automatic session/workflow/provider retries.

Dana retrieved both reports and produced a draft that passed application validation without correction. Nora independently retrieved source evidence and returned a response. The fourth response brought accounted run usage to **32,045 tokens**, exceeding the unchanged 24,000 limit. Exact error: `Research token budget exceeded`. The budget check stopped execution before Nora's returned review could be validated or saved; no accepted review or completed report. No protocol-event rejection was reported in this attempt. Actual UI displayed the saved failure handover. No second attempt or repair followed.

## Per-stage usage

| Stage | Input including caches | Output | Total | Estimated cost USD |
|---|---:|---:|---:|---:|
| Dana | 15,007 | 520 | 15,527 | 0.0533486 |
| Nora | 16,187 | 331 | 16,518 | 0.052467 |
| Run | 31,194 | 851 | 32,045 | 0.1058156 |

per-stage-usage.json and ui/usage.json preserve cumulative accounting and additional-model disclosure. Additional aggregate usage purpose remains unattributed. Costs are estimates, not bills. The limit is checked on returned usage; it stopped acceptance but did not prevent that response's processing from taking usage beyond the threshold. No claim of a pre-generation hard token ceiling.

Dana's draft and draft-attempt-1.json are preserved. Nora's raw returned response is preserved and separately copied as returned-review-unvalidated.json, explicitly unvalidated/unaccepted. No review.json was saved. Full local transcripts, incremental wire evidence, usage, selected-route screenshot, state/outcome and handover retained.

## Restoration and recovery

Source app / existing .workspace-os/liam-app-data verified. Both original reports and twelve checked earlier failed-run directories unchanged. Six originals SHA-256 verified; four runtime/UI files restored byte-for-byte to f197922. Temporary permit/script removed from active code; durable consumed marker retained. Live-blocked app rebuilt. No permanent implementation edits or repeated deterministic tests. No push and no pending automatic attempt. Stop here.
