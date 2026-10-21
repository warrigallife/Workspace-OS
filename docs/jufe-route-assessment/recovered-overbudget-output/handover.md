# Recovery of validated output from an over-budget run — 2026-10-22

Recovered from an over-budget run; draft and review passed validation.

Created two new files only in the approved original staging directory `.workspace-os/liam-workspace/JUFE-staging/bg-mviqvk8b-utpn8m/`: recovered-report.md and recovered-handover.md. Content is rendered from the saved Dana draft and Nora response, whose offline validation previously passed with saves blocked. No regeneration, inference, new research or budget override. The report preserves original findings, exact excerpts, record paths/ranges, dated-record limitations and Nora's recorded rationale. It explicitly distinguishes validation/model review from independent proof of scientific claims.

Original state.json, outcome.json, handover.md, drafts, raw responses and usage are unchanged and hash-verified against recovery copies. The run remains failed / queue error; there is no inserted review.json, completion receipt or status change. Local copies of the two recovered files are included here and hash-match staging.

The existing readResearchResult interface now optionally displays the two fixed recovered filenames alongside the failed outcome and original handover. It still hides ordinary report.md on failed runs. No new action, grant, source access or model route was added. A regression verifies that recovered material never overrides failed status or reveals an unaccepted normal report.

Actual UI verification through the existing Desktop launcher confirmed the source app and .workspace-os/liam-app-data, clicked only the existing run's View research report and handover button, and displayed both labelled recovery artifacts beneath Authoritative outcome: failed. Queue status remained error; zero new jobs. ui-display.txt/png and ui-verification.json preserve evidence. 49 deterministic tests passed; no new typecheck errors (70 known /75 baseline). Launcher rebuilt the local app; installed app untouched. Live block unchanged.

Use the existing Desktop launcher → Agents → JUFE research — Dana → Nora → run bg-mviqvk8b-utpn8m → View research report and handover. Do not select Run or Retry to read this output. Preserve its failed/over-budget designation. No push.
