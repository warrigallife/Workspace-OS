import { execFile } from 'child_process'
import os from 'os'
import path from 'path'
import type { ActionReply } from './actionBridge'

const PYTHON = '/Library/Frameworks/Python.framework/Versions/3.14/bin/python3'
const ADAPTER = path.join(os.homedir(), 'Desktop/ruflo-test/ada/ada_workspace_adapter_v01.py')

export function evidenceAction(args: unknown): Promise<ActionReply> {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return Promise.resolve({ ok: false, error: 'expected {question: string}' })
  }
  const input = args as Record<string, unknown>
  if (Object.keys(input).length !== 1 || typeof input.question !== 'string' ||
      !input.question.trim() || Buffer.byteLength(input.question, 'utf8') > 4000) {
    return Promise.resolve({ ok: false, error: 'expected only a nonempty question of at most 4000 UTF-8 bytes' })
  }
  return runEvidence({ question: input.question })
}

interface LookupInput { record_id: string; start_line: number; end_line: number }

export function evidenceLookupAction(args: unknown): Promise<ActionReply> {
  if (!args || typeof args !== 'object' || Array.isArray(args)) {
    return Promise.resolve({ ok: false, error: 'expected approved record_id, start_line and end_line' })
  }
  const input = args as Record<string, unknown>
  const { record_id, start_line, end_line } = input
  if (Object.keys(input).length !== 3 || typeof record_id !== 'string' ||
      !/^[a-z][a-z0-9-]{0,63}$/.test(record_id) ||
      typeof start_line !== 'number' || typeof end_line !== 'number' ||
      !Number.isInteger(start_line) || !Number.isInteger(end_line) ||
      start_line < 1 || end_line < start_line || end_line > 100000 || end_line - start_line + 1 > 80) {
    return Promise.resolve({ ok: false, error: 'lookup requires an approved record ID and 1–80 inclusive lines (1–100000); no paths or extra fields' })
  }
  return runEvidence({ record_id, start_line, end_line })
}

function lookupMatches(result: any, input: LookupInput): boolean {
  const source = result.sources?.[0]
  return result.question === null && result.lookup?.record_id === input.record_id &&
    result.lookup?.start_line === input.start_line && result.lookup?.end_line === input.end_line &&
    result.sources.length === 1 && source?.record_id === input.record_id &&
    source?.lines?.length === 2 && source.lines[0] === input.start_line && source.lines[1] === input.end_line &&
    Number.isInteger(source.total_lines) && source.total_lines >= input.end_line &&
    typeof source.path === 'string' && typeof source.excerpt === 'string' &&
    Buffer.byteLength(source.excerpt, 'utf8') <= 32768 && source.integrity?.status === 'VERIFIED_MATCH'
}

function runEvidence(input: { question: string } | LookupInput): Promise<ActionReply> {
  return new Promise((resolve) => {
    const child = execFile(PYTHON, ['-B', '-E', '-s', ADAPTER], {
      cwd: path.dirname(ADAPTER),
      timeout: 10_000,
      killSignal: 'SIGKILL',
      maxBuffer: 256 * 1024,
      encoding: 'utf8',
      shell: false,
    }, (error, stdout) => {
      if (error) {
        resolve({ ok: false, error: 'Ada unavailable, timed out, exceeded output limit, or failed' })
        return
      }
      try {
        const result = JSON.parse(stdout)
        if ('record_id' in input && result?.schema === 'ada.evidence_error.v0.1' &&
            ['UNKNOWN_RECORD', 'INVALID_RANGE', 'SOURCE_UNAVAILABLE', 'SOURCE_TOO_LARGE',
              'RANGE_OUT_OF_BOUNDS', 'EXCERPT_TOO_LARGE', 'REGISTRY_MISMATCH'].includes(result.code)) {
          resolve({ ok: false, error: `Ada lookup failed: ${result.code}` })
          return
        }
        if (!result || result.schema !== 'ada.evidence_response.v0.1' ||
            !Array.isArray(result.sources) ||
            result.answer !== null || result.semantic_support !== 'UNRESOLVED' ||
            result.status !== 'RETRIEVAL_ONLY' ||
            ('question' in input ? result.question !== input.question : !lookupMatches(result, input))) {
          throw new Error('invalid response')
        }
        resolve({ ok: true, result })
      } catch {
        resolve({ ok: false, error: 'Ada returned an invalid evidence response' })
      }
    })
    child.stdin?.on('error', () => { /* process failure handled by callback */ })
    child.stdin?.end(JSON.stringify(input))
  })
}
