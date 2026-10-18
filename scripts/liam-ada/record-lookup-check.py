"""Bounded lookup regression checks. Missing/large sources use temporary fixtures."""
import hashlib
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

sys.dont_write_bytecode = True
ADA = Path.home() / 'Desktop/ruflo-test/ada'
sys.path.insert(0, str(ADA))
import ada_workspace_records_v01 as records
PYTHON = '/Library/Frameworks/Python.framework/Versions/3.14/bin/python3'
IDS = {'governance-constitution','agent-contract','operational-handover','workforce-findings',
       'dev-team-status','warrigal-reconciliation','integration-spec','evidence-contract',
       'implementation-log','integration-readme','liam-profile','launcher-permissions',
       'live-launch','live-bridge-response','live-liam-response'}

def wire(value):
    return subprocess.run([PYTHON,'-B','-E','-s',str(ADA/'ada_workspace_adapter_v01.py')],
                          input=value, text=True, capture_output=True, timeout=12)

class LookupChecks(unittest.TestCase):
    def code(self, expected, record_id='implementation-log', start=1, end=1):
        with self.assertRaisesRegex(records.LookupFailure, '^' + expected + '$'):
            records.lookup(record_id,start,end)

    def test_exact_registry_and_existing_sources(self):
        registry=records.approved_records()
        self.assertEqual(set(registry), IDS)
        self.assertEqual(set(registry.values()), set(records.service.approved_paths()))
        for record_id,path in registry.items():
            with self.subTest(record_id=record_id):
                source=records.lookup(record_id,1,1)['sources'][0]
                self.assertEqual(source['excerpt'], '1: '+path.read_text().splitlines()[0])
                self.assertEqual(source['record_id'],record_id)

    def test_log_line_152_via_installed_adapter(self):
        request={'record_id':'implementation-log','start_line':145,'end_line':160}
        before=records.approved_records()['implementation-log'].read_bytes()
        reply=wire(json.dumps(request));self.assertEqual(reply.returncode,0,reply.stderr)
        result=json.loads(reply.stdout);self.assertEqual(result['lookup'],request)
        self.assertIsNone(result['question']);self.assertIsNone(result['answer'])
        self.assertEqual(result['semantic_support'],'UNRESOLVED');self.assertEqual(result['status'],'RETRIEVAL_ONLY')
        source=result['sources'][0];lines=before.decode().splitlines()
        self.assertEqual(source['excerpt'],'\n'.join(f'{i}: {lines[i-1]}' for i in range(145,161)))
        self.assertIn('152: '+lines[151],source['excerpt'])
        self.assertEqual(source['source_sha256'],hashlib.sha256(before).hexdigest())
        self.assertEqual(source['integrity']['basis'],'bounded_source_snapshot')

    def test_unknown_ids(self):
        for value in ['unknown','../implementation-log','/etc/passwd','',None,True,{},[], 'x'*10000]:
            with self.subTest(value=str(value)[:40]):self.code('UNKNOWN_RECORD',value)

    def test_invalid_ranges(self):
        for a,b in [(0,1),(-1,1),(2,1),(1,81),(100001,100001),(True,1),(1,True),('1',1),(1.0,1),(1,None)]:
            with self.subTest(start=a,end=b):self.code('INVALID_RANGE',start=a,end=b)

    def test_registry_drift_fails_closed(self):
        with patch.object(records.service,'approved_paths',return_value=()):
            self.code('REGISTRY_MISMATCH')

    def test_missing_source(self):
        with tempfile.TemporaryDirectory() as tmp:
            with patch.object(records,'approved_records',return_value={'implementation-log':Path(tmp)/'missing'}):
                self.code('SOURCE_UNAVAILABLE')

    def test_fixture_boundaries(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/'fixture'
            with patch.object(records,'approved_records',return_value={'implementation-log':p}):
                p.write_text('line\n'*80)
                self.assertEqual(records.lookup('implementation-log',1,80)['sources'][0]['lines'],[1,80])
                self.code('RANGE_OUT_OF_BOUNDS',start=81,end=81)
                p.write_text('x'*(records.MAX_EXCERPT_BYTES-3))
                self.assertEqual(len(records.lookup('implementation-log',1,1)['sources'][0]['excerpt'].encode()),32768)
                p.write_text('x'*(records.MAX_EXCERPT_BYTES-2));self.code('EXCERPT_TOO_LARGE')
                p.write_text('é'*16383);self.code('EXCERPT_TOO_LARGE')
                p.write_bytes(b'a\n'+b'x'*(records.MAX_SOURCE_BYTES-2))
                self.assertEqual(records.lookup('implementation-log',1,1)['sources'][0]['excerpt'],'1: a')
                p.write_bytes(b'x'*(records.MAX_SOURCE_BYTES+1));self.code('SOURCE_TOO_LARGE')
                p.write_bytes(b'\xff');self.code('SOURCE_UNAVAILABLE')
                p.unlink();p.symlink_to(Path(tmp)/'missing');self.code('SOURCE_UNAVAILABLE')

    def test_adapter_rejects_paths_extra_fields_and_oversized_input(self):
        request={'record_id':'implementation-log','start_line':145,'end_line':160}
        for value in [{**request,'path':'/etc/passwd'},{**request,'question':'x'}, {'record_id':'implementation-log'},[],None]:
            with self.subTest(value=value):self.assertNotEqual(wire(json.dumps(value)).returncode,0)
        self.assertNotEqual(wire('x'*8193).returncode,0)
        for code,request in [('UNKNOWN_RECORD',{'record_id':'unknown','start_line':1,'end_line':1}),
                             ('INVALID_RANGE',{'record_id':'implementation-log','start_line':True,'end_line':1})]:
            result=wire(json.dumps(request));self.assertEqual(result.returncode,0)
            self.assertEqual(json.loads(result.stdout),{'schema':'ada.evidence_error.v0.1','code':code})

if __name__=='__main__':unittest.main(verbosity=2)
