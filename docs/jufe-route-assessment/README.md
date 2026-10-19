# Bounded local JUFE research route

**Implemented; the first live research task failed.** The installed model did not retrieve the approved records or produce an acceptable cited draft. No reviewed research report is available. The Python pilot is unchanged.

## What the route does

The existing Workspace OS background RunQueue calls launchRun's dedicated Ollama branch before memory recall, inherited environment, cloud CLI or connector-secret loading. HTTP is fixed to 127.0.0.1:11434 and installed llama3.2:latest with its verified digest; no proxy, redirects, model download or cloud fallback. This is a task-specific local provider adapter, not a general Ollama replacement for all specialist runs.

Dana and Nora use their existing personas, but receive new **temporary exact-action grants** for this approved run only. Normal profile capabilities are not forwarded and no profile is edited. The bridge still checks the token, matching open workspace and grant, then the task scope checks the role:

- `researchRecords.lookup`: only the two approved stable IDs, 1–80 existing lines, at most 32 KiB; no caller paths or source discovery. The two JUFE originals are hashed at run start and rechecked during reads/saves/finalization. Symlinks, missing sources and source changes fail closed.
- `researchReport.save`: Dana can create one structured draft; Nora can create one structured review. No model-controlled filenames. Coordinator progress, raw responses, final report and handover are restricted to the new `JUFE-staging/<run-id>` folder in the existing local workspace. Prior folders cannot be reused or overwritten.

The two allowed record IDs are `jufe-coverage-2026-10-11` and `jufe-schedule-2026-10-11`, mapped to the exact paths in the approved proposal. Ada's separate 15-source allowlist is unchanged. No memory writes, shell, browser, delegation or general filesystem tools are exposed.

Each stage is bounded to 12 local responses / 16 tool calls; the whole run has a six-minute deadline and per-request timeout/response limits. A response without required tools terminates the stage. There is no automatic whole-run retry. Nora begins only after Dana saves a valid draft. Approval requires her own lookups covering every citation, plus exact quote/range/hash checks by trusted code. Quote fidelity is not semantic truth; Nora's separate invocation assesses meaning using the same model, not an independent provider.

Existing queue events and numbered evidence files save progress. Queue cancellation aborts local HTTP and revokes grants. The Ollama server may still finish an already submitted inference. Previously queued/running research becomes interrupted on restart and does not auto-resume. Retry creates a separate linked run; a forced machine crash was not live-tested. The shared background queue now fails closed on malformed persistence, instead of silently treating it as empty. No global specialist permission was changed.

## Verified outcome

Actual Desktop launcher → Agents → JUFE local research → Run approved JUFE research, workflow `bg-mvfjwjrp-jrzvu0`:

- Three local model responses, two attempted `researchReport.save` calls, **zero lookup calls**.
- First save had an unexpected top-level field and empty limitations; second omitted limitations. Both were rejected before any draft write. The generated text also mislabeled prompt instructions as source quotations; it is preserved as untrusted failed-model evidence, not a report.
- Third response returned prose without a tool call. The adapter stopped with `Model returned prose without required tool execution/save`.
- Nora did not run. No draft, approved review or final report was accepted. The failure handover was displayed through the real UI.
- Both source-file hashes remained unchanged. Failure checkpoint: `6e54b54dfbf6fc5c310f95f1ed1e124f6a0e1aa8`. No second live submission or prompt experiment followed.

See `live-verification/ui-result.json`, raw events and handover. The implementation's boundary and failure handling work; successful end-to-end local research with this model remains blocked/unverified.

## Checks

102 Electron-compatible tests passed across six files: grants/workspace binding, source/range/quote restrictions, independent citation retrieval, rejection, 12-response/16-tool budgets, cancellation/revocation, missing-model refusal, persistent queue recovery, and Liam–Ada authorization regressions. The build passed. `npm run typecheck` passed its existing regression baseline (70 known errors against baseline 75); no claim of zero compiler errors. Logs are retained beside live evidence. No native-module rebuild or dependency changes.

## Exact clicks

1. Double-click `~/Desktop/Workspace OS — Local Python Pilot.command`. This existing launcher opens the local checkout with `.workspace-os/liam-app-data`; its historical filename does not change the new research panel.
2. Click **Agents**, then expand **JUFE local research — Dana → Nora**.
3. To inspect the verified failure, find `bg-mvfjwjrp-jrzvu0` and click **View research report and handover**. The displayed result is a failure handover, not a research report.
4. **Run approved JUFE research** starts a new bounded attempt; **Cancel research** stops it. **Retry research as new run** preserves an incomplete attempt. No additional retry was performed during this implementation; these controls do not imply the model can succeed.

## Recovery

`pre-ollama-adapter.tar.gz` preserves selected pre-edit runtime/UI/log files with hashes; checkpoint `3c2b217` preserves all previously tracked originals, including queue tests. The failed run and its shadow checkpoint remain under `.workspace-os/liam-workspace/JUFE-staging/bg-mvfjwjrp-jrzvu0/`; copied evidence is here for review. To roll back code, quit the local app and restore selected files from the prior checkpoint into an isolated copy first. Preserve the queue, new run folders, all earlier pilot/prototype checkpoints and normal app data. Do not restore an old app-data snapshot over newer work. No rollback execution is claimed.
