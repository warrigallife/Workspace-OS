// Exactly one UI submission of the saved original task. Coordinator permits <=2 repairs.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
const root=process.cwd(),data=path.join(root,'.workspace-os/liam-app-data'),base=path.join(data,'local-team')
const ids=['bg-mvey334q-dwptl6','bg-mvey7aeh-dl4ln8']
const inputs=ids.map(id=>JSON.parse(fs.readFileSync(path.join(base,id,'input.json'))))
const task=inputs[0].task
assert.deepEqual(task.cases,inputs[1].task.cases);assert.equal(task.cases.length,4)
const digest=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex')
function inventory(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?inventory(path.join(dir,e.name)):[path.join(dir,e.name)])}
const originals=Object.fromEntries(ids.flatMap(id=>inventory(path.join(base,id))).map(p=>[p,digest(p)]))
const target=path.join(root,'docs/local-team/duplicate-removal-verification');fs.mkdirSync(target,{recursive:true})
fs.writeFileSync(path.join(target,'original-task.json'),JSON.stringify(task,null,2)+'\n')
let app
try {
 app=await electron.launch({executablePath:path.join(os.homedir(),'Desktop/Workspace OS — Local Python Pilot.command'),cwd:root,timeout:60000})
 const win=await app.firstWindow();await win.waitForFunction(()=>!!window.workspace?.localTeam)
 const identity=await app.evaluate(({app})=>({appPath:app.getAppPath(),userData:app.getPath('userData')}));assert.equal(identity.userData,data)
 const enter=win.getByRole('button',{name:'Enter',exact:true});await enter.waitFor({state:'visible',timeout:10000}).catch(()=>{});if(await enter.isVisible())await enter.click()
 await win.getByRole('button',{name:'Agents',exact:true}).click()
 await win.getByTestId('local-team').locator('summary').click()
 await win.getByLabel('Local team task',{exact:true}).fill(task.description)
 await win.getByLabel('Local team checks',{exact:true}).fill(JSON.stringify(task.cases))
 await win.getByLabel('Local team review criteria',{exact:true}).fill(task.reviewCriteria)
 const before=await win.evaluate(()=>window.workspace.localTeam.list())
 assert(!before.some(j=>['running','queued'].includes(j.status)),'Do not interrupt active local jobs')
 await win.getByRole('button',{name:'Run local team',exact:true}).click()
 let job
 const end=Date.now()+400000
 while(Date.now()<end){
  const rows=await win.evaluate(()=>window.workspace.localTeam.list());job=rows.find(j=>!before.some(old=>old.id===j.id))
  if(job&&!['running','queued'].includes(job.status))break
  await new Promise(r=>setTimeout(r,500))
 }
 assert(job&&!['running','queued'].includes(job.status),'Run did not finish within the existing deadline')
 const directory=path.join(base,job.id)
 assert.deepEqual(JSON.parse(fs.readFileSync(path.join(directory,'input.json'))).task,task)
 for(const name of ['input.json','state.json','candidate.py','validation.json','execution.json','review.json','handover.md','specialist.raw.json','review.raw.json','handover.raw.json','handover.json'])if(fs.existsSync(path.join(directory,name)))fs.copyFileSync(path.join(directory,name),path.join(target,name))
 if(fs.existsSync(path.join(directory,'attempts')))fs.cpSync(path.join(directory,'attempts'),path.join(target,'attempts'),{recursive:true})
 const state=JSON.parse(fs.readFileSync(path.join(directory,'state.json')))
 assert(state.attempts.length<=3,'Exceeded repair budget')
 for(const [file,hash] of Object.entries(originals))assert.equal(digest(file),hash,'Original failure changed')
 await win.getByTestId('local-team-job').filter({hasText:job.id}).getByRole('button',{name:'View result and evidence'}).click()
 const shown=await win.getByTestId('local-team-result').innerText();assert(shown.includes('validation.json'))
 const report={identity,route:'Desktop launcher → Agents → Local Python pilot → Run local team',jobId:job.id,queueStatus:job.status,state:state.status,checkpointId:job.checkpointId,originalFailuresUnchanged:true,originalTaskAndFourChecksUnchanged:true,candidates:state.attempts.length,repairs:state.attempts.length-1,model:state.model,result:state.status==='completed'?'succeeded':'blocked',error:state.error??null}
 fs.writeFileSync(path.join(target,'result.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2))
 if(state.status==='completed'){
  const execution=JSON.parse(fs.readFileSync(path.join(directory,'execution.json'))),review=JSON.parse(fs.readFileSync(path.join(directory,'review.json')))
  assert.equal(job.status,'pending');assert.equal(execution.checks.length,4);assert(execution.checks.every(c=>c.passed&&c.exit_code===0));assert.equal(review.decision,'approve');assert(job.checkpointId)
  for(const [name,sha] of Object.entries(state.evidence))assert.equal(digest(path.join(directory,name)),sha)
 }else process.exitCode=1 // Stop after this bounded workflow. Do not silently resubmit.
}finally{if(app)await app.close()}
