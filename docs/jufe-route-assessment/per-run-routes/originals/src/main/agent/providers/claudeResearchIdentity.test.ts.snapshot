import {expect,it} from 'vitest'
import {checkResearchAssistant,checkResearchUsageModels,requireResearchModel,sanitizedModelId} from './claudeResearchIdentity'
const model='claude-sonnet-5'
it('accepts the exact approved full ID at every identity surface',()=>{
 requireResearchModel('init',model,model)
 checkResearchAssistant(model,{message:{model}})
 checkResearchUsageModels(model,{[model]:{}})
})
it.each(['sonnet','claude-sonnet-5-20260630','claude-sonnet-5.5','claude-sonnet-5[1m]','claude-opus-5'])('does not guess alias, revision or suffix equivalence for %s',returned=>{
 for(const check of [()=>requireResearchModel('init',model,returned),()=>checkResearchAssistant(model,{message:{model:returned}}),()=>checkResearchUsageModels(model,{[returned]:{}})]){
  expect(check).toThrow('identity-mismatch');expect(check).toThrow('"requested":"claude-sonnet-5"');expect(check).toThrow(returned)
 }
})
it.each(['is_api_error_message','isApiErrorMessage'])('separates %s host errors from model substitution without accepting them',field=>{
 const event={message:{model:'<synthetic>',content:[{text:'private response text'}]},[field]:true,api_error_status:403}
 expect(()=>checkResearchAssistant(model,event)).toThrow('host-api-error')
 expect(()=>checkResearchAssistant(model,event)).toThrow('"httpStatus":403')
 expect(()=>checkResearchAssistant(model,event)).not.toThrow('private response text')
})
it('rejects synthetic messages and missing assistant identity even without error flags',()=>{
 expect(()=>checkResearchAssistant(model,{message:{model:'<synthetic>'}})).toThrow('host-synthetic-message')
 expect(()=>checkResearchAssistant(model,{message:{}})).toThrow('<missing>')
})
it('rejects API errors even when they repeat the approved model ID',()=>{
 expect(()=>checkResearchAssistant(model,{message:{model},is_api_error_message:true})).toThrow('host-api-error')
})
it('rejects mixed-model accounting and malformed accounting',()=>{
 expect(()=>checkResearchUsageModels(model,{[model]:{},'claude-haiku-4-5':{}})).toThrow('claude-haiku-4-5')
 for(const x of [null,[],7])expect(()=>checkResearchUsageModels(model,x)).toThrow('invalid-model-usage')
})
it('bounds and sanitizes diagnostic identifiers without copying arbitrary data',()=>{
 for(const x of ['secret-token-value','claude-sonnet-5\nPRIVATE','claude-sonnet-5 '+ 'x'.repeat(10000),{secret:'value'},null])expect(sanitizedModelId(x)).toBe('<redacted-invalid-model-id>')
 const ids=Object.fromEntries(Array.from({length:20},(_,i)=>['claude-sonnet-'+i,{}]))
 try{checkResearchUsageModels(model,ids);throw new Error('expected rejection')}catch(e){
  const text=(e as Error).message;expect(text).toContain('"truncated":true');expect(text.length).toBeLessThan(500)
 }
})
