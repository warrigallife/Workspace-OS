/** Reuse installed Ruflo task handlers. No agent execution, MCP startup or swarm. */
import { execFile } from 'child_process'
import path from 'path'
import fs from 'fs'
import { app } from 'electron'
import { safePath } from './researchScope'
export type ResearchLedger = (action: 'task_create'|'task_update'|'task_complete', args: Record<string, unknown>) => Promise<any>
export function researchLedger(directory: string, signal: AbortSignal): ResearchLedger {
  safePath(directory)
  return (action,args) => new Promise((resolve,reject) => {
    signal.throwIfAborted()
    safePath(directory)
    const script=path.join(app.getAppPath(),'scripts/local-team/ruflo-ledger.mjs')
    if(!fs.existsSync(script)) { reject(new Error('Installed Ruflo ledger adapter unavailable')); return }
    const child=execFile('/opt/homebrew/bin/node',[script],{cwd:directory,
      env:{PATH:'/opt/homebrew/bin:/usr/bin:/bin',HOME:directory,LANG:'en_US.UTF-8'},
      signal,timeout:10000,maxBuffer:65536},(error,stdout)=>{
        if(error){reject(new Error('Ruflo ledger failed: '+error.message));return}
        try{const result=JSON.parse(stdout);if(result.error||result.success===false)throw new Error('Ruflo refused operation');resolve(result)}catch(e){reject(e)}
      })
    child.stdin?.on('error',()=>{})
    child.stdin?.end(JSON.stringify({action,args}))
  })
}
