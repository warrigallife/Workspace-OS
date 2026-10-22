import {execFile} from 'child_process'
import os from 'os'
export const RESEARCH_CLAUDE='/opt/homebrew/Caskroom/claude-code/2.1.267/claude'
export const researchClaudeEnv=():NodeJS.ProcessEnv=>({HOME:os.homedir(),USER:process.env.USER,PATH:'/opt/homebrew/bin:/usr/bin:/bin',LANG:'en_US.UTF-8',CLAUDE_CODE_MAX_OUTPUT_TOKENS:'2048',CLAUDE_CODE_MAX_RETRIES:'0'})
export function requireProMetadata(value:any):void {
 if(value?.loggedIn!==true||value.authMethod!=='claude.ai'||value.apiProvider!=='firstParty'||value.subscriptionType!=='pro')throw new Error('Claude Pro subscription authentication required; no API-key fallback')
}
/** Metadata only; raw output, account details and stderr never leave this function. */
export function verifyResearchPro(signal:AbortSignal):Promise<void> {
 return new Promise((resolve,reject)=>execFile(RESEARCH_CLAUDE,['auth','status','--json'],{env:researchClaudeEnv(),signal,timeout:15000,maxBuffer:16384},(error,stdout)=>{
  if(error){reject(new Error('Claude authentication status unavailable; no inference'));return}
  try{requireProMetadata(JSON.parse(stdout));resolve()}catch{reject(new Error('Claude Pro authentication prerequisite failed; no inference'))}
 }))
}
