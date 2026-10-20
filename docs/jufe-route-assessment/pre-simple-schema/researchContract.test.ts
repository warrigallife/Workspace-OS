import {it,expect} from 'vitest'
import {LIMITS,researchTools,textErrors,fieldErrors} from './researchContract'
it('advertises the same text bounds used by validation and hides save during retrieval',()=>{
 const sources={first:{lines:Array(160)},second:{lines:Array(212)}}
 expect(researchTools('dana',sources,false).map((t:any)=>t.function.name)).toEqual(['lookup'])
 const draft:any=researchTools('dana',sources,true)[1],review:any=researchTools('nora',sources,true)[1]
 for(const [name,schema] of Object.entries({limitations:draft.function.parameters.properties.limitations,statement:draft.function.parameters.properties.findings.items.properties.statement,quote:draft.function.parameters.properties.findings.items.properties.citation.properties.quote,reason:review.function.parameters.properties.reason})){
  const bounds=LIMITS[name as 'limitations'|'statement'|'quote'|'reason'];expect(schema).toMatchObject({minLength:bounds[0],maxLength:bounds[1]})
  expect(textErrors('x'.repeat(bounds[0]-1),name,bounds).length).toBe(1);expect(textErrors('x'.repeat(bounds[0]),name,bounds)).toEqual([]);expect(textErrors('x'.repeat(bounds[1]+1),name,bounds).length).toBe(1)
 }
 expect(draft.function.parameters.properties.findings).toMatchObject({minItems:3,maxItems:8})
 expect((researchTools('dana',sources,false)[0] as any).function.parameters.properties.record_id.enum).toEqual(['first','second'])
 expect(fieldErrors({findings:[],statement:'bad'},['findings','limitations'],'save')).toEqual(['save.limitations: required','save.statement: unexpected field'])
})
