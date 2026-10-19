"""Real sandbox + installed ledger checks, deterministic model fixtures (no inference)."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('runner',Path(__file__).with_name('run.py'))
r=importlib.util.module_from_spec(spec);spec.loader.exec_module(r)

class Checks(unittest.TestCase):
    def setUp(self):
        self.previous=Path.cwd();self.tmp=tempfile.TemporaryDirectory(prefix='local-team-check-');os.chdir(self.tmp.name)
    def tearDown(self):
        os.chdir(self.previous);self.tmp.cleanup()
    def test_execution_and_independent_failure(self):
        code='def solve(value):\n    return sum(value)'
        self.assertTrue(r.execute(code,[{'input':[1,2,3],'expected':6}])['passed'])
        self.assertFalse(r.execute(code,[{'input':[1,2,3],'expected':7}])['passed'])
    def test_denied_generated_code(self):
        for code in ['import os\ndef solve(value): return 1','def solve(value): return open(value).read()',
                     'def solve(value): return value.__class__','def solve(value): return eval(value)',
                     'def solve(value): return solve(value)','def solve(value):\n    while True: pass']:
            with self.subTest(code=code):self.assertFalse(r.execute(code,[{'input':'x','expected':1}])['passed'])
    def test_os_boundary_not_just_ast(self):
        sentinel=Path(self.tmp.name)/'private-sentinel';sentinel.write_text('not worker readable')
        probes=["open("+repr(str(sentinel))+").read()", "open("+repr(str(Path(self.tmp.name)/'forbidden'))+",'w').write('x')",
                "__import__('socket').create_connection(('127.0.0.1',11434),1)","__import__('os').fork()"]
        for probe in probes:
            with self.subTest(probe=probe):
                p=subprocess.run(['/usr/bin/sandbox-exec','-p',r.sandbox_profile(),r.PYTHON,'-I','-B','-c',probe],capture_output=True,text=True,timeout=5,env={'PATH':'/usr/bin:/bin','HOME':self.tmp.name})
                self.assertNotEqual(p.returncode,0)
                self.assertIn('Operation not permitted',p.stderr)
        self.assertFalse((Path(self.tmp.name)/'forbidden').exists())
    def test_ruflo_persistence(self):
        result=r.ledger('task_create',{'type':'test','description':'Disposable task'})
        task_id=result['taskId']
        self.assertEqual(r.ledger('task_status',{'taskId':task_id})['status'],'pending')
        r.ledger('task_update',{'taskId':task_id,'status':'in_progress'})
        r.ledger('task_complete',{'taskId':task_id,'result':{'evidence':'fixture'}})
        self.assertEqual(r.ledger('task_status',{'taskId':task_id})['result'],{'evidence':'fixture'})
    def fixture(self,stage,persona,prompt):
        values={'specialist':{'code':'def solve(value):\n    return sum(value)'},'review':{'decision':self.decision,'reason':'Fixture independent review'},'handover':{'summary':'Fixture handover','limitations':'Supplied checks only'}}
        result=values[stage];r.atomic(stage+'.raw.json',{'fixture':True,'response':json.dumps(result)});r.atomic(stage+'.json',result)
        return result
    def attempt(self,decision='approve',expected=6):
        self.decision=decision
        request={'task':{'description':'Sum list','cases':[{'input':[1,2,3],'expected':expected}],'reviewCriteria':''},'profiles':{role:{'persona':role} for role in ['specialist','reviewer','continuity']}}
        with patch.object(r,'local_request',return_value={'models':[{'name':r.MODEL,'digest':r.DIGEST}]}),patch.object(r,'generate',side_effect=self.fixture):
            code=r.run(request)
        return code,json.loads(Path('state.json').read_text())
    def test_approved_evidence_and_handover(self):
        code,state=self.attempt();self.assertEqual(code,0);self.assertEqual(state['status'],'completed')
        for name,sha in state['evidence'].items():self.assertEqual(r.digest(name),sha)
        self.assertEqual(len(state['dependencies']),2)
    def test_review_rejection_blocks_handover(self):
        code,state=self.attempt('reject');self.assertEqual(code,1);self.assertEqual(state['status'],'rejected')
        self.assertFalse(Path('handover.raw.json').exists())
        self.assertNotEqual(r.ledger('task_status',{'taskId':state['tasks']['review']})['status'],'completed')
    def test_failure_blocks_review(self):
        code,state=self.attempt(expected=7);self.assertEqual(code,1);self.assertEqual(state['status'],'failed')
        self.assertFalse(Path('review.raw.json').exists())
    def test_unavailable_model_no_fallback(self):
        with patch.object(r,'local_request',return_value={'models':[]}),patch.object(r,'generate') as model:
            self.assertEqual(r.run({'task':{},'profiles':{}}),1);model.assert_not_called()

if __name__=='__main__':unittest.main(verbosity=2)
