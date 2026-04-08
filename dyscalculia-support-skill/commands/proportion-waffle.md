# Proportion Waffle

Visualize proportions and percentages using a waffle grid of countable squares instead of
pie charts or abstract fraction notation.

## Design Rationale

Pie charts require angular estimation — judging what fraction of 360° a slice represents.
Research consistently shows this is unreliable even for neurotypical readers, and it's
significantly harder for dyscalculic individuals who struggle with part-whole relationships.

A waffle grid (typically 10×10 = 100 squares) makes proportions concrete and countable:
72% becomes "72 colored squares out of 100." This leverages subitizing for small clusters
and counting for larger ones, rather than requiring fraction/percentage conversion.

## What NOT to do

- Do NOT use pie charts — angular estimation is the least accurate visual encoding
- Do NOT use donut charts — same problem as pie charts with added center confusion
- Do NOT show more than 3-4 proportions in a single grid (use side-by-side grids instead)
- Do NOT use similar colors for different categories — high-contrast, distinct hues only
- Do NOT require the user to calculate the proportion — accept "15 out of 30" directly

## Rendering the Waffle Grid

### Text rendering (10×10 grid)

```
Passed the Test: 72%
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ □ □ □ □ □ □ □ □
□ □ □ □ □ □ □ □ □ □
□ □ □ □ □ □ □ □ □ □
■ = passed (72)  □ = did not pass (28)
```

### Simplified grid (5×5 = 25 squares, for younger learners)

Use `grid_size: 5` for a 25-square grid. Each square represents 4%. Round to the nearest
square. This is easier to count and less visually overwhelming.

### Side-by-side comparison

```
Class A: 72% passed          Class B: 58% passed
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        ■ ■ ■ ■ ■ ■ ■ ■ ■ ■
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        ■ ■ ■ ■ ■ ■ ■ ■ □ □
■ ■ ■ ■ ■ ■ ■ ■ ■ ■        □ □ □ □ □ □ □ □ □ □
■ ■ □ □ □ □ □ □ □ □        □ □ □ □ □ □ □ □ □ □
□ □ □ □ □ □ □ □ □ □        □ □ □ □ □ □ □ □ □ □
□ □ □ □ □ □ □ □ □ □        □ □ □ □ □ □ □ □ □ □
```

### SVG/HTML rendering

1. Grid of rounded-corner squares with distinct fill colors per category
2. Squares fill left-to-right, top-to-bottom (reading order)
3. For RTL locales, fill right-to-left
4. High contrast between filled and empty (WCAG AA minimum)
5. Legend below the grid with category label and count
6. For comparison: grids placed side-by-side with equal spacing

## Plain-language summary

After rendering, provide a summary:

> "72 out of every 100 students passed the test. If you look at the grid, almost three
> quarters of the squares are filled in."

Use concrete language ("72 out of 100") rather than abstract notation ("72%" or "0.72").

## Input parsing

Accept flexible input formats:
- "72%" → 72 out of 100
- "72 out of 100" → 72 out of 100
- "15 out of 30" → convert to 50 out of 100 (scale to grid)
- "3/4" → 75 out of 100
- Multiple categories: "Pass: 72%, Fail: 28%" → two-color single grid

## Edge cases

- **Proportions that don't sum to 100**: Warn the user and show the actual values.
  Do not silently normalize.
- **Very small proportions (<3%)**: Show at least 1 square (minimum visibility).
  Add a note: "This is less than 3% — shown as 1 square for visibility."
- **More than 4 categories in one grid**: Switch to stacked side-by-side grids
  rather than cramming many colors into one grid.
