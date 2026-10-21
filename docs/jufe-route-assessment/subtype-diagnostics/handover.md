# Bounded subtype diagnostics — 2026-10-22

Continuation of 2b4ac03 and its already-finalised failed run; no repeat finalisation, live calls or repair of event acceptance.

## Fixed

The diagnostic whitelist replaced every unlisted subtype with <redacted-unrecognized>, losing even valid event identifiers. protocolMetadata now retains subtype identifiers of at most 64 characters matching lowercase snake-case letters/digits. Known subtype handling is preserved. Missing subtype remains <absent>; explicit null, other nonstrings, oversized identifiers, whitespace/control characters, paths, URLs, JSON and credential-shaped hyphenated strings remain redacted in full, never truncated into a misleading label. Top-level unknown event types remain redacted. Only the subtype field is considered; message bodies, tokens, request input and other fields are not copied. Syntax filtering is a bounded protocol-identifier diagnostic, not a general secret/content classifier.

Unknown system events still fail with unsupported_system_event. Control/tool requests still fail. No classifier branch changed; verification.json checks it byte-for-byte. Identity, tools/MCP checks, source grants, billing checks, review gates and live block unchanged. An integrated fixture verifies that the safe unknown subtype survives the existing failure → outcome → handover → result-display path while the run fails and its payload remains excluded.

## Contract and launcher evidence

Read the installed Claude 2.1.267 binary statically; SHA-256 matches the earlier saved contract (a681f3008f0050029aeebcab3af51bb6a55ddeb625a3af3141a4416d43cd2558). installed-contract.json records schema subtype literals, including identifiers absent from the old diagnostic whitelist. These include multiple message categories, not only system events. None is inferred to be the historical failure.

The working launchRun.ts:352–375 already buffers newline-delimited JSON and passes each line to existing session/result/activity/text consumers; it neither supplies a safe rejected-subtype recorder nor archives this restricted run's discarded event. The restricted transport and existing ResearchProtocolError persistence path are retained. No alternate protocol, permissive normal-launch fallback or raw stderr logging added.

The original system event behind bg-mvimbs76-yofh6q **cannot be recovered** from retained evidence: only the redacted subtype and unsupported_system_event reason were saved. Its exact identifier and payload are missing. The installed contract lists possibilities, not proof of identity. Live compatibility remains unverified; this change improves future rejection evidence only.

## Verification/recovery

132 focused deterministic tests /4 files passed in the Electron-compatible runtime. Cases cover safe identifiers, exact size boundary, oversized/malformed values, control characters, absent/null subtype, control requests, persistence/display and existing rejection/review boundaries. Build passed; no new typecheck errors (70 known /75 baseline). Five pre-edit originals SHA-256 verified. Classifier, working launcher, adapter access checks and live-block/source/grant files verified unchanged. Evidence and originals saved beside this file. No downloads, purchases, permissions changes or push.
