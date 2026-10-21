# Second-request initialization correction — 2026-10-22

Continued from 5b07a7b. No inference, authentication calls, downloads or permission changes. Live execution remains blocked.

## Evidence-backed diagnosis

Saved run bg-mvikmp3b-xric67 accepted its first system/init with the selected claude-sonnet-5, tools=[] and mcp_servers=[], accepted a lookup response and retrieved both reports. event-007.json records the second request. The terminal diagnostic is system/init/restrictions_mismatch. See ../claude-selected-routes-live/ui/event-003.json, event-007.json and outcome.json; evidence.json here contains only the relevant safe metadata.

The old adapter's condition was `initialized || invalid/nonempty tools || invalid/nonempty mcp_servers`. After request one, initialized remained true. Therefore the second init necessarily triggered this branch, short-circuiting before tools/MCP checks. Model validation precedes it, so this rejection was not the exact-model check. This establishes a repeated-initialization defect, rather than merely a candidate explanation for that branch. It does **not** establish that the second init had empty tools/MCP: the rejected declarations were not retained. Whether correcting this defect suffices for a live run remains unverified.

## Working-launcher comparison and minimal repair

src/main/agent/launchRun.ts:177–184, 280–328, 352–365, 457–469 uses newline-buffered stream-json output, feeds one plain prompt then closes stdin, and uses validated session IDs for later --resume invocations. Its consumeLine path does not reject repeated initialization; it extracts session metadata and delegates text/activity/result parsing. The restricted adapter already uses the same newline-buffered handling pattern, but keeps stream-json stdin open for multiple coordinator requests. Importing the ordinary launch path would also import ambient environment, connectors, native tools and persistence/resume behaviour incompatible with the approved boundary. No alternate transport or framework is warranted or introduced.

The existing adapter now revalidates selected-model identity, tools array and MCP array on **every** init. Repetition itself is accepted only when these checks pass. Missing/malformed tools → init_tools_invalid; nonempty tools → init_tools_not_empty; missing/malformed MCP → init_mcp_invalid; nonempty MCP → init_mcp_not_empty. Diagnostics contain fixed reasons and sanitized event metadata, not tool names, connector content, credentials or research text. Exact-model diagnostics remain unchanged.

Required initialization before accepting results, per-request answer identity, native-action/control denial, overage rejection, usage accounting, cancellation, source grants, citations, review and save gates remain. No settings, profiles or model choices changed.

## Deterministic verification and recovery

142 tests /8 files passed in Electron's compatible runtime. New cases exercise two requests in one child with repeated valid init and unchanged cumulative token deltas; changed model and missing/malformed/nonempty tools/MCP on later init all stop and kill the child with safe diagnostics. Existing integrated Claude fixtures now emit init for every request, covering Dana → Nora success, additional aggregate usage, fabricated citations, reviewer rejection and failed saves. Cancellation, interruption and live-block tests also passed.

Build passed; baseline typecheck has no new errors (70 known /75 baseline). Six originals SHA-256 verified in manifest.json. verification.json records unchanged normal launcher, live-block/routes, source/contract/grant/handler files and preserved prior failure hashes. All prior evidence remains intact.

Next action, only if separately approved: one bounded UI verification under the existing account/transmission/billing terms. This task made no live attempt and does not claim workflow success. If a later init violates actual restrictions, the new specific reason will distinguish that failure without exposing its payload. Saved historical rejected fields cannot be reconstructed.
