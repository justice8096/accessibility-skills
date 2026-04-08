# Trend Direction

Show whether values are rising, falling, or flat over time using simplified directional
indicators, without requiring the user to read graph axes.

## Design Rationale

Line graphs encode values as positions on two axes (time and value), requiring simultaneous
number-to-space mapping on both dimensions. For dyscalculic users, this doubles the spatial
estimation demand. But most trend questions boil down to: "is it going up, down, or staying
the same?" — a categorical judgment, not a numerical one.

This command separates direction from magnitude: a clear arrow shows the trend, and an
optional axis-free sparkline shows the shape (acceleration, plateaus, dips) without
requiring precise value reading.

## What NOT to do

- Do NOT render a full line graph with labeled axes — the axis reading is the bottleneck
- Do NOT show multiple overlapping trend lines — compare one at a time
- Do NOT use only color to encode direction (red/green) — use arrows AND color for
  accessibility (color blindness affects ~8% of males)
- Do NOT describe trends using rates of change ("increased by 12.5%") — use directional
  language ("scores went up steadily")

## Trend Classification

Given a series of values, classify the trend:

| Pattern | Arrow | Label | Criteria |
|---------|-------|-------|----------|
| Strong rise | ↑ | Rising steadily | Overall increase > 15% of range, mostly upward |
| Gentle rise | ↗ | Rising slightly | Overall increase 5-15% of range |
| Flat | → | Staying flat | Overall change < 5% of range |
| Gentle fall | ↘ | Falling slightly | Overall decrease 5-15% of range |
| Strong fall | ↓ | Falling steadily | Overall decrease > 15% of range |
| Volatile | ↕ | Up and down | Direction changes > 40% of intervals |

Sensitivity parameter adjusts the thresholds:
- `strict`: Requires > 20% change to register as non-flat
- `moderate` (default): 5-15% thresholds as above
- `loose`: Any consistent 3%+ change counts as a trend

## Rendering

### Text rendering

```
Math Quiz Scores (6 weeks)
  ↗ Rising slightly

  Sparkline: ▁▂▂▃▄▅

  "Your math quiz scores have been going up slightly over the past 6 weeks."
```

### Multiple series comparison

```
Weekly Progress
  Reading:  ↗ Rising slightly    ▁▂▃▃▄▅
  Math:     → Staying flat       ▃▃▂▃▃▃
  Science:  ↑ Rising steadily    ▁▂▃▅▆▇
```

### SVG/HTML rendering

1. Large directional arrow (colored: green=rising, amber=flat, red=falling)
2. Below: axis-free sparkline as a smooth curve (no grid, no labels)
3. Below: plain-language summary sentence
4. For comparison: stack multiple rows with aligned sparklines

## Plain-language summary

Always provide a summary that answers the question without numbers:

> "Your reading scores have been going up slightly over the past 6 weeks. Science has
> improved the most — it's been rising steadily. Math has stayed about the same."

If `context` is provided, use it to frame the summary naturally.

## Edge cases

- **Only 2 data points**: Can show direction but not shape. Show arrow only, no sparkline.
  Note: "Only two measurements — this shows the direction but not whether it's consistent."
- **Single data point**: Cannot determine trend. Say: "Only one measurement — at least
  two are needed to see a direction."
- **All identical values**: Flat (→), note: "These values are all the same."
- **Strong outlier**: If one value is wildly different, note it: "There was an unusual
  dip in week 3, but the overall direction is upward."
