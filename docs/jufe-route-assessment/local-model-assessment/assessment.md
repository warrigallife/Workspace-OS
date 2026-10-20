# Existing local models and hardware — 2026-10-20

Continued from 9b99d73, reusing the 2026-10-17 Warrigal software inventory and existing role evaluation. No broad home-directory discovery, credentials, archive traversal, symlink following, inference or runtime-setting changes.

## Hardware snapshot

Apple M3 Pro, Mac15,6; hw.memsize 19,327,352,832 bytes = 18 GiB unified RAM. Data volume reports 240 GiB available (460 GiB volume). vm_stat snapshot: 5,050 free pages at 16,384 bytes (~79 MiB immediately free), 386,967 inactive pages (~5.90 GiB), 127,696 file-backed pages (~1.95 GiB), 152,459 compressor pages (~2.33 GiB). Categories overlap and must not be added as independent available memory. Later memory_pressure -Q reported system-wide memory free percentage 67%; this is an OS pressure/reclaimability indicator, not 12 GiB guaranteed allocatable. Swap snapshot: 7,682.25 MiB used of 9,216 MiB (~7.50 GiB used). These are changing snapshots, not peak-load measurements. Do not infer current pressure solely from accumulated swap. Before evaluation, check headroom again; quitting unneeded applications may help but none were closed here.

## Targeted locations and findings

- ~/.ollama/models: completed manifests for llama3.2:latest (2,019,377,376-byte model blob) and all-minilm:22m / Xenova/all-MiniLM-L6-v2:latest (45,949,216-byte embedding layers). Only completed generative model is the previously evaluated Llama 3.2. Embedders cannot perform this generation/review benchmark.
- Model blob scan also found sha256-1329cd5ab37e5ef6faef37cd8ff8660ffc96ed5b47b34fddf8eb0912e6c82466-partial. Logical size 6,140,392,672 bytes; 16 partial receipts total only 399,905,683 completed bytes (~6.5%). Bounded GGUF header inspection reports architecture qwen3vl, parameter_count 8,767,123,696. No completed manifest references it. Exact model tag/completeness cannot be inferred from the header alone. It is not a usable downloaded alternative; do not attempt loading or silently resume it. Left untouched.
- Existing /opt/homebrew/Cellar/llama.cpp/0.4.1 and /opt/homebrew/share/llama.cpp: no weight files found. Binaries alone do not supply a model.
- Known downloaded repository roots ~/Desktop/AI-Agent-Resources and ~/Desktop/AI-Agent-Research: six small RuView ONNX/safetensors files (666–507,032 bytes) in person-count/pose-estimation artifacts and tests; no generative LLM weights. No model files in AI-Agent-Research. Dependency/build/archive/config/credential trees excluded.
- Absent checked stores: ~/.cache/huggingface/hub, ~/.cache/lm-studio/models, ~/.lmstudio/models, ~/Library/Caches/llama.cpp, ~/Models, ~/Desktop/models, ~/Library/Application Support/nomic.ai/GPT4All, ~/Library/Application Support/Jan/data/models, ~/.cache/gpt4all, ~/.cache/mlx, ~/.jan/models.
- Documents and Downloads: no matching model files. No current-process OLLAMA_MODELS override. This is not proof that no custom daemon store or unlisted location exists. No inaccessible checked locations were reported; the sandbox initially denied hardware sysctl, which succeeded under approved read-only escalation.

No suitable *alternative completed* generative model was found. Llama 3.2 is compatible but already failed the frozen benchmark; repeating it would not evaluate a replacement. **Zero inference calls** made this turn.

## One proposed download — requires approval

Propose `qwen2.5:7b-instruct-q4_K_M` through existing Ollama: 7.62B parameters, Q4_K_M, catalog size 4.7 GB, Apache-2.0. Official tag page: https://ollama.com/library/qwen2.5:7b-instruct-q4_K_M (checked this turn). The publisher documents instruction following, table understanding and structured JSON output as capabilities, not as verified success on our benchmark. Uses the existing local chat interface; no additional framework required.

Rationale: a larger instruction-tuned text model addresses the observed instruction/semantic failures while keeping weights materially smaller than total unified RAM. Disk is sufficient. Runtime memory includes context/KV cache and application overhead beyond the 4.7 GB file; exact resident usage and speed have not been measured. Plausible on 18 GiB, not guaranteed under current competing workloads. It is a candidate for evaluation, not a promised fix or the newest/best model claim.

Proposed approval scope: download this one tag only; then evaluate the same frozen four requests/criteria (substitute only model identity and verify digest), no expected-label exposure, at most four local calls, no retries. Keep the existing 2,048 output-token and 16,384-context settings. Do not change Workspace OS's pinned runtime model or permissions. No download/resume/inference performed now. Public documentation lookup only; no cloud inference or source-record upload.
