import {expect,it,vi} from 'vitest'
// A metadata check must never become a provider startup or network request.
const unexpected=vi.hoisted(()=>vi.fn(()=>{throw new Error('Unexpected native process start')}))
vi.mock('child_process',()=>({spawn:unexpected,execFile:unexpected,execFileSync:unexpected}))
import {assertRestrictedNativeHosts,assertRestrictedLiveApproved,restrictedHostPlan,RESEARCH_ROUTES} from './researchProvider'
import fs from 'fs'
import path from 'path'
const root=path.join(process.cwd(),'docs/jufe-route-assessment/native-host-boundary')
const evidence=JSON.parse(fs.readFileSync(path.join(root,'installed-control-evidence.json'),'utf8'))
it('pins existing route identifiers without default, fallback or model probing',()=>{
 expect(RESEARCH_ROUTES).toEqual({dana:{provider:'claude',model:'claude-sonnet-5'},nora:{provider:'codex',model:'gpt-5.6-terra'}})
 expect(unexpected).not.toHaveBeenCalled()
})
it('Claude native plan uses documented exclusion controls, not Safe mode alone',()=>{
 const help=fs.readFileSync(path.join(root,'claude-help.txt'),'utf8')
 const args=restrictedHostPlan('dana').args as string[]
 for(const flag of ['--tools','--safe-mode','--restricted','--disable-slash-commands','--setting-sources','--strict-mcp-config','--mcp-config','--no-session-persistence']) {
  expect(help).toContain(flag);expect(args).toContain(flag)
 }
 expect(help).toContain('disable all');expect(args[args.indexOf('--tools')+1]).toBe('')
 expect(JSON.parse(args[args.indexOf('--mcp-config')+1])).toEqual({mcpServers:{}})
 expect(args).not.toContain('--fallback-model');expect(restrictedHostPlan('dana').status).toBe('controls-documented-not-live-verified')
})
it('Codex schema establishes narrower controls, not a blanket native tool allowlist',()=>{
 expect(evidence.thread_start_controls.environments.description).toContain('Empty disables environment access')
 expect(evidence.thread_start_controls.dynamicTools.items.$ref).toContain('DynamicToolSpec')
 expect(Object.keys(evidence.config_tools_type.properties)).toEqual(['web_search'])
 expect(evidence.thread_start_response_fields).not.toContain('tools')
 expect(restrictedHostPlan('nora')).toMatchObject({status:'blocked',thread:{environments:[],dynamicTools:[],sandbox:'read-only',approvalPolicy:'never',allowProviderModelFallback:false}})
})
it('fails technical preflight before either role; approval cannot stand in for restrictions',()=>{
 for(const check of [assertRestrictedNativeHosts,assertRestrictedLiveApproved]) {
  try { check(); throw new Error('Expected fail-closed check') }
  catch(e) {expect(e).toMatchObject({name:'NativeResearchBoundaryError',code:'NATIVE_TOOL_EXCLUSION_UNESTABLISHED',provider:'codex'});expect((e as Error).message).toContain('locked')}
 }
 expect(unexpected).not.toHaveBeenCalled()
 expect(evidence).toMatchObject({inference_calls:0,provider_sessions_started:0,research_content_transmitted:false})
})
