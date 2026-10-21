import {localOllama} from './ollamaLocal'
import {snapshotResearchRoutes,type ResearchRoutes,type ResearchDriver} from '../researchProvider'
/** Reuse loopback Ollama only. No downloads, proxy, cloud credentials or fallback. */
export function createOllamaResearchDriver(selected:ResearchRoutes):ResearchDriver {
 const routes=snapshotResearchRoutes(selected),digests=new Map<string,string>()
 return {kind:'ollama-local',routes,
  async preflight(signal){
   const tags=await localOllama('/api/tags',null,signal)
   for(const r of Object.values(routes).filter(r=>r.provider==='ollama-local')){
    const m=tags.models?.find((m:any)=>m.name===r.model)
    if(!m||typeof m.digest!=='string'||!/^sha256:[a-f0-9]{64}$|^[a-f0-9]{64}$/.test(m.digest))throw new Error('Required installed model unavailable; no fallback')
    if(m.remote_host||m.remote_model||m.details?.format!=='gguf')throw new Error('Local GGUF weights required; remote or unverified model metadata denied')
    // Retain the original installation pin for the existing pilot model.
    if(r.model==='llama3.2:latest'&&m.digest.replace(/^sha256:/,'')!=='a80c4f17acd55265feec403c7aef86be0c25983ab279d83f3bcd3abbcb5b8b72')throw new Error('Existing local model digest changed')
    digests.set(r.model,m.digest)
   }
  },
  async open(role){
   const r=routes[role],digest=digests.get(r.model)
   if(r.provider!=='ollama-local'||!digest)throw new Error('Local model has not passed installed-model preflight')
   return {receipt:{...r,digest,nativeTools:[],connectors:[],ambientContext:false,fallback:false,restrictionsEnforced:true},close(){},
    async request(request,signal){
     const result=await localOllama('/api/chat',{model:r.model,...request,stream:false,options:{temperature:0,num_ctx:16384,num_predict:2048},keep_alive:'2m'},signal)
     if(result.model!==r.model)throw new Error('Local answer model mismatch; no substitution')
     return {...result,provider:'ollama-local',inputTokens:result.prompt_eval_count,outputTokens:result.eval_count}
    },
   }
  },
 }
}
