import {it,expect,vi} from 'vitest'
import os from 'os'
vi.mock('electron',()=>({app:{getPath:()=>os.tmpdir()},BrowserWindow:{getFocusedWindow:()=>null,getAllWindows:()=>[]}}))
import {handleRequest} from './actionBridge'
import {GrantTable} from './grants'
const ctx={actions:[],allActionIds:[],surface:'agents',root:'/ws',folder:'/ws',openFile:null}
it('only a matching, permitted run can read or change Beads tasks',async()=>{
 const table=new GrantTable(),beads=vi.fn(async()=>({ok:true as const,result:[]})),invoke=vi.fn()
 const allowed=table.issue('allowed',['beads-tasks'],'Allowed','/ws'),denied=table.issue('denied',['research'],'Denied','/ws'),other=table.issue('other','all','Other','/other'),unbound=table.issue('unbound','all')
 const deps={context:()=>ctx,beads,invoke,grants:(token:unknown)=>table.lookup(token)}
 for(const token of [undefined,denied,other,unbound])expect((await handleRequest({cmd:'run',actionId:'beads.ready',args:{},token},deps)).ok).toBe(false)
 expect(beads).not.toHaveBeenCalled()
 expect((await handleRequest({cmd:'run',actionId:'beads.ready',args:{},token:allowed},deps)).ok).toBe(true)
 expect(beads).toHaveBeenCalledWith('/ws','beads.ready',{},'allowed')
 table.revoke('allowed');expect((await handleRequest({cmd:'run',actionId:'beads.ready',args:{},token:allowed},deps)).ok).toBe(false)
 expect(invoke).not.toHaveBeenCalled()
})
it('exact restricted research grants do not acquire Beads access',async()=>{
 const table=new GrantTable(),token=table.issueExact('research',['researchRecords.lookup'],'Research','/ws'),beads=vi.fn()
 expect((await handleRequest({cmd:'run',actionId:'beads.ready',args:{},token},{context:()=>ctx,invoke:vi.fn(),beads,grants:t=>table.lookup(t)})).ok).toBe(false)
 expect(beads).not.toHaveBeenCalled()
})
