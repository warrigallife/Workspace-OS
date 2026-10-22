import {RESEARCH_BUDGET} from './researchProvider'
/** Planning reserve from the preserved 32,045-token run, not model qualification
 * or a provider-enforced token ceiling. Actual usage remains authoritative. */
export const REVIEW_RESERVE=16518
export function researchCostPlan(role:'dana'|'nora',spent:number,request:unknown,lastInputTokens=0,firstRequest=false,plannedExcerpts=false){
 if(!Number.isSafeInteger(spent)||spent<0||!Number.isSafeInteger(lastInputTokens)||lastInputTokens<0)throw new Error('Invalid cost accounting')
 const requestBytes=Buffer.byteLength(JSON.stringify(request))
 // Full context is charged again even on incremental persistent transport.
 // Baseline first-turn input includes host/auxiliary overhead; add the unchanged
 // maximum output allocation. Unknown tokenisation/host work may exceed this.
 const inputEstimate=Math.max(Math.ceil(requestBytes/3),lastInputTokens,role==='dana'?3451:4521)
 // Hash-bound two-request plan forecasts at most ~9700/stage; round to
 // 10000 per request and retain 12000 for review (including ~2300 headroom).
 const estimatedRequestTokens=Math.max(inputEstimate+2048,plannedExcerpts?10000:0)
 const reserve=plannedExcerpts?12000:REVIEW_RESERVE
 const reviewerReserve=role==='dana'?reserve:0
 const requiredCapacity=role==='nora'&&firstRequest?Math.max(estimatedRequestTokens,reserve):estimatedRequestTokens
 const remaining=RESEARCH_BUDGET.tokens-spent
 return {requestBytes,inputEstimate,estimatedRequestTokens,reviewerReserve,remaining,requiredCapacity,allowed:requiredCapacity+reviewerReserve<=remaining,basis:'saved input floors plus full-context bytes/3 and previous input; 2048 output allowance; estimate, not guaranteed cap'}
}
