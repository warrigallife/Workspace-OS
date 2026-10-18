"""Ada evidence service v0.3: approved-source retrieval prototype."""
from pathlib import Path
import ada_v04 as ada
import ada_evidence_checker_v02 as checker

SCHEMA = "ada.evidence_response.v0.1"

APPROVED_SOURCES = (
    "governance/GOVERNANCE_CONSTITUTION_v0.1_DRAFT.md",
    "governance/AGENT_CONTRACT_v0.1_DRAFT.md",
    "governance/OPERATIONAL_HANDOVER_PROTOCOL_v0.1_DRAFT.md",
    "WORKFORCE_FINDINGS.md",
    "dev-team/STATUS.md",
)

APPROVED_REPORT = (
    Path.home() / "Desktop/WARRIGAL RESEARCH SUITE/docs/reports/"
    "WARRIGAL_REPOSITORY_RECONCILIATION_2026-10-18.md"
)

# Explicit individual files only. No directory traversal or discovery.
# Record labels describe provenance, not semantic validation or adoption.
INTEGRATION_DOCS = Path.home() / "Desktop/Workspace-OS/docs/liam-ada"
INTEGRATION_SOURCES = (
    (ada.ROOT / "ada/ADA_WORKSPACE_OS_INTEGRATION_SPEC_v0.1_DRAFT.md",
     "draft_specification", "Historical proposal; DRAFT, not adopted. Implementation status may be superseded by the implementation log."),
    (ada.ROOT / "ada/ADA_WORKSPACE_OS_EVIDENCE_CONTRACT_v0.1_DRAFT.md",
     "draft_contract", "Historical interface proposal; DRAFT, not adopted. Proposed fields and historical implementation status are not current facts."),
    (INTEGRATION_DOCS / "implementation-log.md",
     "implementation_record", "Authoritative integration implementation-log copy; distinguish dated historical entries from later updates. Recorded claims are not semantic validation."),
    (INTEGRATION_DOCS / "README.md",
     "operating_instructions", "Local usage instructions and documented limitations; not governance adoption."),
    (Path.home() / ".claude/agents/liam.md",
     "saved_profile", "Saved persona instructions; broader tool permissions are determined by the launcher, not persona prose."),
    (INTEGRATION_DOCS / "launcher-permissions.json",
     "test_observation", "Recorded launcher permission probe; an observation of that test, not a universal security guarantee."),
    (INTEGRATION_DOCS / "live-launch.json",
     "test_observation", "Recorded launch metadata; model identities are provider-reported, not independently verified."),
    (INTEGRATION_DOCS / "live-bridge-response.json",
     "test_observation", "Historical raw bridge response containing source excerpts; not a fresh query or proof of semantic truth."),
    (INTEGRATION_DOCS / "live-liam-response.md",
     "agent_interpretation", "Historical model response used to observe quotation formatting; paraphrases are interpretations, not independently verified facts."),
)


def approved_paths():
    return tuple(ada.ROOT / name for name in APPROVED_SOURCES) + (
        APPROVED_REPORT,
    ) + tuple(path for path, _, _ in INTEGRATION_SOURCES)

def load_approved_sections():
    sections = []
    for path in approved_paths():
        if path.is_symlink() or not path.is_file():
            continue
        try:
            lines = path.read_text(encoding="utf-8").splitlines()
        except (OSError, UnicodeError):
            continue
        for offset in range(0, len(lines), 12):
            start = offset + 1
            end = min(offset + 18, len(lines))
            excerpt = "\n".join(
                f"{i}: {lines[i-1]}" for i in range(start, end + 1)
            )
            terms = ada.tokens(excerpt)
            sections.append((path, start, end, excerpt, terms))
    return sections

def research(question):
    approved = approved_paths()
    evidence = ada.retrieve(question, load_approved_sections())
    sources = []
    for number, record in enumerate(evidence, 1):
        integrity = checker.verify_excerpt(record, approved)
        source = {
            "id": number,
            "path": str(record[0]),
            "lines": [record[1], record[2]],
            "excerpt": record[3],
            "integrity": integrity,
        }
        for source_path, kind, note in INTEGRATION_SOURCES:
            if record[0] == source_path:
                source["record_kind"] = kind
                source["record_note"] = note
                break
        sources.append(source)
    return {
        "schema": SCHEMA,
        "question": question,
        "sources": sources,
        "answer": None,
        "semantic_support": "UNRESOLVED",
        "status": "RETRIEVAL_ONLY",
    }
