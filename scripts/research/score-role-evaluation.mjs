// Offline deterministic scoring only; no network or model execution.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const dir='docs/jufe-route-assessment/role-evaluation'
const read=n=>JSON.parse(fs.readFileSync(path.join(dir,n)))
const fixture=JSON.parse(fs.readFileSync('docs/jufe-route-assessment/evaluation-fixture/fixture.json'))
const sources=Object.fromEntries(Object.entries(fixture.sources).map(([id,s])=>{
 const raw=fs.readFileSync(path.join(os.homedir(),'Desktop/JUFE',s.path_relative_to_JUFE))
 assert.equal(createHash('sha256').update(raw).digest('hex'),s.sha256)
 return [id,raw.toString().split(/\r?\n/)]
}))
function response(id){const http=read(id+'-raw.json');assert.equal(http.status,200);const r=JSON.parse(http.body);assert(r.done&&r.done_reason==='stop');return {tokens:r.eval_count,data:JSON.parse(r.message.content)}}
function citation(c){const lines=sources[c.record_id];return !!lines&&Number.isInteger(c.start_line)&&Number.isInteger(c.end_line)&&c.start_line>=1&&c.end_line>=c.start_line&&c.end_line<=lines.length&&lines.slice(c.start_line-1,c.end_line).join('\n').includes(c.quote)}
const dana=response('dana'),key=read('scoring-key.json'),nora=[]
// Assert expected-answer isolation against preserved requests, not model replies.
const dreq=JSON.stringify(read('dana-request.json'))
for(const c of fixture.cases){assert(!dreq.includes(c.supported_finding.statement));assert(!dreq.includes(c.unsupported_claim));assert(!dreq.includes(c.unsupported_reason))}
for(const id of Object.keys(key)){
 const req=read(id+'-request.json'),input=JSON.parse(req.messages[1].content),r=response(id)
 assert.equal(input.candidates.length,2)
 for(const c of input.candidates){assert.deepEqual(Object.keys(c).sort(),['candidate_id','citation','statement']);assert(citation(c.citation))}
 const reviews=r.data.reviews;assert.equal(reviews.length,2);assert.equal(new Set(reviews.map(v=>v.candidate_id)).size,2)
 nora.push({id,tokens:r.tokens,candidates:key[id].map(expected=>{
  const actual=reviews.find(v=>v.candidate_id===expected.candidate_id);assert(actual)
  return {candidate_id:expected.candidate_id,expected,actual,quotationDecisionCorrect:actual.quotation_matches===expected.quotation_matches,supportDecisionCorrect:actual.claim_supported===expected.claim_supported}
 })})
}
const flat=nora.flatMap(x=>x.candidates)
const result={model:read('model.json'),inferenceRequests:read('finished.json').inferenceRequests,sourcesMatchFixture:true,expectedAnswerIsolationVerified:true,dana:{tokens:dana.tokens,completeJSON:true,findingCount:dana.data.findings.length,exactlyThree:dana.data.findings.length===3,bothRecords:new Set(dana.data.findings.map(f=>f.citation.record_id)).size===2,quotations:dana.data.findings.map(f=>({matchesDisk:citation(f.citation),characters:f.citation.quote.length})),semanticScoring:'See assessment.md; not inferred from quotation matching.'},nora,summary:{quotationDecisionsCorrect:flat.filter(x=>x.quotationDecisionCorrect).length,supportDecisionsCorrect:flat.filter(x=>x.supportDecisionCorrect).length,totalCandidates:flat.length,supportedAccepted:flat.filter(x=>x.expected.claim_supported&&x.actual.claim_supported).length,unsupportedRejected:flat.filter(x=>!x.expected.claim_supported&&!x.actual.claim_supported).length,falseAcceptances:flat.filter(x=>!x.expected.claim_supported&&x.actual.claim_supported).length}}
assert.equal(result.inferenceRequests,4)
fs.writeFileSync(path.join(dir,'scores.json'),JSON.stringify(result,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({dana:result.dana,summary:result.summary},null,2))
