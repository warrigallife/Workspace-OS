import {it,expect,vi,afterEach} from 'vitest'
import {approveResearchRun,claimResearchApproval,assertResearchPermit,revokeResearchApproval} from './researchApproval'
import {RESEARCH_ROUTES} from './researchProvider'
import {LOCAL_RESEARCH_ROUTES} from '../../shared/researchRoutes'
import {researchApprovalText} from '../../shared/researchApproval'
import {requireProMetadata,researchClaudeEnv} from './providers/claudeResearchAuth'
const value={routes:RESEARCH_ROUTES,workspace:'/tmp/research',task:'fixed task'}
afterEach(()=>vi.useRealTimers())
it('requires fresh nonserializable main-process authority bound to one route/workspace/task/run',()=>{
 const id=approveResearchRun(value),permit=claimResearchApproval(id,'bg-approval-one',value)
 expect(()=>assertResearchPermit(permit,value.routes,'/tmp/research/JUFE-staging/bg-approval-one')).not.toThrow()
 expect(()=>claimResearchApproval(id,'bg-approval-two',value)).toThrow()
 expect(()=>assertResearchPermit(JSON.parse(JSON.stringify(permit)),value.routes,'/tmp/research/JUFE-staging/bg-approval-one')).toThrow()
 expect(()=>assertResearchPermit(permit,LOCAL_RESEARCH_ROUTES,'/tmp/research/JUFE-staging/bg-approval-one')).toThrow()
 expect(()=>assertResearchPermit(permit,value.routes,'/tmp/other')).toThrow()
 for(const change of [{task:'changed'},{workspace:'/other'},{routes:LOCAL_RESEARCH_ROUTES}])expect(()=>claimResearchApproval(approveResearchRun(value),'bg-change-test',{...value,...change})).toThrow()
 expect(()=>claimResearchApproval('persisted-id','bg-restart-test',value)).toThrow()
})
it('expires pending approvals and active permits and honors revocation',()=>{
 vi.useFakeTimers();const id=approveResearchRun(value);vi.advanceTimersByTime(300001);expect(()=>claimResearchApproval(id,'bg-expired-test',value)).toThrow()
 const revoked=approveResearchRun(value);revokeResearchApproval(revoked);expect(()=>claimResearchApproval(revoked,'bg-revoked-test',value)).toThrow()
 const permit=claimResearchApproval(approveResearchRun(value),'bg-active-test',value);vi.advanceTimersByTime(360001);expect(()=>assertResearchPermit(permit,value.routes,'/tmp/research/JUFE-staging/bg-active-test')).toThrow()
})
it('discloses exact routes, source scope and limits, with billing conditional on cloud',()=>{
 const cloud=researchApprovalText(value.routes),local=researchApprovalText(LOCAL_RESEARCH_ROUTES)
 for(const text of [cloud,local]){expect(text).toContain('24,000');expect(text).toContain('47–59');expect(text).toContain('58–73');expect(text).toContain('No automatic retry');expect(text).toContain('Review gates completion')}
 expect(cloud).toContain(value.routes.dana.model);expect(cloud).toContain('credits must be OFF');expect(cloud).toContain('$0.50')
 expect(local).toContain('no subscription prerequisite');expect(local).not.toContain('credits must be OFF')
})
it('requires subscription auth metadata and does not inherit API keys or arbitrary environment',()=>{
 expect(()=>requireProMetadata({loggedIn:true,authMethod:'claude.ai',apiProvider:'firstParty',subscriptionType:'pro'})).not.toThrow()
 for(const data of [{},{loggedIn:true,authMethod:'api_key'},{loggedIn:true,authMethod:'claude.ai',apiProvider:'firstParty',subscriptionType:'free'}])expect(()=>requireProMetadata(data)).toThrow()
 expect(Object.keys(researchClaudeEnv()).sort()).toEqual(['CLAUDE_CODE_MAX_OUTPUT_TOKENS','CLAUDE_CODE_MAX_RETRIES','HOME','LANG','PATH','USER'].sort())
 expect(researchClaudeEnv().CLAUDE_CODE_MAX_RETRIES).toBe('0')
})
