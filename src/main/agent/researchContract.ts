/** Shared advertised/validated field limits; relational citation checks stay in ResearchScope. */
export const LIMITS = {findings:[3,8],statement:[10,2000],quote:[12,2000],limitations:[20,2000],reason:[20,4000]} as const
export function fieldErrors(value:unknown,keys:string[],prefix:string):string[] {
  if(!value||typeof value!=='object'||Array.isArray(value))return [prefix+': expected object']
  const v=value as Record<string,unknown>
  return [...keys.filter(k=>!Object.hasOwn(v,k)).map(k=>`${prefix}.${k}: required`),...Object.keys(v).filter(k=>!keys.includes(k)).map(k=>`${prefix}.${k}: unexpected field`)]
}
export function textErrors(value:unknown,field:string,limits:readonly[number,number]):string[] {
  return typeof value!=='string'?[field+': expected string']:value.length<limits[0]||value.length>limits[1]?[`${field}: must contain ${limits[0]}–${limits[1]} characters (received ${value.length})`]:[]
}
const text=(limits:readonly[number,number])=>({type:'string',minLength:limits[0],maxLength:limits[1]})
export function researchTools(role:'dana'|'nora',sources:Record<string,{lines:string[]}>,saveEnabled:boolean):unknown[] {
  const ids=Object.keys(sources),record={type:'string',enum:ids},line={type:'integer',minimum:1,maximum:Math.max(...Object.values(sources).map(s=>s.lines.length))}
  const range={record_id:record,start_line:line,end_line:line}
  const citation={type:'object',properties:{...range,quote:text(LIMITS.quote)},required:['record_id','start_line','end_line','quote'],additionalProperties:false,description:'Inclusive range within one actual lookup, at most 80 lines; quote must exactly match text in that range.'}
  const lookup={type:'function',function:{name:'lookup',description:'Retrieve an approved record. Use start_line <= end_line, at most 80 existing lines, at most 32 KiB. Read BOTH record IDs before save becomes available.',parameters:{type:'object',properties:range,required:['record_id','start_line','end_line'],additionalProperties:false}}}
  if(!saveEnabled)return [lookup]
  return [lookup,{type:'function',function:{name:'save',description:role==='dana'?'Save 3–8 cited findings and limitations. Cite BOTH records; quotes must exactly match your lookups.':'Save independent review after retrieving both records. Approval requires separately retrieving every draft citation range and checking its meaning.',parameters:role==='dana'?{type:'object',properties:{findings:{type:'array',minItems:LIMITS.findings[0],maxItems:LIMITS.findings[1],items:{type:'object',properties:{statement:text(LIMITS.statement),citation},required:['statement','citation'],additionalProperties:false}},limitations:text(LIMITS.limitations)},required:['findings','limitations'],additionalProperties:false}:{type:'object',properties:{decision:{type:'string',enum:['approve','reject']},reason:text(LIMITS.reason),checked_citations:{type:'array',items:{type:'integer'},description:'On approval, exactly all zero-based draft finding indices, each once; every cited range must have been independently retrieved.'}},required:['decision','reason','checked_citations'],additionalProperties:false}}}]
}

/** Provider grammar only. Bounded repetitions expand explosively in the installed
 * Ollama grammar compiler. Keep structural constraints here; all numeric/text/
 * count bounds remain in the full prompt schema and trusted save validation. */
export function providerOutputSchema(schema: unknown): any {
  if (Array.isArray(schema)) return schema.map(providerOutputSchema)
  if (!schema || typeof schema !== 'object') return schema
  return Object.fromEntries(Object.entries(schema).filter(([key])=>
    !['minLength','maxLength','minItems','maxItems','minimum','maximum'].includes(key)
  ).map(([key,value])=>[key,providerOutputSchema(value)]))
}
