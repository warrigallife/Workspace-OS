import {it,expect} from 'vitest'
import fs from 'fs'
import {researchSystem,researchFinalisation} from './researchContext'
import {researchTools,providerOutputSchema,LIMITS} from './researchContract'
const root='docs/jufe-route-assessment/claude-thinking-live/ui/'
const event=(n:number)=>JSON.parse(fs.readFileSync(root+`event-${String(n).padStart(3,'0')}.json`,'utf8')).data
it('reduces saved instruction context while retaining validation limits and the span-only schema',()=>{
 const catalog=[5,6].map(n=>{const r=event(n).result.result;return {record_id:r.record_id,total_lines:r.total_lines}})
 for(const [role,n] of [['dana',7],['nora',18]] as const){
  const old=event(n).messages
  expect(researchSystem(role,catalog).length).toBeLessThan(old[0].content.length)
  expect(researchFinalisation(role).length).toBeLessThan(old.at(-1).content.length)
  for(const key of (role==='dana'?['findings','statement','quote','limitations']:['reason']) as (keyof typeof LIMITS)[])expect(researchFinalisation(role)).toContain(LIMITS[key].join('–'))
 }
 const sources=Object.fromEntries(catalog.map(c=>[c.record_id,{lines:Array(c.total_lines).fill('')}]))
 const schema=(researchTools('dana',sources,true)[1] as any).function.parameters
 expect(providerOutputSchema(schema).properties.findings.items.properties.citation.required).toEqual(['record_id','start_line','end_line'])
 expect(researchSystem('nora',catalog)).toContain('do not approve on insufficient context')
})
