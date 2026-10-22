import {describe,it,expect,afterEach,vi} from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import {ResearchScope,registerResearchStage,closeResearchStage} from './researchScope'
import {GrantTable} from './grants'
vi.mock('electron',()=>({app:{getPath:()=>'/tmp'},BrowserWindow:{}}))
import {handleRequest} from './actionBridge'
const dirs:string[]=[]
function fixture(){const dir=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'jufe-test-'));dirs.push(dir);const a=path.join(dir,'a.md'),b=path.join(dir,'b.md');fs.writeFileSync(a,'Outstanding first record work.\nMore source content.\n');fs.writeFileSync(b,'Outstanding second record work.\n');return {dir,a,b,scope:new ResearchScope(dir,{first:a,second:b})}}
const citations=[{record_id:'first',start_line:1,end_line:1,quote:'Outstanding first record work.'},{record_id:'second',start_line:1,end_line:1,quote:'Outstanding second record work.'}]
const selection=({quote,...range}:typeof citations[number])=>range
const draft={findings:[{statement:'First recorded outstanding work.',citation:selection(citations[0])},{statement:'Second recorded outstanding work.',citation:selection(citations[1])},{statement:'These remain reported gaps only.',citation:selection(citations[0])}],limitations:'Only the supplied dated records were examined.'}
function read(scope:ResearchScope,role:'dana'|'nora'){for(const c of citations){const {quote,...range}=c;scope.action(role,'researchRecords.lookup',range)}}
afterEach(()=>{for(const d of dirs.splice(0))fs.rmSync(d,{recursive:true,force:true});closeResearchStage('test')})
describe('approved research scope',()=>{
 it('requires Dana retrieval, exact quotes, both sources and independent Nora lookups',()=>{const {scope}=fixture();expect(()=>scope.save('dana',draft)).toThrow('retrieved');read(scope,'dana');scope.save('dana',draft);expect(()=>scope.save('nora',{decision:'approve',reason:'Every citation is supported by the records.',checked_citations:[0,1,2]})).toThrow('independently');read(scope,'nora');scope.save('nora',{decision:'approve',reason:'Every citation is supported by the records.',checked_citations:[0,1,2]});expect(scope.review?.decision).toBe('approve');expect(()=>scope.save('dana',draft)).toThrow('already')})
 it('rejects paths, IDs, invalid ranges, extra fields and false quotes',()=>{const {scope}=fixture();for(const arg of [{record_id:'../a',start_line:1,end_line:1},{record_id:'first',start_line:0,end_line:1},{record_id:'first',start_line:1,end_line:81},{record_id:'first',start_line:1,end_line:3},{record_id:'first',start_line:1,end_line:1,path:'/etc/passwd'}])expect(()=>scope.lookup('dana',arg)).toThrow();read(scope,'dana');expect(()=>scope.checkCitation({...citations[0],quote:'Fabricated quotation text'},'dana')).toThrow('verbatim')})
 it('rejects source drift, missing sources, symlinks and output escapes',()=>{const {scope,a,dir}=fixture();fs.writeFileSync(a,'Changed');expect(()=>scope.lookup('dana',{record_id:'first',start_line:1,end_line:1})).toThrow('changed');expect(()=>scope.write('../escape.md','x')).toThrow();fs.symlinkSync('/nonexistent-target',path.join(dir,'draft.json'));expect(()=>scope.write('draft.json',{})).toThrow('Symlink');fs.unlinkSync(a);expect(()=>scope.assertSources()).toThrow()})
 it('records rejection without falsely accepting and closes cancellation authority',()=>{const {scope}=fixture();read(scope,'dana');scope.save('dana',draft);read(scope,'nora');scope.save('nora',{decision:'reject',reason:'Insufficient semantic support for a finding.',checked_citations:[]});expect(scope.review?.decision).toBe('reject');scope.active=false;expect(()=>scope.action('dana','researchRecords.lookup',{})).toThrow('closed')})
 it('requires exact grant, token, matching workspace and active stage in actual bridge',async()=>{const {scope,dir}=fixture();const table=new GrantTable();const token=table.issueExact('test',['researchRecords.lookup','researchReport.save'],'Dana',dir);registerResearchStage('test',scope,'dana');const deps={context:()=>({root:dir,actions:[],allActionIds:[],surface:null,folder:null,openFile:null}),invoke:vi.fn(),grants:(t:unknown)=>table.lookup(t)};const req={cmd:'run' as const,actionId:'researchRecords.lookup',args:{record_id:'first',start_line:1,end_line:1},token};expect((await handleRequest(req,deps)).ok).toBe(true);expect((await handleRequest({...req,token:'wrong'},deps)).ok).toBe(false);expect((await handleRequest({...req,actionId:'memory.remember'},deps)).ok).toBe(false);expect((await handleRequest({...req,actionId:'researchRecords.lookupExtra'},deps)).ok).toBe(false);expect((await handleRequest(req,{...deps,context:()=>({...deps.context(),root:'/different'})})).ok).toBe(false);table.revoke('test');expect((await handleRequest(req,deps)).ok).toBe(false)})
})

 it('enforces both-record retrieval before save, including direct unadvertised calls',()=>{
   const {scope}=fixture()
   expect(()=>scope.action('dana','researchReport.save',draft)).toThrow('first, second')
   scope.lookup('dana',{record_id:'first',start_line:1,end_line:1})
   expect(scope.missingRecords('dana')).toEqual(['second'])
   expect(()=>scope.action('dana','researchReport.save',draft)).toThrow('second')
   scope.lookup('dana',{record_id:'second',start_line:1,end_line:1})
   expect(scope.missingRecords('dana')).toEqual([])
   scope.save('dana',draft)
   expect(scope.missingRecords('nora')).toEqual(['first','second'])
 })
 it('reports exact extra, missing and length errors rather than misleading finding counts',()=>{
   const {scope}=fixture();read(scope,'dana')
   expect(()=>scope.save('dana',{...draft,statement:'unexpected',limitations:''})).toThrow('save.statement: unexpected field; save.limitations: must contain 20–2000 characters (received 0)')
   expect(()=>scope.save('dana',{findings:draft.findings})).toThrow('save.limitations: required')
   expect(()=>scope.save('dana',{...draft,findings:[{...draft.findings[0],statement:'short'},...draft.findings.slice(1)]})).toThrow('save.findings[0].statement')
 })

it('retains all acceptance bounds removed only from provider grammar',()=>{
 const {scope}=fixture();read(scope,'dana')
 for(const n of [2,9])expect(()=>scope.save('dana',{...draft,findings:Array(n).fill(draft.findings[0])})).toThrow('3–8 findings')
 for(const n of [19,2001])expect(()=>scope.save('dana',{...draft,limitations:'x'.repeat(n)})).toThrow('save.limitations')
 for(const n of [9,2001])expect(()=>scope.save('dana',{...draft,findings:[{...draft.findings[0],statement:'x'.repeat(n)},...draft.findings.slice(1)]})).toThrow('statement')
 for(const n of [11,2001])expect(()=>scope.checkCitation({...citations[0],quote:'x'.repeat(n)},'dana')).toThrow('citation.quote')
 scope.save('dana',draft);read(scope,'nora')
 for(const n of [19,4001])expect(()=>scope.save('nora',{decision:'approve',checked_citations:[0,1,2],reason:'x'.repeat(n)})).toThrow('save.reason')
 expect(scope.review).toBeUndefined()
})

it('copies exact selected snapshot lines including escaping and whitespace without mutating the submitted draft',()=>{
 const {dir,a,b}=fixture(),dest=path.join(dir,'fresh');fs.mkdirSync(dest)
 const text='Exact \\hat{X} and "quoted" source.  \nSecond line with **markup**.\n'
 fs.writeFileSync(a,text)
 const s=new ResearchScope(dest,{first:a,second:b});s.lookup('dana',{record_id:'first',start_line:1,end_line:2});s.lookup('dana',{record_id:'second',start_line:1,end_line:1})
 const input=structuredClone(draft);input.findings[0].citation.end_line=2;const original=JSON.stringify(input)
 s.save('dana',input)
 expect(JSON.stringify(input)).toBe(original)
 expect(s.draft?.findings[0].citation.quote).toBe(text.slice(0,-1))
 expect(fs.readFileSync(s.sources.first.snapshot,'utf8')).toBe(text)
 expect(JSON.parse(fs.readFileSync(path.join(dest,'source-snapshots.json'),'utf8')).first.sha256).toBe(s.sources.first.hash)
 expect(s.review).toBeUndefined()
})
it('rejects invented IDs, unreturned spans, injected quotations and oversized trusted excerpts',()=>{
 const {scope}=fixture();read(scope,'dana')
 for(const citation of [{record_id:'invented',start_line:1,end_line:1},{record_id:'first',start_line:2,end_line:2},{record_id:'first',start_line:1,end_line:99},{...selection(citations[0]),quote:citations[0].quote}])expect(()=>scope.resolveCitation(citation)).toThrow()
 expect(scope.draft).toBeUndefined()
 const {dir,a,b}=fixture(),dest=path.join(dir,'large');fs.mkdirSync(dest);fs.writeFileSync(a,'x'.repeat(2001)+'\nshort\n')
 const s=new ResearchScope(dest,{first:a,second:b});s.lookup('dana',{record_id:'first',start_line:1,end_line:2})
 for(const n of [1,2])expect(()=>s.resolveCitation({record_id:'first',start_line:n,end_line:n})).toThrow('citation.quote')
})
it('fails closed on altered or missing saved snapshots, and changed originals after retrieval',()=>{
 for(const mutation of ['snapshot','missing','original']){
  const {scope,a}=fixture();read(scope,'dana')
  if(mutation==='missing')fs.unlinkSync(scope.sources.first.snapshot)
  else fs.writeFileSync(mutation==='snapshot'?scope.sources.first.snapshot:a,'Changed source text.')
  expect(()=>scope.save('dana',draft)).toThrow();expect(scope.draft).toBeUndefined()
 }
})
