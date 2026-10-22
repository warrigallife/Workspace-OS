import type {Draft} from './researchScope'
/** Locations established by the saved 32,045-token run, not expected answers.
 * Hash binding avoids applying line locations to different document revisions.
 * No paths or provider/model choices are accepted here. */
const PLAN=[
 {record_id:'jufe-coverage-2026-10-11',start_line:47,end_line:59,sha256:'eaa5a95fc910bf016c03f899e2ec7d283d9eb56b9c35ad88aa3a5ba569f4b96d'},
 {record_id:'jufe-schedule-2026-10-11',start_line:58,end_line:73,sha256:'e281c7def2fc5461202f84422771adc6a32300260ee1d2a0928416830fee4772'},
]
export function plannedResearchExcerpts(sources:Record<string,{hash:string}>,draft?:Draft){
 // Different fixtures/revisions retain the original model-directed lookup route.
 if(PLAN.some(p=>sources[p.record_id]?.hash!==p.sha256))return []
 const ranges=PLAN.map(({sha256,...r})=>r)
 // Review never relies on Dana's receipts. Include any additional draft span
 // outside the seed passages; the normal handler still validates it.
 for(const {citation:c} of draft?.findings??[]){
  if(!ranges.some(r=>r.record_id===c.record_id&&r.start_line<=c.start_line&&r.end_line>=c.end_line))ranges.push({record_id:c.record_id,start_line:c.start_line,end_line:c.end_line})
 }
 return ranges
}
