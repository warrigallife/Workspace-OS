# Internet-session download checklist

Planning only — **nothing approved, downloaded or installed by this checklist**. Based on saved inventories and the [local hardware/model assessment](local-model-assessment/assessment.md).

## 1. Qwen2.5 7B — awaiting approval and download; benchmark suitability unverified

- **Exact identifier:** `qwen2.5:7b-instruct-q4_K_M`; approximately **4.7 GB**, 7.62B parameters, Apache-2.0. [Official source](https://ollama.com/library/qwen2.5:7b-instruct-q4_K_M).
- **Purpose:** evaluate a replacement for Llama 3.2 on source-grounded generation and semantic review. No automatic Workspace OS model switch.
- **Resources:** recorded M3 Pro / 18 GiB unified RAM / 240 GiB free disk. Allow at least 4.7 GB for weights; keeping 10 GB free is a conservative staging allowance, not a publisher requirement. Runtime RAM exceeds weight size because of context/KV cache and overhead; exact requirement unknown. Recorded swap use was ~7.5 GiB: recheck headroom before testing. Do not run competing models.

**Commands for a later approved session only** (do not run `ollama run`, which would start unbudgeted inference):

```sh
# Read-only preflight: avoid downloading an already-present model.
/usr/local/bin/ollama list
df -h "$HOME"
sysctl hw.memsize vm.swapusage
memory_pressure -Q

# ONLY after explicit download approval:
/usr/local/bin/ollama pull qwen2.5:7b-instruct-q4_K_M

# Metadata verification; no inference:
/usr/local/bin/ollama show qwen2.5:7b-instruct-q4_K_M --verbose
curl --noproxy '*' --fail --silent --show-error http://127.0.0.1:11434/api/tags
```

Require successful pull completion; verify the exact tag, parameter count, Q4_K_M quantisation and nonzero size. Save the complete returned digest and pin it for evaluation; do not reuse the Llama digest or assume a mutable tag is unchanged. If already present, verify it first and skip the pull. No installation/upgrade needed.

**Then, only with evaluation approval:** use the [frozen criteria](role-evaluation/criteria.md) and four saved `*-request.json` files in [role-evaluation](role-evaluation/). Preserve prompts, schemas, candidate ordering and options; change only model identity and pin its verified digest. Save into a new evidence folder. One Dana call plus three independent Nora calls; maximum four total, no retries, 2,048 output tokens, 16,384 context, temperature 0. Withhold fixture answers from Dana and verdict labels/rationales from Nora. Retain raw outputs; score exact quotations separately from semantic support. Stop after budget/failure; no prompt experiments. The current `scripts/research/evaluate-roles.mjs` is pinned to Llama and an already-used folder: **do not rerun it unchanged**. Preparing an isolated replay requires no production runtime changes.

## 2. Optional future candidates already documented — not required downloads

| Candidate | Possible purpose / prerequisite | Known size / status |
| --- | --- | --- |
| Existing Qwen3-VL partial | Only if a separate vision-language need is approved; identify exact tag and full package first | Partial logical file 6.14 GB, receipts ~400 MB complete. Total package unknown. **Leave untouched; no resume/delete.** |
| Whisper model weights | Local transcription, if requested; choose language/accuracy target and check existing weights first | Size/model unknown; whisper.cpp binaries already installed. Not needed for this benchmark. |
| Separate llama.cpp GGUF weights | Alternative executor only if Ollama is unsuitable; select compatible model/template and avoid duplicate weights | Size/model unknown; llama.cpp already installed, no complete weights found in checked locations. Not required now. |
| OpenCode executor | Previously documented Agentic Kit route option; only after a concrete executor need and permission review | Download size unknown; absent at previously checked paths. Does not itself solve model-quality failures. |
| Goose executor | the-gibson's architecture candidate; needs a verified runtime spike and scoped-tool design | Size/install status unverified; architecture notes are not runtime proof. Not required now. |

**Already present — do not download twice:** Workspace OS, Ruflo, Agentic Kit, Ollama, llama.cpp and whisper.cpp binaries; `llama3.2:latest` (~2.02 GB weights, failed benchmark); both MiniLM embedding entries (~46 MB model layer, not generators). CoWork-OS, DeepNote-AI and all seven AI-Agent-Resources repositories are already downloaded; these source checkouts are not a dependency shopping list. RuView's tiny sensing/test weights cannot replace a language model.

Current blocker: no suitable completed alternative local model found; Llama 3.2 failed generation and semantic-review criteria. **Next action: obtain approval for the single Qwen2.5 download and bounded evaluation.** No cloud inference, runtime permission/model changes, archive edits or partial-file cleanup.
