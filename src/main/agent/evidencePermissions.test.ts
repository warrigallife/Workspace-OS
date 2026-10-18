import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  app: { getPath: () => '/tmp' },
  BrowserWindow: { getFocusedWindow: () => null, getAllWindows: () => [] },
}))
vi.mock('./evidenceAction', () => ({
  evidenceLookupAction: vi.fn(async () => ({ ok: true, result: { status: 'RETRIEVAL_ONLY' } })),
  evidenceAction: vi.fn(async () => ({
    ok: true,
    result: { status: 'RETRIEVAL_ONLY' },
  })),
}))

import { handleRequest } from './actionBridge'
import { evidenceAction, evidenceLookupAction } from './evidenceAction'
import { GrantTable, allows, prefixesFor } from './grants'

const ctx = {
  actions: [], allActionIds: [], surface: null,
  root: '/ws', folder: '/ws', openFile: null,
}

describe.each(['evidence.query', 'evidence.lookup'])('%s permissions', (actionId) => {
  const args = actionId === 'evidence.query' ? { question: 'What are the agent permissions?' } : { record_id: 'implementation-log', start_line: 145, end_line: 160 }
  const handler = actionId === 'evidence.query' ? evidenceAction : evidenceLookupAction
  beforeEach(() => vi.clearAllMocks())

  function setup() {
    const table = new GrantTable()
    const invoke = vi.fn(async () => ({ ok: true as const }))
    const deps = {
      context: () => ctx,
      invoke,
      grants: (token: unknown) => table.lookup(token),
    }
    return { table, invoke, deps }
  }

  it('grants evidence without unrelated action permissions', () => {
    const scope = prefixesFor(['evidence'])
    expect([...scope]).toEqual(['evidence.'])
    expect(allows(scope, 'evidence.query')).toBe(true)
    expect(allows(scope, 'evidence.lookup')).toBe(true)
    expect(allows(scope, 'browser.navigate')).toBe(false)
    expect(allows(scope, 'files.create')).toBe(false)
    expect(allows(scope, 'memory.remember')).toBe(false)
  })

  it('routes an authorised query to Ada without renderer registration', async () => {
    const { table, invoke, deps } = setup()
    const token = table.issue('liam', ['evidence'], 'Liam', '/ws')
    const reply = await handleRequest(
      { cmd: 'run', actionId, token, args }, deps,
    )
    expect(reply).toEqual({ ok: true, result: { status: 'RETRIEVAL_ONLY' } })
    expect(handler).toHaveBeenCalledExactlyOnceWith(args)
    expect(invoke).not.toHaveBeenCalled()
  })

  it('rejects a missing token before calling Ada', async () => {
    const { deps } = setup()
    const reply = await handleRequest(
      { cmd: 'run', actionId, args }, deps,
    )
    expect(reply.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects a token lacking the evidence grant', async () => {
    const { table, deps } = setup()
    const token = table.issue('other', ['research'], 'Other', '/ws')
    const reply = await handleRequest(
      { cmd: 'run', actionId, token, args }, deps,
    )
    expect(reply.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects an unbound token', async () => {
    const { table, deps } = setup()
    const token = table.issue('liam', ['evidence'])
    expect((await handleRequest({ cmd: 'run', actionId, token, args }, deps)).ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects a revoked token', async () => {
    const { table, deps } = setup()
    const token = table.issue('liam', ['evidence'], 'Liam', '/ws')
    table.revoke('liam')
    const reply = await handleRequest(
      { cmd: 'run', actionId, token, args }, deps,
    )
    expect(reply.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects a token bound to a different workspace', async () => {
    const { table, deps } = setup()
    const token = table.issue('liam', ['evidence'], 'Liam', '/other')
    const reply = await handleRequest(
      { cmd: 'run', actionId, token, args }, deps,
    )
    expect(reply.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects evidence queries when no workspace is open', async () => {
    const { table, deps } = setup()
    const token = table.issue('liam', ['evidence'], 'Liam', '/ws')
    const reply = await handleRequest(
      { cmd: 'run', actionId, token, args },
      { ...deps, context: () => ({ ...ctx, root: null }) },
    )
    expect(reply.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('rejects evidence queries without an authorization dependency', async () => {
    const reply = await handleRequest(
      { cmd: 'run', actionId, args },
      { context: () => ctx, invoke: async () => ({ ok: true }) },
    )
    expect(reply.ok).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('preserves legacy all-grant access: Liam is not exclusive', async () => {
    const { table, deps } = setup()
    const token = table.issue('dock', 'all', 'Dock', '/ws')
    const reply = await handleRequest(
      { cmd: 'run', actionId, token, args }, deps,
    )
    expect(reply.ok).toBe(true)
    expect(handler).toHaveBeenCalledExactlyOnceWith(args)
  })
})
