"""Untrusted candidate evaluation. OS sandbox + AST/builtin limits; no model tools."""
import ast
import builtins
import json
import resource
import sys
resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
# macOS RLIMIT_AS is not reliable; parent also bounds time, input/output and AST size.
SAFE = {k: getattr(builtins, k) for k in ('abs','all','any','bool','dict','enumerate','float','int','len','list','max','min','range','reversed','round','set','sorted','str','sum','tuple','zip')}
METHODS = {'lower','upper','strip','replace','split','join','append','count','items','keys','values','get','isdigit','isalnum','isalpha','startswith','endswith'}
ALLOWED = (ast.Module, ast.FunctionDef, ast.arguments, ast.arg, ast.Return, ast.Assign,
           ast.AugAssign, ast.Expr, ast.If, ast.For, ast.Break, ast.Continue, ast.Pass,
           ast.Name, ast.Load, ast.Store, ast.Constant, ast.List, ast.Tuple, ast.Dict,
           ast.Set, ast.BinOp, ast.UnaryOp, ast.BoolOp, ast.Compare, ast.IfExp,
           ast.Subscript, ast.Slice, ast.Call, ast.keyword, ast.Attribute,
           ast.ListComp, ast.SetComp, ast.DictComp, ast.GeneratorExp, ast.comprehension,
           ast.Add, ast.Sub, ast.Mult, ast.Div, ast.FloorDiv, ast.Mod, ast.USub, ast.UAdd,
           ast.Not, ast.And, ast.Or, ast.Eq, ast.NotEq, ast.Lt, ast.LtE, ast.Gt, ast.GtE,
           ast.In, ast.NotIn, ast.Is, ast.IsNot)

def evaluate(code, value):
    tree = ast.parse(code)
    if len(list(ast.walk(tree))) > 500: raise ValueError('Candidate AST too large')
    if len(tree.body) != 1 or not isinstance(tree.body[0], ast.FunctionDef): raise ValueError('Exactly one solve function required')
    fn = tree.body[0]
    if fn.name != 'solve' or fn.decorator_list or fn.returns or fn.args.defaults or fn.args.kw_defaults or fn.args.vararg or fn.args.kwarg or fn.args.kwonlyargs or fn.args.posonlyargs or len(fn.args.args) != 1 or fn.args.args[0].annotation:
        raise ValueError('Expected def solve(value) without annotations/defaults/decorators')
    for n in ast.walk(tree):
        if not isinstance(n, ALLOWED): raise ValueError('Unsupported Python construct: '+type(n).__name__)
        if isinstance(n, ast.FunctionDef) and n is not fn: raise ValueError('Nested functions denied')
        if isinstance(n, ast.Name) and (n.id.startswith('_') or isinstance(n.ctx, ast.Store) and n.id in SAFE): raise ValueError('Reserved name')
        if isinstance(n, ast.Attribute) and n.attr not in METHODS: raise ValueError('Attribute denied')
        if isinstance(n, ast.Call) and not (isinstance(n.func, ast.Name) and n.func.id in SAFE or isinstance(n.func, ast.Attribute) and n.func.attr in METHODS): raise ValueError('Call denied')
    scope = {'__builtins__': SAFE}
    exec(compile(tree, '<candidate>', 'exec'), scope)
    return scope['solve'](value)

if __name__ == '__main__':
    data=json.loads(sys.stdin.read(24577))
    result=evaluate(data['code'],data['input'])
    raw=json.dumps(result,allow_nan=False)
    if len(raw.encode())>8192: raise ValueError('Result too large')
    print(raw)
