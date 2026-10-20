# Dated JUFE report-observation evaluation fixture

`fixture.json` contains three manually curated evaluation cases from the two already approved reports dated **11 October 2026**. Each includes source identity/hash, actual report line range, complete exact context excerpt, a supported finding with an exact quotation, and an unsupported claim with its explanation. These are observations about what those dated reports record, not independently established manuscript/experimental facts or current completion status. This is evaluation data, not a model-produced report or a Nora-approved handover. No runtime allowlist registration was added.

Cases: source-31 stochastic-emergence support (schedule report lines 60–73); unresolved sympathetic-weights terminology (lines 74–85); source-35 experimental-verification claim awaiting assessment (full audit line 50). Line numbers refer to the reports themselves, not manuscript line numbers mentioned within them. JSON escaping preserves the original text when decoded.

## Verified results

15 tests passed across evaluation, scope and contract suites using Electron's Node runtime. Machine-readable results: `test-results.json`.

- Both approved source hashes match disk; each full context excerpt matches its exact lines. All positive citation strings pass the existing verbatim/range/retrieval checks.
- The three supported examples pass mechanical draft validation in a disposable temporary directory. No independent-review approval or completed report is claimed.
- The original saved failed payload from `concise-findings-verification/event-007.json` is tested without alteration after reproducing its two lookups: rejected for fewer than three findings.
- Its original citation is tested directly, independently of the count failure: rejected because the quote does not match the cited source verbatim.
- Negative control: all three explicitly unsupported statements, paired with the real fixture citations, pass existing mechanical draft checks in an isolated temporary directory. No review or report is created. This demonstrates that those checks do not establish semantic entailment.

Deterministic checks establish field/count bounds, source identity and stability, line ranges, quote fidelity and recorded retrieval prerequisites. They do not establish that a quote supports a claim, that findings answer the research question, that claims are distinct or exhaustive, that the underlying reports are true, or that their observations remain current. These require semantic review and, where appropriate, separately authorised substantive research. The unsupported examples must not be promoted into reports.

Repeat without model calls:

```sh
ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron node_modules/vitest/vitest.mjs run src/main/agent/researchEvaluation.test.ts src/main/agent/researchScope.test.ts src/main/agent/researchContract.test.ts
```

Tests write only disposable temporary artifacts; the approved source files are read only. Runtime code, permissions, budgets and review gates are unchanged.
