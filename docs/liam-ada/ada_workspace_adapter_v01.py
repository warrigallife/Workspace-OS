"""Workspace OS adapter: bounded JSON input, retrieval-only output."""
import json
import sys

def main():
    raw = sys.stdin.buffer.read(8193)
    if len(raw) > 8192:
        raise ValueError("request too large")
    request = json.loads(raw)
    if not isinstance(request, dict) or set(request) != {"question"}:
        raise ValueError("expected only question")
    question = request["question"]
    if not isinstance(question, str) or not question.strip():
        raise ValueError("question must be nonempty text")
    if len(question.encode("utf-8")) > 4000:
        raise ValueError("question too large")
    import ada_evidence_service_v03 as service
    response = service.research(question)
    output = json.dumps(response, ensure_ascii=True, allow_nan=False)
    if len(output.encode("utf-8")) > 262144:
        raise ValueError("response too large")
    sys.stdout.write(output + "\n")

if __name__ == "__main__":
    try:
        main()
    except Exception:
        sys.stderr.write("Ada adapter failed: invalid request or backend failure\n")
        sys.exit(1)
