import {expect,it,vi,beforeEach} from 'vitest'
const request=vi.hoisted(()=>vi.fn())
vi.mock('./ollamaLocal',()=>({localOllama:request}))
import {createOllamaResearchDriver} from './ollamaResearchDriver'
import {snapshotResearchRoutes} from '../researchProvider'
const routes=snapshotResearchRoutes({dana:{provider:'ollama-local',model:'fixture-a:latest'},nora:{provider:'ollama-local',model:'fixture-b:q4'}})
const signal=new AbortController().signal
beforeEach(()=>request.mockReset())
it('uses exact installed selections and separate stage contexts with no subscription check',async()=>{
 request.mockResolvedValueOnce({models:Object.values(routes).map(r=>({name:r.model,digest:'a'.repeat(64),details:{format:'gguf'}}))})
 const d=createOllamaResearchDriver(routes);await d.preflight(signal)
 for(const role of ['dana','nora'] as const){
  request.mockResolvedValueOnce({model:routes[role].model,done:true,prompt_eval_count:2,eval_count:3,message:{role:'assistant',content:'fixture'}})
  const s=await d.open(role,signal),r=await s.request({messages:[]},signal)
  expect(r.model).toBe(routes[role].model);expect(r.inputTokens).toBe(2);expect(s.receipt.digest).toBe('a'.repeat(64))
 }
 expect(request.mock.calls[1][1].model).toBe('fixture-a:latest');expect(request.mock.calls[2][1].model).toBe('fixture-b:q4')
})
it('missing installed model stops without inference or download',async()=>{
 request.mockResolvedValue({models:[]});await expect(createOllamaResearchDriver(routes).preflight(signal)).rejects.toThrow('no fallback');expect(request).toHaveBeenCalledTimes(1)
})
it('rejects answer substitution',async()=>{
 request.mockResolvedValueOnce({models:Object.values(routes).map(r=>({name:r.model,digest:'a'.repeat(64),details:{format:'gguf'}}))}).mockResolvedValueOnce({model:'other:latest'})
 const d=createOllamaResearchDriver(routes);await d.preflight(signal);const s=await d.open('dana',signal);await expect(s.request({messages:[]},signal)).rejects.toThrow('mismatch')
})

it.each([{remote_host:'https://remote.invalid'},{remote_model:'remote'},{details:{format:''}}])('rejects remote or unverified local weights before chat: %j',async extra=>{
 request.mockResolvedValue({models:Object.values(routes).map(r=>({name:r.model,digest:'a'.repeat(64),details:{format:'gguf'},...extra}))})
 await expect(createOllamaResearchDriver(routes).preflight(signal)).rejects.toThrow('Local GGUF weights required');expect(request).toHaveBeenCalledTimes(1)
})
