# Restricted set.add proposal — subsequently approved

Historical proposal from checkpoint `d2beeba`, based on `f8a9dae`. The user subsequently approved exactly this boundary; see implementation-log.md for implementation and verification. The remaining sections preserve the proposal as written.

## Diagnosis

`set` already exists in `SAFE`; `ast.Set` and set comprehensions are already allowed. The method name `add` is absent from `METHODS`. Accordingly both the `ast.Call` and `ast.Attribute` rules reject `seen.add(item)` at line 7, column 13 in the saved duplicate-removal candidate. This occurs before sandbox execution. No filesystem, network or process denial caused this failure. The current diagnostic names the exact operation.

Read-only preflight reproduced this result: `def solve(value): return list(set(value))` has no policy diagnostics; the saved candidate has CALL_POLICY and ATTRIBUTE_POLICY. The former is only a policy probe, not a correct order-preserving solution or a model success.

The record does not establish why the original author omitted `add`; it establishes an explicit, conservative method-name allowlist, rather than evidence that set mutation requires external access. Existing `append` already permits in-memory collection mutation. Set insertion is useful for the saved algorithm and is reasonable within the same isolation boundaries when restricted to an actual builtin set. It can still fail on unhashable input and remains subject to existing resource limitations (including no hard RSS cap).

## Exact proposed permission delta

Permit only a direct call `receiver.add(item)` with exactly one positional argument, no starred arguments and no keywords, and only when `type(receiver) is set` at runtime. The return value is Python's normal `None`. This is one additional in-memory operation; the constructor already needs no change.

Do **not** add `add` to the general name-only METHODS allowlist. Instead:

1. Preflight recognizes only the specified direct call shape. An `.add` attribute used as a value, extracted into a variable, or called with a different argument shape remains rejected.
2. After validation, the worker transforms that specific call to a trusted private helper. The helper checks the exact receiver type and calls the builtin `set.add(receiver, item)` descriptor; it never dispatches an arbitrary object's `.add` method. Both operands are evaluated once. Wrong receiver types produce an explicit runtime policy failure.
3. The helper name is injected only by trusted code after source validation. Source access to private names stays denied; no `type`, `getattr`, extra builtin, general attribute access, imports or user-defined classes are granted.
4. Generator guidance describes this same narrow operation. No other permitted calls or syntax change. Seatbelt, filesystem/network/process denials, sanitized environment, CPU/wall/output limits, review gate, cancellation/recovery, Liam–Ada and the initial-plus-two-repairs limit remain unchanged.

## Verification after approval

Preserve the source originals before implementation. Test set insertion and its None return, rejection of non-set receivers, extracted methods, keyword/multiple arguments, private-helper access and unrelated denied operations. Re-run the existing sandbox/review/cancellation and Electron-compatible integration regressions.

Use a new evidence directory and submit the original task and its four unchanged checks through the existing Desktop launcher and real UI, with at most one initial candidate and two local repairs. Preserve all previous failed attempts. Require actual execution of all four checks, reviewer approval and saved handover before claiming success. If this bounded run fails, stop without further prompt experiments, cloud fallback or downloads.

## Current outcome

Diagnosis succeeded; duplicate-removal completion remains blocked. No new model inference, UI execution or reviewed success is claimed by this assessment. Approval is required by the user's explicit instruction before this operation-policy expansion can be applied.
