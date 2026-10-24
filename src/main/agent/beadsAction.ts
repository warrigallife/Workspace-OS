import { execFile } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import type { ActionReply } from './actionBridge'

export const BEADS_ACTIONS = ['beads.ready','beads.show','beads.create','beads.update','beads.close'] as const
/** No caller paths, shell, init, sync, force-close or provider execution. */
export function beadsCommand(action: string, args: unknown): string[] {
  if (!args || typeof args !== 'object' || Array.isArray(args)) throw new Error('Beads arguments must be an object')
  const a=args as Record<string,unknown>
  const keys=(allowed:string[])=>{if(Object.keys(a).some(k=>!allowed.includes(k)))throw new Error('Unexpected Beads argument')}
  const text=(k:string,max:number)=>{const v=a[k];if(typeof v!=='string'||!v.trim()||Buffer.byteLength(v)>max||/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(v))throw new Error('Invalid Beads '+k);return v}
  const id=()=>{const v=text('id',128);if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(v))throw new Error('Invalid Beads ID');return v}
  switch(action){
    case 'beads.ready': {
      keys(['limit']);const n=a.limit??3
      if(!Number.isInteger(n)||Number(n)<1||Number(n)>10)throw new Error('Beads limit must be 1–10')
      return ['ready','--limit',String(n),'--brief']
    }
    case 'beads.show':keys(['id']);return ['show',id()]
    case 'beads.create': {
      keys(['title','description']);const out=['create','--title='+text('title',240),'--type=task']
      if(a.description!==undefined)out.push('--description='+text('description',8000))
      return out
    }
    case 'beads.update': {
      keys(['id','status','notes']);const out=['update',id()]
      if(a.status!==undefined){if(!['open','in_progress','blocked'].includes(String(a.status)))throw new Error('Invalid Beads status');out.push('--status='+String(a.status))}
      if(a.notes!==undefined)out.push('--notes='+text('notes',8000))
      if(out.length===2)throw new Error('Provide status or notes')
      return out
    }
    case 'beads.close':keys(['id','reason']);return ['close',id(),'--reason='+text('reason',4000)]
    default:throw new Error('Unknown Beads action')
  }
}

export function compactBeadsReady(value: unknown): unknown[] {
  const rows=Array.isArray(value)?value:(value as any)?.issues
  if(!Array.isArray(rows)||rows.length>10)throw new Error('Invalid Beads ready result')
  return rows.map(row=>{
    if(!row||typeof row.id!=='string'||typeof row.title!=='string')throw new Error('Invalid Beads task')
    return Object.fromEntries(['id','title','status','priority','issue_type'].filter(k=>row[k]!==undefined).map(k=>[k,row[k]]))
  })
}

export function beadsAction(root: string, action: string, args: unknown, actor: string): Promise<ActionReply> {
  let command:string[],db:string,binary:string
  try {
    command=beadsCommand(action,args)
    if(!path.isAbsolute(root)||fs.realpathSync(root)!==root)throw new Error('Beads requires a resolved workspace root')
    const dir=path.join(root,'.beads');db=path.join(dir,'beads.db')
    for(const file of [dir,db])if(fs.lstatSync(file).isSymbolicLink())throw new Error('Symlinked Beads stores are not supported')
    if(!fs.statSync(db).isFile()||fs.realpathSync(dir)!==dir||fs.realpathSync(db)!==db)throw new Error('Beads store is not a workspace-local database')
    binary=[path.join(os.homedir(),'.cargo/bin/br'),'/opt/homebrew/bin/br','/usr/local/bin/br'].find(p=>{try{fs.accessSync(p,fs.constants.X_OK);return true}catch{return false}})??''
    if(!binary)throw new Error('Beads br command is not installed; no download or fallback was attempted')
  } catch(e){return Promise.resolve({ok:false,error:'Beads unavailable: '+(e instanceof Error?e.message:String(e))})}
  return new Promise(resolve=>{
    execFile(binary,['--db',db,'--no-auto-import','--no-auto-flush','--json','--actor','workspace-os:'+actor,...command],{
      cwd:root,env:{HOME:os.homedir(),PATH:'/opt/homebrew/bin:/usr/bin:/bin',LANG:'en_US.UTF-8'},
      encoding:'utf8',shell:false,timeout:10000,maxBuffer:65536,killSignal:'SIGKILL',
    },(error,stdout)=>{
      // Do not retry writes: a failed/oversized response can follow a committed change.
      if(error){resolve({ok:false,error:'Beads command failed or response unavailable; task state may have changed. Inspect before retrying.'});return}
      try {
        const parsed=JSON.parse(stdout)
        if(parsed?.error||parsed?.success===false)throw new Error('Beads rejected the operation')
        const result=action==='beads.ready'?compactBeadsReady(parsed):parsed
        if(Buffer.byteLength(JSON.stringify(result))>24000)throw new Error('Beads detail exceeds the bounded response size; no content returned')
        resolve({ok:true,result})
      }catch(e){resolve({ok:false,error:e instanceof Error?e.message:'Invalid Beads response'})}
    })
  })
}
