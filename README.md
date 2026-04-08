# Accessibility Skills

Cross-platform accessibility skills for dyslexia and dyscalculia support, with internationalization across 10 locales and sample code for multiple AI platforms.

## What's in this repo

| Directory | Description |
|-----------|-------------|
| [`dyslexia-support-skill/`](dyslexia-support-skill/) | 9 commands for reading support, text adaptation, and context enrichment |
| [`dyscalculia-support-skill/`](dyscalculia-support-skill/) | 8 commands for number visualization, math scaffolding, and spatial reasoning |
| [`multi-format-build-skill/`](multi-format-build-skill/) | The build system that compiles each skill into 6 output formats |
| [`samples/`](samples/) | Demo scripts for Ollama, OpenAI, n8n, and ChatGPT/Codex |

## Quick start

```bash
# Build the dyslexia skill
cd dyslexia-support-skill
npm install && npm run build

# Build the dyscalculia skill
cd ../dyscalculia-support-skill
npm install && npm run build

# Try a demo with local Ollama
cd ../samples
pip install requests pyyaml
python ollama_runner.py --list
python ollama_runner.py --skill dyslexia --command context-enrichment \
    --param text="The catalyst accelerated the reaction."
```

## Output formats

Each skill builds from a single `source/manifest.json` into 6 formats:

| Format | Use case |
|--------|----------|
| Claude Plugin | Install directly in Claude Code |
| OpenAI Functions | Function calling with GPT-4 or compatible APIs |
| n8n Node | Community node for n8n workflow automation |
| YAML Prompts | Model-agnostic prompt templates for any LLM |
| MCP Server | Model Context Protocol server with typed tools |
| Standalone CLI | Command-line tool with subcommands |

## Internationalization

Both skills support 10 locales: **en**, **es**, **fr**, **de**, **ja**, **zh**, **ar**, **pt**, **ko**, **hi**.

These 10 locales were selected to cover the widest range of writing systems, numeral conventions, and reading directions with the fewest locale files. Together they represent approximately 4.5 billion native speakers across Latin, CJK, Devanagari, Arabic, and Hangul scripts. Each writing system introduces distinct accessibility challenges — for example, Arabic requires full RTL layout, CJK languages demand radical-level analysis instead of syllable segmentation, and Hindi/Korean require script-specific phonological rules. Including all three CJK locales (ja, zh, ko) is necessary because their learning disabilities manifest differently despite shared character heritage.

Localization goes beyond string translation — each locale adapts to local conventions:

- **Dyslexia**: Writing-system-specific confusion pairs, syllable rules, phonological patterns, and pedagogical approaches (e.g., radical analysis for Chinese, jamo segmentation for Korean)
- **Dyscalculia**: Number separators, currency, traditional math tools (soroban, suanpan), grouping systems (lakh/crore, 万/億), and grade-level terminology

Arabic includes full RTL support with direction metadata.

## Platform demos

| Platform | File | Setup |
|----------|------|-------|
| Ollama (local) | `samples/ollama_runner.py` | `ollama pull llama3 && ollama serve` |
| OpenAI-compatible | `samples/openai_compatible_demo.py` | Works with Ollama or OpenAI API |
| n8n (local) | `samples/n8n_workflow.json` | Import into n8n, activate, POST to webhook |
| ChatGPT / Codex | `samples/chatgpt_prompt_pack.md` | Copy-paste into free ChatGPT |

See [`samples/README.md`](samples/README.md) for detailed usage instructions.

## Research grounding

The skills are designed around established research rather than ad hoc accessibility patterns:

- **Dyslexia**: Phonological deficit hypothesis, contextual facilitation effect (Stanovich 1980, Nation & Snowling 1998), orthographic mapping theory
- **Dyscalculia**: Concrete-Representational-Abstract (CRA) framework, subitizing research, magnitude comparison studies

The core design principle is to convert tasks that require impaired cognitive pathways into tasks that use intact ones — visual/spatial reasoning for dyscalculia, semantic/contextual processing for dyslexia.

## License

MIT
