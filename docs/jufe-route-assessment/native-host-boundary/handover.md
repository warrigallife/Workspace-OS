# Native host boundary — stopped at enforcement blocker

Continued from **4db35b7**, 21 October 2026. No inference, provider session, research-content transmission, downloads, permission changes or model substitutions. Existing coordinator, grants, approved sources, staging, cancellation and review gates remain intact. No replacement executor was built.

## Determination

The complete Claude/Codex adapter pair could **not** be completed safely under the required boundary using the inspected installed controls. Native execution remains blocked. This is not a working native team or a request to unlock it for a live test.

- **Claude Code 2.1.267:** installed help explicitly documents `--tools ""` to disable all built-in tools, `--safe-mode` to disable customisations, and `--strict-mcp-config` with an empty MCP configuration. These are supported exclusion controls, not merely Safe-mode prose. Managed policy still applies. The existing launch contract incorporates them. No session or inference was started, so startup behaviour, exact-model availability and native transport operation remain unverified; a live-ready Claude adapter is not claimed.
- **Codex 0.155.1:** the generated app-server schema documents `dynamicTools` as supplied dynamic tools, `environments: []` as disabling environment access, and read-only/never-approve policies. None of those establishes the required complete exclusion of native tools and ambient access. `ToolsV2` exposes web-search configuration, not a complete native-tool allowlist; the thread-start response has no complete effective tool inventory. The inspected CLI provides feature toggles, not a documented blanket tool-exclusion control equivalent to Claude's empty tools list. Read-only alone does not restrict reads to the two approved records. An empty app-tool list must not be treated as an empty native-tool list.

**Exact unestablished requirement:** prevent all model-selected native filesystem reads/writes, shell/code execution, browsing, connectors, delegation and ambient context so that only the coordinator's grant-checked approved-record lookups and stage-specific saves can act. This boundary must be enforced before either stage receives task/profile/source content. Denying a later approval request or noticing a tool event after it starts is not equivalent.

This is a bounded finding about the installed controls inspected, **not proof that every possible Codex route is inherently incapable**. No arbitrary config keys, exhaustive guessed feature flags, model assertions or requested configuration values were promoted to evidence of effective restrictions. No new MCP server, sandbox framework or alternate executor was built to bypass the stopping condition.

## Implementation and deterministic verification

Added an explicit technical preflight error, `NATIVE_TOOL_EXCLUSION_UNESTABLISHED` (provider `codex`), to the existing production gate. It stops the entire pair before source staging, provider calls or a partial Dana run. Content/spending approval does not override this blocker. Host plans now distinguish documented controls from a blocked/unverified native path.

**148 tests pass in 11 files** with the Electron-compatible runtime, including the existing coordinator/grant/citation/recovery regressions and four new installed-control/preflight checks. Build passes; typecheck has no new errors (70 known, baseline 75). Tests compare saved local help/schema evidence and verify the fail-closed behaviour; they do not demonstrate live CLI enforcement or semantic model quality. The first run's additional suite-discovery error came from a preserved `.test.ts` snapshot; that recovery copy was renamed `.ts.snapshot`, its hash preserved, and the clean rerun passed. Both outputs are retained.

Exact routes remain **Dana: Claude / `claude-sonnet-5` → Nora: Codex / `gpt-5.6-terra`**. No defaults, substitutions or fallback. The existing response/action/deadline/token budgets were not changed.

## Precisely what remains before one live test

1. Establish a supported, verifiable Codex native-tool/ambient-context exclusion boundary for this installed route. If no supported mechanism can be identified, the workflow remains blocked; a broader-permission route is not authorised.
2. Only once that boundary exists, implement and deterministically verify both native session adapters with the existing coordinator, including exact-model identity and cancellation. The current work does not claim that missing transport implementation is complete.
3. Confirm availability of the exact configured models without substituting another, and obtain explicit approval for research-content transmission and a bounded live spend. Only then perform one authorised UI test. The token threshold remains reactive, not a guaranteed dollar cap.

**Stop here.** No live-test approval is sought while the technical boundary is unresolved.

Evidence: `installed-control-evidence.json`, saved CLI help, schema-generation receipt, `tests.txt`, `typecheck.txt`, `build.txt`. Recoverable originals and SHA-256 manifest are under `originals/`; `originals-verification.json` confirms four copies. The local Git checkpoint preserves this result; no push.
