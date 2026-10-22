# Qwen frozen four-call evaluation — 2026-10-22

Model: qwen2.5:7b-instruct-q4_K_M; ID 845dbda0ea48; full digest in model.json; size 4,683,087,332 bytes (~4.7 GB). Installation verified from local Ollama metadata. No cloud, downloads, fallback, retries or runtime changes.

Memory preflight: 18 GiB RAM; memory-pressure report 40% free; approximately 5.6 GB swap already used; no models loaded in Ollama; 237 GiB disk available. This was sufficient to finish the bounded test; it is not proof of comfortable concurrency or general model capacity. Four sequential HTTP calls returned 200 / done_reason=stop within the frozen 90-second per-call timeout. Output tokens: Dana 688; Nora 159, 156, 142. No truncation explains the failures.

## Frozen protocol

Reused the existing evaluate-roles/score-role-evaluation scripts with only output directory and selected model/digest changed. All four preserved request objects match the prior baseline exactly apart from model. Criteria copied byte-for-byte before inference; its historic opening names Llama, while preflight/model records identify Qwen as this evaluation's subject. No prompt, schema, candidate order, temperature, context or output limit changed. The saved fixture and source hashes/excerpts were checked before calls; source hashes checked again afterward.

Dana received only question, passages and task/schema instructions, not fixture answers/counterexamples/rationales. Nora received two unlabelled candidates and one passage per independent request, not verdicts/rationales, Dana output or previous reviews. The existing scorer verifies request separation; scoring-key.json was never transmitted. Raw responses and requests are retained separately from earlier evidence.

## Dana generation: FAIL

Complete JSON, exactly three findings, both records, one issue per supplied passage. All three quotations fail exact matching. Finding 1 collapses source newlines/indentation and removes Markdown; finding 2 rewrites quotation marks, formatting and line breaks; finding 3 copies the whole row but changes double quotes to single quotes. Quote lengths are 139, 509 and 618 characters; two exceed the frozen 180-character concision instruction (though below the application's 2,000-character hard limit). No output was repaired or accepted.

The substantive statements generally identify the three relevant gaps: stochastic versus deterministic treatment, unresolved sympathetic terminology, and unchecked experimental basis. These are useful dated-record topics; this is separate from the failed quotations. They do not explicitly attribute each observation to the report date as instructed. The limitations deny current-completeness/scientific-verification claims, but refer imprecisely to a single audit despite two report records. No scientific truth or present-day completion is established. The generation role fails the all-criteria requirement regardless of these semantic qualifications.

## Nora semantic review: FAIL

All six candidate citations are real, exact excerpts, verified independently of model judgment. Qwen judged quotation fidelity correctly in 4/6 cases and claim support correctly in 4/6. It accepted 1/3 supported claims and rejected all 3/3 unsupported claims; zero false acceptances in this small set. That is better than the preserved Llama result, but still fails the frozen requirement.

- Stochastic claim: correctly rejects scientific disproof/impossibility and accepts the supported dated observation. However, it incorrectly marks the unsupported candidate's genuine quote as nonmatching, conflating quotation fidelity with claim support.
- Sympathetic weights: rejects the unsupported equivalence claim, but also rejects the supported observation. Its explanation misreads an explicitly unresolved possibility as an assertion of a connection, even though the source itself names that possible connection.
- Source 35: rejects independent verification/completion correctly, but incorrectly marks that candidate's genuine quotation false. It also rejects the supported unassessed-claim observation; its stated reason that the claim was unchecked actually supports that observation.

The exact-match scorer is deterministic. Interpretation of claims, relevance, dated scope and adequacy of reasons is manual assessment against the frozen fixture; matching a quotation does not prove a claim. This small short-context component test supplies passages directly and cannot establish retrieval, tool execution, agent coordination, UI completion or production reliability.

## One next action

Evaluate a different locally runnable model against this same frozen benchmark before further local-team integration, with separate authorization for any required acquisition. Do not use this Qwen model for unattended generation/completion or as an automatic semantic-review gate on this evidence. Four-call budget is exhausted; no further prompt experiments were performed.

## Project status carried forward

46823db recovered the useful Claude report and verified its actual UI display while retaining the failed over-budget outcome. Automatic research completion within the unchanged 24,000-token budget remains unresolved (saved run used 32,045). Existing restricted retrieval, incremental provider transport, validation, separate review execution and recovery display work in the recorded scopes; neither recovered output nor this benchmark establishes fully working automatic coordination. Qwen is installed and can execute this bounded local benchmark, but did not meet generation/review criteria. Existing Llama failures remain; no source, profile, permission, runtime or billing settings changed.
