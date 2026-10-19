/** Artifact-only pilot. Inputs are JSON, never paths, commands or provider choices. */
export interface LocalTeamTask {
  description: string
  cases: { input: unknown; expected: unknown }[]
  reviewCriteria: string
}
export interface LocalTeamOptions {
  task: LocalTeamTask
  recoveredFrom?: string
}
function boundedJson(value: unknown, depth = 0): boolean {
  if (depth > 10) return false
  if (value === null || typeof value === 'boolean') return true
  if (typeof value === 'number') return Number.isFinite(value) && Math.abs(value) <= 1e6
  if (typeof value === 'string') return value.length <= 4000
  if (Array.isArray(value)) return value.length <= 1000 && value.every(v => boundedJson(v, depth + 1))
  return !!value && typeof value === 'object' && Object.keys(value).length <= 100 &&
    Object.entries(value).every(([k,v]) => k.length <= 100 && boundedJson(v, depth + 1))
}
export function validateLocalTask(value: unknown): LocalTeamTask {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a local team task')
  const v = value as Record<string, unknown>
  if (Object.keys(v).some(k => !['description', 'cases', 'reviewCriteria'].includes(k))) throw new Error('Unexpected task fields')
  if (typeof v.description !== 'string' || !v.description.trim() || v.description.length > 4000) throw new Error('Task must contain 1–4000 characters')
  if (!Array.isArray(v.cases) || v.cases.length < 1 || v.cases.length > 12) throw new Error('Supply 1–12 independent input/expected checks')
  for (const c of v.cases) {
    if (!c || typeof c !== 'object' || Array.isArray(c) || Object.keys(c).sort().join(',') !== 'expected,input') throw new Error('Each check needs only input and expected')
  }
  if (!boundedJson(v.cases)) throw new Error('Checks must be bounded, finite JSON values (depth 10, numbers within ±1000000)')
  const criteria = v.reviewCriteria ?? ''
  if (typeof criteria !== 'string' || criteria.length > 2000) throw new Error('Review criteria must be at most 2000 characters')
  if (JSON.stringify(value).length > 12000) throw new Error('Task input too large')
  return JSON.parse(JSON.stringify({ description: v.description.trim(), cases: v.cases, reviewCriteria: criteria }))
}
