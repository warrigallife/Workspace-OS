# Single selected-route UI test — 2026-10-22

**Failed; stopped without retry.** Continued from fe8ada6. Run `bg-mvikmp3b-xric67`; queue error; run checkpoint `52e0612085f69801e98f4b2b7713add2d888f1c5`.

The exact restricted-environment auth status confirmed loggedIn=true / claude.ai / firstParty / pro using installed Claude 2.1.267. Reused the user's recorded two-report transmission approval, credits-off / zero-balance confirmation and subscription-only limits. No purchases, account changes, credentials, credits or fallback. Auth status does not independently prove the current credits setting. Existing $0.50 estimated stop threshold per role is not an invoice ceiling; six-minute, token, step and source boundaries stayed unchanged. Host retries disabled for this attempt.

UI selection before submission: Dana → Claude / claude-sonnet-5; Nora → Claude / claude-sonnet-5. The configurable per-run controls were used, not a Sonnet-only policy. Chosen routes were saved and captured in ui/chosen-routes.png. Actual source app / existing .workspace-os/liam-app-data route verified. One authorization was durably consumed; no automatic run remains.

## Observed result and blocker

Dana's first answer passed exact selected-model identity. Additional aggregate Haiku usage was disclosed as **purpose unattributed**, not rejected or assigned a presumed purpose. Both approved reports were retrieved at lines 1–80. The following structured-finalisation request included that retrieved evidence. It stopped on sanitized diagnostic: type=system, subtype=init, reason=restrictions_mismatch. No draft, report or Nora review was accepted. The actual UI displayed the saved failure handover.

The first accepted init had empty tools and MCP servers. The adapter also rejects repeated initialization using the same restrictions_mismatch reason. A second request had begun after the first accepted init, so repeated initialization is a concrete candidate; the rejected event's fields are not retained, and this evidence cannot distinguish repetition from an additional tool/MCP mismatch. Do not claim that Claude actually gained access. No protocol relaxation or retry was made. Next action is a deterministic inspection of the installed multi-request initialization contract and finer safe rejection diagnostics before any separately approved live retry.

Accepted accounting only: 3,405 input tokens including cache creation, 97 output tokens; estimated cost $0.009613. This includes Sonnet and additional Haiku aggregate usage with unknown purpose. It is not a bill or a verified total for the rejected subsequent response. Sources, grant boundaries and review gating remained intact.

## Verification and recovery

131 temporary-path deterministic tests passed; typecheck no new errors (70 known /75 baseline). Afterward all six modified runtime/test/UI files were restored byte-for-byte to fe8ada6, the three temporary authorization/test/UI-script files were removed from active code, and the live-blocked app was rebuilt. 66 restored boundary/provider/coordinator tests passed. Eight originals SHA-256 verified. Both original reports and seven prior failed-run directories were checked unchanged by the UI harness. Existing agents and configurable selection remain unchanged.

The one-use consumption marker remains in the existing workspace and is copied here. Saved patch and temporary-file snapshots document the execution path without leaving it active. ui/ contains the accepted request/response/usage evidence, sanitized rejection, state/outcome/handover and UI result; it is private local research evidence, not for publication. No push.
