import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('child_process', () => ({ execFile: vi.fn() }))
import { execFile } from 'child_process'
import { evidenceAction } from './evidenceAction'

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
