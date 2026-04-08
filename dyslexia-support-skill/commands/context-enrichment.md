---
name: context-enrichment
description: Expand terse text with semantically supportive context to aid word recognition through top-down processing
---

# Context Enrichment

Reshape text so that difficult words are surrounded by enough contextual clues for a dyslexic reader to predict and confirm them — the opposite of text simplification.

## Why This Helps

Skilled readers use two parallel routes to recognize words:

- **Bottom-up (phonological)**: Sounding out letters → blending → word. This is the route dyslexia disrupts.
- **Top-down (contextual)**: Using sentence meaning, grammar, and world knowledge to predict what the next word should be. This route is often *intact* in dyslexia and becomes the primary compensation strategy.

Terse writing — short sentences, minimal modifiers, technical jargon without explanation — starves the top-down route. There aren't enough surrounding words to build a prediction. The reader is forced to rely entirely on the broken bottom-up route, and decoding fails.

**Context enrichment** adds semantically redundant material that gives the top-down route more to work with. Research on the **contextual facilitation effect** (Stanovich, 1980; Nation & Snowling, 1998) shows that dyslexic readers benefit *more* from supportive context than typical readers do, because they depend on it more heavily.

This is explicitly NOT simplification. Simplification replaces hard words with easy ones. Enrichment *keeps* the hard words but wraps them in enough meaning that the reader can figure them out.

## Enrichment Techniques

### 1. Appositives (light enrichment)
Insert a brief defining phrase next to the difficult word.

**Before**: "The catalyst accelerated the reaction."
**After**: "The catalyst — a substance that speeds things up — accelerated the reaction."

### 2. Semantic echoes (moderate enrichment)
Repeat the core meaning using different words later in the same sentence or the next one, so the reader encounters the concept twice.

**Before**: "Photosynthesis converts light into energy."
**After**: "Photosynthesis converts light into energy. In other words, plants use sunlight to make the food they need to grow."

### 3. Contextual pre-loading (moderate enrichment)
Add a lead-in sentence that sets up the meaning before the hard word appears.

**Before**: "The legislation was ratified unanimously."
**After**: "Every single member voted yes, with no one disagreeing. The legislation was ratified unanimously."

### 4. Semantic field expansion (heavy enrichment)
Add related words from the same meaning cluster so the reader builds a mental frame before hitting the target word.

**Before**: "The patient was diagnosed with anemia."
**After**: "After the blood test showed low iron levels, the doctor reviewed the results carefully. The patient was diagnosed with anemia — a condition where the blood doesn't carry enough oxygen."

## Behavior

Given input text:

1. **Identify target words**: Scan for words likely to be decoding challenges — multi-syllable words, low-frequency vocabulary, domain-specific terms, words with irregular spelling. If `target_words` is provided, use those instead.

2. **Assess existing context**: For each target word, check whether the surrounding sentence already provides enough semantic support. Skip words that are already well-supported.

3. **Apply enrichment** at the selected level:
   - `light`: Appositives only. Adds 2–5 words per target. Minimal text expansion.
   - `moderate`: Appositives + semantic echoes + occasional pre-loading. Adds a clause or short sentence per target.
   - `heavy`: Full contextual scaffolding including semantic field expansion. May double passage length.

4. **Quality checks**:
   - Every added phrase must carry genuine semantic information about the target word. No filler.
   - Added context must be *accurate* — don't insert misleading clues.
   - Maintain sentence flow. The enriched text should read naturally, not feel patched.
   - Don't enrich the same word twice in close proximity.
   - Preserve the original vocabulary. Never *replace* a hard word; always *support* it.

5. **Annotation** (if `show_annotations` is true): Mark added material with brackets or a distinct style so educators can see what was enriched and why.

## Output Format

### Default (clean)
```
After the blood test showed low iron levels, the doctor reviewed the
results carefully. The patient was diagnosed with anemia — a condition
where the blood doesn't carry enough oxygen.
```

### Annotated (show_annotations = true)
```
[After the blood test showed low iron levels, the doctor reviewed the
results carefully.] The patient was diagnosed with anemia [— a condition
where the blood doesn't carry enough oxygen].

Enrichment notes:
  • "anemia" — pre-loaded with "low iron levels" and "blood test" to
    build semantic field; appositive added for definition
```

## When to Use Enrichment vs. Simplification

| Situation | Use |
|-----------|-----|
| Reader needs to learn the vocabulary (school, work) | **Enrichment** — keeps the real words |
| Reader just needs the information quickly | **Simplification** — replaces hard words |
| Technical/academic text for a student | **Enrichment** — builds word knowledge |
| Instructions, forms, public signage | **Simplification** — maximum clarity |
| Reader has strong comprehension but slow decoding | **Enrichment** — plays to their strength |
| Reader has both decoding and comprehension difficulty | **Simplification** first, then enrichment on remaining hard words |

## Interaction with Other Commands

- **text-simplification**: Opposite approach. Can be used *after* enrichment on passages that are still too hard — simplify the easy parts, enrich around the important vocabulary.
- **passage-decoder**: Complementary. Passage-decoder adds scaffolding *around* the text (pre-teaching, checkpoints). Context-enrichment changes the text *itself*.
- **vocabulary-builder**: Can be used together. Enrichment provides in-context exposure; vocabulary-builder provides explicit word study.

## Edge Cases

- **Already rich text**: If the source text is already context-heavy (e.g., children's literature, textbooks with good explanations), enrichment may not be needed. Report "text already well-supported" rather than adding redundant material.
- **Very short text** (single sentence): Limited room for pre-loading. Use appositives and a follow-up echo sentence.
- **Dialogue**: Enrich the narrative around dialogue, not the dialogue itself (people don't speak in appositives).
- **Poetry**: Generally don't enrich — the conciseness is part of the form. Offer a prose companion instead.
- **Multiple hard words in one sentence**: Enrich the hardest 1–2; if the sentence has 3+, consider splitting it first, then enriching.

## Locale Considerations

- Context enrichment works across all languages, but the specific techniques vary:
  - **Languages with transparent orthography** (Spanish, Italian, Finnish): Decoding is less of a bottleneck, so enrichment may focus more on meaning support for domain vocabulary than on phonological prediction.
  - **Logographic languages** (Chinese, Japanese kanji): Enrichment adds character-meaning context — using the word in a familiar compound or pairing it with a near-synonym that uses simpler characters.
  - **Arabic**: Enrichment can add diacritics (tashkeel) to the target word alongside semantic context, providing both bottom-up and top-down support simultaneously.
  - **Agglutinative languages** (German, Finnish, Turkish): Compound words are the primary challenge. Enrichment can unpack the compound into its components in surrounding text.
