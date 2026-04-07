---
name: vocabulary-builder
description: Create visual word maps with morpheme breakdown, etymology, word families, and mnemonics
---

# Vocabulary Builder

Build rich, multi-sensory vocabulary maps that leverage **meaning-based learning** — a strength channel for many dyslexic learners — rather than relying solely on phonics.

## Why This Helps

Dyslexic readers often struggle to acquire vocabulary through reading alone because the decoding bottleneck means fewer words are encountered in print. However, research shows dyslexic individuals often have strong:

- **Conceptual reasoning**: Understanding word meanings through relationships and context
- **Visual-spatial thinking**: Remembering word associations through images and spatial layouts
- **Narrative memory**: Recalling information embedded in stories better than isolated facts

This command exploits these strengths by presenting each word as a connected web of meaning rather than a sequence of letters to decode.

## Behavior

For each word provided:

1. **Morpheme breakdown**: Split the word into prefix, root(s), and suffix with meanings.
   ```
   "unbreakable"
   ├── un-    (prefix: not, reversal)
   ├── break  (root: to separate into pieces)
   └── -able  (suffix: capable of being)
   → "not capable of being broken"
   ```

2. **Etymology** (if `include_etymology` is true): Trace the word's origin in plain language.
   ```
   "biology" — from Greek: bios (life) + logos (study of)
   First used in English around 1799 to mean "the study of living things"
   ```

3. **Word family** (if `include_word_family` is true): Show related words sharing the same root, organized by part of speech.
   ```
   Root: "bio" (life)
   ├── biography (writing about a life)
   ├── antibiotic (against living organisms)
   ├── biodegradable (able to be broken down by living things)
   └── symbiosis (living together)
   ```

4. **Mnemonic** (if `include_mnemonic` is true): Generate a memorable association — visual image, story, or wordplay.
   ```
   "necessary" — imagine a shirt: it has 1 Collar and 2 Sleeves → 1 C, 2 S's
   "island" — an island IS LAND surrounded by water
   ```

## Output Format

### Compact (default for multiple words)
```
━━━ UNBREAKABLE ━━━
Parts:  un- (not) + break (separate) + -able (can be)
Means:  Cannot be broken
Family: break, breakable, breakdown, unbroken, breaker
Memory: Think of a superhero's shield — UN-BREAK-ABLE
```

### Full (default for single word)
A complete visual word map with all four components, laid out as a spatial diagram showing connections between the root, its meaning, the family words, and the mnemonic image.

## Difficulty Scaling

- **Elementary**: Use simple definitions, skip etymology, focus on common prefixes/suffixes (`un-`, `re-`, `-ing`, `-ed`, `-ful`).
- **Middle school**: Add etymology as a story, expand word families, include Greek/Latin root patterns.
- **High school**: Full morphological analysis, academic vocabulary focus, cross-language cognates.
- **Adult**: Professional/technical vocabulary, include register information (formal vs. informal).

## Edge Cases

- **Words with no clear morphemes**: Use whole-word mnemonics and semantic associations instead.
- **Multiple etymologies**: Note the most common/relevant origin; mention alternatives if helpful.
- **Borrowed words**: Highlight cognates in the user's language(s) if operating in a multilingual context.
- **Irregular morphology**: Flag when a morpheme changes form (`receive` → `reception`, not `receivtion`).

## Locale Considerations

- All locales can use etymology tracing, but the source language changes.
- Word family generation should use the target language's morphological patterns.
- Mnemonic strategies should use culturally familiar references.
- For logographic languages (Chinese, Japanese kanji), shift from morpheme breakdown to radical breakdown and character-component analysis.
