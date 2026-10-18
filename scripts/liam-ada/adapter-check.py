"""Read-only checks of installed Ada; malformed-backend checks use isolated copies."""
import hashlib, json, pathlib, subprocess, tempfile, shutil
ada = pathlib.Path.home() / 'Desktop/ruflo-test/ada'
python = '/Library/Frameworks/Python.framework/Versions/3.14/bin/python3'
question = 'What are the governance permissions and approval boundaries?'
def inventory(root):
    return {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and not p.is_symlink()}
def run(script, raw):
    return subprocess.run([python, '-B', '-E', '-s', str(script)], input=raw, capture_output=True, timeout=12)
paths = json.loads(subprocess.check_output([python,'-B','-E','-s','-c',"import sys,json; sys.path.insert(0,sys.argv[1]); import ada_evidence_service_v03 as s; print(json.dumps([str(p) for p in s.approved_paths()]))",str(ada)],text=True))
def source_hashes():
    return {name:hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest() for name in paths}
source_before=source_hashes()
before = inventory(ada)
script = ada / 'ada_workspace_adapter_v01.py'
r = run(script, json.dumps({'question':question}).encode()); assert r.returncode == 0, r.stderr
response = json.loads(r.stdout)
assert response['answer'] is None and response['status']=='RETRIEVAL_ONLY' and response['semantic_support']=='UNRESOLVED'
for source in response['sources']:
    p=pathlib.Path(source['path']); lines=p.read_text().splitlines(); start,end=source['lines']
    assert source['excerpt']=='\n'.join(f'{i}: {lines[i-1]}' for i in range(start,end+1))
    assert not any(parent.is_symlink() for parent in [p,*p.parents])
for raw in [b'null', b'[]', b'{}', b'{', b'{"question":""}', b'{"question":1}', b'{"question":"x","path":"/tmp"}', json.dumps({'question':'x'*4001}).encode(), b'x'*8193]:
    r=run(script,raw); assert r.returncode!=0 and not r.stdout
with tempfile.TemporaryDirectory(prefix='ada-check-') as tmp:
    copy=pathlib.Path(tmp)/script.name; shutil.copy2(script,copy)
    assert run(copy,b'{"question":"x"}').returncode != 0
assert source_before == source_hashes(), 'Approved source contents changed'
assert before == inventory(ada), 'Ada directory changed during read-only checks'
print(json.dumps({'sourcesMatched':len(response['sources']),'invalidRequests':9,'missingBackend':True,'adaInventoryUnchanged':True,'approvedSourceContentsUnchanged':len(paths),'currentSourceParentSymlinks':False},indent=2))
