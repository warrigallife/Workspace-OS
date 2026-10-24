import {it,expect,vi,beforeEach} from 'vitest'
const m=vi.hoisted(()=>({exec:vi.fn(),symlink:false,output:'[]'}))
vi.mock('child_process',()=>({execFile:m.exec}))
vi.mock('fs',()=>({default:{realpathSync:(p:string)=>p,lstatSync:()=>({isSymbolicLink:()=>m.symlink}),statSync:()=>({isFile:()=>true}),accessSync:()=>{},constants:{X_OK:1}}}))
import {beadsAction,beadsCommand,compactBeadsReady} from './beadsAction'
beforeEach(()=>{m.exec.mockReset();m.symlink=false;m.output='[]';m.exec.mockImplementation((_b,_a,_o,cb)=>{cb(null,m.output);return {}})})
it('uses brief bounded task selection and omits long history',()=>{
 expect(beadsCommand('beads.ready',{})).toEqual(['ready','--limit','3','--brief'])
 const tasks=compactBeadsReady([{id:'br-1',title:'One',status:'open',description:'long history',notes:'private note',priority:2}])
 expect(tasks).toEqual([{id:'br-1',title:'One',status:'open',priority:2}])
})
it.each([['beads.ready',{limit:11}],['beads.show',{id:'--db=/other'}],['beads.show',{id:'../outside'}],['beads.close',{id:'br-1',reason:'Done',force:true}],['beads.update',{id:'br-1',status:'closed'}],['beads.init',{}],['beads.create',{title:'One',path:'/other'}]])('rejects unsupported arguments %s', (action,args)=>{expect(()=>beadsCommand(action,args)).toThrow()})
it('writes only specific fields without shell interpretation',()=>{
 expect(beadsCommand('beads.create',{title:'$(touch /tmp/no)',description:'- text'})).toEqual(['create','--title=$(touch /tmp/no)','--type=task','--description=- text'])
 expect(beadsCommand('beads.update',{id:'br-1',status:'in_progress',notes:'Evidence: report.md'})).toEqual(['update','br-1','--status=in_progress','--notes=Evidence: report.md'])
 expect(beadsCommand('beads.close',{id:'br-1',reason:'Verified report.md'})).toEqual(['close','br-1','--reason=Verified report.md'])
})
it('pins store to workspace, isolates environment and bounds native process',async()=>{
 expect((await beadsAction('/workspace','beads.ready',{},'run-1')).ok).toBe(true)
 const [,args,options]=m.exec.mock.calls[0]
 expect(args).toContain('/workspace/.beads/beads.db');expect(args).toContain('--no-auto-import');expect(args).toContain('--no-auto-flush')
 expect(options).toMatchObject({cwd:'/workspace',shell:false,timeout:10000,maxBuffer:65536})
 expect(Object.keys(options.env).sort()).toEqual(['HOME','LANG','PATH'])
})
it('rejects symlinked store before subprocess',async()=>{m.symlink=true;expect((await beadsAction('/workspace','beads.ready',{},'run-1')).ok).toBe(false);expect(m.exec).not.toHaveBeenCalled()})
it('does not retry a failed write',async()=>{m.exec.mockImplementation((_b,_a,_o,cb)=>{cb(new Error('timeout'),'');return {}});expect(await beadsAction('/workspace','beads.close',{id:'br-1',reason:'Verified'},'run-1')).toMatchObject({ok:false,error:expect.stringContaining('state may have changed')});expect(m.exec).toHaveBeenCalledTimes(1)})
it.each(['not json','{"success":false}','{"error":"refused"}'])('rejects bad response %s',async output=>{m.output=output;expect((await beadsAction('/workspace','beads.ready',{},'run-1')).ok).toBe(false)})
