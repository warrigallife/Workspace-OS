import {it,expect} from 'vitest'
import {researchReviewDraft} from './researchContext'
const draft={findings:[{statement:'A dated finding, not current status.',citation:{record_id:'approved-record',start_line:47,end_line:59,quote:'Exact retrieved source quotation.'}}],limitations:'Only the dated approved evidence was considered.'}
it('preserves claims, limitations and citation locations without duplicated quote text',()=>{
 const before=JSON.stringify(draft),value=researchReviewDraft(draft)
 expect(value).toEqual({findings:[{statement:draft.findings[0].statement,citation:{record_id:'approved-record',start_line:47,end_line:59}}],limitations:draft.limitations})
 expect(JSON.stringify(draft)).toBe(before)
 expect(JSON.stringify(value)).not.toContain('Exact retrieved source quotation.')
})
it('does not collapse distinct findings or alter their order',()=>{
 const input={...draft,findings:[draft.findings[0],{...draft.findings[0],statement:'Another claim with the same source.'}]}
 expect(researchReviewDraft(input).findings.map(f=>f.statement)).toEqual(input.findings.map(f=>f.statement))
})
