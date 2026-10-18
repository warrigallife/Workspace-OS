import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
const root = process.cwd()
const temp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'liam-live-')))
const data = path.join(temp, 'data'), workspace = path.join(temp, 'workspace')
fs.mkdirSync(data); fs.mkdirSync(workspace)
fs.writeFileSync(path.join(data, 'workspace-root.json'), JSON.stringify({root: workspace}))
const wrapper = path.join(temp, 'claude-probe')
const real = execFileSync('/bin/zsh', ['-lc', 'command -v claude'], {encoding:'utf8'}).trim()
fs.writeFileSync(wrapper, `#!${process.execPath}\nconst fs=require('fs'), cp=require('child_process');\nconst args=process.argv.slice(2);\nfs.writeFileSync(${JSON.stringify(path.join(temp,'launch.json'))},JSON.stringify({args,cwd:process.cwd(),tokenPresent:!!process.env.WOS_AGENT_TOKEN,socketPresent:!!process.env.WOS_AGENT_SOCK}));\nconst c=cp.spawn(${JSON.stringify(real)},args,{env:process.env,stdio:['pipe','pipe','pipe']});\nprocess.stdin.pipe(c.stdin); c.stdout.on('data',b=>{fs.appendFileSync(${JSON.stringify(path.join(temp,'stream.jsonl'))},b);process.stdout.write(b)});c.stderr.pipe(process.stderr);c.on('close',code=>process.exit(code??1));\n`, {mode:0o700})
let app
try {
  app = await electron.launch({args:[root,`--user-data-dir=${data}`],cwd:root,env:{...process.env,CLAUDE_BIN:wrapper}})
  const win=await app.firstWindow(); await win.waitForLoadState('domcontentloaded')
  await win.waitForFunction(()=>!!window.workspace?.agent)
  const roster=await win.evaluate(()=>window.workspace.agents.list())
  assert(roster.some(a=>a.name==='Liam' && a.capabilities.includes('evidence')))
  await win.evaluate(async workspace=>{
    await window.workspace.context.set({root:workspace,folder:workspace,surface:'knowledge'})
    window.__liam={output:'',done:null,meta:null}
    window.workspace.agent.onOutput((id,t)=>{if(id==='liam-acceptance')window.__liam.output+=t})
    window.workspace.agent.onDone((id,code,cp,failure)=>{if(id==='liam-acceptance')window.__liam.done={code,failure}})
    window.workspace.agent.onRunMeta((id,meta)=>{if(id==='liam-acceptance')window.__liam.meta=meta})
    await window.workspace.agent.run('liam-acceptance','Use the authorised evidence.query bridge once to ask: What are the governance permissions and approval boundaries? Return one short exact quotation with its source path and lines, then a labelled paraphrase. Preserve retrieval-only limitations. Do not write files or use other tools.',[],null,'safe','Liam',undefined,'claude:sonnet')
  },workspace)
  await win.waitForFunction(()=>window.__liam.done!==null,{},{timeout:180000})
  const result=await win.evaluate(()=>window.__liam)
  fs.writeFileSync(path.join(temp,'result.json'),JSON.stringify(result,null,2))
  const launch=JSON.parse(fs.readFileSync(path.join(temp,'launch.json')))
  assert(launch.tokenPresent && launch.socketPresent); assert.equal(launch.cwd,workspace)
  assert(launch.args.includes('Bash(wos-action:*)')); assert(!launch.args.includes('Agent'))
  assert.equal(result.done.code,0)
  const stream=fs.readFileSync(path.join(temp,'stream.jsonl'),'utf8')
  const replies=stream.split('\n').filter(Boolean).map(l=>JSON.parse(l)).filter(o=>o.type==='user').flatMap(o=>o.message?.content??[]).filter(c=>c.type==='tool_result').flatMap(c=>{try{return [JSON.parse(c.content)]}catch{return []}})
  const reply=replies.find(r=>r.ok && r.result?.schema==='ada.evidence_response.v0.1')
  assert(reply, 'No raw Ada response in tool output')
  for(const source of reply.result.sources){
    const lines=fs.readFileSync(source.path,'utf8').split(/\r?\n/), [start,end]=source.lines
    assert.equal(source.excerpt,lines.slice(start-1,end).map((l,i)=>`${start+i}: ${l}`).join('\n'))
  }
  fs.writeFileSync(path.join(temp,'bridge-response.json'),JSON.stringify(reply,null,2))
  console.log(JSON.stringify({temp,result,launch:{cwd:launch.cwd,tokenPresent:launch.tokenPresent,socketPresent:launch.socketPresent,allowedTools:launch.args.slice(launch.args.indexOf('--allowedTools')+1,launch.args.indexOf('--append-system-prompt'))}},null,2))
} finally { if(app) await app.close() }
