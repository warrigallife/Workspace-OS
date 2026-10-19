import { describe, expect, it } from 'vitest'
import { validateLocalTask } from '../runs/localTeamTask'
import { localEnvironment, TEAM_PROFILES } from './localTeamRun'

describe('local team boundaries', () => {
  it('drops credentials, proxies and inherited bridge authority', () => {
    const env = localEnvironment('/tmp/disposable')
    expect(Object.keys(env).sort()).toEqual(['HOME','LANG','PATH','PYTHONDONTWRITEBYTECODE'])
    expect(env).not.toHaveProperty('ANTHROPIC_API_KEY')
    expect(env).not.toHaveProperty('WOS_AGENT_TOKEN')
    expect(Object.values(TEAM_PROFILES)).not.toContain('Liam')
  })
  it('validates bounded JSON input without commands, paths or provider knobs', () => {
    const task = { description: 'sum', cases: [{ input: [1], expected: 1 }], reviewCriteria: '' }
    expect(validateLocalTask(task)).toEqual(task)
    for (const value of [null, [], {...task, path:'/etc/passwd'}, {...task,provider:'claude'},
      {...task,cases:[]}, {...task,cases:Array(13).fill(task.cases[0])},
      {...task,cases:[{input:1}]}, {...task,description:'x'.repeat(4001)}]) {
      expect(() => validateLocalTask(value)).toThrow()
    }
  })
})
