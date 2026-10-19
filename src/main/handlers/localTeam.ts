import { app, type IpcMain } from 'electron'
import path from 'path'
import fs from 'fs'
import { ipcHandle } from '../ipc-registry'
import { assertMainFrame } from '../security'
import { IPC } from '../ipc-channels'
import { sendToWindow } from '../main-window'
import { getWorkspaceRoot } from '../workspace-root'
import { launchRun } from '../agent/launchRun'
import { terminateLocalGroup } from '../agent/localTeamRun'
import { RunQueue } from '../runs/queue'
import { validateLocalTask } from '../runs/localTeamTask'

let queue: RunQueue | null = null
function localQueue(): RunQueue {
  if (!queue) queue = new RunQueue(path.join(app.getPath('userData'), 'local-team-queue.json'), async (job, sink) => {
    if (!job.localTeam) throw new Error('Missing local-only task')
    const { child } = await launchRun({ runId: job.id, prompt: job.prompt, localTeam: job.localTeam,
      contextFiles: [], activeFile: null, safeMode: true, agent: null, capabilities: [],
      sink: { ...sink, activity: () => {}, artifact: () => {} },
    })
    return { kill: () => terminateLocalGroup(child) }
  }, { concurrency: 1, strictPersistence: true, onEvent: ev => sendToWindow(IPC.LOCAL_TEAM_UPDATED, ev.job) })
  return queue
}
export function shutdownLocalTeam(): void { queue?.shutdown() }
export function registerLocalTeam(ipc: IpcMain): void {
  ipcHandle(ipc, IPC.LOCAL_TEAM_ENQUEUE, (event, value) => {
    assertMainFrame(event)
    if (localQueue().list().filter(j => ['running','queued'].includes(j.status)).length >= 10) throw new Error('Local queue limit: wait for existing tasks')
    const task = validateLocalTask(value)
    return localQueue().enqueue({ prompt: task.description, label: 'Local team: '+task.description,
      agentName: 'Reid → Nora → Marguerite', root: getWorkspaceRoot(), capabilities: [], localTeam: { task } })
  })
  ipcHandle(ipc, IPC.LOCAL_TEAM_LIST, event => { assertMainFrame(event); return localQueue().list() })
  ipcHandle(ipc, IPC.LOCAL_TEAM_RESULT, (event, id) => {
    assertMainFrame(event)
    if (typeof id !== 'string' || !/^bg-[a-z0-9-]{3,40}$/.test(id) || !localQueue().get(id)) throw new Error('Unknown attempt')
    const directory = path.join(app.getPath('userData'), 'local-team', id)
    const sections: string[] = []
    for (const name of ['handover.md','candidate.py','execution.json','review.json','state.json']) {
      const file = path.join(directory, name)
      if (fs.existsSync(file) && !fs.lstatSync(file).isSymbolicLink() && fs.statSync(file).size <= 64000) sections.push(name+'\n'+fs.readFileSync(file, 'utf8'))
    }
    return sections.join('\n\n')
  })
  ipcHandle(ipc, IPC.LOCAL_TEAM_CANCEL, (event, id) => {
    assertMainFrame(event)
    if (typeof id !== 'string') throw new Error('Invalid task ID')
    const ok = localQueue().cancel(id); localQueue().flush(); return { ok }
  })
  ipcHandle(ipc, IPC.LOCAL_TEAM_RETRY, (event, id) => {
    assertMainFrame(event)
    if (typeof id !== 'string') throw new Error('Invalid task ID')
    const previous = localQueue().get(id)
    if (!previous?.localTeam || !['error','interrupted','cancelled'].includes(previous.status)) throw new Error('Only a stopped incomplete attempt can be retried')
    const task = validateLocalTask(previous.localTeam.task)
    return localQueue().enqueue({ prompt: task.description, label: 'Retry: '+task.description,
      agentName: previous.agentName, root: previous.root, capabilities: [], localTeam: { task, recoveredFrom: previous.id } })
  })
}
