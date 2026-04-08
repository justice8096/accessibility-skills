# Dyslexia Support Skill

Accessibility tools for reading support, text adaptation, and evidence-based interventions tailored to dyslexic users. Grounded in reading science — phonological processing, orthographic mapping, and the contextual facilitation effect.

## Commands

| Command | What it does |
|---------|-------------|
| `text-simplification` | Reduce sentence complexity and replace difficult words while preserving meaning |
| `reading-guide-generation` | Chunk documents into sections with vocabulary previews and comprehension checkpoints |
| `font-recommendation` | Suggest dyslexia-friendly fonts and formatting for a given reading context |
| `syllable-highlighter` | Color-code syllables for phonological decoding with stress markers and morpheme boundaries |
| `confusion-checker` | Detect mirror letters (b/d, p/q), reversed words (was/saw), and homophones with visual disambiguation |
| `vocabulary-builder` | Create word maps with morpheme breakdown, etymology, word families, and mnemonic images |
| `writing-scaffold` | Generate sentence starters, transition banks, paragraph templates, and graphic organizers |
| `passage-decoder` | Chunk passages with pre-reading vocabulary, inline decoding hints, and comprehension questions |
| `context-enrichment` | Expand terse text with supportive context around hard words — the opposite of simplification |

## Research basis

The skill design targets core dyslexia deficits identified in the literature:

- **Phonological processing** → syllable-highlighter, passage-decoder
- **Orthographic processing** → confusion-checker
- **Vocabulary acquisition** → vocabulary-builder, context-enrichment
- **Written expression / working memory** → writing-scaffold
- **Reading comprehension** → reading-guide-generation, passage-decoder

Context enrichment is based on the contextual facilitation effect (Stanovich 1980, Nation & Snowling 1998): dyslexic readers benefit disproportionately from semantically rich surrounding text because they rely on top-down processing to compensate for impaired bottom-up decoding. The key principle is to never replace hard words — keep them and wrap them in supportive context.

## Internationalization

Supports 10 locales with culturally appropriate localizations:

| Locale | Language | Notes |
|--------|----------|-------|
| `en` | English | Default |
| `es` | Spanish | Transparent orthography — fewer decoding issues, focus shifts to comprehension |
| `fr` | French | Opaque orthography with liaison and silent letter challenges |
| `de` | German | Compound word segmentation, case-marking confusions |
| `ja` | Japanese | Kanji/kana dual-script challenges, furigana support |
| `zh` | Chinese | Radical-component analysis replaces phonological approaches |
| `ar` | Arabic | RTL support, diacritics restoration, root-pattern morphology |
| `pt` | Portuguese | Nasal vowel distinctions, Brazilian/European variants |
| `ko` | Korean | Jamo block segmentation for syllable work |
| `hi` | Hindi | Devanagari matra positioning, conjunct consonant support |

Translations go beyond string substitution — each locale adapts confusion pairs, syllable rules, and pedagogical approaches to the target writing system.

## Project structure

```
dyslexia-support-skill/
├── build.ts                    # Multi-format build system
├── package.json
├── tsconfig.json
└── source/
    ├── manifest.json           # Skill definition with all 9 commands
    ├── skills/
    │   └── dyslexia-support.md # Domain knowledge and accommodation strategies
    ├── commands/
    │   ├── text-simplification.md
    │   ├── reading-guide-generation.md
    │   ├── font-recommendation.md
    │   ├── syllable-highlighter.md
    │   ├── confusion-checker.md
    │   ├── vocabulary-builder.md
    │   ├── writing-scaffold.md
    │   ├── passage-decoder.md
    │   └── context-enrichment.md
    └── i18n/
        ├── ar.json, de.json, es.json, fr.json, hi.json
        ├── ja.json, ko.json, pt.json, zh.json
        └── (en is the default — no separate file needed)
```

## Building

```bash
npm install
npm run build              # All locales, all 6 output formats
npm run build -- --locale es   # Spanish only
npm run build -- --validate-only  # Check manifest without building
```

Output goes to `dist/` with subdirectories for each format: `claude-plugin/`, `openai/`, `n8n/`, `prompts/`, `mcp-server/`, `cli/`.

## License

MIT
