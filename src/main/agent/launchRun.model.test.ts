import { describe, expect, it } from 'vitest'
import { isValidModelAlias, modelArgs, modelsUsed, shouldRecallMemory, budgetArgs, DEFAULT_MAX_BUDGET_USD } from './launchRun'

describe('launchRun — model selection', () => {
  it('accepts aliases and first-party ids, rejects anything else', () => {
    expect(isValidModelAlias('fable')).toBe(true)
    expect(isValidModelAlias('claude-opus-5')).toBe(true)
    expect(isValidModelAlias('')).toBe(true) // '' = the default model
    expect(isValidModelAlias('--dangerously-skip')).toBe(false)
    expect(isValidModelAlias('a b')).toBe(false)
    expect(isValidModelAlias(42)).toBe(false)
  })

  it('emits the flag pair only for a valid alias', () => {
    expect(modelArgs('haiku')).toEqual(['--model', 'haiku'])
    expect(modelArgs('')).toEqual([])
    expect(modelArgs(undefined)).toEqual([])
    expect(modelArgs('x y')).toEqual([])
  })

  it('reads the models a result line used, without the context-window suffix', () => {
    expect(modelsUsed({ modelUsage: { 'claude-opus-5[1m]': {}, 'claude-haiku-4-5': {} } })).toBe('claude-opus-5 + claude-haiku-4-5')
    expect(modelsUsed({})).toBe('')
  })
})

describe('launchRun — memory-recall gating', () => {
  it('always recalls for the legacy full grant', () => {
    expect(shouldRecallMemory('all', [])).toBe(true)
    expect(shouldRecallMemory('all', ['research'])).toBe(true)
  })

  it('recalls when no persona capabilities list is declared (the default/no-persona run)', () => {
    expect(shouldRecallMemory([], undefined)).toBe(true)
    expect(shouldRecallMemory([], [])).toBe(true)
  })

  it('recalls when the persona explicitly declares the knowledge capability', () => {
    expect(shouldRecallMemory([], ['knowledge', 'research'])).toBe(true)
  })

  it('skips recall for a persona that declares capabilities without knowledge', () => {
    expect(shouldRecallMemory([], ['research'])).toBe(false)
  })
})

describe('launchRun — per-task budget guard', () => {
  it('defaults to the shared cap when unset', () => {
    expect(budgetArgs(undefined)).toEqual(['--max-budget-usd', String(DEFAULT_MAX_BUDGET_USD)])
  })

  it('honors an explicit positive override', () => {
    expect(budgetArgs(2.5)).toEqual(['--max-budget-usd', '2.5'])
  })

  it('falls back to the default for a non-positive or invalid override', () => {
    expect(budgetArgs(0)).toEqual(['--max-budget-usd', String(DEFAULT_MAX_BUDGET_USD)])
    expect(budgetArgs(-1)).toEqual(['--max-budget-usd', String(DEFAULT_MAX_BUDGET_USD)])
    expect(budgetArgs(NaN)).toEqual(['--max-budget-usd', String(DEFAULT_MAX_BUDGET_USD)])
  })
})
