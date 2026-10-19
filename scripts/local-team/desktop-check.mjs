// Verify installed Desktop launcher -> established local app data -> pilot panel.
// No inference: the live-check script separately verifies actual local execution.
import { _electron as electron } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert/strict'
const launcher=path.join(os.homedir(),'Desktop/Workspace OS — Local Python Pilot.command')
const root=process.cwd(),expected=path.join(root,'.workspace-os/liam-app-data')
let app
try {
 app=await electron.launch({executablePath:launcher,cwd:root,timeout:60000})
 const win=await app.firstWindow();await win.waitForFunction(()=>!!window.workspace?.localTeam)
 const identity=await app.evaluate(({app,BrowserWindow})=>({appPath:app.getAppPath(),userData:app.getPath('userData'),title:BrowserWindow.getAllWindows()[0].getTitle()}))
 assert.equal(identity.userData,expected);assert.equal(identity.appPath,root)
 const enter=win.getByRole('button',{name:'Enter',exact:true});await enter.waitFor({state:'visible',timeout:10000}).catch(()=>{});if(await enter.isVisible())await enter.click()
 await win.getByRole('button',{name:'Agents',exact:true}).click()
 await win.getByTestId('local-team').locator('summary').click()
 assert(await win.getByRole('button',{name:'Run local team',exact:true}).isVisible())
 const agents=await win.evaluate(()=>window.workspace.agents.list());assert(agents.some(a=>a.name==='Liam'))
 fs.writeFileSync('docs/local-team/desktop-launch.json',JSON.stringify({launcher,mode:(fs.statSync(launcher).mode&0o777).toString(8),...identity,pilotPanel:true,liamPresent:true,modelCalls:0},null,2)+'\n')
 console.log('Desktop launch verified:',JSON.stringify(identity))
} finally { if(app)await app.close() }
