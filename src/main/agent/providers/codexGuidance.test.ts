import {it,expect,vi} from 'vitest'
vi.mock('../../docgen',()=>({docgenResourceDir:()=>'/installed resources/office'}))
vi.mock('../../context/workspaceContext',()=>({agentActionGuide:()=> 'Existing granted action guide'}))
vi.mock('../capabilityCatalog',()=>({capabilityGuidanceBlock:()=> 'Existing capability guidance'}))
import {codexGuidance} from './codexGuidance'
it('keeps persona, memory, permissions and action transport while deferring reference schemas',()=>{
 const value=codexGuidance('/workspace','/workspace/file.md',{persona:'Unchanged specialist persona',capabilities:['evidence']} as any,true,'Unchanged recalled evidence')
 for(const text of ['Unchanged specialist persona','Unchanged recalled evidence','Existing granted action guide','Existing capability guidance','workspace_action','Never send mail','SAFE MODE','Do NOT write a spec','refuses to overwrite','Respect a refused capability','## Spec schemas','Before generating pptx/xlsx/docx','read that section','If unavailable'])expect(value).toContain(text)
 expect(value).toContain('/installed resources/office/SKILL.md')
})
it('retains full-mode restrictions and no permission bypass',()=>{
 const value=codexGuidance('/workspace',null,null,false,'')
 expect(value).toContain('FULL MODE');expect(value).toContain('Do not retry a denied operation through another mechanism')
 expect(value).toContain('inherit only the parent’s grant')
})
