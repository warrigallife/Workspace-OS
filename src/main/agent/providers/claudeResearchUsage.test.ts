import {expect,it} from 'vitest'
import {ClaudeUsageTracker} from './claudeResearchUsage'
const selected='claude-opus-5',extra='claude-haiku-4-5-20251001'
const usage=(n:number)=>({inputTokens:n,outputTokens:n,cacheReadInputTokens:n,cacheCreationInputTokens:n,costUSD:n/1000})
it('discloses additional models without attributing their purpose and counts cumulative deltas',()=>{
 const t=new ClaudeUsageTracker(selected)
 const a=t.accept({[selected]:usage(10),[extra]:usage(2)})
 expect(a.inputTokens).toBe(36);expect(a.outputTokens).toBe(12)
 expect(a.snapshot.models[1]).toMatchObject({model:extra,attribution:'additional aggregate usage; purpose unattributed'})
 const b=t.accept({[selected]:usage(20),[extra]:usage(2)})
 expect(b.inputTokens).toBe(30);expect(b.outputTokens).toBe(10)
 expect(t.accept({[selected]:usage(20),[extra]:usage(2)}).inputTokens).toBe(0)
})
it('rejects missing, malformed, regressing or disappearing required accounting',()=>{
 for(const value of [undefined,null,[],{}, {[selected]:{}},{[selected]:{...usage(1),costUSD:NaN}},{[selected]:{...usage(1),inputTokens:-1}}])expect(()=>new ClaudeUsageTracker(selected).accept(value)).toThrow()
 const t=new ClaudeUsageTracker(selected);t.accept({[selected]:usage(10),[extra]:usage(2)})
 expect(()=>t.accept({[selected]:usage(9),[extra]:usage(2)})).toThrow()
 expect(()=>t.accept({[selected]:usage(11)})).toThrow()
})
it('excludes arbitrary payloads and unsafe identifiers from disclosure',()=>{
 const v=new ClaudeUsageTracker(selected).accept({[selected]:usage(1),'SECRET\nCONTENT':{...usage(2),private:'DO NOT COPY'}})
 expect(JSON.stringify(v)).not.toContain('SECRET');expect(JSON.stringify(v)).not.toContain('DO NOT COPY');expect(v.snapshot.models[1].attribution).toContain('unattributed')
})
