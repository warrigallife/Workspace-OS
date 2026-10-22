import {it,expect,afterEach} from 'vitest'
import fs from 'fs'
import path from 'path'
import os from 'os'
import {ResearchScope,RECORDS,hash} from './researchScope'
const fixture=JSON.parse(fs.readFileSync('docs/jufe-route-assessment/evaluation-fixture/fixture.json','utf8'))
const saved=JSON.parse(fs.readFileSync('docs/jufe-route-assessment/concise-findings-verification/event-007.json','utf8')).data.args
const dirs:string[]=[]
function scope(){const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'jufe-evaluation-'));dirs.push(dir);return new ResearchScope(dir)}
function read(s:ResearchScope,role:'dana'|'nora'){for(const c of fixture.cases){const {exact_excerpt,...range}=c.context;s.lookup(role,range)}}
const draft=()=>({findings:fixture.cases.map((c:any)=>c.supported_finding),limitations:fixture.limitations})
afterEach(()=>{for(const d of dirs.splice(0))fs.rmSync(d,{recursive:true,force:true})})
it('verifies all dated contexts, exact excerpts, source identities and hashes against approved disk records',()=>{
 const s=scope()
 for(const c of fixture.cases){
  expect(c.classification).toBe('dated report observation');expect(c.observation_date).toBe('2026-10-11')
  const source=fixture.sources[c.context.record_id],text=fs.readFileSync(RECORDS[c.context.record_id],'utf8')
  expect(RECORDS[c.context.record_id].endsWith('/'+source.path_relative_to_JUFE)).toBe(true)
  expect(hash(text)).toBe(source.sha256)
  const {exact_excerpt,...range}=c.context
  expect((s.lookup('dana',range) as any).excerpt).toBe(exact_excerpt)
  expect(()=>s.checkCitation(c.supported_finding.citation,'dana')).not.toThrow()
 }
 s.assertSources()
})
it('accepts fixture structure and citations as a draft but still requires independent retrieval before approval',()=>{
 const s=scope();read(s,'dana');s.save('dana',draft())
 expect(s.review).toBeUndefined()
 expect(()=>s.save('nora',{decision:'approve',reason:'A verdict without independent retrieval must be rejected.',checked_citations:[0,1,2]})).toThrow('independently retrieved')
 expect(fs.existsSync(path.join(s.directory,'report.md'))).toBe(false)
})
it('rejects the untouched saved inaccurate payload on finding count after reproducing its reads',()=>{
 const s=scope();for(const record_id of Object.keys(RECORDS))s.lookup('dana',{record_id,start_line:1,end_line:80})
 expect(()=>s.save('dana',saved)).toThrow('save.findings: require 3–8 findings')
 expect(s.draft).toBeUndefined()
})
it('separately rejects the saved inaccurate citation as non-verbatim, independent of count',()=>{
 const s=scope(),citation=saved.findings[0].citation
 const {quote,...range}=citation;s.lookup('dana',range)
 expect(()=>s.checkCitation(citation,'dana')).toThrow('citation.quote: must match source verbatim')
 expect(s.draft).toBeUndefined()
})
it('documents the semantic boundary: false statements paired with real quotations can pass mechanical draft checks',()=>{
 const s=scope();read(s,'dana')
 const unsupported={findings:fixture.cases.map((c:any)=>({...c.supported_finding,statement:c.unsupported_claim})),limitations:fixture.limitations}
 expect(()=>s.save('dana',unsupported)).not.toThrow()
 expect(s.review).toBeUndefined()
 expect(fs.existsSync(path.join(s.directory,'report.md'))).toBe(false)
 // This is an isolated negative control, not acceptance of the claims or a reviewer verdict.
})
