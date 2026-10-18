"""Explicit-source acceptance; no models, credentials, network, or file mutations."""
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys
import subprocess
import tarfile
import types

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
ADA = Path.home() / 'Desktop/ruflo-test/ada'
sys.path.insert(0, str(ADA))
service_path = Path(sys.argv[1]) if len(sys.argv) > 1 else ADA / 'ada_evidence_service_v03.py'
spec = importlib.util.spec_from_file_location('expanded_service', service_path)
service = importlib.util.module_from_spec(spec)
spec.loader.exec_module(service)
with tarfile.open(ROOT / 'docs/liam-ada/pre-source-expansion-recovery.tar.gz') as archive:
    baseline = types.ModuleType('baseline_service')
    exec(compile(archive.extractfile('0-ada_evidence_service_v03.py').read(), '<preserved service>', 'exec'), baseline.__dict__)
originals = baseline.approved_paths()
new = [
    ADA / 'ADA_WORKSPACE_OS_INTEGRATION_SPEC_v0.1_DRAFT.md',
    ADA / 'ADA_WORKSPACE_OS_EVIDENCE_CONTRACT_v0.1_DRAFT.md',
    ROOT / 'docs/liam-ada/implementation-log.md',
    ROOT / 'docs/liam-ada/README.md',
    Path.home() / '.claude/agents/liam.md',
    ROOT / 'docs/liam-ada/launcher-permissions.json',
    ROOT / 'docs/liam-ada/live-launch.json',
    ROOT / 'docs/liam-ada/live-bridge-response.json',
    ROOT / 'docs/liam-ada/live-liam-response.md',
]
assert service.approved_paths() == originals + tuple(new)
assert len(originals) == 6 and len(set(service.approved_paths())) == 15
assert len({p.resolve() for p in service.approved_paths()}) == 15
# Scan only the explicit candidates. Field names and boolean tokenPresent are not secrets.
secret = re.compile(r'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:sk-ant-|sk-proj-|ghp_|github_pat_)[A-Za-z0-9_-]{16,}|\bBearer\s+[A-Za-z0-9._~-]{20,}|(?:WOS_AGENT_TOKEN|api[_-]?key|access[_-]?token|password)\s*[=:]\s*["\x27]?[A-Za-z0-9_./+~-]{20,}', re.I)
for p in new:
    assert p.is_file() and not any(x.is_symlink() for x in [p, *p.parents]), p
    assert not secret.search(p.read_text()), f'Possible sensitive value in {p.name}'

def hashes():
    return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in service.approved_paths()}
before = hashes()
sections = service.load_approved_sections()
assert {s[0] for s in sections} == set(service.approved_paths())
old_sections = [s for s in sections if s[0] in originals]
assert old_sections == baseline.load_approved_sections(), 'Original source sections changed'
queries = [
    'integration specification dedicated specialist capability evidence grant prefix',
    'evidence contract request_id requested_by source_scope proposed future request',
    'implementation log continuation defects corrected compiler execution failure',
    'README launch.sh scratch workspace separate app data',
    'Liam profile bridge grants technically enforced Safe Write Edit read-only',
    'launcher permissions outsideGrant missingToken otherWorkspace',
    'live launch requestedProvider requestedModel reportedMeta costUsd',
    'live bridge response schema ada.evidence_response.v0.1 integrity sources',
    'live Liam response paraphrase my summary not quotation unresolved question',
]
observed = []
for path, question in zip(new, queries):
    response = service.research(question)
    wire = subprocess.run(['/Library/Frameworks/Python.framework/Versions/3.14/bin/python3', '-B', '-E', '-s', str(ADA / 'ada_workspace_adapter_v01.py')], input=json.dumps({'question':question}), text=True, capture_output=True, timeout=12)
    assert wire.returncode == 0, wire.stderr
    assert json.loads(wire.stdout) == response, 'Installed adapter changed the retrieval response'
    assert response['answer'] is None and response['semantic_support'] == 'UNRESOLVED'
    assert response['status'] == 'RETRIEVAL_ONLY' and response['schema'] == 'ada.evidence_response.v0.1'
    assert any(Path(s['path']) == path for s in response['sources']), (path.name, [s['path'] for s in response['sources']])
    for s in response['sources']:
        assert s['integrity']['status'] == 'VERIFIED_MATCH'
        if Path(s['path']) in new:
            assert s['record_kind'] and s['record_note']
    observed.append({'file':str(path), 'question':question, 'retrieved':True})
# Original retrieval algorithm and source text remain identical when scoped to the old corpus.
for path in originals:
    query = path.stem.replace('_', ' ')
    assert service.ada.retrieve(query, old_sections) == baseline.ada.retrieve(query, baseline.load_approved_sections())
    response = service.research(query)
    assert any(Path(s['path']) == path for s in response['sources']), f'Old source not retrievable: {path}'
    for s in response['sources']:
        assert s['integrity']['status'] == 'VERIFIED_MATCH'
assert before == hashes(), 'Approved content changed during checks'
print(json.dumps({'originalSources':6,'newSources':9,'exactAllowlist':True,'sensitivePatternScan':'no matches; supplemented by manual review','originalSectionsIdentical':len(old_sections),'oldSourcesRetrievable':6,'sourceContentsUnchanged':True,'installedAdapterNewRecordChecks':9,'newRetrieval':observed},indent=2))
