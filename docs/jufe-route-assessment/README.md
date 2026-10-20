# Bounded local JUFE research route

**Implemented; the research task remains blocked.** The first live run failed before retrieval. The retrieval-first update successfully read both approved records, but the next model response was prose instead of a structured save. No reviewed research report is available. The Python pilot is unchanged.

## What the route does

The existing Workspace OS background RunQueue calls launchRun's dedicated Ollama branch before memory recall, inherited environment, cloud CLI or connector-secret loading. HTTP is fixed to 127.0.0.1:11434 and installed llama3.2:latest with its verified digest; no proxy, redirects, model download or cloud fallback. This is a task-specific local provider adapter, not a general Ollama replacement for all specialist runs.

Dana and Nora use their existing personas, but receive new **temporary exact-action grants** for this approved run only. Normal profile capabilities are not forwarded and no profile is edited. The bridge still checks the token, matching open workspace and grant, then the task scope checks the role:

- `researchRecords.lookup`: only the two approved stable IDs, 1–80 existing lines, at most 32 KiB; no caller paths or source discovery. The two JUFE originals are hashed at run start and rechecked during reads/saves/finalization. Symlinks, missing sources and source changes fail closed.
- `researchReport.save`: Dana can create one structured draft; Nora can create one structured review. No model-controlled filenames. Coordinator progress, raw responses, final report and handover are restricted to the new `JUFE-staging/<run-id>` folder in the existing local workspace. Prior folders cannot be reused or overwritten.

The two allowed record IDs are `jufe-coverage-2026-10-11` and `jufe-schedule-2026-10-11`, mapped to the exact paths in the approved proposal. Ada's separate 15-source allowlist is unchanged. No memory writes, shell, browser, delegation or general filesystem tools are exposed.

Each stage begins with only `lookup` exposed. `save` is enabled only after successful reads from both approved record IDs; the scope handler independently enforces this prerequisite even for unadvertised save calls. This does not establish full-file coverage: each cited range still requires its own actual retrieval. Shared field limits drive both tool schemas and validation, with field-specific errors. Run instructions suspend unavailable Git/edit/post-edit-test duties without changing the saved profiles.

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

## Retrieval-first update — deterministic verification

The three diagnosed fixes are implemented without changes to grant issuance, source allowlists, citation fidelity/retrieval checks, review approval requirements or the 12-response/16-tool/six-minute budgets. Only the advertised tools and prerequisite checks now enforce reading first. The reviewer also starts with fresh retrieval prerequisites.

106 focused Electron-compatible tests passed across seven files. New coverage exercises a premature save, one-record-only denial, tool availability after both records, fresh Nora retrieval, preserved tool-result messages, complete deterministic Dana → Nora progression, precise errors for both previous malformed save forms, shared schema/validator field limits and the run-specific Git/edit suspension. Typecheck passed its unchanged baseline (70 known diagnostics versus 75). No model calls were used by these tests.

Pre-edit originals and hashes: `pre-retrieval-first.tar.gz`. The previous real failure remains in `live-verification/` and its original staging folder. The new UI verification writes a separate `retrieval-first-verification/` directory and compares every file in the previous failed run before/after.

## Retrieval-first real UI result — stopped on failure

One bounded Desktop-launched UI submission, `bg-mvfrniva-d7d502`, used the same existing local app data and fixed installed Ollama model. The initial request advertised only `lookup`. Its response invoked four successful lookup calls: lines 1–80 of each approved record, each requested twice. Those were actual bridge-authorized local reads. Duplicate calls counted toward the unchanged tool budget. This established partial retrieval of both records, not complete coverage of either report.

The next request correctly offered `lookup` and `save` and retained all four tool results. The model then returned ordinary prose without any tool call (`done: true`, `done_reason: stop`; 10,902 prompt tokens, 682 generated tokens). This was not a reported truncation, tool rejection or budget exhaustion. The existing no-tool failure policy stopped the run after two responses. **No save was attempted, no draft/report accepted, and Nora was not invoked.**

The prose cited `JUFE_30_Foundational_Analysis_2026-10-10.md` and `JUFE_11_12_Foundational_Analysis_2026-10-09.md`, which are referenced by the approved reports but were not retrieved by this run. It also repeated findings. This is unvalidated model text, not independently checked research. No new source access was granted to follow those references.

Exact remaining blocker: after successful retrieval and availability of the correctly constrained save tool, the installed model did not produce the required structured save with citations to the retrieved approved records. The sequencing fix demonstrably enabled real retrieval, but end-to-end research/report/review completion is still unverified. No additional model call, resubmission or prompt experiment followed.

The UI displayed the saved failure handover. Final run checkpoint: `a0361a8c08afcea3742b8866732c606c96025756`. Both JUFE source hashes and every pre-existing file in the previous failed run were unchanged. New evidence: `retrieval-first-verification/`; the old evidence remains in `live-verification/`. The Desktop launcher rebuilt the updated checkout successfully.

To view this latest result: open the existing Desktop launcher, **Agents → JUFE local research — Dana → Nora**, find `bg-mvfrniva-d7d502`, and click **View research report and handover**. It displays failure evidence, not an approved report.

## Structured finalisation (2026-10-20)

The local adapter now separates retrieval from final output. Dana uses authorised lookup calls for both records, then receives the existing save schema as Ollama's JSON `format`. Nora independently retrieves both records and every draft citation range before receiving the review schema. Trusted code submits each parsed JSON object through the existing token-authorised `researchReport.save` handler. Schema-constrained generation is not proof of factual correctness: exact quotations, retrieved ranges, source hashes and approval are still checked. Rejected JSON/citations stop the attempt; no automatic follow-up experiment runs. The same response, tool and time budgets apply, including the coordinator's save call.

Use the existing Desktop launcher **Workspace OS — Local Python Pilot.command**, then **Agents → JUFE local research — Dana → Nora → Run approved JUFE research**. This panel is separate from the Python pilot despite the launcher's historical name. View the run with **View research report and handover**. A failed handover is not a reviewed report. Single-attempt verification evidence is retained in `structured-finalisation-verification/`; older attempts remain in their original directories.

**Live result: failed**, run `bg-mvfyujmy-lovpsj`. Retrieval worked, but the installed Ollama grammar compiler rejected the nested save schema's repetition complexity with HTTP 400. No structured answer, draft, Nora review or final report was produced. See `structured-finalisation-verification/provider-diagnostic.txt` and `ui-result.json`. No retry was made. Deterministic adapter tests do not establish live-provider success. The exact remaining blocker is schema grammar compilation; simplifying generation-only constraints without weakening trusted validation remains untested.
