# Difference Gap

Visualize the difference between two values as an explicit, visible gap bar — making
"how much more?" or "how much less?" a spatial observation rather than a subtraction problem.

## Design Rationale

Subtraction is one of the core operations impaired by dyscalculia, especially when borrowing
or regrouping is involved. When a user asks "how much more did Class A score than Class B?",
they need to subtract — but the CRA (concrete-representational-abstract) framework tells us
to make the difference itself a visible, concrete object.

This command draws both values as bars on a shared axis, then explicitly highlights the gap
between them as a third, distinctly colored element. The gap IS the answer — no computation
needed.

## What NOT to do

- Do NOT just show two bars and expect the user to mentally compute the difference
- Do NOT label the gap with a subtraction expression ("87 - 63 = 24") — show the result
  directly as "24 apart"
- Do NOT use this for more than 2 values at once — for 3+ values, use range-comparison
- Do NOT use similar colors for the two bars and the gap — the gap must be visually distinct

## Rendering

### Text rendering

```
My Score vs. Class Average (points)
────────────────────────────────────────────
Class average:  |████████████████████████████████|  65
                                                 ├──gap: 7──┤
My score:       |████████████████████████████████████████|  72
                ├────┼────┼────┼────┼────┼────┼────┼────┤
                0   10   20   30   40   50   60   70   80

  → "Your score is 7 points above the class average."
```

### When gap value is hidden (show_gap_value: false)

```
Class average:  |████████████████████████████████|
                                                 ├─ gap ─┤
My score:       |████████████████████████████████████████|

  → "Your score is a bit above the class average."
```

### SVG/HTML rendering

1. Two horizontal bars, one above the other, aligned to a shared left edge
2. The gap between the bar endpoints is filled with a distinct highlight color
   (e.g., dashed orange fill) with an optional label
3. A bracket or brace connects the two bar endpoints through the gap
4. If `show_gap_value` is true, the numeric difference appears inside the gap
5. For RTL locales, bars grow from right to left
6. Colors: high contrast, WCAG AA compliant, gap color distinct from both bars

## Plain-language summary

Always frame the result as a relationship, not a computation:

> "Your score is 7 points above the class average."
> "The red car is 15 centimeters longer than the blue car."
> "Store A charges $3.50 more than Store B."

If `show_gap_value` is false, use relative language:
> "Your score is a bit above the class average."
> "The red car is noticeably longer than the blue car."

Use the `context` parameter to add units when available.

## Edge cases

- **Equal values**: Show two bars of equal length, no gap. Say: "These two values are
  the same — there's no difference."
- **Very small difference**: If the gap is less than 2% of the larger value, note:
  "These are very close — the difference is tiny."
- **Very large difference**: If one value is more than 10× the other, the smaller bar
  will be hard to see. In this case, add a note about the scale and consider showing
  the ratio instead: "Store A costs about 12 times more than Store B."
- **Negative values**: Support negative numbers by extending the axis past zero.
  The gap visualization still works — it just spans a different region of the axis.
