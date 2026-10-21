import {expect,it} from 'vitest'
import {snapshotResearchRoutes,LOCAL_RESEARCH_ROUTES,hasCloudRoute} from '../../shared/researchRoutes'
import {selectedResearchRoutes} from './researchProvider'
it('snapshots each role independently without retaining caller references',()=>{
 const input={dana:{provider:'claude',model:'claude-opus-5'},nora:{provider:'ollama-local',model:'fixture:latest'}}
 const saved=snapshotResearchRoutes(input);input.dana.model='claude-haiku-4-5'
 expect(saved.dana.model).toBe('claude-opus-5');expect(Object.isFrozen(saved.nora)).toBe(true);expect(hasCloudRoute(saved)).toBe(true)
})
it.each([
 {dana:{provider:'codex',model:'gpt'},nora:LOCAL_RESEARCH_ROUTES.nora},
 {dana:{provider:'claude',model:'sonnet'},nora:LOCAL_RESEARCH_ROUTES.nora},
 {dana:{provider:'ollama-local',model:'model-without-tag'},nora:LOCAL_RESEARCH_ROUTES.nora},
 {dana:{provider:'claude',model:'claude-opus-5',fallback:'claude-sonnet-5'},nora:LOCAL_RESEARCH_ROUTES.nora},
 {dana:LOCAL_RESEARCH_ROUTES.dana},
])('rejects unsupported/ambiguous route %j',input=>expect(()=>snapshotResearchRoutes(input)).toThrow())
it('preserves legacy route choices and rejects contradictory mode',()=>{
 expect(selectedResearchRoutes({}).dana.provider).toBe('ollama-local')
 expect(selectedResearchRoutes({providerMode:'restricted-hosts'}).dana.model).toBe('claude-sonnet-5')
 expect(()=>selectedResearchRoutes({providerMode:'restricted-hosts',routes:LOCAL_RESEARCH_ROUTES})).toThrow('mismatch')
})
