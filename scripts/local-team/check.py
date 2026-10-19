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
    def fixture(self,stage,persona,prompt,directory=Path('.')):
        values={'specialist':{'code':'def solve(value):\n    return sum(value)'},'review':{'decision':self.decision,'reason':'Fixture independent review'},'handover':{'summary':'Fixture handover','limitations':'Supplied checks only'}}
        result=values[stage];r.atomic(directory/(stage+'.raw.json'),{'fixture':True,'response':json.dumps(result)});r.atomic(directory/(stage+'.json'),result)
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

    def test_precise_saved_failure_diagnostics(self):
        saved=self.previous/'.workspace-os/liam-app-data/local-team'
        first=(saved/'bg-mvey334q-dwptl6/candidate.py').read_text()
        latest=(saved/'bg-mvey7aeh-dl4ln8/candidate.py').read_text()
        errors=r.POLICY.validate(first)
        self.assertEqual(errors,[]) # Approved exact-set operation; old failure artifacts remain unchanged.
        self.assertEqual(r.POLICY.validate(latest)[0]['kind'],'SYNTAX')
        self.assertEqual(r.POLICY.validate('print(1)')[0]['kind'],'FUNCTION_STRUCTURE')
        with patch.object(r.subprocess,'Popen') as process:
            self.assertFalse(r.execute(latest,[{'input':[],'expected':[]}])['executed'])
            process.assert_not_called()

    def test_exact_set_add_boundary(self):
        code='def solve(value):\n    seen=set()\n    result=seen.add(value)\n    return [list(seen), result]'
        self.assertTrue(r.execute(code,[{'input':3,'expected':[[3],None]}])['passed'])
        for expression in ['[].add(1)','{}.add(1)','"x".add(1)','set.add(1)']:
            code='def solve(value):\n    return '+expression
            self.assertEqual(r.POLICY.validate(code),[])
            result=r.execute(code,[{'input':0,'expected':None}])
            self.assertFalse(result['passed']);self.assertIn('SET_ADD_RECEIVER',result['checks'][0]['error'])
        for expression in ['set().add','set().add()','set().add(1,2)','set().add(item=1)',
                           'set().add(*value)','set().add(**value)','set().remove(1)',
                           '_checked_set_add(set(),1)','getattr(set(),"add")(1)']:
            self.assertTrue(r.POLICY.validate('def solve(value):\n    return '+expression),expression)
        class Pretender:
            def add(self,item):raise AssertionError('Must not dispatch custom add')
        class Subset(set):pass
        for obj in [Pretender(),Subset()]:
            with self.assertRaisesRegex(ValueError,'SET_ADD_RECEIVER'):r.POLICY._checked_set_add(obj,1)
        # Side effects prove receiver and item expressions are each evaluated once.
        code='def solve(value):\n    sets=[set()]\n    marks=[]\n    result=sets[marks.append(1) or 0].add(marks.append(2))\n    return [marks,len(sets[0]),result]'
        self.assertTrue(r.execute(code,[{'input':0,'expected':[[1,2],1,None]}])['passed'])
        code='def solve(value):\n    method=set().add\n    return method(value)'
        self.assertTrue(r.POLICY.validate(code))

    def test_two_repairs_preserve_every_candidate(self):
        self.decision='approve';calls=[]
        candidates=['l=[[];', 'def solve(value):\n    return set(value).remove(1)', 'def solve(value):\n    return sum(value)']
        def model(stage,persona,prompt,directory=Path('.')):
            if stage!='specialist':return self.fixture(stage,persona,prompt,directory)
            code=candidates[len(calls)];calls.append(prompt)
            r.atomic(directory/'specialist.raw.json',{'fixture':True,'response':code})
            return {'code':code}
        with patch.object(r,'generate',side_effect=model),patch.object(r,'local_request',return_value={'models':[{'name':r.MODEL,'digest':r.DIGEST}]}):
            result=r.run({'task':{'description':'Sum list','cases':[{'input':[1,2,3],'expected':6}],'reviewCriteria':''},'profiles':{k:{'persona':k} for k in ['specialist','reviewer','continuity']}})
        self.assertEqual(result,0);self.assertEqual(len(calls),3)
        self.assertIn('SYNTAX',calls[1]);self.assertIn('CALL_POLICY',calls[2])
        for i,code in enumerate(candidates):self.assertEqual(Path(f'attempts/attempt-{i}/candidate.py').read_text(),code)
        self.assertFalse(Path('attempts/attempt-0/execution.json').exists())
        self.assertEqual(json.loads(Path('state.json').read_text())['accepted_attempt'],2)

    def test_repair_budget_and_cancellation(self):
        request={'task':{'description':'Sum','cases':[{'input':[1],'expected':1}],'reviewCriteria':''},'profiles':{k:{'persona':k} for k in ['specialist','reviewer','continuity']}}
        def invalid(stage,persona,prompt,directory=Path('.')):
            self.assertEqual(stage,'specialist');return {'code':'print(1)'}
        with patch.object(r,'generate',side_effect=invalid) as model,patch.object(r,'local_request',return_value={'models':[{'name':r.MODEL,'digest':r.DIGEST}]}):
            self.assertEqual(r.run(request),1);self.assertEqual(model.call_count,3)
        self.assertFalse(Path('review.json').exists());self.assertEqual(len(list(Path('attempts').iterdir())),3)
        with tempfile.TemporaryDirectory() as fresh:
            os.chdir(fresh)
            with patch.object(r,'generate',side_effect=KeyboardInterrupt()) as model,patch.object(r,'local_request',return_value={'models':[{'name':r.MODEL,'digest':r.DIGEST}]}):
                self.assertEqual(r.run(request),1);self.assertEqual(model.call_count,1)
                self.assertEqual(json.loads(Path('state.json').read_text())['status'],'cancelled')

if __name__=='__main__':unittest.main(verbosity=2)
