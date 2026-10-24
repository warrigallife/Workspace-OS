import {it,expect,vi} from 'vitest'
import os from 'os'
vi.mock('electron',()=>({app:{getPath:()=>os.tmpdir()},BrowserWindow:{getFocusedWindow:()=>null,getAllWindows:()=>[]}}))
import {handleRequest} from './actionBridge'
import {GrantTable} from './grants'
const ctx={actions:[],allActionIds:[],surface:'agents',root:'/ws',folder:'/ws',openFile:null}

it('only a full-grant run bound to this workspace can reach gibson.run — no scoped persona or routine grant, however broad, can', async () => {
  const table=new GrantTable()
  const gibson=vi.fn(async()=>({ok:true as const,result:{}}))
  const full=table.issue('full','all','Full','/ws')
  // 'beads-tasks' is the broadest NAMED capability any persona can carry today;
  // confirms gibson.run has deliberately no SURFACE_PREFIXES entry at all.
  const scoped=table.issue('scoped',['beads-tasks','research','files','knowledge'],'Scoped','/ws')
  const otherWorkspace=table.issue('other','all','Other','/other-ws')
  const deps={context:()=>ctx,invoke:vi.fn(),beads:vi.fn(),gibson,grants:(token:unknown)=>table.lookup(token)}

  for (const token of [undefined, scoped, otherWorkspace]) {
    expect((await handleRequest({cmd:'run',actionId:'gibson.run',args:{},token},deps)).ok).toBe(false)
  }
  expect(gibson).not.toHaveBeenCalled()

  expect((await handleRequest({cmd:'run',actionId:'gibson.run',args:{runner:'claude',repoSlug:'acme/app',runnerTimeoutSec:60,planOnly:true},token:full},deps)).ok).toBe(true)
  expect(gibson).toHaveBeenCalledWith('/ws',{runner:'claude',repoSlug:'acme/app',runnerTimeoutSec:60,planOnly:true})
})

it('a revoked full grant can no longer reach gibson.run', async () => {
  const table=new GrantTable()
  const gibson=vi.fn(async()=>({ok:true as const,result:{}}))
  const full=table.issue('full','all','Full','/ws')
  const deps={context:()=>ctx,invoke:vi.fn(),beads:vi.fn(),gibson,grants:(token:unknown)=>table.lookup(token)}
  table.revoke('full')
  expect((await handleRequest({cmd:'run',actionId:'gibson.run',args:{},token:full},deps)).ok).toBe(false)
  expect(gibson).not.toHaveBeenCalled()
})

it('gibson.run is listed as a known action id', async () => {
  const deps={context:()=>ctx,invoke:vi.fn(),grants:(_t:unknown)=>undefined}
  const listed=await handleRequest({cmd:'list'},deps)
  expect(listed.ok).toBe(true)
  if (listed.ok) expect((listed.result as { all: string[] }).all).toContain('gibson.run')
})
