# Separate Dana generation and Nora review assessment

Installed model: llama3.2:latest, pinned digest in model.json. Exactly four local inference requests, no retries, downloads or fallback. All returned HTTP 200, complete JSON and done_reason=stop, within the unchanged 2,048-token per-call ceiling. Output token counts: Dana 134; Nora 111, 107, 121. No budget exhaustion or grammar failure explains these outcomes.

Criteria were saved before calls and their hash recorded in started.json. Source hashes and exact contexts were verified against disk before inference and hashes after. Dana saw only question, source passages and task/schema instructions, not fixture answers or counterexamples. Nora saw unlabelled candidate texts and their real citations, not expected verdicts/rationales or Dana's output; requests used separate histories. score-role-evaluation.mjs verifies the retained request separation and mechanically scores results. No full runtime profiles, tool loop, UI or independent retrieval were exercised. Source snippets were directly supplied, making this an easier component test; it is not a successful team run or general benchmark.

## Dana: failed source-grounded generation

Mechanical results: one finding, not three; one record cited, not both; complete JSON; its 71-character quote matches the cited report lines exactly. The quote is the opening fragment of the stochastic-emergence passage. Quotation fidelity passes for this one citation.

Manual semantic assessment: the finding merely attributes a claim to report lines 60–73. That attribution is supported but does not identify the outstanding work: the lack of support in the dedicated deterministic treatment and need to reconcile it. It omits the other two issues. Its limitations sentence asserts that the claim's status as a concrete claim is not addressed by any existing report, whereas the supplied lines 71–73 explicitly identify it as a concrete claim made only in the abstract and unsupported by the dedicated chapter. It also does not explain unresolved present-day status. Thus this is not merely a count/format failure: task relevance and an accurate account of evidence also fail. The exact quotation does not cure these defects.

## Nora: failed semantic review gate

All six candidate citations are genuine exact excerpts, independently checked against disk. Model quotation-match decisions were correct in only 2/6 cases. Semantic verdicts matched the fixed key in 2/6 cases: 0/3 supported statements accepted, 2/3 unsupported statements rejected, and one false acceptance.

| Call | Candidate order | Observed review and manual assessment |
| --- | --- | --- |
| Nora 1: stochastic claim | Unsupported, supported | Rejected both. Rejection of the disproof/impossibility claim was correct, but wrongly marked its genuine quotation false. The supported dated observation was rejected using a reason about stochastic impossibility, a claim belonging to the other candidate: cross-candidate confusion. |
| Nora 2: sympathetic weights | Supported, unsupported | Rejected the supported unresolved-terminology observation, using the absence of a clear connection as a reason when that is precisely the observation. Accepted the unsupported operator-equivalence claim and repeated its assertion as evidence despite the passage leaving the connection unresolved. Also wrongly marked its genuine quotation false. This false acceptance disqualifies the model as an automatic gate under the pre-fixed criteria. |
| Nora 3: source 35 | Unsupported, supported | Correctly rejected experimental verification/completion but also rejected the supported observation that checking the experimental basis was outstanding. Its reason that the claim was unchecked supports the latter observation rather than rejecting it. Marked both genuine quotations false. |

Exact string/range/hash matching is deterministic. Claim relevance, entailment, interpretation of absence of evidence, and whether explanations address the correct candidate required manual assessment. A matching quotation is not proof of the claim; a report's dated observation is not independent verification of manuscript truth or current status.

## Recommendation

Do not use the current installed Llama 3.2 model for unattended completion or automatic semantic approval of this bounded workflow. Both roles failed even with selected, short source passages, and Nora falsely accepted an explicitly unsupported claim. This does not prove inability on every task or establish another model's suitability. Evaluate a different local model against the same frozen criteria before further integration or prompt tuning; no alternative has been selected, downloaded or run here. Four-call budget exhausted: no further prompt experiments performed.
