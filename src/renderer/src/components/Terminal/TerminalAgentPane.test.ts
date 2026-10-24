import { describe, it, expect } from 'vitest'
import { groundedPrompt } from './TerminalAgentPane'

describe('groundedPrompt', () => {
  it('includes the harness context block on the first turn', () => {
    expect(groundedPrompt('[Workspace-OS context]\nroot: /x', 'hello', true)).toBe(
      '[Workspace-OS context]\nroot: /x\n\nhello',
    )
  })

  it('omits the context block on a resumed (non-first) turn', () => {
    expect(groundedPrompt('[Workspace-OS context]\nroot: /x', 'hello', false)).toBe('hello')
  })

  it('falls back to the default body when the prompt is empty, on either turn', () => {
    expect(groundedPrompt('[ctx]', '', true)).toBe('[ctx]\n\nLook at the attached files.')
    expect(groundedPrompt('[ctx]', '', false)).toBe('Look at the attached files.')
  })
})
