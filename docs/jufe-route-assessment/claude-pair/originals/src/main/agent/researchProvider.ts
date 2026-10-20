/** Research stages are app-coordinated, not ordinary specialist Run launches.
 * Native provider tools must be absent; only returned action data reaches grants.
 * No renderer/env/queue field can enable external transmission in this build. */
export type ResearchRole = 'dana' | 'nora'
export interface ResearchOptions {
  recoveredFrom?: string
  providerMode?: 'ollama-local' | 'restricted-hosts'
  task?: string
}
export const RESEARCH_ROUTES = Object.freeze({
  dana: Object.freeze({ provider: 'claude', model: 'claude-sonnet-5' }),
  nora: Object.freeze({ provider: 'codex', model: 'gpt-5.6-terra' }),
})
export const RESEARCH_BUDGET = Object.freeze({ responsesPerStage: 12, actionsPerStage: 16, deadlineMs: 360000, tokens: 24000, contextBytes: 120000, responseBytes: 65536 })
export const RESTRICTED_LIVE_BLOCK = 'Restricted Claude/Codex research is locked: Codex 0.155.1 has no established supported all-native-tool exclusion boundary in the inspected app-server controls. Content transmission and spending also remain unapproved.'
export class NativeResearchBoundaryError extends Error {
  readonly code = 'NATIVE_TOOL_EXCLUSION_UNESTABLISHED'
  readonly provider = 'codex'
  constructor() { super(RESTRICTED_LIVE_BLOCK); this.name='NativeResearchBoundaryError' }
}
/** Technical preflight precedes BOTH stages. Empty dynamicTools is not an
 * all-native-tool allowlist; read-only is not a source-read restriction. No
 * assertion from a model or a requested config flag may supply this evidence.
 * User approval cannot repair an unsupported/unestablished native boundary. */
export function assertRestrictedNativeHosts(): never { throw new NativeResearchBoundaryError() }
export function assertRestrictedLiveApproved(): never { return assertRestrictedNativeHosts() }

export interface ResearchRequest { messages: any[]; tools?: any[]; format?: unknown }
export interface ResearchReply {
  done: boolean; done_reason?: string; message: { role: string; content?: string; tool_calls?: any[] }
  /** Actual provider/model, not requested labels. Required on every external reply. */
  provider?: string; model?: string; inputTokens?: number; outputTokens?: number
}
export interface RestrictionReceipt {
  provider: string; model: string
  nativeTools: string[]; connectors: string[]; ambientContext: false
  fallback: false; restrictionsEnforced: true
}
export interface ResearchSession {
  receipt: RestrictionReceipt
  request(request: ResearchRequest, signal: AbortSignal): Promise<ResearchReply>
  close(): void
}
export interface ResearchDriver {
  kind: 'ollama-local' | 'restricted-hosts'
  preflight(signal: AbortSignal): Promise<void>
  open(role: ResearchRole, signal: AbortSignal): Promise<ResearchSession>
}
/** Receipts come from a trusted host adapter, never from model-generated text.
 * Missing/unknown fields are not interpreted as evidence of restrictions. */
export function validateRestriction(role: ResearchRole, r: RestrictionReceipt): void {
  const expected = RESEARCH_ROUTES[role]
  if (!r || r.provider !== expected.provider || r.model !== expected.model) throw new Error('Exact provider/model unavailable; no substitution')
  if (r.restrictionsEnforced !== true || r.ambientContext !== false || r.fallback !== false ||
      !Array.isArray(r.nativeTools) || r.nativeTools.length || !Array.isArray(r.connectors) || r.connectors.length) {
    throw new Error('Provider tool restrictions not established; refusing research content')
  }
}

/** Auditable native launch contract. Deliberately not the normal runner's
 * permissions/env/connector injection. Help/schema inspection is not attestation.
 * Codex's current protocol has no complete effective tool-inventory receipt;
 * the native connection remains fail-closed until that boundary is established. */
export function restrictedHostPlan(role: ResearchRole): Record<string, unknown> {
  const route = RESEARCH_ROUTES[role]
  return role === 'dana' ? {
    ...route, transport: 'claude-stream-json', status: 'controls-documented-not-live-verified',
    args: ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
      '--model', route.model, '--tools', '', '--safe-mode', '--restricted', '--disable-slash-commands',
      '--setting-sources', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
      '--no-session-persistence', '--no-chrome'],
    requiredReceipt: 'exact model; empty effective tool inventory; no ambient context or connectors',
  } : {
    ...route, transport: 'codex-app-server', status: 'blocked',
    thread: { model: route.model, allowProviderModelFallback: false, ephemeral: true,
      sandbox: 'read-only', approvalPolicy: 'never', environments: [], dynamicTools: [],
      runtimeWorkspaceRoots: [], selectedCapabilityRoots: [] },
    requiredReceipt: 'effective native tools disabled; empty connectors and ambient context; exact model',
    blocker: 'No established supported all-native-tool exclusion: dynamicTools only supplies app tools, environments controls environment access, and read-only is not an approved-source read allowlist. No complete effective tool inventory is exposed either.',
  }
}

/** Cancellation must end a stage even if a host fails to settle its request. */
export function withResearchAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) { void promise.catch(()=>{}); return Promise.reject(new Error('Research cancelled')) }
  return new Promise((resolve,reject)=>{
    const abort=():void=>reject(new Error('Research cancelled'))
    signal.addEventListener('abort',abort,{once:true})
    promise.then(resolve,reject).finally(()=>signal.removeEventListener('abort',abort))
  })
}
