#!/usr/bin/env node
'use strict'
/**
 * The HERMES_CMD value gibsonAction.ts's loop mode points Gibson's
 * `scripts/loop.sh` at (via `--runner hermes`, loop.sh's own documented
 * env-hook — see docs/10-vendor-adapters.md / docs/11-solo-loop.md in the
 * Gibson checkout). Deliberately dumb: it does not call any model and does
 * not decide anything. It forwards loop.sh's rendered prompt (stdin) to the
 * local, one-shot Unix socket gibsonAction.ts is already listening on in the
 * SAME running Workspace OS process, waits for a single "EXIT:<code>" reply,
 * and exits with that code so loop.sh's own success/failure accounting sees
 * exactly what the real launchRun() call (or an explicit block) decided.
 *
 * Only Node builtins — this has to run as a plain child process spawned by a
 * shell, with nothing else guaranteed on PATH.
 */
const net = require('net')

const socketPath = process.argv[2]
if (!socketPath) {
  process.stderr.write('gibsonHermesSocketClient: missing socket path argument\n')
  process.exit(1)
}

const chunks = []
process.stdin.on('data', (d) => chunks.push(d))
process.stdin.on('end', () => {
  const prompt = Buffer.concat(chunks)
  const sock = net.createConnection(socketPath)
  sock.on('connect', () => sock.end(prompt))
  let resp = ''
  sock.on('data', (d) => { resp += d.toString('utf8') })
  sock.on('end', () => {
    const m = /EXIT:(-?\d+)/.exec(resp)
    process.exit(m ? parseInt(m[1], 10) : 1)
  })
  sock.on('error', () => process.exit(1))
})
