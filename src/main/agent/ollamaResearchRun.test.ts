import {it,expect,vi,afterEach} from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
const mock=vi.hoisted(()=>({request:vi.fn(),root:'',directory:''}))
vi.mock('./providers/ollamaLocal',()=>({localOllama:mock.request}))
vi.mock('../handlers/agents',()=>({readAgentForRun:(name:string)=>({name,persona:'Only approved research.'})}))
vi.mock('../workspace-root',()=>({getWorkspaceRoot:()=>mock.root}))
vi.mock('../checkpoint',()=>({CheckpointStore:class{async createCheckpoint(){return {id:'test-checkpoint'}}}}))
vi.mock('./actionBridge',()=>({invokeGrantedAction:vi.fn(async()=>({ok:false,error:'not granted'}))}))
vi.mock('./researchScope',async()=>{const original=await vi.importActual<any>('./researchScope');return {...original,runDirectory:()=>mock.directory}})
import { launchOllamaResearch } from './ollamaResearchRun'
import { RESEARCH_ROOT } from './researchScope'
import {grants} from './grants'
const dirs:string[]=[]
afterEach(()=>{mock.request.mockReset();for(const d of dirs.splice(0))fs.rmSync(d,{recursive:true,force:true})})
function setup(){const parent=fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()),'jufe-adapter-'));dirs.push(parent);mock.directory=path.join(parent,'run');mock.root=RESEARCH_ROOT;let done!:(v:number)=>void;const result=new Promise<number>(r=>{done=r});const sink={output:vi.fn(),meta:vi.fn(),activity:vi.fn(),artifacts:vi.fn(),artifact:vi.fn(),done:(code:number)=>done(code)};return {options:{runId:'bg-test-test',prompt:'',contextFiles:[],activeFile:null,safeMode:true,agent:null,capabilities:[],sink,research:{}},result}}
const tags={models:[{name:'llama3.2:latest',digest:'a80c4f17acd55265feec403c7aef86be0c25983ab279d83f3bcd3abbcb5b8b72'}]}
it('stops after 12 local responses, preserving failures without review or fallback',async()=>{const {options,result}=setup();mock.request.mockResolvedValueOnce(tags).mockResolvedValue({done:true,message:{role:'assistant',content:'',tool_calls:[{function:{name:'shell',arguments:{}}}]}});await launchOllamaResearch(options);expect(await result).toBe(1);expect(mock.request).toHaveBeenCalledTimes(13);const state=JSON.parse(fs.readFileSync(path.join(mock.directory,'state.json'),'utf8'));expect(state.status).toBe('failed');expect(state.error).toContain('budget');expect(fs.existsSync(path.join(mock.directory,'report.md'))).toBe(false);expect(grants.size()).toBe(0)})
it('stops at 16 tool calls even when the model batches them',async()=>{const {options,result}=setup();mock.request.mockResolvedValueOnce(tags).mockResolvedValue({done:true,message:{role:'assistant',tool_calls:Array.from({length:17},()=>({function:{name:'shell',arguments:{}}}))}});await launchOllamaResearch(options);expect(await result).toBe(1);expect(mock.request).toHaveBeenCalledTimes(2);expect(fs.readFileSync(path.join(mock.directory,'state.json'),'utf8')).toContain('Tool-call budget')})
it('cancellation aborts the request and revokes stage grants',async()=>{const {options,result}=setup();let waiting! :()=>void;const started=new Promise<void>(r=>waiting=r);mock.request.mockResolvedValueOnce(tags).mockImplementation((_route,_body,signal)=>new Promise((_resolve,reject)=>{waiting();signal.addEventListener('abort',()=>reject(new Error('aborted')))}));const run=await launchOllamaResearch(options);await started;run.child.kill();expect(await result).toBe(1);expect(grants.size()).toBe(0);expect(fs.readFileSync(path.join(mock.directory,'state.json'),'utf8')).toContain('cancelled')})
it('missing installed model fails before inference and never falls back',async()=>{const {options,result}=setup();mock.request.mockResolvedValue({models:[]});await launchOllamaResearch(options);expect(await result).toBe(1);expect(mock.request).toHaveBeenCalledTimes(1)})
