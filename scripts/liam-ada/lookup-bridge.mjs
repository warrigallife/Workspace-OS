// Built IPC -> Liam launcher -> authenticated bridge, deterministic child; no model call.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
const root=process.cwd(), tmp=fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(),'liam-lookup-')))
const data=path.join(tmp,'data'), workspace=path.join(tmp,'workspace')
fs.mkdirSync(data);fs.mkdirSync(workspace)
fs.writeFileSync(path.join(data,'workspace-root.json'),JSON.stringify({root:workspace}))
const probe=path.join(tmp,'probe'), ready=path.join(tmp,'ready'), go=path.join(tmp,'go'), report=path.join(tmp,'report.json')
const request={record_id:'implementation-log',start_line:145,end_line:160}
fs.writeFileSync(probe,`#!${process.execPath}
const fs=require('fs'),net=require('net');
const request=${JSON.stringify(request)};
function query(actionId,args=request,token=process.env.WOS_AGENT_TOKEN){return new Promise((resolve,reject)=>{const s=net.createConnection(process.env.WOS_AGENT_SOCK);let b='';s.on('error',reject);s.on('connect',()=>s.write(JSON.stringify({cmd:'run',actionId,args,token})+'\\n'));s.on('data',x=>b+=x);s.on('end',()=>resolve(JSON.parse(b)));})}
(async()=>{const r={cwd:process.cwd(),authorized:await query('evidence.lookup'),unknown:await query('evidence.lookup',{...request,record_id:'unknown'}),range:await query('evidence.lookup',{...request,end_line:300}),path:await query('evidence.lookup',{...request,path:'/etc/passwd'}),outsideGrant:await query('memory.remember'),missingToken:await query('evidence.lookup',request,'')};fs.writeFileSync(${JSON.stringify(ready)},'ready');while(!fs.existsSync(${JSON.stringify(go)}))await new Promise(r=>setTimeout(r,50));r.otherWorkspace=await query('evidence.lookup');fs.writeFileSync(${JSON.stringify(report)},JSON.stringify(r,null,2));})().catch(e=>{console.error(e);process.exitCode=1});
`,{mode:0o700})
let app
try {
 app=await electron.launch({args:[root,`--user-data-dir=${data}`],cwd:root,env:{...process.env,CLAUDE_BIN:probe}})
 const win=await app.firstWindow();await win.waitForFunction(()=>!!window.workspace?.agent)
 await win.evaluate(async workspace=>{await window.workspace.context.set({root:workspace,folder:workspace});window.__lookupDone=null;window.workspace.agent.onDone((id,code)=>{if(id==='lookup-probe')window.__lookupDone=code});await window.workspace.agent.run('lookup-probe','Check approved-record lookup',[],null,'safe','Liam',undefined,'claude:sonnet')},workspace)
 for(let i=0;!fs.existsSync(ready)&&i<200;i++)await new Promise(r=>setTimeout(r,50))
 assert(fs.existsSync(ready),'probe did not reach bridge')
 await win.evaluate(workspace=>window.workspace.context.set({root:workspace,folder:workspace}),tmp)
 fs.writeFileSync(go,'go')
 await win.waitForFunction(()=>window.__lookupDone!==null,{},{timeout:15000})
 assert.equal(await win.evaluate(()=>window.__lookupDone),0)
 const r=JSON.parse(fs.readFileSync(report));assert.equal(r.cwd,workspace);assert.equal(r.authorized.ok,true)
 for(const key of ['unknown','range','path','outsideGrant','missingToken','otherWorkspace'])assert.equal(r[key].ok,false,key)
 assert.match(r.unknown.error,/UNKNOWN_RECORD/);assert.match(r.otherWorkspace.error,/different workspace/)
 const result=r.authorized.result,source=result.sources[0]
 const bytes=fs.readFileSync(path.join(root,'docs/liam-ada/implementation-log.md')),lines=bytes.toString('utf8').trimEnd().split(/\r?\n/)
 assert.deepEqual(result.lookup,request);assert.equal(source.record_id,request.record_id)
 assert.equal(source.excerpt,lines.slice(144,160).map((line,i)=>`${i+145}: ${line}`).join('\n'))
 assert.equal(source.total_lines,lines.length);assert.equal(source.source_sha256,createHash('sha256').update(bytes).digest('hex'))
 assert.equal(result.answer,null);assert.equal(result.semantic_support,'UNRESOLVED');assert.equal(result.status,'RETRIEVAL_ONLY')
 fs.writeFileSync(path.join(root,'docs/liam-ada/lookup-bridge-response.json'),JSON.stringify({verification:{route:'built app IPC -> actual Liam launcher -> socket',modelCall:false,diskMatch:true,line152Verified:true,negativeChecks:['unknown record','range limit','caller path','memory.remember','missing token','workspace mismatch']},response:r.authorized},null,2)+'\n')
 console.log(JSON.stringify({tmp,lookup:'PASS',diskMatch:true,line152Verified:true,negativeChecks:6,modelCall:false},null,2))
}finally{if(app)await app.close()}
