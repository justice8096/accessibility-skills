---
name: passage-decoder
description: Chunk passages into manageable segments with pre-teaching, decoding hints, and comprehension scaffolds
---

# Passage Decoder

Transform a reading passage into a scaffolded, chunked reading experience with pre-taught vocabulary, inline decoding hints, per-chunk comprehension checks, and a cumulative summary template.

## Why This Helps

Reading comprehension in dyslexia fails not because of a comprehension deficit but because decoding consumes so much cognitive resource that little remains for meaning-making. Research shows:

- **Decoding bottleneck**: Slow, effortful word-level reading exhausts working memory before the reader can integrate sentence meaning.
- **Matthew effect**: Struggling readers read less, encounter fewer words, and fall further behind in vocabulary and world knowledge.
- **Comprehension monitoring**: Dyslexic readers are less likely to notice when they've lost the thread of meaning — they need explicit checkpoints.

This command addresses all three by: pre-teaching hard words (reducing decoding surprises), chunking (limiting the working memory window), and inserting comprehension checks (enforcing self-monitoring).

## Behavior

Given a passage:

1. **Analyze difficulty**: Scan for multi-syllable words, low-frequency vocabulary, complex sentence structures, and domain-specific terms.

2. **Pre-teach vocabulary** (controlled by `pre_teach_count`):
   - Select the N hardest words from the upcoming chunk.
   - For each, provide: the word, syllable breakdown, simple definition, and the sentence it appears in.
   ```
   Before reading Chunk 1:
     📖 "pho·to·syn·the·sis" — how plants use sunlight to make food
         "Plants use photosynthesis to convert sunlight into energy."
     📖 "chlo·ro·phyll" — the green chemical in leaves
         "Chlorophyll gives leaves their green color."
   ```

3. **Chunk the passage** using the selected `chunk_strategy`:
   - `sentence`: Each sentence is one chunk (for very struggling readers).
   - `paragraph`: Each paragraph is one chunk (standard).
   - `natural-break`: Split at topic shifts or after 3–5 sentences, whichever creates the most meaningful units.

4. **Add decoding hints** inline (if `include_decoding_hints` is true):
   - For words with 3+ syllables, add a superscript syllable guide on first occurrence.
   - Format: `photosynthesis ᵖʰᵒ·ᵗᵒ·ˢʸⁿ·ᵗʰᵉ·ˢⁱˢ` or a parenthetical: `photosynthesis (foh-toh-SIN-thuh-sis)`.
   - Only annotate each word once (first occurrence in the passage).

5. **Insert comprehension checkpoints** after each chunk:
   - One **recall question** ("What did the paragraph say about ___?")
   - One **connection question** ("Why do you think ___ is important?")
   - Keep questions answerable from the chunk alone — no inference beyond the text.

6. **Summary scaffold** (if `include_summary_scaffold` is true):
   After the final chunk, provide a fill-in-the-blank summary:
   ```
   Summary:
   This passage was about ___. First, it explained that ___.
   Then, it described how ___. The main idea is ___.
   ```

## Output Structure

```
═══ PASSAGE DECODER ═══

📚 Words to Know (Chunk 1):
  • "pho·to·syn·the·sis" — how plants make food from sunlight
  • "chlo·ro·phyll" — the green pigment in leaves

── Chunk 1 ──────────────────────────
Plants need sunlight to survive. Through a process called
photosynthesis (foh-toh-SIN-thuh-sis), they convert light energy
into food. The green pigment chlorophyll (KLOR-oh-fill) in their
leaves captures the light.

  ✅ Check: What do plants use to capture sunlight?
  🤔 Think: Why are most leaves green?

── Chunk 2 ──────────────────────────
[next section...]

══ Summary Template ══
This passage explained how plants ___. They use a process called
___ to turn ___ into food. The chemical ___ is what makes this
possible and gives leaves their ___ color.
```

## Difficulty Adaptation

- **Sentence-level chunking**: For readers who lose track within a paragraph. Add decoding hints for 2+ syllable words.
- **Paragraph chunking**: Standard difficulty. Pre-teach 3 words per chunk.
- **Natural-break chunking**: For stronger readers who need organization support more than decoding support. Pre-teach only domain-specific terms.

## Edge Cases

- **Very short passages** (< 3 sentences): Skip chunking; provide vocabulary and a single comprehension question.
- **Dialogue-heavy text**: Keep speaker exchanges together in the same chunk.
- **Poetry**: Chunk by stanza; add rhythm/rhyme annotations instead of phonetic decoding hints.
- **Technical/academic text**: Increase pre-teach count; add a glossary at the end.

## Locale Considerations

- Decoding hints should use the target language's phonetic system (not English IPA for non-English passages).
- Comprehension question phrasing should match local educational conventions.
- For languages with transparent orthography (Spanish, Italian), reduce decoding hints — focus on vocabulary meaning instead.
