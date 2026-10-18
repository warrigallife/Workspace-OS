"""Stable IDs and bounded snapshot lookup for exactly Ada's existing sources."""
import hashlib
from pathlib import Path
import ada_evidence_service_v03 as service

MAX_LINES = 80
MAX_LINE_NUMBER = 100000
MAX_EXCERPT_BYTES = 32768
MAX_SOURCE_BYTES = 2 * 1024 * 1024

class LookupFailure(Exception):
    """A fixed public error code, never a filesystem error/credential dump."""


def approved_records():
    root = service.ada.ROOT
    docs = service.INTEGRATION_DOCS
    records = {
        'governance-constitution': root / 'governance/GOVERNANCE_CONSTITUTION_v0.1_DRAFT.md',
        'agent-contract': root / 'governance/AGENT_CONTRACT_v0.1_DRAFT.md',
        'operational-handover': root / 'governance/OPERATIONAL_HANDOVER_PROTOCOL_v0.1_DRAFT.md',
        'workforce-findings': root / 'WORKFORCE_FINDINGS.md',
        'dev-team-status': root / 'dev-team/STATUS.md',
        'warrigal-reconciliation': service.APPROVED_REPORT,
        'integration-spec': root / 'ada/ADA_WORKSPACE_OS_INTEGRATION_SPEC_v0.1_DRAFT.md',
        'evidence-contract': root / 'ada/ADA_WORKSPACE_OS_EVIDENCE_CONTRACT_v0.1_DRAFT.md',
        'implementation-log': docs / 'implementation-log.md',
        'integration-readme': docs / 'README.md',
        'liam-profile': Path.home() / '.claude/agents/liam.md',
        'launcher-permissions': docs / 'launcher-permissions.json',
        'live-launch': docs / 'live-launch.json',
        'live-bridge-response': docs / 'live-bridge-response.json',
        'live-liam-response': docs / 'live-liam-response.md',
    }
    # Fail closed if code/config drifts; this registry may not widen the allowlist.
    if len(records) != 15 or len(set(records.values())) != 15 or set(records.values()) != set(service.approved_paths()):
        raise LookupFailure('REGISTRY_MISMATCH')
    return records


def annotate_query(response):
    by_path = {str(path): record_id for record_id, path in approved_records().items()}
    for source in response['sources']:
        source['record_id'] = by_path[source['path']]
    return response


def lookup(record_id, start_line, end_line):
    records = approved_records()
    if not isinstance(record_id, str) or record_id not in records:
        raise LookupFailure('UNKNOWN_RECORD')
    if (type(start_line) is not int or type(end_line) is not int or
            not 1 <= start_line <= end_line <= MAX_LINE_NUMBER or
            end_line - start_line + 1 > MAX_LINES):
        raise LookupFailure('INVALID_RANGE')
    path = records[record_id]
    try:
        if path.is_symlink() or not path.is_file():
            raise LookupFailure('SOURCE_UNAVAILABLE')
        with path.open('rb') as source_file:
            raw = source_file.read(MAX_SOURCE_BYTES + 1)
    except OSError:
        raise LookupFailure('SOURCE_UNAVAILABLE') from None
    if len(raw) > MAX_SOURCE_BYTES:
        raise LookupFailure('SOURCE_TOO_LARGE')
    try:
        lines = raw.decode('utf-8').splitlines()
    except UnicodeError:
        raise LookupFailure('SOURCE_UNAVAILABLE') from None
    if end_line > len(lines):
        raise LookupFailure('RANGE_OUT_OF_BOUNDS')
    excerpt = '\n'.join(f'{i}: {lines[i - 1]}' for i in range(start_line, end_line + 1))
    if len(excerpt.encode('utf-8')) > MAX_EXCERPT_BYTES:
        raise LookupFailure('EXCERPT_TOO_LARGE')
    source = {
        'id': 1, 'record_id': record_id, 'path': str(path),
        'lines': [start_line, end_line], 'excerpt': excerpt, 'total_lines': len(lines),
        'source_sha256': hashlib.sha256(raw).hexdigest(),
        'integrity': {'status': 'VERIFIED_MATCH', 'source': str(path),
                      'lines': [start_line, end_line], 'basis': 'bounded_source_snapshot'},
    }
    for approved_path, kind, note in service.INTEGRATION_SOURCES:
        if path == approved_path:
            source.update(record_kind=kind, record_note=note)
            break
    return {
        'schema': service.SCHEMA, 'question': None,
        'lookup': {'record_id': record_id, 'start_line': start_line, 'end_line': end_line},
        'sources': [source], 'answer': None,
        'semantic_support': 'UNRESOLVED', 'status': 'RETRIEVAL_ONLY',
    }
