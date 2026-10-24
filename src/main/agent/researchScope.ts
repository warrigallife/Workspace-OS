import { LIMITS, fieldErrors, textErrors } from './researchContract'
/** Run-specific approved records and outputs. No model-controlled paths or global profile grants. */
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createHash } from 'crypto'
export const RESEARCH_ROOT = path.join(os.homedir(), 'Desktop/Workspace-OS/.workspace-os/liam-workspace')
export const WARRIGAL_RESEARCH_ROOT = path.join(os.homedir(), 'Desktop/WARRIGAL RESEARCH SUITE')
/** Only these owner-designated workspaces may host the fixed two-report workflow. */
export function requireResearchWorkspace(root: string | null): string {
  if (root !== RESEARCH_ROOT && root !== WARRIGAL_RESEARCH_ROOT) throw new Error('Open the pilot or WARRIGAL RESEARCH SUITE workspace')
  safePath(root)
  return root
}
export const RECORDS: Record<string,string> = {
  'jufe-coverage-2026-10-11': path.join(os.homedir(),'Desktop/JUFE/docs/reports/JUFE_Full_Collection_Coverage_Audit_2026-10-11.md'),
  'jufe-schedule-2026-10-11': path.join(os.homedir(),'Desktop/JUFE/docs/reports/JUFE_Schedule_and_Source31_Coverage_Review_2026-10-11.md'),
}
const sourceLines=(text:string):string[]=>text.replace(/\r?\n$/, '').split(/\r?\n/)
export const hash = (text: string): string => createHash('sha256').update(text).digest('hex')
export function safePath(file: string): void {
  let current=path.parse(file).root
  for (const part of file.slice(current.length).split(path.sep)) {
    current=path.join(current,part)
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symlink denied') }
    catch (e) { if ((e as NodeJS.ErrnoException).code!=='ENOENT') throw e }
  }
}
export function runDirectory(id: string, workspace: string = RESEARCH_ROOT): string {
  if (!/^bg-[a-z0-9-]{3,40}$/.test(id)) throw new Error('Invalid research run ID')
  const dir=path.join(requireResearchWorkspace(workspace),'JUFE-staging',id);safePath(dir);return dir
}
export interface Citation { record_id: string; start_line: number; end_line: number; quote: string }
export interface Finding { statement: string; citation: Citation }
export interface Draft { findings: Finding[]; limitations: string }
export interface Review { decision: 'approve'|'reject'; reason: string; checked_citations: number[] }
export class ResearchScope {
  readonly sources: Record<string,{ path: string; snapshot: string; hash: string; lines: string[] }> = {}
  readonly reads: Record<string, { record_id: string; start_line: number; end_line: number }[]> = { dana:[], nora:[] }
  draft?: Draft
  review?: Review
  active=true
  constructor(readonly directory: string, sourcePaths=RECORDS) {
    safePath(directory)
    for (const [id,file] of Object.entries(sourcePaths)) {
      safePath(file)
      if (!fs.statSync(file).isFile() || fs.statSync(file).size>2*1024*1024) throw new Error('Invalid source size/type')
      const text=fs.readFileSync(file,'utf8')
      const name=`source-snapshot-${Object.keys(this.sources).length}.md`
      this.write(name,text)
      this.sources[id]={path:file,snapshot:path.join(directory,name),hash:hash(text),lines:sourceLines(text)}
    }
    this.write('source-snapshots.json',Object.fromEntries(Object.entries(this.sources).map(([id,s])=>[id,{path:s.path,snapshot:path.basename(s.snapshot),sha256:s.hash}])))
  }
  assertSources(): void {
    for (const source of Object.values(this.sources)) {
      safePath(source.path)
      safePath(source.snapshot)
      if (hash(fs.readFileSync(source.snapshot,'utf8'))!==source.hash) throw new Error('Source snapshot changed; run stopped')
      if (hash(fs.readFileSync(source.path,'utf8'))!==source.hash) throw new Error('Source changed; run stopped')
    }
  }
  write(name: string, value: unknown): void {
    if (!/^[a-z0-9-]+\.(json|md)$/.test(name)) throw new Error('Invalid fixed output')
    safePath(this.directory)
    const file=path.join(this.directory,name);safePath(file)
    fs.writeFileSync(file, typeof value==='string'?value:JSON.stringify(value,null,2),{mode:0o600,flag:'wx'})
  }
  lookup(role: 'dana'|'nora', input: any): unknown {
    const errors=fieldErrors(input,['record_id','start_line','end_line'],'lookup');if(errors.length)throw new Error(errors.join('; '))
    const {record_id,start_line,end_line}=input, source=this.sources[record_id]
    if (typeof record_id!=='string'||!Object.hasOwn(this.sources,record_id)) throw new Error('lookup.record_id: must be one of '+Object.keys(this.sources).join(', '))
    if (!Number.isInteger(start_line)||start_line<1)throw new Error('lookup.start_line: positive integer required')
    if (!Number.isInteger(end_line)||end_line<start_line||end_line-start_line>=80||end_line>source.lines.length)throw new Error(`lookup.end_line: must be >= start_line, span at most 80 lines, and be <= ${source.lines.length}`)
    this.assertSources()
    const excerpt=source.lines.slice(start_line-1,end_line).join('\n')
    if (Buffer.byteLength(excerpt)>32768) throw new Error('Excerpt too large')
    this.reads[role].push({record_id,start_line,end_line})
    return {record_id,start_line,end_line,total_lines:source.lines.length,sha256:source.hash,excerpt}
  }
  checkCitation(c: Citation, role: 'dana'|'nora'): void {
    const errors=fieldErrors(c,['record_id','start_line','end_line','quote'],'citation');if(errors.length)throw new Error(errors.join('; '))
    const source=this.sources[c.record_id]
    if (typeof c.record_id!=='string'||!Object.hasOwn(this.sources,c.record_id)||!Number.isInteger(c.start_line)||!Number.isInteger(c.end_line)||c.start_line<1||c.end_line<c.start_line||c.end_line-c.start_line>=80||c.end_line>source.lines.length) throw new Error('citation.record_id/start_line/end_line: require an approved ID and 1–80 existing inclusive lines')
    const quoteErrors=textErrors(c.quote,'citation.quote',LIMITS.quote);if(quoteErrors.length)throw new Error(quoteErrors.join('; '))
    if (!source.lines.slice(c.start_line-1,c.end_line).join('\n').includes(c.quote)) throw new Error('citation.quote: must match source verbatim')
    if (!this.reads[role].some(r=>r.record_id===c.record_id&&r.start_line<=c.start_line&&r.end_line>=c.end_line)) throw new Error('Citation not independently retrieved by '+role)
  }
  /** Model selects only a previously retrieved span; quotation text is trusted output. */
  resolveCitation(selection: any): Citation {
    const errors=fieldErrors(selection,['record_id','start_line','end_line'],'citation')
    if(errors.length)throw new Error(errors.join('; '))
    const source=this.sources[selection.record_id]
    if(typeof selection.record_id!=='string'||!Object.hasOwn(this.sources,selection.record_id)||!Number.isInteger(selection.start_line)||!Number.isInteger(selection.end_line)||selection.start_line<1||selection.end_line<selection.start_line||selection.end_line-selection.start_line>=80||selection.end_line>source.lines.length)throw new Error('citation.record_id/start_line/end_line: require an approved ID and 1–80 existing inclusive lines')
    this.assertSources()
    const text=fs.readFileSync(source.snapshot,'utf8')
    if(hash(text)!==source.hash)throw new Error('Source snapshot changed; run stopped')
    const citation={...selection,quote:sourceLines(text).slice(selection.start_line-1,selection.end_line).join('\n')}
    this.checkCitation(citation,'dana')
    return citation
  }
  missingRecords(role:'dana'|'nora'):string[] {
    return Object.keys(this.sources).filter(id=>!this.reads[role].some(r=>r.record_id===id))
  }
  save(role:'dana'|'nora', input: any): unknown {
    const missing=this.missingRecords(role)
    if(missing.length)throw new Error('Records not independently retrieved: '+missing.join(', ')+'. Call lookup for each before save.')
    this.assertSources()
    if (role==='dana') {
      if (this.draft) throw new Error('Draft already saved')
      const errors=fieldErrors(input,['findings','limitations'],'save')
      if(!Array.isArray(input?.findings)||input.findings.length<LIMITS.findings[0]||input.findings.length>LIMITS.findings[1])errors.push('save.findings: require 3–8 findings')
      errors.push(...textErrors(input?.limitations,'save.limitations',LIMITS.limitations))
      if(errors.length)throw new Error(errors.join('; '))
      const findings: Finding[]=[]
      for (const [i,f] of input.findings.entries()) {
        const fields=fieldErrors(f,['citation','statement'],`save.findings[${i}]`)
        fields.push(...textErrors(f?.statement,`save.findings[${i}].statement`,LIMITS.statement))
        if(fields.length)throw new Error(fields.join('; '))
        try{findings.push({statement:f.statement,citation:this.resolveCitation(f.citation)})}catch(e){throw new Error(`save.findings[${i}].${(e as Error).message}`)}
      }
      if (new Set(input.findings.map((f:Finding)=>f.citation.record_id)).size!==2) throw new Error('Cite both approved records')
      const draft={findings,limitations:input.limitations}
      this.write('draft.json',draft);this.draft=draft
    } else {
      if (this.review||!this.draft) throw new Error('Review stage unavailable')
      const errors=fieldErrors(input,['checked_citations','decision','reason'],'save')
      if(!['approve','reject'].includes(input?.decision))errors.push('save.decision: must be approve or reject')
      errors.push(...textErrors(input?.reason,'save.reason',LIMITS.reason))
      if(!Array.isArray(input?.checked_citations)||input.checked_citations.some((v:unknown)=>!Number.isInteger(v)))errors.push('save.checked_citations: expected array of integer finding indices')
      if(errors.length)throw new Error(errors.join('; '))
      if (input.decision==='approve') {
        if (JSON.stringify([...input.checked_citations].sort((a,b)=>a-b))!==JSON.stringify(this.draft.findings.map((_,i)=>i))) throw new Error('save.checked_citations: approval requires exactly indices '+this.draft.findings.map((_,i)=>i).join(', '))
        for (const f of this.draft.findings) this.checkCitation(f.citation,'nora')
      }
      this.write('review.json',input);this.review=input
    }
    return {saved:role==='dana'?'draft.json':'review.json'}
  }
  action(role:'dana'|'nora', action:string, args:unknown): unknown {
    if (!this.active) throw new Error('Run cancelled or closed')
    if (action==='researchRecords.lookup') return this.lookup(role,args)
    if (action==='researchReport.save') return this.save(role,args)
    throw new Error('Unknown research action')
  }
}
const sessions=new Map<string,{scope:ResearchScope;role:'dana'|'nora'}>()
export function registerResearchStage(id:string,scope:ResearchScope,role:'dana'|'nora'):void { sessions.set(id,{scope,role}) }
export function closeResearchStage(id:string):void { sessions.delete(id) }
export function researchAction(runId:string,action:string,args:unknown): {ok:true;result?:unknown}|{ok:false;error:string} {
  try { const s=sessions.get(runId);if(!s)throw new Error('No active research stage');return {ok:true,result:s.scope.action(s.role,action,args)} }
  catch(e){return {ok:false,error:(e as Error).message}}
}
