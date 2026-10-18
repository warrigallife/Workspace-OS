"""Workspace OS adapter: bounded JSON input, retrieval-only output."""
import json
import sys

def main():
    raw = sys.stdin.buffer.read(8193)
    if len(raw) > 8192:
        raise ValueError('request too large')
    request = json.loads(raw)
    if not isinstance(request, dict):
        raise ValueError('expected object')
    import ada_workspace_records_v01 as records
    if set(request) == {'question'}:
        question = request['question']
        if not isinstance(question, str) or not question.strip() or len(question.encode('utf-8')) > 4000:
            raise ValueError('invalid question')
        response = records.annotate_query(records.service.research(question))
    elif set(request) == {'record_id', 'start_line', 'end_line'}:
        try:
            response = records.lookup(**request)
        except records.LookupFailure as exc:
            response = {'schema': 'ada.evidence_error.v0.1', 'code': str(exc)}
    else:
        raise ValueError('unexpected request fields')
    output = json.dumps(response, ensure_ascii=True, allow_nan=False)
    if len(output.encode('utf-8')) + 1 > 262144:
        raise ValueError('response too large')
    sys.stdout.write(output + '\n')

if __name__ == '__main__':
    try:
        main()
    except Exception:
        sys.stderr.write('Ada adapter failed: invalid request or backend failure\n')
        sys.exit(1)
