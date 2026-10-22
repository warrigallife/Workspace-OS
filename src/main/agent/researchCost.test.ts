import {it,expect} from 'vitest'
import {researchCostPlan,REVIEW_RESERVE} from './researchCost'
it('cost controls reserve observed Nora usage before Dana calls, including corrections',()=>{
 const p=researchCostPlan('dana',0,{messages:[]})
 expect(REVIEW_RESERVE).toBe(16518);expect(p.allowed).toBe(true)
 const boundary=24000-REVIEW_RESERVE-p.estimatedRequestTokens
 expect(researchCostPlan('dana',boundary,{}).allowed).toBe(true)
 expect(researchCostPlan('dana',boundary+1,{}).allowed).toBe(false)
 expect(researchCostPlan('dana',0,{text:'x'.repeat(30000)}).allowed).toBe(false)
})
it('cost controls release the reserve to Nora and retain full context and observed-input estimates',()=>{
 expect(researchCostPlan('nora',7482,{}).reviewerReserve).toBe(0)
 expect(researchCostPlan('nora',7482,{}).allowed).toBe(true)
 expect(researchCostPlan('nora',7483,{},0,true).allowed).toBe(false)
 expect(researchCostPlan('nora',24000,{}).allowed).toBe(false)
 expect(researchCostPlan('nora',10000,{},13000).allowed).toBe(false)
 expect(()=>researchCostPlan('dana',NaN,{})).toThrow('accounting')
})
it('uses a bounded 12000 review reserve only for the hash-bound excerpt plan',()=>{
 const dana=researchCostPlan('dana',0,{},0,true,true)
 expect(dana.estimatedRequestTokens).toBe(10000);expect(dana.reviewerReserve).toBe(12000);expect(dana.allowed).toBe(true)
 expect(researchCostPlan('dana',2000,{},0,false,true).allowed).toBe(true)
 expect(researchCostPlan('dana',2001,{},0,false,true).allowed).toBe(false)
 expect(researchCostPlan('nora',12000,{},0,true,true).allowed).toBe(true)
 expect(researchCostPlan('nora',12001,{},0,true,true).allowed).toBe(false)
 expect(researchCostPlan('dana',0,{}).reviewerReserve).toBe(16518)
 expect(researchCostPlan('dana',0,{text:'x'.repeat(40000)},0,true,true).allowed).toBe(false)
})
