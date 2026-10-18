// Use the real launcher, persistent Liam data, roster Run button and prompt input.
// No direct agent.run calls, temporary userData, fake CLI, token minting or provider override.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import crypto from 'node:crypto'
import assert from 'node:assert/strict'
const root=process.cwd(), data=path.join(root,'.workspace-os/liam-app-data')
const reportDir=path.join(root,'.workspace-os/liam-user-run')
fs.mkdirSync(reportDir,{recursive:true})
const before=JSON.parse(fs.readFileSync(path.join(data,'agent-conversations.json'),'utf8'))
let app
try {
 app=await electron.launch({executablePath:path.join(root,'Liam Workspace OS.command'),cwd:root,timeout:60000})
 const win=await app.firstWindow();await win.waitForFunction(()=>!!window.workspace?.agent)
 const identity=await app.evaluate(({app,BrowserWindow})=>({pid:process.pid,executable:process.execPath,appPath:app.getAppPath(),userData:app.getPath('userData'),title:BrowserWindow.getAllWindows()[0].getTitle()}))
 identity.workspace=JSON.parse(fs.readFileSync(path.join(data,'workspace-root.json'),'utf8')).root
 identity.socket=path.join(data,'wos-agent.sock')
 identity.mainSha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'out/main/index.js'))).digest('hex')
 fs.writeFileSync(path.join(reportDir,'identity.json'),JSON.stringify(identity,null,2))
 assert.equal(identity.userData,data)
 assert.equal(identity.title,'Workspace OS — Liam (Local)')
 console.log('IDENTITY',JSON.stringify(identity))
 await win.getByRole('button',{name:'Enter',exact:true}).click()
 await win.getByRole('button',{name:'Settings',exact:true}).click()
 await win.getByRole('button',{name:'🛡 Safe',exact:true}).click()
 await win.getByRole('button',{name:'Close',exact:true}).click()
 await win.getByRole('button',{name:'Agents',exact:true}).click()
 await win.getByTestId('agent-run-Liam').click()
 const input=win.getByPlaceholder('Ask the agent — @ file, / skill…').filter({visible:true})
 await input.waitFor({state:'visible'})
 // This roster opens TerminalAgentPane, which uses Settings' default agent mode.
 await win.evaluate(()=>{
   window.__liamVerification={output:'',done:null,meta:null}
   window.workspace.agent.onOutput((id,text)=>{window.__liamVerification.runId=id;window.__liamVerification.output+=text})
   window.workspace.agent.onDone((id,code)=>{window.__liamVerification.done={id,code}})
   window.workspace.agent.onRunMeta((id,meta)=>{window.__liamVerification.meta=meta})
 })
 await input.fill('Use evidence.query through the authorised bridge to answer: What do your saved Liam profile and integration records say about technically enforced bridge grants versus Safe mode Write/Edit access? Cite the returned source paths and lines and preserve retrieval-only limitations. Do not use any other tools or write files.')
 await input.press('Enter')
 await win.waitForFunction(()=>window.__liamVerification.done!==null,{},{timeout:180000})
 const result=await win.evaluate(()=>window.__liamVerification)
 fs.writeFileSync(path.join(reportDir,'result.json'),JSON.stringify(result,null,2))
 assert.equal(result.done.code,0)
 const after=JSON.parse(fs.readFileSync(path.join(data,'agent-conversations.json'),'utf8'))
 const added=after.filter(entry=>!before.some(old=>JSON.stringify(old)===JSON.stringify(entry)))
 fs.writeFileSync(path.join(reportDir,'new-conversations.json'),JSON.stringify(added,null,2))
 assert.equal(added.length,1,'Expected one new persisted user-facing conversation')
 const sid=added[0][1].replace(/^claude:/,'')
 const project=identity.workspace.replace(/[^a-zA-Z0-9]/g,'-')
 const transcript=path.join(os.homedir(),'.claude/projects',project,`${sid}.jsonl`)
 const events=fs.readFileSync(transcript,'utf8').trim().split('\n').map(l=>JSON.parse(l))
 const replies=events.filter(e=>e.type==='user').flatMap(e=>e.message?.content??[]).filter(c=>c.type==='tool_result').flatMap(c=>{try{return[JSON.parse(c.content)]}catch{return[]}})
 const reply=replies.find(r=>r.ok && r.result?.schema==='ada.evidence_response.v0.1')
 assert(reply,'User-facing run returned no actual Ada evidence')
 assert.equal(reply.result.answer,null);assert.equal(reply.result.status,'RETRIEVAL_ONLY');assert.equal(reply.result.semantic_support,'UNRESOLVED')
 assert(reply.result.sources.some(s=>s.record_kind),'No integration source in actual reply')
 for(const source of reply.result.sources){
   const lines=fs.readFileSync(source.path,'utf8').split(/\r?\n/),[a,b]=source.lines
   assert.equal(source.excerpt,lines.slice(a-1,b).map((line,i)=>`${a+i}: ${line}`).join('\n'))
   assert.equal(source.integrity.status,'VERIFIED_MATCH')
 }
 fs.writeFileSync(path.join(reportDir,'bridge-response.json'),JSON.stringify(reply,null,2))
 await win.screenshot({path:path.join(reportDir,'user-run.png')})
 console.log('RESULT',JSON.stringify({reportDir,result,newConversations:added},null,2))
} catch(error){if(app){const win=await app.firstWindow();await win.screenshot({path:path.join(reportDir,'failure.png')});fs.writeFileSync(path.join(reportDir,'failure-text.txt'),await win.locator('body').innerText())}throw error} finally {if(app)await app.close()}
