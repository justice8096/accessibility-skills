# Sample Code: Dyslexia & Dyscalculia Support Skills

Demo scripts for running the accessibility skills on your available platforms.

## What's in this folder

| File | Platform | What it does |
|------|----------|-------------|
| `ollama_runner.py` | Ollama (local) | CLI tool that loads YAML prompts and calls Ollama's native API |
| `openai_compatible_demo.py` | Ollama / OpenAI / any compatible API | Loads OpenAI function schemas and runs 5 demo scenarios |
| `n8n_workflow.json` | n8n (local) | Importable workflow with webhook trigger, skill routing, and Ollama backend |
| `chatgpt_prompt_pack.md` | ChatGPT / Codex (free tier) | Copy-paste system prompts for each skill and individual commands |

## Quick start

### 1. Ollama (recommended first demo)

```bash
# Make sure Ollama is running with a model pulled
ollama pull llama3
ollama serve

# Install dependencies
pip install requests pyyaml

# List available commands
python ollama_runner.py --list

# Run context enrichment (dyslexia)
python ollama_runner.py --skill dyslexia --command context-enrichment \
    --param text="The catalyst accelerated the reaction."

# Run range comparison (dyscalculia)
python ollama_runner.py --skill dyscalculia --command range-comparison \
    --param datasets="Class A: 40-95, 72" \
    --param datasets="Class B: 55-88, 68" \
    --param center_type=median

# Try Spanish locale
python ollama_runner.py --skill dyslexia --command context-enrichment \
    --locale es \
    --param text="El catalizador aceleró la reacción."

# Dry run (see the prompts without calling Ollama)
python ollama_runner.py --skill dyslexia --command syllable-highlighter \
    --param text="photosynthesis" --dry-run

# Use a different model
OLLAMA_MODEL=mistral python ollama_runner.py --skill dyscalculia \
    --command proportion-waffle --param items="Agree: 62%"
```

### 2. n8n (best for visual demos)

1. Open n8n (usually http://localhost:5678)
2. Go to **Workflows** → **Import from File**
3. Select `n8n_workflow.json`
4. Activate the workflow
5. Send POST requests to the webhook:

```bash
# Dyslexia: context enrichment
curl -X POST http://localhost:5678/webhook/skill-demo \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "dyslexia",
    "command": "context-enrichment",
    "input": "The catalyst accelerated the reaction.",
    "options": "enrichment_level: moderate"
  }'

# Dyscalculia: elapsed time
curl -X POST http://localhost:5678/webhook/skill-demo \
  -H "Content-Type: application/json" \
  -d '{
    "skill": "dyscalculia",
    "command": "elapsed-time",
    "input": "Start: 10:45, End: 12:20"
  }'
```

The workflow routes to the correct skill, builds the system prompt, calls your local Ollama, and returns the result as JSON.

### 3. OpenAI-compatible API demo

```bash
pip install openai

# With local Ollama (default)
python openai_compatible_demo.py

# With OpenAI API (if you have a paid key)
OPENAI_API_KEY=sk-... OPENAI_BASE_URL=https://api.openai.com/v1 \
    OPENAI_MODEL=gpt-4o python openai_compatible_demo.py
```

This runs 5 pre-built demo scenarios (context enrichment, syllable highlighting, range comparison, proportion waffle, confusion checker) using the OpenAI function-calling format from the build output.

### 4. ChatGPT / Codex (free tier)

Open `chatgpt_prompt_pack.md` and copy-paste one of the prompt packs into a ChatGPT conversation. Three options:

- **Full dyslexia assistant** — all 9 commands in one system prompt
- **Full dyscalculia assistant** — all 8 commands in one system prompt
- **Single-command demos** — focused prompts for context enrichment, range comparison, or confusion checker

No API key needed. Works with the free ChatGPT web interface.

## How the pieces connect

```
source/manifest.json
       │
       ▼  (npm run build)
     dist/
       ├── prompts/         ← ollama_runner.py reads these
       ├── openai/          ← openai_compatible_demo.py reads these
       ├── n8n/             ← n8n_workflow.json mirrors these
       ├── claude-plugin/   ← used by Claude Code directly
       ├── mcp-server/      ← Model Context Protocol server
       └── cli/             ← standalone TypeScript CLI
```

## Locale support

All demos support the 10 built-in locales: en, es, fr, de, ja, zh, ar, pt, ko, hi.

- **ollama_runner.py**: Use `--locale es` flag
- **n8n**: Add `"locale": "es"` to the webhook body
- **openai_compatible_demo.py**: Set locale in the `load_functions()` call
- **ChatGPT**: Use the localized prompt packs from `dist/prompts/{locale}/`
