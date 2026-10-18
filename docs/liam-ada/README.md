# Liam–Ada local integration

Verified 18 October 2026. This is the bounded local integration, not broader deployment or adoption of the draft governance/specification.

Open **`~/Desktop/Workspace-OS/Liam Workspace OS.command`** (double-click in Finder), or run that exact launcher from Terminal:

```sh
"$HOME/Desktop/Workspace-OS/Liam Workspace OS.command"
```

This builds the local source, checks the Electron native modules, and opens Electron **at the project directory**. It keeps app data in `.workspace-os/liam-app-data` and starts with `.workspace-os/liam-workspace` as a scratch workspace. Both are ignored by Git. Quit this instance normally before restarting it. The installed `/Applications/Workspace OS.app` is unchanged and does **not** contain the Ada handler; launching it can show Liam from the shared profile but returns `unknown action: evidence.query`. Its normal app data and conversations are separate and preserved. Do not launch `out/main/index.js` directly: resource lookup then misses the bridge CLI.

In the window titled **Workspace OS — Liam (Local)** (Dock badge **Liam**), click **Enter**. Set **Settings → Default agent mode → Safe**, close Settings, then click **Agents → Liam → Run**. The saved Liam profile supplies **Claude / Sonnet**. Ask: `What are the governance permissions and approval boundaries? Give source paths and line ranges, separate exact quotations from paraphrases, and preserve Ada's limitations.` The saved profile defaults to `claude:sonnet`; an explicit UI model selection overrides it. Do not select Codex for this verified route. A fresh conversation is needed for updated persona instructions. The scratch workspace does not change Ada's explicit source allowlist (six original sources plus nine integration records).

Verified: raw bridge response in `live-bridge-response.json`, actual launcher metadata in `live-launch.json`, actual permission probe in `launcher-permissions.json`, and corrected quotation/paraphrase example in `live-liam-response.md`. The quoted sentence was compared with Constitution line 40. Older chat output is historical and has not been rewritten; its paraphrases must not be treated as verbatim quotations.

Liam uses the existing Claude CLI/authentication. Ada is local Python retrieval and has no provider SDK or credential requirement. No OpenAI dependency or credential was added. Provider neutrality does not mean all providers were tested: the live run reported `claude-sonnet-5` and `claude-haiku-4-5-20251001`; these are CLI-reported identities, not an independent audit of the serving vendor. Existing Codex text helpers strip `WOS_AGENT_TOKEN`; the existing interactive path has a structured `workspace_action` callback with grant checks. Its unit checks passed, but live Codex–Ada access was not exercised and is not a supported route in this handoff.

Safe mode allows Read, Glob, Grep, **Write, Edit**, `Bash(wos-gen:*)`, and `Bash(wos-action:*)`. Liam's action scope is `evidence.` plus the existing baseline `memory.search`; browser/write actions outside that scope are denied by the bridge. This does not make the agent itself read-only. Legacy workspace-bound `all` runs can also query Ada. Current source-parent symlinks were absent for returned sources, but Ada does not enforce parent containment or prevent filesystem races. No source hardening or source expansion was added. Ada's `VERIFIED_MATCH` means text matching, never semantic truth or draft adoption.

Repeatable checks (keep native modules built for Electron):

```sh
ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron node_modules/vitest/vitest.mjs run src/main/agent src/main/agent-permissions.test.ts src/main/memory
python3 scripts/liam-ada/adapter-check.py
python3 scripts/liam-ada/rollback-check.py
node scripts/liam-ada/permissions.mjs
node scripts/liam-ada/live.mjs
npm run typecheck
git diff --check
```

The live check uses existing Claude authentication and incurs provider usage. It launches an isolated Electron instance and retains its test artifacts in a temporary directory; no token is written to its reports. Permission checks use a deterministic child probe instead of a model call. Real timeout/overflow/missing-process checks use temporary backend fixtures while retaining production subprocess limits. Run socket/Electron checks outside restricted sandboxes that prohibit local socket binding. Do not run `rebuild:node`; this installation is configured for Electron. If a later unrelated task changes the ABI, use the existing `npm run rebuild:electron` before launch.

Recovery: both `pre-integration-recovery.tar.gz` and `pre-continuation-recovery.tar.gz` contain selected originals and manifests. Extract to a separate directory first and review intervening changes. The first snapshot restores capabilityCatalog.ts, grants.ts, actionBridge.ts and the original Liam profile. The second also preserves launchRun.ts and typecheck.mjs before this continuation. Remove only the newly introduced evidence handler/tests and installed Ada adapter when deliberately reverting the integration; keep Ada services, checker, contracts and checkpoints. The rollback script demonstrates these operations only in disposable copies and reruns the original 15 bridge/grant tests. Dependency installs/native rebuilds are environment changes and are not undone by file rollback. Git contains the adapter/profile copies so the external integration files can be recovered along with the application source.

Known maintenance limits: typecheck has 70 existing errors against an unchanged baseline of 75. The installed React plugin 4.7.0 declares Vite support through 7, while Vite is 8.0.16; builds pass with warnings. The previous installation reported 44 vulnerabilities (14 moderate, 29 high, 1 critical); these were not remediated. An offline audit returning zero is not evidence they disappeared. `ignore-scripts=false`; lockfile install scripts include better-sqlite3, node-pty, esbuild and fsevents. This continuation did not reinstall, upgrade or reapprove dependencies. These issues and source-boundary limitations remain constraints on broader deployment, not claims of production readiness.

## Approved integration records (limited expansion)

The explicit allowlist is in `ada_evidence_service_v03.py` (recovery copy here; installed service remains in `~/Desktop/ruflo-test/ada`). All six original paths are retained. Nine individual files are added: the integration specification and evidence contract in Ada's directory; this README; **this directory's implementation-log.md** as the authoritative integration-log copy; the saved `~/.claude/agents/liam.md`; and launcher-permissions.json, live-launch.json, live-bridge-response.json, live-liam-response.md in this directory. The external implementation-log mirror, this directory's profile copy, checkpoints, recovery archives, code, credentials and whole directories are excluded.

New excerpts include `record_kind` and `record_note` provenance labels. Drafts remain unadopted historical proposals; implementation logs contain dated implementation claims; raw acceptance records are test observations; the historical Liam response contains model interpretations. These labels do not validate truth, and retrieval still returns null answer, UNRESOLVED semantic support and RETRIEVAL_ONLY status. The five-result lexical ranking may change when sources are added; omission from one response does not mean a file is unavailable.

Bridge token, grant and workspace checks are technically enforced. Safe mode's separate Write/Edit tools remain writable; bridge grants do not impose a read-only filesystem sandbox. Start a fresh Liam conversation to receive the revised profile.

Run `python3 -B scripts/liam-ada/source-check.py` to verify the exact allowlist, new-record retrieval, preserved old-source sections and rankings when scoped to those six sources, provenance labels, and read-only observations. `pre-source-expansion-recovery.tar.gz` preserves the service, profile, README and both log copies before expansion, with source paths and SHA256 hashes. Restoring its service/profile originals removes this expansion without reverting the earlier bridge integration.

## Launch-route diagnosis

The failed session `ebc4ea2d-ea53-4492-9e40-b24ef09953fc` is recorded in the normal app-data conversation map (`dock-convo-agent-1792298299009-2`), not the persistent Liam map. Its transcript records the exact unknown-action error and Warrigal workspace. At diagnosis, installed app PID 48826 served `~/Library/Application Support/workspace-os/wos-agent.sock`; local PID 48190 served `Workspace-OS/.workspace-os/liam-app-data/wos-agent.sock`. The installed bundle had no `evidence.query` string or handler; the local bundle had both. This was a different-app/build route, not a missing Ada source or a provider problem.

The named `.command` launcher delegates to `scripts/liam-ada/launch.sh`, builds the local app, uses the existing persistent Liam data, and labels its window/Dock. It never redirects the installed app's socket or moves normal conversations. A local app-data backup is kept privately under `.workspace-os/liam-routing-recovery`; selected source/docs originals are in `pre-routing-fix-recovery.tar.gz`. Neither is indexed. Test-only inspector flags are supplied by Playwright during verification; ordinary launches do not enable a debugging port.

`node scripts/liam-ada/user-run.mjs` tests this exact launcher and persistent data: clicks Enter → Settings → Safe → Close → Agents → Liam → Run, fills the normal prompt box, and presses Enter. It does not invoke `agent.run` directly or use a temporary profile. It reads the resulting Claude transcript to require actual Ada evidence, verifies all returned excerpt lines, and retains private artifacts under `.workspace-os/liam-user-run`. Quit the local instance before this diagnostic (it uses the same single-instance data); the installed app can stay open. The diagnostic uses the existing Claude authentication and incurs provider usage.
