# Restricted provider connection — handover

Follow-up: [installed native-host boundary determination](../native-host-boundary/handover.md). The requested adapter completion stopped at unestablished Codex native-tool exclusion. The production guard now reports that specific technical blocker; 148 deterministic tests pass. Native adapters are not claimed complete.

Status: shared coordinator connection and deterministic verification completed. **Native Claude/Codex execution remains blocked, not ready for live approval alone.** No live model calls or research-content transmission occurred.

Implemented in the existing research coordinator: injectable, stage-specific provider sessions; exact route/restriction receipt checks before sending context; mandatory usage accounting; existing grants, lookup/citation/save validation and Dana → Nora gate; Ruflo task-handler wiring; cancellation of uncooperative requests; and post-save outcome reporting that hides reports on failed saves. Existing queue interruption/recovery and staging are retained. No new UI, framework, persona, source access or Python-pilot extension.

Exact fixed route identities (from the previously inspected activity configuration, not a claim of availability):

- Dana: **Claude / `claude-sonnet-5`**.
- Nora: **Codex / `gpt-5.6-terra`**.

No default-model substitution, fallback, automatic retry or broader normal-Run permissions are allowed. Global profiles/settings and Liam–Ada are unchanged. `restricted-hosts` at the production entrypoint fails before source staging or any provider call. Tests inject trusted in-process provider stubs, not a renderer/environment bypass. Existing Ollama runs retain their original provider branch.

Passed: **144 tests in 10 files**, including 30 new deterministic cases. Covered specialist success, separate reviewer retrieval, rejection, invented quotations, failed draft/review/report/handover/outcome saves, checkpoint failure, cancellation, queue interruption, forbidden actions, missing restriction evidence, model mismatch, missing/excess token usage and Ruflo adapter failure. Electron-compatible runtime; build passed; typecheck has no new errors (70 existing, baseline 75). The initial assertion failure and final results are preserved under `verification/`.

What remains blocked:

1. The native host transport is not certified or wired to an enforceable effective-tool receipt. `restrictedHostPlan` is only a launch contract. Claude's inspected help advertises restrictive switches; Codex's inspected thread-start protocol lacks a complete effective native-tool inventory. No receipt is fabricated from flags or model prose. The driver therefore cannot currently be enabled safely. Deterministic stubs establish coordinator behaviour, not CLI enforcement or model quality.
2. Availability of these exact model identifiers is unverified. Do not substitute another name.
3. Research-content egress and live spending remain unapproved. Limits encoded for the shared coordinator: 12 responses and 16 actions per stage, six minutes overall, 24,000 reported input/output tokens total, bounded contexts/results. Usage cutoff is reactive and is not a hard dollar ceiling; Codex cost stays unknown. No paid test has been run.

**Exact next action:** establish a supported, independently checkable restriction boundary for the existing native Claude/Codex transports and implement their attested session adapters without sending research content. If the installed hosts cannot establish that boundary, stop with the specific blocker. Only after that succeeds seek explicit approval for content transmission, the exact routes and a bounded live-verification spend. Do not unlock this build merely by removing its approval guard.

Recovery: verified pre-change originals are in `originals/`; the interrupted implementation was separately preserved in `resume-originals/`. Original copies were verified by SHA-256; see `verification/originals-verification.json`. The local Git checkpoint containing this handover preserves the implementation and test evidence. No push, canonical changes, installations or runtime activation.
