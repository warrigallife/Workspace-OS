# Single approved UI attempt after sign-in — 2026-10-21

**Failed and stopped without retry.** Run `bg-mvhn6ipe-w74jo5`; queue status `error`; run checkpoint `ad65b230d9b1e7f501ba94cd30f97a4b0101a591`.

The immediately preceding metadata checks recognized Claude.ai Pro in both normal and restricted environments. User confirmed usage credits off / zero balance and approved one two-report attempt. No login, billing or credential changes were made during this attempt.

The real UI launched the source app with its existing `.workspace-os/liam-app-data`, clicked the approved research button once and displayed the saved failure handover. Temporary one-use routing selected restricted-hosts / exact `claude-sonnet-5`, retaining corrected sanitized model-identity diagnostics. Existing tools, grants, source bounds and review gate remained unchanged. Provider retries were disabled; per-session estimated spending stop threshold was $0.50, with the existing six-minute/step/action/token bounds. This threshold is not a hard invoice ceiling; subscription-only operation relied on the authenticated Pro route and user's credits-off confirmation.

**Observed failure:** `Unexpected Claude protocol/control event` during Dana's first request. No complete response accepted (turns=0), no retrieval, no report excerpts transmitted, no draft, no Nora session and no completed report. Initial transmission comprised the approved task, persona, bounded instructions, catalog and schema. No fallback or alternate model was selected by the workflow.

**Evidence limit:** this generic protocol-rejection path does not retain the event type/body. The cause cannot be identified further from the saved evidence, and no inference or workflow retry was made to diagnose it. Corrected identity diagnostics remained installed but no identity-specific rejection was recorded. This is not proof that the exact model was unavailable or substituted. Zero accepted turns is not proof of zero provider processing or usage; cost/token totals were not verified.

63 deterministic tests passed before launch, and typecheck introduced no new errors (70 known /75 baseline). The UI script verified both reports and five previous failed-run directories unchanged, including the earlier Claude failure. Eight originals were SHA-256 verified; six runtime/test/UI source files restored byte-for-byte after the attempt. Temporary authorization code and script were removed from active source and preserved as snapshots and a patch. The durable consumption marker remains; live-blocked code was rebuilt. No pending retry or live authorization remains.

Evidence: `ui/` (request, state, outcome, handover, UI identity and result), `ui-console.txt`, `approval.json`, `consumed.json`, deterministic checks, `temporary-live-route.patch`, and recovery manifest. Stopped as instructed. No push.
