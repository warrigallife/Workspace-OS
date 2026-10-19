"""Untrusted candidate evaluation. OS sandbox + AST/builtin limits; no model tools."""
import ast
import builtins
import json
import resource
import sys
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

class CandidateInvalid(ValueError):
    def __init__(self, diagnostics):
        self.diagnostics = diagnostics
        super().__init__(json.dumps(diagnostics))

def policy_prompt():
    return ("WORKER CONTRACT (authoritative, generated from its allowlists):\n"
            "Write valid Python, exactly one top-level def solve(value) with one positional argument; "
            "no annotations, defaults, decorators, nested functions or top-level expressions.\n"
            "Callable builtins: " + ', '.join(sorted(SAFE)) + ".\n"
            "Permitted methods: " + ', '.join(sorted(METHODS)) + ". No other calls or attributes. "
            "In particular .remove(), .sort(), dict.fromkeys(), print(), imports and recursion are denied. "
            "Special case: receiver.add(item) is allowed ONLY on an exact builtin set, with one positional argument and no keywords or starred arguments. Extracting .add as a value is denied. List membership (in/not in) and list.append() are available.\n"
            "Permitted AST constructs/operators: " + ', '.join(n.__name__ for n in ALLOWED) + ".\n"
            "Names starting with _ and assignments to builtin names are denied. Maximum 12000 source characters / 500 AST nodes. "
            "No while, try, with, classes, lambda, I/O or shell. Do not output JavaScript/C braces or pseudocode. "
            "Return a JSON object with one code string containing the entire function, using normal newline escaping.")

def is_set_add_call(node):
    return (isinstance(node,ast.Call) and isinstance(node.func,ast.Attribute)
            and node.func.attr=='add' and len(node.args)==1
            and not isinstance(node.args[0],ast.Starred) and not node.keywords)

def _checked_set_add(receiver, item):
    if type(receiver) is not set:
        raise ValueError('SET_ADD_RECEIVER: .add requires an exact builtin set')
    return set.add(receiver,item)

class _SetAddTransformer(ast.NodeTransformer):
    def visit_Call(self,node):
        node=self.generic_visit(node)
        if is_set_add_call(node):
            return ast.copy_location(ast.Call(func=ast.Name(id='_checked_set_add',ctx=ast.Load()),
                                               args=[node.func.value,node.args[0]],keywords=[]),node)
        return node

def validate(code):
    def diagnostic(kind, message, node=None, line=None, column=None):
        return {'kind':kind,'message':message,'line':line or getattr(node,'lineno',None),
                'column':column or (getattr(node,'col_offset',-1)+1 or None)}
    if not isinstance(code,str) or not code.strip() or len(code)>12000:
        return [diagnostic('SOURCE_LIMIT','Expected nonempty Python source, at most 12000 characters')]
    try:
        tree=ast.parse(code)
    except SyntaxError as exc:
        return [diagnostic('SYNTAX',exc.msg+'; supply a complete valid Python def solve(value).',line=exc.lineno,column=exc.offset)]
    if len(list(ast.walk(tree)))>500:return [diagnostic('AST_LIMIT','At most 500 AST nodes')]
    if len(tree.body)!=1 or not isinstance(tree.body[0],ast.FunctionDef):
        return [diagnostic('FUNCTION_STRUCTURE','Exactly one top-level def solve(value) is required')]
    fn=tree.body[0]
    if fn.name!='solve' or fn.decorator_list or fn.returns or fn.args.defaults or fn.args.kw_defaults or fn.args.vararg or fn.args.kwarg or fn.args.kwonlyargs or fn.args.posonlyargs or len(fn.args.args)!=1 or fn.args.args[0].annotation:
        return [diagnostic('FUNCTION_STRUCTURE','Expected solve with one positional argument, no annotations/defaults/decorators',fn)]
    approved_add_attributes={id(n.func) for n in ast.walk(tree) if is_set_add_call(n)}
    errors=[]
    for n in ast.walk(tree):
        kind=message=None
        if not isinstance(n,ALLOWED):kind,message='SYNTAX_POLICY','Unsupported Python construct: '+type(n).__name__
        elif isinstance(n,ast.FunctionDef) and n is not fn:kind,message='FUNCTION_STRUCTURE','Nested functions denied'
        elif isinstance(n,ast.Name) and (n.id.startswith('_') or isinstance(n.ctx,ast.Store) and n.id in SAFE):kind,message='NAME_POLICY','Reserved name: '+n.id
        elif isinstance(n,ast.Attribute) and n.attr not in METHODS and id(n) not in approved_add_attributes:kind,message='ATTRIBUTE_POLICY','Attribute denied: .'+n.attr
        elif isinstance(n,ast.Call) and not (is_set_add_call(n) or isinstance(n.func,ast.Name) and n.func.id in SAFE or isinstance(n.func,ast.Attribute) and n.func.attr in METHODS):
            kind,message='CALL_POLICY','Call denied: '+ast.unparse(n.func)+'; permitted builtins: '+', '.join(sorted(SAFE))+'; methods: '+', '.join(sorted(METHODS))
        if kind:errors.append(diagnostic(kind,message,n))
        if len(errors)>=8:break
    if not errors:
        try:compile(tree,'<candidate>','exec')
        except SyntaxError as exc:errors.append(diagnostic('SYNTAX',exc.msg,line=exc.lineno,column=exc.offset))
    return errors

def evaluate(code, value):
    errors=validate(code)
    if errors:raise CandidateInvalid(errors)
    tree=ast.fix_missing_locations(_SetAddTransformer().visit(ast.parse(code)))
    scope={'__builtins__':SAFE,'_checked_set_add':_checked_set_add}
    exec(compile(tree,'<candidate>','exec'),scope)
    return scope['solve'](value)

if __name__ == '__main__':
    resource.setrlimit(resource.RLIMIT_CPU, (2, 2))
    resource.setrlimit(resource.RLIMIT_FSIZE, (0, 0))
    resource.setrlimit(resource.RLIMIT_NOFILE, (32, 32))
    # No hard RSS/address-space cap is claimed on macOS.
    data=json.loads(sys.stdin.read(24577))
    result=evaluate(data['code'],data['input'])
    raw=json.dumps(result,allow_nan=False)
    if len(raw.encode())>8192: raise ValueError('Result too large')
    print(raw)
