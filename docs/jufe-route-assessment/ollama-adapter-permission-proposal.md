# Existing-runner Ollama adapter: feasibility and approval boundary

Assessment date: 2026-10-20. Continued from a6a393f. **Proposal only; no runtime changes or model runs.**

## Feasible bounded integration

Reuse `launchRun` and its RunSink interface, existing RunQueue persistence/cancel/interruption behavior, `readAgentForRun`, grant issuance/revocation, `invokeGrantedAction`, CheckpointStore and existing artifact/result UI. Add an explicit local Ollama provider branch before the current memory recall, inherited environment and connector-secret injection. Only localhost 127.0.0.1:11434 and installed llama3.2:latest; no redirects, downloads, proxy or cloud fallback. No shell/native model execution tools. Model tool requests are data dispatched through the existing bridge authorization checks, not executed as code.

This is a provider adapter with narrowly scoped action handlers, not a replacement queue/framework. However, normal runs currently land pending human review; an automatic independent reviewer gate is not already available there. Add a small sequential stage transition using the same adapter and queue job: Dana reads/drafts, Nora receives the draft and independently re-reads cited records, then trusted code verifies citations and finalizes report/handover. Do not modify or import the Python pilot as the executor. Reuse its established evidence/handover conventions, not its Python workflow.

## Exact permission expansion requested

### Source reads (Dana and Nora only, per run)

New action `researchRecords.lookup`, authorized by a dedicated per-run capability. Stable IDs and bounded line ranges only, no caller-supplied filesystem paths. Exactly two approved files:

- `jufe-coverage-2026-10-11` → `/Users/liammcilmurray/Desktop/JUFE/docs/reports/JUFE_Full_Collection_Coverage_Audit_2026-10-11.md`
- `jufe-schedule-2026-10-11` → `/Users/liammcilmurray/Desktop/JUFE/docs/reports/JUFE_Schedule_and_Source31_Coverage_Review_2026-10-11.md`

Limit each lookup to 80 lines / 32 KiB; reject symlinks or identity drift and oversized/missing sources. Bind each run to source hashes. No directory enumeration, manuscript access or automatic following of references. The two candidate files were inspected (160 and 212 lines respectively); common credential/private-key scans found no matches. This is not a claim of exhaustive sensitive-content classification.

This permits research on what those dated reports record, not an assertion of current JUFE-wide completeness. Newer or referenced material stays unresolved unless separately approved.

### Staged outputs (role-specific, per run)

New `researchReport.save` action: Dana can save only a draft; Nora can save only her review. Fixed filenames, no caller-supplied paths. Trusted coordinator writes verified final report, progress and handover, and exposes them through the existing artifact UI. All writes are confined to a new exclusive run folder under:

`/Users/liammcilmurray/Desktop/Workspace-OS/.workspace-os/liam-workspace/JUFE-staging/<run-id>/`

The current local app's workspace is the parent liam-workspace. Reject workspace switches, path traversal, symlink escapes, reused attempt folders and overwrites of prior runs. Reports/progress may be updated only inside that run's new folder; originals and other runs cannot be changed. Use a per-folder checkpoint so JUFE is never checkpointed or modified by this workflow.

### Authority limits

These are temporary grants for **Dana — JUFE Runtime Keeper** and **Nora — Workspace Auditor**, not persistent profile changes. Each stage receives only its exact read/save actions; do not forward their broader files/cases capabilities. No memory.remember, browser, arbitrary filesystem, shell, delegation, credentials or external connector access. No grant or source changes to Liam–Ada, including its existing 15-source registry. Bridge token/grant/workspace checks remain mandatory; Safe mode/persona text is not treated as enforcement.

Installed model execution over loopback is local; no cloud credentials are loaded or passed. Bounded policy: at most 12 model responses and 16 tool calls per specialist/reviewer stage, one sequential reviewer, six-minute overall deadline, bounded prompts/results, no automatic model retry or fallback. Cancellation revokes grants and aborts inference; interruption saves partial state and never resumes automatically. A user retry creates a new linked run and retains originals.

## Acceptance after approval

Validate scope denials, cancellation and persistence with Electron-compatible tests. Through real Workspace OS UI submit one task: report outstanding work **as recorded in the two approved coverage reports**, distinguishing reported facts from inference and unresolved currency. Require Dana's actual lookup calls, Nora's separate review and independent source lookups, and deterministic checks of every quoted citation's stable record ID, line range, exact text and source hash. Mechanical checks establish quote fidelity, not semantic entailment; Nora's review assesses interpretation. Reject missing/incorrect citations or review rejection; no completion claim on model prose alone.

Save and display the final report plus handover in Workspace OS; preserve source hashes, tool receipts, model responses and stage state. If the installed model fails the bounded workflow, stop and preserve failure instead of repeated prompt experiments. Exact tested clicks will be documented only after successful verification.

## Pending decision

Approve the two exact source reads, stage-specific staging writes and the bounded Dana/Nora local run described above. No runtime permission expansion has been applied. If approved, proceed with this limited provider adapter; if the implementation proves to require replacement orchestration rather than these existing interfaces, stop and return the smallest existing executor alternative.
