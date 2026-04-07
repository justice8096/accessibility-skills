# Range Comparison

Compare two or more datasets visually using simplified range bars, designed specifically to
reduce the cognitive load of comparing statistics numerically.

## Design Rationale

Traditional box-and-whisker plots encode five values (min, Q1, median, Q3, max) and require
understanding quartiles — an abstract concept that presupposes the number sense dyscalculia
impairs. Research shows dyscalculic individuals also have a "general deficit in mapping numbers
onto space" (Szucs et al., 2013), meaning even reading positions on a number line axis is harder.

The range-bar approach solves this by showing only three values per dataset (min, max, center)
and encoding the comparison as "which bar sits higher?" — a spatial judgment that bypasses
numerical comparison entirely.

## What NOT to do

- Do NOT use full box-and-whisker plots — the quartile abstraction adds cognitive load
- Do NOT show outlier dots — they are visually salient but statistically minor, creating
  a misleading sense of importance for dyscalculic readers
- Do NOT require reading precise positions from the axis — the visual comparison should
  work even without reading any numbers
- Do NOT show more than 4-5 datasets at once — visual comparison breaks down beyond that

## Rendering the Range Bar

Each dataset gets a horizontal bar from min to max, with a marker (●) at the center value.
Bars are stacked vertically and share a common axis for direct spatial comparison.

### Text rendering (for terminal/markdown output)

```
Test Scores
───────────────────────────────────────────────────
Class A:  |████████████████●██████████████|
Class B:  |██████●██████████████████████████████████|
Class C:  |██████████████████████████●████|
          ├─────┼─────┼─────┼─────┼─────┤
          0    20    40    60    80   100
                              ● = median
```

Rules for text rendering:
1. Bar width is proportional to the range (max − min)
2. Bar position on the shared axis reflects where the range sits
3. The center marker (●) is placed proportionally within the bar
4. Labels go on the left, aligned to the same column
5. Axis ticks use round numbers — never label every value
6. A legend states what the ● represents (mean, median, or mode)
7. If `show_numbers` is true, annotate the center: `Class A: ●72`
8. Use consistent colors/shading when output supports it

### SVG/HTML rendering (for graphical output)

When the output format supports graphics, render as SVG with:
1. Colored horizontal rectangles for each bar (distinct hue per dataset)
2. A vertical line or filled circle at the center value
3. A shared horizontal axis with minimal tick marks
4. Dataset labels left-aligned
5. Generous spacing between bars (at least bar-height gap)
6. Large, readable font (16px+) for labels
7. If `show_numbers` is true, print the center value inside or beside the marker
8. High-contrast colors that pass WCAG AA (4.5:1 minimum)
9. For RTL locales, mirror the axis direction (max on left, min on right)

## Interpreting the output

After rendering the visual, provide a plain-language summary:

> "Class B has the widest range of scores (30 to 98) and its median sits at 55. Class A has
> a narrower range (45 to 90) but a higher median at 72. Class C sits in the middle."

The summary should:
- State which dataset has the widest/narrowest range
- State which has the highest/lowest center value
- Use comparison words (wider, higher, lower) rather than numbers where possible
- Only include numbers if `show_numbers` is true, otherwise describe relationships spatially

## Edge cases

- **Overlapping ranges**: When bars overlap significantly, add a note: "These two datasets
  cover similar ground — the ranges overlap heavily."
- **Single dataset**: Still render the bar with center marker, but skip comparison language.
  Useful for showing "where does this value sit within the range?"
- **Very different scales**: If one dataset ranges 0–10 and another 0–10000, warn the user
  and suggest comparing them separately. Shared axes with wildly different magnitudes will
  compress the smaller range into an unreadable sliver.
- **Missing center**: If no center value is provided, show only the range bar without a
  marker and note that no central tendency is available.
- **Tied/identical datasets**: If two datasets have the same range and center, say so
  explicitly rather than showing identical bars that invite confusion.
