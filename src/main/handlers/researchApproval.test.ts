import {it,expect,vi,beforeEach} from 'vitest'
const mock=vi.hoisted(()=>({nextRun:0,handlers:new Map<string,Function>(),dialog:vi.fn(),jobs:[] as any[],root:'',enqueue:vi.fn(),frame:vi.fn()}))
vi.mock('electron',()=>({app:{getPath:()=>'/tmp'},dialog:{showMessageBox:mock.dialog},BrowserWindow:{}}))
vi.mock('../ipc-registry',()=>({ipcHandle:(_ipc:unknown,key:string,fn:Function)=>mock.handlers.set(key,fn)}))
vi.mock('../security',()=>({assertMainFrame:mock.frame}))
vi.mock('../main-window',()=>({sendToWindow:vi.fn()}))
vi.mock('../notify',()=>({notify:vi.fn()}))
vi.mock('./agents',()=>({readAgentForRun:vi.fn()}))
vi.mock('./agent',()=>({getDefaultAgentModel:vi.fn()}))
vi.mock('../workspace-root',()=>({getWorkspaceRoot:()=>mock.root}))
vi.mock('../agent/launchRun',()=>({launchRun:vi.fn()}))
vi.mock('../runs/queue',()=>({RunQueue:class{list(){return mock.jobs}get(id:string){return mock.jobs.find(j=>j.id===id)}enqueue(input:any){mock.enqueue(input);return {...input,id:'bg-dialog-'+(++mock.nextRun),status:'queued'}}}}))
import {registerRunsHandlers} from './runs'
import {IPC} from '../ipc-channels'
import {RESEARCH_ROOT,WARRIGAL_RESEARCH_ROOT} from '../agent/researchScope'
import {RESEARCH_TASK} from '../agent/ollamaResearchRun'
import {RESEARCH_ROUTES} from '../agent/researchProvider'
import {LOCAL_RESEARCH_ROUTES} from '../../shared/researchRoutes'
import {claimResearchApproval} from '../agent/researchApproval'
beforeEach(()=>{mock.dialog.mockReset();mock.enqueue.mockClear();mock.frame.mockReset();mock.jobs=[];mock.root=RESEARCH_ROOT;registerRunsHandlers({} as any)})
const start=(id?:string,routes:any=RESEARCH_ROUTES)=>mock.handlers.get(IPC.RESEARCH_ENQUEUE)!({},id,routes)
it('requires native confirmation and credits attestation before queueing cloud work',async()=>{
 for(const answer of [{response:0,checkboxChecked:true},{response:1,checkboxChecked:false}]){mock.dialog.mockResolvedValueOnce(answer);await expect(start()).rejects.toThrow('not approved')}
 expect(mock.enqueue).not.toHaveBeenCalled()
 mock.dialog.mockResolvedValueOnce({response:1,checkboxChecked:true});const job=await start()
 expect(mock.dialog.mock.calls.at(-1)![0].detail).toContain(RESEARCH_ROUTES.nora.model)
 expect(mock.dialog.mock.calls.at(-1)![0].defaultId).toBe(0)
 expect(()=>claimResearchApproval(job.research.approvalId,job.id,{routes:job.research.routes,workspace:RESEARCH_ROOT,task:RESEARCH_TASK})).not.toThrow()
})
it('local approval has no cloud billing prerequisite; rejects workspace changes while confirming',async()=>{
 mock.dialog.mockResolvedValueOnce({response:1,checkboxChecked:false});await start(undefined,LOCAL_RESEARCH_ROUTES)
 expect(mock.dialog.mock.calls[0][0].checkboxLabel).toBeUndefined()
 mock.dialog.mockImplementationOnce(async()=>{mock.root='/other';return {response:1,checkboxChecked:true}})
 await expect(start()).rejects.toThrow('Workspace or active run changed')
 expect(mock.enqueue).toHaveBeenCalledTimes(1)
})
it('a manual retry needs a fresh dialog and preserves its saved route selection',async()=>{
 mock.jobs=[{id:'bg-old-test',root:RESEARCH_ROOT,research:{routes:LOCAL_RESEARCH_ROUTES,approvalId:'stale'},status:'error'}]
 mock.dialog.mockResolvedValue({response:0})
 await expect(start('bg-old-test',undefined)).rejects.toThrow()
 expect(mock.enqueue).not.toHaveBeenCalled()
 // Invoke without the helper default route so the retry uses saved routes.
 mock.dialog.mockResolvedValueOnce({response:1})
 const job=await mock.handlers.get(IPC.RESEARCH_ENQUEUE)!({},'bg-old-test')
 expect(job.research.routes).toEqual(LOCAL_RESEARCH_ROUTES);expect(job.research.approvalId).not.toBe('stale')
})
it('rejects untrusted frames and simultaneous approval dialogs',async()=>{
 mock.frame.mockImplementationOnce(()=>{throw Error('frame denied')});await expect(start()).rejects.toThrow('frame denied');expect(mock.dialog).not.toHaveBeenCalled()
 let resolve!:(value:any)=>void;mock.dialog.mockReturnValueOnce(new Promise(r=>resolve=r));const first=start()
 await expect(start()).rejects.toThrow('already open');resolve({response:0});await expect(first).rejects.toThrow('not approved')
})

it('binds everyday-workspace approval, queue root and output location without switching workspace',async()=>{
 mock.root=WARRIGAL_RESEARCH_ROOT;mock.dialog.mockResolvedValue({response:1,checkboxChecked:true})
 const job=await start()
 expect(job.root).toBe(WARRIGAL_RESEARCH_ROOT)
 expect(mock.dialog.mock.calls[0][0].detail).toContain(WARRIGAL_RESEARCH_ROOT)
 expect(()=>claimResearchApproval(job.research.approvalId,job.id,{routes:job.research.routes,workspace:WARRIGAL_RESEARCH_ROOT,task:RESEARCH_TASK})).not.toThrow()
})
it('rejects other workspaces and cross-workspace retries before approval',async()=>{
 mock.root='/unapproved';await expect(start()).rejects.toThrow('workspace');expect(mock.dialog).not.toHaveBeenCalled()
 mock.root=WARRIGAL_RESEARCH_ROOT;mock.jobs=[{id:'bg-old-test',root:RESEARCH_ROOT,research:{routes:RESEARCH_ROUTES},status:'error'}]
 await expect(mock.handlers.get(IPC.RESEARCH_ENQUEUE)!({},'bg-old-test')).rejects.toThrow('another workspace')
 expect(mock.dialog).not.toHaveBeenCalled()
})
