import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('child_process', () => ({ execFile: vi.fn() }))
import { execFile } from 'child_process'
import { evidenceAction, evidenceLookupAction } from './evidenceAction'

const question = 'What are the governance permissions?'
const response = {
  schema: 'ada.evidence_response.v0.1',
  question, sources: [], answer: null,
  semantic_support: 'UNRESOLVED', status: 'RETRIEVAL_ONLY',
}
const execute = vi.mocked(execFile)
let options: any
let command: string
let argv: string[]
let stdin: ReturnType<typeof vi.fn>

function backend(output: string, error: Error | null = null) {
  execute.mockImplementation(((file: string, args: string[], opts: any, callback: any) => {
    command = file
    argv = args
    options = opts
    callback(error, output, '')
    return { stdin: { on: vi.fn(), end: stdin } }
  }) as any)
}

describe('Ada action adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    stdin = vi.fn()
    backend(JSON.stringify(response))
  })

  it('returns retrieval-only JSON using a fixed invocation and bounded execution', async () => {
    expect(await evidenceAction({ question })).toEqual({ ok: true, result: response })
    expect(command).toBe('/Library/Frameworks/Python.framework/Versions/3.14/bin/python3')
    expect(argv.slice(0, 3)).toEqual(['-B', '-E', '-s'])
    expect(argv[3]).toMatch(/\/Desktop\/ruflo-test\/ada\/ada_workspace_adapter_v01\.py$/)
    expect(options).toMatchObject({
      shell: false, timeout: 10000, maxBuffer: 262144, killSignal: 'SIGKILL',
    })
    expect(stdin).toHaveBeenCalledWith(JSON.stringify({ question }))
  })

  it.each([
    null, [], {}, { question: '' }, { question: '   ' },
    { question: 123 }, { question: 'x', path: '/tmp/arbitrary' },
    { question: 'x'.repeat(4001) }, { question: 'é'.repeat(2001) },
  ])('rejects invalid or oversized input before spawning: %j', async (args) => {
    expect((await evidenceAction(args)).ok).toBe(false)
    expect(execute).not.toHaveBeenCalled()
  })

  it.each(['missing backend', 'timeout', 'oversized output'])(
    'reports process failure safely: %s', async (reason) => {
      backend('', new Error(reason))
      expect((await evidenceAction({ question })).ok).toBe(false)
    },
  )

  it('rejects malformed JSON', async () => {
    backend('not JSON')
    expect((await evidenceAction({ question })).ok).toBe(false)
  })

  it.each([
    { ...response, answer: 'unsupported generated answer' },
    { ...response, semantic_support: 'VERIFIED' },
    { ...response, question: 'different question' },
    { ...response, sources: null },
  ])('rejects a response that violates the retrieval contract', async (value) => {
    backend(JSON.stringify(value))
    expect((await evidenceAction({ question })).ok).toBe(false)
  })
})


describe('bounded approved-record action', () => {
  const input = { record_id: 'implementation-log', start_line: 145, end_line: 160 }
  const source = { record_id: input.record_id, path: '/approved/implementation-log.md', lines: [145, 160], total_lines: 200, excerpt: '145: record', integrity: { status: 'VERIFIED_MATCH' } }
  const reply = { ...response, question: null, lookup: input, sources: [source] }
  beforeEach(() => { vi.clearAllMocks(); stdin = vi.fn(); backend(JSON.stringify(reply)) })

  it('uses the same bounded fixed process and preserves lookup identity', async () => {
    expect(await evidenceLookupAction(input)).toEqual({ ok: true, result: reply })
    expect(stdin).toHaveBeenCalledWith(JSON.stringify(input))
    expect(options).toMatchObject({ shell: false, timeout: 10000, maxBuffer: 262144 })
  })

  it.each([
    null, [], {}, { ...input, path: '/etc/passwd' }, { ...input, question: 'extra' },
    { ...input, record_id: '../../etc/passwd' }, { ...input, record_id: 'x'.repeat(65) },
    { ...input, record_id: '' }, { ...input, record_id: 1 },
    { ...input, start_line: 0 }, { ...input, start_line: -1 },
    { ...input, start_line: true }, { ...input, start_line: '145' },
    { ...input, start_line: 145.5 }, { ...input, end_line: 144 },
    { ...input, end_line: 225 }, { ...input, end_line: Infinity },
    { ...input, start_line: 100001, end_line: 100001 },
  ])('rejects invalid input before spawning: %j', async (value) => {
    expect((await evidenceLookupAction(value)).ok).toBe(false)
    expect(execute).not.toHaveBeenCalled()
  })

  it.each([
    { ...reply, question: 'invented' }, { ...reply, answer: 'synthesized' },
    { ...reply, lookup: { ...input, record_id: 'other' } },
    { ...reply, lookup: { ...input, end_line: 161 } },
    { ...reply, sources: [] }, { ...reply, sources: [source, source] },
    { ...reply, sources: [{ ...source, record_id: 'other' }] },
    { ...reply, sources: [{ ...source, lines: [145, 161] }] },
    { ...reply, sources: [{ ...source, total_lines: 159 }] },
    { ...reply, sources: [{ ...source, excerpt: 'é'.repeat(16385) }] },
    { ...reply, sources: [{ ...source, integrity: { status: 'MISMATCH' } }] },
  ])('rejects miscorrelated or oversized results', async (value) => {
    backend(JSON.stringify(value))
    expect((await evidenceLookupAction(input)).ok).toBe(false)
  })

  it.each(['UNKNOWN_RECORD', 'INVALID_RANGE', 'SOURCE_UNAVAILABLE', 'SOURCE_TOO_LARGE', 'RANGE_OUT_OF_BOUNDS', 'EXCERPT_TOO_LARGE', 'REGISTRY_MISMATCH'])(
    'returns a fixed failure code: %s', async (code) => {
      backend(JSON.stringify({ schema: 'ada.evidence_error.v0.1', code }))
      expect(await evidenceLookupAction(input)).toEqual({ ok: false, error: `Ada lookup failed: ${code}` })
    },
  )
})
