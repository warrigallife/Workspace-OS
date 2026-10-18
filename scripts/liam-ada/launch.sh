#!/bin/sh
# Local source build; separate state/workspace; never replaces the installed app.
set -eu
cd "$(dirname "$0")/../.."
npm run build
ELECTRON_RUN_AS_NODE=1 ./node_modules/.bin/electron -e 'require("better-sqlite3"); require("node-pty")'
mkdir -p .workspace-os/liam-app-data .workspace-os/liam-workspace
node --input-type=module -e '
import fs from "node:fs";
import path from "node:path";
const file=".workspace-os/liam-app-data/workspace-root.json";
if(!fs.existsSync(file)) fs.writeFileSync(file, JSON.stringify({root:path.resolve(".workspace-os/liam-workspace")}));
'
exec ./node_modules/.bin/electron . --user-data-dir="$PWD/.workspace-os/liam-app-data"
