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
  nora: Object.freeze({ provider: 'claude', model: 'claude-sonnet-5' }),
})
export const RESEARCH_BUDGET = Object.freeze({ responsesPerStage: 12, actionsPerStage: 16, deadlineMs: 360000, tokens: 24000, contextBytes: 120000, responseBytes: 65536 })
export const RESTRICTED_LIVE_BLOCK = 'Restricted Claude → Claude research is locked: live content transmission and spending are not approved; exact model availability remains unverified.'
export class NativeResearchBoundaryError extends Error {
  readonly code = 'RESEARCH_LIVE_NOT_APPROVED'
  constructor() { super(RESTRICTED_LIVE_BLOCK); this.name='NativeResearchBoundaryError' }
}
/** No IPC, environment or queue value can unlock live inference. */
export function assertRestrictedNativeHosts(): never { throw new NativeResearchBoundaryError() }
export function assertRestrictedLiveApproved(): never { throw new NativeResearchBoundaryError() }

export interface ResearchRequest { messages: any[]; tools?: any[]; format?: unknown }
export interface ResearchReply {
  done: boolean; done_reason?: string; message: { role: string; content?: string; tool_calls?: any[] }
  /** Actual provider/model, not requested labels. Required on every external reply. */
  provider?: string; model?: string; inputTokens?: number; outputTokens?: number
  nativeEvidence?: unknown[]
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

/** Workflow-only Claude controls; documented locally, not live verified. */
export function restrictedHostPlan(role: ResearchRole): {provider:string;model:string;transport:string;status:string;args:string[]} {
  const route = RESEARCH_ROUTES[role]
  return {
    ...route, transport: 'claude-stream-json', status: 'controls-documented-not-live-verified',
    args: ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
      '--model', route.model, '--tools', '', '--safe-mode', '--restricted', '--disable-slash-commands',
      '--setting-sources', '', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}',
      '--no-session-persistence', '--no-chrome'],
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
