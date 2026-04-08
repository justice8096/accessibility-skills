# n8n-nodes-accessibility

n8n community node for dyslexia and dyscalculia accessibility support. Runs 17 accessibility commands via a local Ollama instance or any OpenAI-compatible LLM.

## Installation

In your n8n instance, go to **Settings > Community Nodes** and install:

```
n8n-nodes-accessibility
```

Or install via npm in your n8n custom directory:

```bash
cd ~/.n8n
npm install n8n-nodes-accessibility
```

## Node: Accessibility Skill

A single node with two skills (dyslexia, dyscalculia) and 17 commands total.

### Dyslexia Commands (9)

Text Simplification, Reading Guide, Font Recommendation, Syllable Highlighter, Confusion Checker, Vocabulary Builder, Writing Scaffold, Passage Decoder, Context Enrichment

### Dyscalculia Commands (8)

Number Visualization, Step-by-Step Math, Estimation Practice, Range Comparison, Proportion Waffle, Trend Direction, Difference Gap, Elapsed Time

### Configuration

The node requires **Ollama API** credentials:

- **Base URL**: Your Ollama instance (default: `http://localhost:11434`)
- **Model**: The model to use (default: `llama3`)

### Parameters

- **Skill**: Dyslexia Support or Dyscalculia Support
- **Command**: The specific accessibility command to run
- **Input Text**: The text or expression to process
- **Locale**: One of 10 supported languages (en, es, fr, de, ja, zh, ar, pt, ko, hi)
- **Additional Options**: Optional command-specific parameters

### Example Workflow

1. **Webhook** receives text to process
2. **Accessibility Skill** node runs context enrichment
3. **Respond to Webhook** returns the enriched text

## Supported Locales

English, Spanish, French, German, Japanese, Chinese, Arabic, Portuguese, Korean, Hindi — with culturally appropriate adaptations for each.

## License

MIT
