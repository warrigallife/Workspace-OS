import fs from 'fs'
import path from 'path'
import { safePath } from './researchScope'
/** Queue and post-save outcome outrank optimistic intermediate state/report files. */
export function readResearchResult(dir: string, jobStatus: string): string {
  const read=(name:string):string|undefined=>{
    const file=path.join(dir,name);safePath(file)
    return fs.existsSync(file)&&fs.statSync(file).size<=100000?fs.readFileSync(file,'utf8'):undefined
  }
  const outcome=read('outcome.json')
  let terminal: any
  if(outcome!==undefined){try{terminal=JSON.parse(outcome)}catch{terminal={status:'failed',error:'Invalid terminal receipt'}}}
  const completed=jobStatus==='pending' && (outcome===undefined || terminal?.status==='completed')
  const header=outcome===undefined?'':`Authoritative outcome: ${terminal?.status??'unknown'}\n${terminal?.error??''}\nIntermediate artifacts below do not override this outcome.\n\n`
  return header+['outcome.json',...(completed?['report.md']:[]),'review.json','handover.md','state.json'].flatMap(name=>{
    const text=read(name);return text===undefined?[]:[name+'\n'+text]
  }).join('\n\n')
}
