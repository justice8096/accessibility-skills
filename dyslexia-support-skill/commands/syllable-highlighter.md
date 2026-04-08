---
name: syllable-highlighter
description: Break words into color-coded syllables for phonological decoding support
---

# Syllable Highlighter

Break words or passages into visually distinct syllables to support phonological decoding — the core deficit in dyslexia.

## Why This Helps

Dyslexia primarily affects **phonological processing**: the ability to hear, identify, and manipulate the sound units in words. Multi-syllable words are especially challenging because the reader must:
1. Segment the word into syllable units
2. Decode each syllable independently
3. Blend the syllables back into a whole word
4. Hold earlier syllables in working memory while decoding later ones

Explicit syllable highlighting removes step 1 entirely and reduces working memory load in step 4 by making boundaries persistent and visible.

## Behavior

Given a word or passage:

1. **Syllabify** each word using standard syllable division rules (VC/CV, V/CV, VC/V patterns).
2. **Render syllable boundaries** using the selected highlight mode:
   - `color-alternating`: Alternate between two high-contrast colors (e.g., blue/orange) for adjacent syllables.
   - `underline`: Underline each syllable with alternating solid/dashed lines.
   - `slash-separated`: Insert a thin slash or vertical bar between syllables: `un·der·stand`.
   - `numbered`: Subscript a number on each syllable: `un₁der₂stand₃`.
3. **Mark stress** (if `show_stress` is true): Bold the primary stressed syllable and optionally add an accent mark (`ÚN·der·stand`).
4. **Mark morphemes** (if `show_morphemes` is true): Use a secondary indicator (brackets or color tint) to show prefix `[un]`, root `{der·stand}`, and suffix boundaries. This helps readers see meaningful chunks inside words.

## Output Formats

### Plain text
```
un · der · STAND · ing
[prefix] [root        ] [suffix]
```

### HTML/Rich text
```html
<span class="syl-a">un</span><span class="syl-b">der</span><span class="syl-a stress">stand</span><span class="syl-b">ing</span>
```

Use colors with sufficient contrast (WCAG AA minimum 4.5:1 against background). Default palette:
- Syllable A: `#2563EB` (blue) on white
- Syllable B: `#EA580C` (orange) on white

## Syllable Division Rules

Apply in order:
1. **Compound words**: Split at compound boundary first (`foot·ball`, `sun·flower`).
2. **Prefixes and suffixes**: Separate known affixes (`un·happy`, `teach·er`).
3. **VCCV pattern**: Split between consonants (`rab·bit`, `nap·kin`).
4. **VCV pattern**: Try splitting before the consonant first (open syllable: `ba·con`); if the word doesn't match a known pronunciation, split after (`cab·in`).
5. **VCCCV pattern**: Keep blends and digraphs together (`mon·ster`, not `mons·ter`).
6. **Final stable syllables**: `-ble`, `-tle`, `-dle`, `-gle`, `-kle`, `-fle`, `-zle` stay together.

## Edge Cases

- **Single-syllable words**: Render without highlighting; optionally note "1 syllable" for awareness.
- **Silent letters**: Include in syllable but may note them (e.g., `knife` → `knife (silent k)`).
- **Irregular words**: Flag words with non-standard pronunciation for teacher review.
- **Passages**: Process word-by-word, preserving punctuation and spacing. Only highlight words of 2+ syllables unless all-word mode is requested.

## Locale Considerations

Syllable rules vary by language. This command uses English syllable patterns by default. Localized versions should apply language-specific rules (e.g., Spanish: always split between vowels unless they form a diphthong; German: split at compound morpheme boundaries).
