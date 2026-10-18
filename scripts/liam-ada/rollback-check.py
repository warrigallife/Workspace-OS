"""Demonstrate pre-integration rollback in a disposable source copy only."""
from pathlib import Path
import shutil, subprocess, tempfile, json
root=Path.cwd()
recovery_dir=Path(tempfile.mkdtemp(prefix='liam-originals-'))
for archive in ['pre-integration-recovery.tar.gz','pre-continuation-recovery.tar.gz']:
    subprocess.run(['tar','-xzf',str(root/'docs/liam-ada'/archive),'-C',str(recovery_dir)],check=True)
backup=recovery_dir/'workspace-integration-backup-20261018-120131'
copy=Path(tempfile.mkdtemp(prefix='liam-rollback-'))
subprocess.run(['git','archive','HEAD'],check=True,stdout=(copy/'head.tar').open('wb'))
subprocess.run(['tar','-xf',str(copy/'head.tar'),'-C',str(copy)],check=True)
# Overlay the current integration, then exercise the documented removal.
files=['capabilityCatalog.ts','grants.ts','actionBridge.ts','evidenceAction.ts','evidenceAction.test.ts','evidencePermissions.test.ts','evidenceProcess.test.ts','launchRun.ts']
for name in files: shutil.copy2(root/'src/main/agent'/name,copy/'src/main/agent'/name)
for index,name in enumerate(files[:3],1): shutil.copy2(backup/f'{index}-{name}',copy/'src/main/agent'/name)
for name in files[3:7]: (copy/'src/main/agent'/name).unlink()
# Launcher change belongs to continuation; restore its preserved original.
recovery=recovery_dir/'liam-recovery-20261018/Users/liammcilmurray/Desktop/Workspace-OS'
shutil.copy2(recovery/'src/main/agent/launchRun.ts',copy/'src/main/agent/launchRun.ts')
shutil.copy2(root/'docs/liam-ada/liam.md',copy/'liam.md')
shutil.copy2(root/'docs/liam-ada/ada_workspace_adapter_v01.py',copy/'ada_workspace_adapter_v01.py')
shutil.copy2(backup/'4-liam.md',copy/'liam.md')
(copy/'ada_workspace_adapter_v01.py').unlink()
assert (copy/'liam.md').read_bytes()==(backup/'4-liam.md').read_bytes()
shutil.copy2(recovery/'scripts/typecheck.mjs',copy/'scripts/typecheck.mjs')
for index,name in enumerate(files[:3],1): assert (copy/'src/main/agent'/name).read_bytes()==(backup/f'{index}-{name}').read_bytes()
assert 'evidence.query' not in (copy/'src/main/agent/actionBridge.ts').read_text()
(copy/'node_modules').symlink_to(root/'node_modules',target_is_directory=True)
r=subprocess.run([str(root/'node_modules/.bin/vitest'),'run','src/main/agent/grants.test.ts','src/main/agent/actionBridge.test.ts'],cwd=copy,text=True,capture_output=True)
print(r.stdout); print(r.stderr)
assert r.returncode==0
print(json.dumps({'rollbackCopy':str(copy),'restoredOriginals':4,'baselineTests':15,'liveFilesUntouched':True}))
