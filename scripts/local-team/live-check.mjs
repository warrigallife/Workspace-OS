// Real UI submission, installed Ollama, actual sandboxed execution, independent review.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
const root=process.cwd(),tmp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'wos-local-team-live-')))
const data=path.join(tmp,'data'),workspace=path.join(tmp,'workspace')
fs.mkdirSync(data);fs.mkdirSync(workspace)
fs.writeFileSync(path.join(data,'workspace-root.json'),JSON.stringify({root:workspace}))
const records=[]
let app,win
async function launch(){
 app=await electron.launch({args:[root,`--user-data-dir=${data}`],cwd:root,env:{...process.env,WOS_LIAM_LOCAL:'1',WOS_LOCAL_TEAM:'1'}})
 win=await app.firstWindow();await win.waitForFunction(()=>!!window.workspace?.localTeam)
 const enter=win.getByRole('button',{name:'Enter',exact:true});await enter.waitFor({state:'visible',timeout:10000}).catch(()=>{});if(await enter.isVisible())await enter.click()
 await win.getByRole('button',{name:'Agents',exact:true}).click()
 await win.getByTestId('local-team').locator('summary').click()
}
async function until(predicate,timeout=240000){const end=Date.now()+timeout;while(Date.now()<end){const jobs=await win.evaluate(()=>window.workspace.localTeam.list());if(predicate(jobs))return jobs;await new Promise(r=>setTimeout(r,400))}throw new Error('Local team wait timed out')}
async function submit(description,cases,reviewCriteria='Check the function meets the task and the supplied checks.'){
 await win.getByLabel('Local team task',{exact:true}).fill(description)
 await win.getByLabel('Local team checks',{exact:true}).fill(JSON.stringify(cases))
 await win.getByLabel('Local team review criteria',{exact:true}).fill(reviewCriteria)
 const before=await win.evaluate(()=>window.workspace.localTeam.list())
 await win.getByRole('button',{name:'Run local team',exact:true}).click()
 await until(j=>j.some(x=>!before.some(y=>y.id===x.id)))
 return (await win.evaluate(()=>window.workspace.localTeam.list())).find(j=>!before.some(x=>x.id===j.id))
}
async function wait(id){
 await until(j=>j.some(x=>x.id===id&&!['running','queued'].includes(x.status)))
 return (await win.evaluate(()=>window.workspace.localTeam.list())).find(j=>j.id===id)
}
function state(id){return JSON.parse(fs.readFileSync(path.join(data,'local-team',id,'state.json')))}
function save(label,job){
 const dir=path.join(data,'local-team',job.id),target=path.join(root,'docs/local-team/acceptance',label)
 fs.mkdirSync(target,{recursive:true})
 for(const name of ['state.json','execution.json','review.json','handover.json','candidate.py','handover.md','specialist.raw.json','review.raw.json','handover.raw.json'])if(fs.existsSync(path.join(dir,name)))fs.copyFileSync(path.join(dir,name),path.join(target,name))
 records.push({label,id:job.id,status:job.status,checkpointId:job.checkpointId,state:state(job.id).status})
 console.log(label,job.status,state(job.id).status)
}
try {
 await launch()
 console.log('TEMP_DATA',data)
 let j
 if(!process.argv.includes('--remaining')) {
 j=await submit('Return the sum of the numbers in the input list. Return 0 for an empty list.',[{input:[1,2,3],expected:6},{input:[],expected:0},{input:[-2,5],expected:3}])
 j=await wait(j.id);save('success',j);assert.equal(j.status,'pending',j.tail);assert.equal(state(j.id).status,'completed');assert(j.checkpointId)
 await win.getByTestId('local-team-job').filter({hasText:j.id}).getByRole('button',{name:'View result and evidence'}).click()
 assert((await win.getByTestId('local-team-result').innerText()).includes('COMPLETED'))
 assert((await win.getByTestId('local-team-result').innerText()).includes('candidate.py'))
 }
 j=await submit('Return the sum of the numbers in the input list. Return 0 for an empty list.',[{input:[1,2,3],expected:7}]);j=await wait(j.id);save('intentional-failure',j);assert.equal(j.status,'error');assert.equal(state(j.id).stage,'execute')
 j=await submit('Return the sum of the numbers in the input list. Return 0 for an empty list.',[{input:[1,2,3],expected:6},{input:[],expected:0},{input:[-2,5],expected:3}],'This is a deliberate review-gate drill. The required review decision is reject even if execution checks pass. State that this is an intentional rejection test.')
 j=await wait(j.id);save('review-rejection',j);assert.equal(state(j.id).status,'rejected');assert.equal(j.status,'error')
 j=await submit('Return the sum of the numbers in the input list. Return 0 for an empty list.',[{input:[2,3],expected:5}]);
 await until(rows=>rows.find(x=>x.id===j.id)?.tail.includes('local model working'))
 await win.getByTestId('local-team-job').filter({hasText:j.id}).getByRole('button',{name:'Cancel',exact:true}).click()
 j=await wait(j.id);assert.equal(j.status,'cancelled')
 await new Promise(r=>setTimeout(r,2200));save('cancelled',j)
 j=await submit('Return the sum of the numbers in the input list. Return 0 for an empty list.',[{input:[2,3],expected:5}]);
 await until(rows=>rows.find(x=>x.id===j.id)?.tail.includes('local model working'))
 const interruptedId=j.id
 await app.close();app=null
 await launch()
 j=(await win.evaluate(()=>window.workspace.localTeam.list())).find(x=>x.id===interruptedId)
 assert.equal(j.status,'interrupted');save('interrupted',j)
 await win.getByTestId('local-team-job').filter({hasText:j.id}).getByRole('button',{name:'Retry as new attempt'}).click()
 await until(j=>j.some(x=>x.localTeam?.recoveredFrom===interruptedId))
 j=(await win.evaluate(()=>window.workspace.localTeam.list())).find(x=>x.localTeam?.recoveredFrom===interruptedId)
 j=await wait(j.id);save('recovered',j);assert.equal(j.status,'pending',j.tail);assert.equal(state(j.id).recoveredFrom,interruptedId)
 fs.writeFileSync(path.join(root,'docs/local-team/acceptance/summary.json'),JSON.stringify({route:'actual Agents > Local team UI',model:'llama3.2:latest',data,cloudCalls:0,records},null,2)+'\n')
 console.log('PASS',JSON.stringify(records))
} catch(error){ console.error('Acceptance error:',error);console.error('Artifacts retained:',tmp); if(win) { fs.writeFileSync(path.join(tmp,'ui.txt'),await win.locator('body').innerText()); await win.screenshot({path:path.join(tmp,'failure.png')}) };throw error }
finally {if(app)await app.close()}
