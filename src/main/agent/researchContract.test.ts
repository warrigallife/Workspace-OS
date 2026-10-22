import fs from 'fs'
import {it,expect} from 'vitest'
import {LIMITS,providerOutputSchema,researchTools,textErrors,fieldErrors} from './researchContract'
it('advertises the same text bounds used by validation and hides save during retrieval',()=>{
 const sources={first:{lines:Array(160)},second:{lines:Array(212)}}
 expect(researchTools('dana',sources,false).map((t:any)=>t.function.name)).toEqual(['lookup'])
 const draft:any=researchTools('dana',sources,true)[1],review:any=researchTools('nora',sources,true)[1]
 for(const [name,schema] of Object.entries({limitations:draft.function.parameters.properties.limitations,statement:draft.function.parameters.properties.findings.items.properties.statement,reason:review.function.parameters.properties.reason})){
  const bounds=LIMITS[name as 'limitations'|'statement'|'quote'|'reason'];expect(schema).toMatchObject({minLength:bounds[0],maxLength:bounds[1]})
  expect(textErrors('x'.repeat(bounds[0]-1),name,bounds).length).toBe(1);expect(textErrors('x'.repeat(bounds[0]),name,bounds)).toEqual([]);expect(textErrors('x'.repeat(bounds[1]+1),name,bounds).length).toBe(1)
 }
 expect(draft.function.parameters.properties.findings).toMatchObject({minItems:3,maxItems:8})
 expect((researchTools('dana',sources,false)[0] as any).function.parameters.properties.record_id.enum).toEqual(['first','second'])
 expect(fieldErrors({findings:[],statement:'bad'},['findings','limitations'],'save')).toEqual(['save.limitations: required','save.statement: unexpected field'])
})

it('projects the preserved HTTP-400 schema without repetition bounds or mutating acceptance requirements',()=>{
 const saved=JSON.parse(fs.readFileSync('docs/jufe-route-assessment/structured-finalisation-verification/event-007.json','utf8')).data.format
 const original=JSON.stringify(saved)
 expect(saved.properties.findings).toMatchObject({minItems:3,maxItems:8})
 expect(saved.properties.findings.items.properties.statement.maxLength).toBe(2000)
 const projected=providerOutputSchema(saved)
 expect(JSON.stringify(projected)).not.toMatch(/"(minLength|maxLength|minItems|maxItems|minimum|maximum)":/)
 expect(projected.properties.findings.items.properties.citation.properties.record_id.enum).toEqual(['jufe-coverage-2026-10-11','jufe-schedule-2026-10-11'])
 expect(projected.required).toEqual(saved.required)
 expect(projected.additionalProperties).toBe(false)
 expect(projected.properties.findings.items.required).toEqual(['statement','citation'])
 expect(JSON.stringify(saved)).toBe(original)
 const sources={'jufe-coverage-2026-10-11':{lines:Array(160)},'jufe-schedule-2026-10-11':{lines:Array(212)}}
 expect((researchTools('dana',sources,true)[1] as any).function.parameters.properties.findings.items.properties.citation.required).toEqual(['record_id','start_line','end_line'])
 const review=providerOutputSchema((researchTools('nora',sources,true)[1] as any).function.parameters)
 expect(review.properties.decision.enum).toEqual(['approve','reject'])
 expect(review.properties.reason).toEqual({type:'string'})
})
