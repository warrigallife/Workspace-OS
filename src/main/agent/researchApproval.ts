import {randomUUID} from 'crypto'
import path from 'path'
import {snapshotResearchRoutes,type ResearchRoutes} from '../../shared/researchRoutes'
import {RESEARCH_APPROVAL_TERMS} from '../../shared/researchApproval'
import {NativeResearchBoundaryError} from './researchProvider'
type Binding={routes:ResearchRoutes;workspace:string;task:string}
type Receipt=Binding&{id:string;terms:string;approvedAt:string;runId:string}
const pending=new Map<string,{binding:string;value:Binding;expires:number;approvedAt:string}>()
const permits=new WeakMap<object,{receipt:Receipt;expires:number}>()
const receipts=new Map<string,Receipt>()
const binding=(value:Binding)=>JSON.stringify({...value,routes:snapshotResearchRoutes(value.routes)})
/** Main-process only, called AFTER native confirmation. Persisted IDs are not authority. */
export function approveResearchRun(value:Binding):string {
 const id=randomUUID(),now=Date.now(),copy={...value,routes:snapshotResearchRoutes(value.routes)}
 for(const [key,p] of pending)if(p.expires<now)pending.delete(key)
 pending.set(id,{binding:binding(copy),value:copy,expires:now+300000,approvedAt:new Date(now).toISOString()});return id
}
export function revokeResearchApproval(id:string):void {pending.delete(id)}
export function claimResearchApproval(id:string|undefined,runId:string,value:Binding):object {
 const p=id?pending.get(id):undefined
 if(id)pending.delete(id)
 if(!p||p.expires<Date.now()||p.binding!==binding(value)||!/^bg-[a-z0-9-]{3,40}$/.test(runId)||receipts.has(runId))throw new NativeResearchBoundaryError()
 const receipt={...p.value,id:id!,terms:RESEARCH_APPROVAL_TERMS,approvedAt:p.approvedAt,runId}
 const permit={};permits.set(permit,{receipt,expires:Date.now()+360000});receipts.set(runId,receipt);return permit
}
export function assertResearchPermit(permit:object|undefined,routes:ResearchRoutes,directory:string):void {
 const p=permit?permits.get(permit):undefined
 if(!p||p.expires<Date.now()||JSON.stringify(p.receipt.routes)!==JSON.stringify(snapshotResearchRoutes(routes))||directory!==path.join(p.receipt.workspace,'JUFE-staging',p.receipt.runId))throw new NativeResearchBoundaryError()
}
export function researchApprovalReceipt(runId:string):Receipt|undefined {return receipts.get(runId)}
