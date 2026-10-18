// Exercise actual IPC -> profile -> launcher -> socket grants, without a model call.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
const root=process.cwd(), tmp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'liam-grants-')))
const data=path.join(tmp,'data'), workspace=path.join(tmp,'workspace')
fs.mkdirSync(data);fs.mkdirSync(workspace)
fs.writeFileSync(path.join(data,'workspace-root.json'),JSON.stringify({root:workspace}))
const probe=path.join(tmp,'probe'), ready=path.join(tmp,'ready'), go=path.join(tmp,'go'), report=path.join(tmp,'report.json')
fs.writeFileSync(probe,`#!${process.execPath}
const fs=require('fs'),net=require('net');
function query(actionId, token=process.env.WOS_AGENT_TOKEN){return new Promise((resolve,reject)=>{const s=net.createConnection(process.env.WOS_AGENT_SOCK);let b='';s.on('error',reject);s.on('connect',()=>s.write(JSON.stringify({cmd:'run',actionId,args:{question:'governance'},token})+'\\n'));s.on('data',x=>b+=x);s.on('end',()=>resolve(JSON.parse(b)));})}
(async()=>{const args=process.argv.slice(2);const r={cwd:process.cwd(),allowedTools:args.slice(args.indexOf('--allowedTools')+1,args.indexOf('--append-system-prompt')),authorized:await query('evidence.query'),outsideGrant:await query('browser.navigate'),missingToken:await query('evidence.query','')};fs.writeFileSync(${JSON.stringify(ready)},'ready');while(!fs.existsSync(${JSON.stringify(go)}))await new Promise(r=>setTimeout(r,50));r.otherWorkspace=await query('evidence.query');fs.writeFileSync(${JSON.stringify(report)},JSON.stringify(r,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
`,{mode:0o700})
let app
try {
 app=await electron.launch({args:[root,`--user-data-dir=${data}`],cwd:root,env:{...process.env,CLAUDE_BIN:probe}})
 const win=await app.firstWindow();await win.waitForFunction(()=>!!window.workspace?.agent)
 await win.evaluate(async workspace=>{await window.workspace.context.set({root:workspace,folder:workspace});window.__grantDone=null;window.workspace.agent.onDone((id,code)=>{if(id==='grant-probe')window.__grantDone=code});await window.workspace.agent.run('grant-probe','Check assigned evidence capability',[],null,'safe','Liam',undefined,'claude:sonnet')},workspace)
 for(let i=0;!fs.existsSync(ready)&&i<200;i++)await new Promise(r=>setTimeout(r,50))
 assert(fs.existsSync(ready),'probe did not reach bridge')
 await win.evaluate(workspace=>window.workspace.context.set({root:workspace,folder:workspace}),tmp)
 fs.writeFileSync(go,'go')
 await win.waitForFunction(()=>window.__grantDone!==null,{},{timeout:15000})
 const r=JSON.parse(fs.readFileSync(report));assert.equal(r.cwd,workspace);assert.equal(r.authorized.ok,true);assert.equal(r.outsideGrant.ok,false);assert.equal(r.missingToken.ok,false);assert.equal(r.otherWorkspace.ok,false);assert.match(r.otherWorkspace.error,/different workspace/)
 assert.deepEqual(r.allowedTools,['Read','Glob','Grep','Write','Edit','Bash(wos-gen:*)','Bash(wos-action:*)'])
 console.log(JSON.stringify({tmp,actualLauncher:'PASS',...r,authorized:{ok:r.authorized.ok,status:r.authorized.result.status}},null,2))
}finally{if(app)await app.close()}
