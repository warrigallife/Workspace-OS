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
  const question = input.question
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
        if (!result || result.schema !== 'ada.evidence_response.v0.1' ||
            result.question !== question || !Array.isArray(result.sources) ||
            result.answer !== null || result.semantic_support !== 'UNRESOLVED' ||
            result.status !== 'RETRIEVAL_ONLY') {
          throw new Error('invalid response')
        }
        resolve({ ok: true, result })
      } catch {
        resolve({ ok: false, error: 'Ada returned an invalid evidence response' })
      }
    })
    child.stdin?.on('error', () => { /* process failure handled by callback */ })
    child.stdin?.end(JSON.stringify({ question }))
  })
}
