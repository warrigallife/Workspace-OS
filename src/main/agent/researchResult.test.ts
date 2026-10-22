import {it,expect} from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {readResearchResult} from './researchResult'
it('displays separately labelled recovery while retaining failed outcome and hiding ordinary report',()=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'recovery-result-'))
 try{
  const outcome=JSON.stringify({status:'failed',error:'Research token budget exceeded'})
  fs.writeFileSync(path.join(dir,'outcome.json'),outcome)
  fs.writeFileSync(path.join(dir,'report.md'),'UNACCEPTED NORMAL REPORT')
  fs.writeFileSync(path.join(dir,'handover.md'),'ORIGINAL FAILED HANDOVER')
  const label='Recovered from an over-budget run; draft and review passed validation.'
  fs.writeFileSync(path.join(dir,'recovered-report.md'),label+'\nDATED OBSERVATIONS')
  fs.writeFileSync(path.join(dir,'recovered-handover.md'),label+'\nRun remains failed.')
  const display=readResearchResult(dir,'error')
  expect(display).toContain('Authoritative outcome: failed');expect(display).toContain(label)
  expect(display).toContain('ORIGINAL FAILED HANDOVER');expect(display).toContain('Run remains failed.')
  expect(display).not.toContain('UNACCEPTED NORMAL REPORT')
  expect(fs.readFileSync(path.join(dir,'outcome.json'),'utf8')).toBe(outcome)
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})
it('cost controls display validated partial draft and usage without exposing an accepted report or changing failure',()=>{
 const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'partial-result-'))
 try{
  fs.writeFileSync(path.join(dir,'outcome.json'),JSON.stringify({status:'failed',error:'cost preflight'}))
  fs.writeFileSync(path.join(dir,'draft.json'),'SAVED DRAFT')
  fs.writeFileSync(path.join(dir,'usage.json'),'SAVED USAGE')
  fs.writeFileSync(path.join(dir,'report.md'),'UNACCEPTED')
  const text=readResearchResult(dir,'error')
  expect(text).toContain('Authoritative outcome: failed');expect(text).toContain('review/completion not established')
  expect(text).toContain('SAVED DRAFT');expect(text).toContain('SAVED USAGE');expect(text).not.toContain('UNACCEPTED')
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
})
