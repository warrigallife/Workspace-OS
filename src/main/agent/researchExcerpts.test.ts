import {it,expect} from 'vitest'
import fs from 'fs'
import {RECORDS,hash} from './researchScope'
import {plannedResearchExcerpts} from './researchExcerpts'
import {researchCostPlan} from './researchCost'
const sources=Object.fromEntries(Object.entries(RECORDS).map(([id,p])=>[id,{hash:hash(fs.readFileSync(p,'utf8'))}]))
it('binds planned locations to saved revisions and preserves whole support passages',()=>{
 const ranges=plannedResearchExcerpts(sources);expect(ranges).toHaveLength(2)
 const texts=ranges.map(r=>fs.readFileSync(RECORDS[r.record_id],'utf8').split(/\r?\n/).slice(r.start_line-1,r.end_line).join('\n'))
 expect(texts[0]).toContain('not read in this pass');expect(texts[0]).toContain('36.md')
 expect(texts[1]).toContain('Not yet assessed');expect(texts[1]).toContain('Not previously flagged')
 expect(plannedResearchExcerpts({})).toEqual([])
 expect(plannedResearchExcerpts({...sources,[ranges[0].record_id]:{hash:'changed'}})).toEqual([])
})
it('keeps extra review citations independently retrievable and planning fail-closed',()=>{
 const c={record_id:Object.keys(sources)[0],start_line:90,end_line:91,quote:'fixture'}
 expect(plannedResearchExcerpts(sources,{findings:[{statement:'fixture',citation:c}],limitations:'fixture'}).at(-1)).toEqual({record_id:c.record_id,start_line:90,end_line:91})
 expect(researchCostPlan('dana',0,{text:'x'.repeat(30000)},0,true).allowed).toBe(false)
 expect(researchCostPlan('nora',7483,{},0,true).allowed).toBe(false)
})
