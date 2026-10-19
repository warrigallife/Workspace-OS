/** Run-specific approved records and outputs. No model-controlled paths or global profile grants. */
import fs from 'fs'
import path from 'path'
import os from 'os'
import { createHash } from 'crypto'
export const RESEARCH_ROOT = path.join(os.homedir(), 'Desktop/Workspace-OS/.workspace-os/liam-workspace')
export const RECORDS: Record<string,string> = {
  'jufe-coverage-2026-10-11': path.join(os.homedir(),'Desktop/JUFE/docs/reports/JUFE_Full_Collection_Coverage_Audit_2026-10-11.md'),
  'jufe-schedule-2026-10-11': path.join(os.homedir(),'Desktop/JUFE/docs/reports/JUFE_Schedule_and_Source31_Coverage_Review_2026-10-11.md'),
}
export const hash = (text: string): string => createHash('sha256').update(text).digest('hex')
export function safePath(file: string): void {
  let current=path.parse(file).root
  for (const part of file.slice(current.length).split(path.sep)) {
    current=path.join(current,part)
    try { if (fs.lstatSync(current).isSymbolicLink()) throw new Error('Symlink denied') }
    catch (e) { if ((e as NodeJS.ErrnoException).code!=='ENOENT') throw e }
  }
}
export function runDirectory(id: string): string {
  if (!/^bg-[a-z0-9-]{3,40}$/.test(id)) throw new Error('Invalid research run ID')
  const dir=path.join(RESEARCH_ROOT,'JUFE-staging',id);safePath(dir);return dir
}
export interface Citation { record_id: string; start_line: number; end_line: number; quote: string }
export interface Finding { statement: string; citation: Citation }
export interface Draft { findings: Finding[]; limitations: string }
export interface Review { decision: 'approve'|'reject'; reason: string; checked_citations: number[] }
export class ResearchScope {
  readonly sources: Record<string,{ path: string; hash: string; lines: string[] }> = {}
  readonly reads: Record<string, { record_id: string; start_line: number; end_line: number }[]> = { dana:[], nora:[] }
  draft?: Draft
  review?: Review
  active=true
  constructor(readonly directory: string, sourcePaths=RECORDS) {
    safePath(directory)
    for (const [id,file] of Object.entries(sourcePaths)) {
      safePath(file)
      if (!fs.statSync(file).isFile() || fs.statSync(file).size>2*1024*1024) throw new Error('Invalid source size/type')
      const text=fs.readFileSync(file,'utf8');this.sources[id]={path:file,hash:hash(text),lines:text.trimEnd().split(/\r?\n/)}
    }
  }
  assertSources(): void {
    for (const source of Object.values(this.sources)) {
      safePath(source.path)
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
    if (!input || Object.keys(input).sort().join(',')!=='end_line,record_id,start_line') throw new Error('Only record ID and line range allowed')
    const {record_id,start_line,end_line}=input, source=this.sources[record_id]
    if (typeof record_id!=='string'||!Object.hasOwn(this.sources,record_id)) throw new Error('Unknown approved record ID')
    if (!Number.isInteger(start_line)||!Number.isInteger(end_line)||start_line<1||end_line<start_line||end_line-start_line>=80||end_line>source.lines.length) throw new Error('Invalid range: 1–80 existing lines')
    this.assertSources()
    const excerpt=source.lines.slice(start_line-1,end_line).join('\n')
    if (Buffer.byteLength(excerpt)>32768) throw new Error('Excerpt too large')
    this.reads[role].push({record_id,start_line,end_line})
    return {record_id,start_line,end_line,total_lines:source.lines.length,sha256:source.hash,excerpt}
  }
  checkCitation(c: Citation, role: 'dana'|'nora'): void {
    if (!c || Object.keys(c).sort().join(',')!=='end_line,quote,record_id,start_line') throw new Error('Invalid citation shape')
    const source=this.sources[c.record_id]
    if (typeof c.record_id!=='string'||!Object.hasOwn(this.sources,c.record_id)||!Number.isInteger(c.start_line)||!Number.isInteger(c.end_line)||c.start_line<1||c.end_line<c.start_line||c.end_line-c.start_line>=80||c.end_line>source.lines.length) throw new Error('Invalid citation range')
    if (typeof c.quote!=='string'||c.quote.length<12||c.quote.length>2000||!source.lines.slice(c.start_line-1,c.end_line).join('\n').includes(c.quote)) throw new Error('Citation quote must match source verbatim')
    if (!this.reads[role].some(r=>r.record_id===c.record_id&&r.start_line<=c.start_line&&r.end_line>=c.end_line)) throw new Error('Citation not independently retrieved by '+role)
  }
  save(role:'dana'|'nora', input: any): unknown {
    this.assertSources()
    if (role==='dana') {
      if (this.draft) throw new Error('Draft already saved')
      if (!input||Object.keys(input).sort().join(',')!=='findings,limitations'||!Array.isArray(input.findings)||input.findings.length<3||input.findings.length>8||typeof input.limitations!=='string'||input.limitations.length<20||input.limitations.length>2000) throw new Error('Supply 3–8 findings and limitations')
      for (const f of input.findings) {
        if (Object.keys(f).sort().join(',')!=='citation,statement'||typeof f.statement!=='string'||f.statement.length<10||f.statement.length>2000) throw new Error('Invalid finding')
        this.checkCitation(f.citation,'dana')
      }
      if (new Set(input.findings.map((f:Finding)=>f.citation.record_id)).size!==2) throw new Error('Cite both approved records')
      this.write('draft.json',input);this.draft=input
    } else {
      if (this.review||!this.draft) throw new Error('Review stage unavailable')
      if (!input||Object.keys(input).sort().join(',')!=='checked_citations,decision,reason'||!['approve','reject'].includes(input.decision)||typeof input.reason!=='string'||input.reason.length<20||input.reason.length>4000||!Array.isArray(input.checked_citations)) throw new Error('Invalid review')
      if (input.decision==='approve') {
        if (JSON.stringify([...input.checked_citations].sort((a,b)=>a-b))!==JSON.stringify(this.draft.findings.map((_,i)=>i))) throw new Error('Review every citation index')
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
