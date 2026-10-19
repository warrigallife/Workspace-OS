// Only installed task persistence handlers; never bootstrap MCP, a swarm or a provider.
import { taskTools } from '/opt/homebrew/lib/node_modules/ruflo/node_modules/@claude-flow/cli/dist/src/mcp-tools/task-tools.js'
let raw=''
for await (const part of process.stdin) { raw+=part; if(raw.length>32768) throw new Error('Input limit') }
const {action,args}=JSON.parse(raw)
if(!['task_create','task_status','task_update','task_complete'].includes(action)) throw new Error('Disallowed ledger action')
const result=await taskTools.find(t=>t.name===action).handler(args)
if(result.error || result.success===false) throw new Error('Ruflo ledger operation failed')
process.stdout.write(JSON.stringify(result))
