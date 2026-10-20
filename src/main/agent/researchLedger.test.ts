import {it,expect,vi,beforeEach} from 'vitest'
const m=vi.hoisted(()=>({exec:vi.fn(),exists:true,write:vi.fn()}))
vi.mock('child_process',()=>({execFile:m.exec}))
vi.mock('electron',()=>({app:{getAppPath:()=>'/app'}}))
vi.mock('fs',()=>({default:{existsSync:()=>m.exists}}))
vi.mock('./researchScope',()=>({safePath:()=>{}}))
import {researchLedger} from './researchLedger'
beforeEach(()=>{m.exec.mockReset();m.write.mockReset();m.exists=true;m.exec.mockImplementation((_bin,_args,_opts,cb)=>{queueMicrotask(()=>cb(null,'{"taskId":"task-1"}'));return {stdin:{on:vi.fn(),end:m.write}}})})
it('reuses task-only Ruflo adapter with per-run cwd, no inherited credentials and bounded process',async()=>{
 const call=researchLedger('/staging/run',new AbortController().signal)
 expect(await call('task_create',{type:'dana'})).toEqual({taskId:'task-1'})
 const [bin,args,opts]=m.exec.mock.calls[0]
 expect(bin).toBe('/opt/homebrew/bin/node');expect(args).toEqual(['/app/scripts/local-team/ruflo-ledger.mjs'])
 expect(opts).toMatchObject({cwd:'/staging/run',timeout:10000,maxBuffer:65536,env:{HOME:'/staging/run'}})
 expect(Object.keys(opts.env).sort()).toEqual(['HOME','LANG','PATH']);expect(JSON.parse(m.write.mock.calls[0][0])).toEqual({action:'task_create',args:{type:'dana'}})
})
it('missing ledger fails closed without spawning anything',async()=>{
 m.exists=false;await expect(researchLedger('/staging/run',new AbortController().signal)('task_create',{})).rejects.toThrow('unavailable');expect(m.exec).not.toHaveBeenCalled()
})
it('cancelled ledger operation never spawns',async()=>{
 const a=new AbortController();a.abort();await expect(researchLedger('/staging/run',a.signal)('task_update',{})).rejects.toThrow();expect(m.exec).not.toHaveBeenCalled()
})
it.each(['malformed','{"success":false}'])('ledger rejects invalid result %s',async output=>{
 m.exec.mockImplementation((_b,_a,_o,cb)=>{queueMicrotask(()=>cb(null,output));return {stdin:{on:vi.fn(),end:m.write}}})
 await expect(researchLedger('/staging/run',new AbortController().signal)('task_complete',{})).rejects.toThrow()
})
