# Single approved UI verification from 7062aa9 — 2026-10-21

**Failed; stopped without retry.** Run `bg-mvhxrby3-v7n62j`; queue `error`; run checkpoint `fc419a91ab43797e74c29061a1a7c356be1c1904`.

Before the attempt, metadata-only auth status in the restricted environment confirmed loggedIn=true / claude.ai / firstParty / pro. The user approved one subscription-only two-report UI test under existing bounds and had confirmed usage credits off and zero balance. No account, credit, billing or credential settings were changed.

The actual UI used the source app and existing `.workspace-os/liam-app-data`, submitted one restricted-hosts job, and displayed its saved failure handover. Temporary authorization was consumed durably. Exact requested model: `claude-sonnet-5`; retries disabled; $0.50 estimated stop threshold per role; original six-minute, action/step/token bounds retained. That estimated threshold is not a hard invoice ceiling. Corrected protocol and identity checks remained active.

## Sanitized rejection

- Event type: `result`
- Event subtype: `success`
- Rejection reason: `model_identity_rejected`
- Identity phase: `result-modelUsage`
- Requested: `claude-sonnet-5`
- Returned usage identifiers: `claude-haiku-4-5-20251001`, `claude-sonnet-5`

The host reported an additional model in its usage accounting. The application did not select another model or accept that result. Whether this reflects an ancillary host operation or substitution of task generation is **not established** by this evidence. No further diagnosis or calls were made. This result does not meet the approved exact-model condition.

No normalized response accepted (`turns=0`), no retrieval executed, no report excerpts sent, no draft accepted and no Nora session. The initial task/persona/catalog/schema was sent. Zero accepted turns does not mean zero provider processing or usage; no verified token/cost total is available. The sanitized diagnostic is retained in state/outcome/handover and UI result; raw rejected response content is intentionally excluded.

## Preservation

105 deterministic tests passed before launch; typecheck introduced no new errors (70 known /75 baseline). UI verification confirmed both original reports and six checked prior failed-run directories unchanged. Eight originals were SHA-256 verified; six runtime/test/UI files restored byte-for-byte. Temporary authorization files were removed from active code and preserved as snapshots/patch. Live-blocked source was rebuilt; consumption marker retained. No pending automatic attempt remains.

Evidence is in `ui/`, `ui-console.txt`, `approval-and-auth.json`, `consumed.json`, test logs and recovery manifest. Stop here. Any investigation or further live attempt requires separate instructions. No push.
