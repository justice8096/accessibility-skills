---
name: confusion-checker
description: Flag commonly confused letters, reversed words, and homophones with visual disambiguation
---

# Confusion Checker

Scan text for items commonly confused by dyslexic readers and writers, then provide context-aware corrections and visual mnemonics.

## Why This Helps

Dyslexia affects **orthographic processing** — the ability to recognize and recall letter patterns. Common manifestations include:

- **Letter reversals**: Confusing mirror-image letters (`b`/`d`, `p`/`q`, `m`/`w`).
- **Word reversals**: Reading or writing mirror words (`was`↔`saw`, `on`↔`no`, `pot`↔`top`).
- **Homophones**: Substituting words that sound identical but differ in spelling and meaning (`their`/`there`/`they're`, `to`/`too`/`two`, `your`/`you're`).
- **Near-miss words**: Swapping visually similar words (`form`/`from`, `quite`/`quiet`, `though`/`through`/`thorough`).

Flagging these proactively during writing (not after grading) reduces error-based frustration and builds self-monitoring habits.

## Behavior

Given input text:

1. **Scan** for all items matching the selected `check_types`:
   - `letter-reversals`: Flag words containing commonly reversed letter pairs in positions where substitution would create a different valid word.
   - `word-reversals`: Flag words that are themselves reversals of other common words.
   - `homophones`: Flag words that have one or more homophones, especially in contexts where the wrong one may be used.
   - `all`: Run all three checks.

2. **Context analysis** (if `context_aware` is true): Use sentence context to determine whether the current word is likely correct or likely a substitution error. Provide a confidence indicator (✓ probably correct, ⚠ possibly confused, ✗ likely wrong).

3. **Visual mnemonics** (if `show_mnemonics` is true): For each flagged item, provide a disambiguation strategy:

### Letter Reversal Mnemonics

| Pair | Mnemonic |
|------|----------|
| b/d | The word **bed** — `b` has its bump on the right, `d` on the left, forming a bed shape: `b e d` |
| p/q | `p` points right like "**p**oint", `q` needs its friend `u` — it always looks toward the `u` |
| m/w | `m` has mountains (peaks up), `w` has waves (peaks down) |

### Homophone Disambiguation

Provide a short decision rule for each set:
- **their** (possession: "their book") / **there** (place: "over there" — contains "here") / **they're** (they are — try expanding it)
- **your** (possession) / **you're** (you are — try expanding)
- **to** (direction) / **too** (also/excessive — "too" has too many o's) / **two** (number 2 — starts with "tw" like "twin")

## Output Format

```
Original:  "Their going too the store too by bread."

Findings:
  ⚠ "Their" → likely should be "They're" (they are going) — try expanding: "They are going" ✓
  ⚠ "too" (1st) → likely should be "to" (direction, not 'also')
  ⚠ "too" (2nd) → likely should be "to" (direction, not 'also')
  ✗ "by" → likely should be "buy" (to purchase, not a location)

Corrected: "They're going to the store to buy bread."
```

## Edge Cases

- **Intentional usage**: If context strongly supports the current word, mark ✓ and don't flag.
- **Proper nouns**: Skip homophone checking for capitalized words unless they start a sentence.
- **Creative writing**: In poetry or dialogue, flag but don't auto-correct — the author may be using wordplay.
- **Young writers**: At elementary level, also flag `c`/`k` confusion, `f`/`ph`, and `s`/`c` soft sounds.

## Locale Considerations

Confusion pairs are language-specific:
- **Spanish**: `b`/`v` (identical pronunciation), `ll`/`y` (yeísmo), `s`/`c`/`z` (seseo)
- **French**: `é`/`è`/`ê`/`e` confusion, silent-letter endings (`-ent`, `-ait`)
- **German**: `ie`/`ei` reversal, `ä`/`e`, `d`/`t` final devoicing
- **Arabic**: Letter-form variations (initial/medial/final) create additional confusion points
