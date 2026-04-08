# Elapsed Time

Calculate and visualize the time between two clock values using a timeline bar, bypassing
the need for mental base-60 arithmetic.

## Design Rationale

Computing elapsed time requires subtracting in base 60 (minutes) and base 12 or 24 (hours),
with potential AM/PM confusion and borrowing across the hour boundary ("from 10:45 to 12:20"
requires borrowing). These are all operations that compound dyscalculia's core deficits:
subtraction difficulty, working memory overload, and procedural confusion.

A visual timeline resolves this by showing the two time points as positions on a horizontal
bar, with the duration highlighted as a colored span between them. Breaking the span into
labeled hour and minute chunks ("1 hour + 35 minutes") makes the structure visible without
requiring any arithmetic.

## What NOT to do

- Do NOT present the calculation as "12:20 - 10:45 = ?" — this invites the procedural
  error this command exists to prevent
- Do NOT show only the final answer ("1 hour 35 minutes") without the visual — the visual
  IS the accommodation
- Do NOT use 24-hour time without also showing the 12-hour equivalent (or vice versa) —
  users may be familiar with only one format
- Do NOT show analog clock faces by default — they are a documented dyscalculia challenge.
  Only show them if `show_clock_faces` is explicitly true, and always alongside the
  digital time.

## Rendering

### Text rendering

```
From 10:45 AM to 12:20 PM
──────────────────────────────────────────────
10:45     11:00        12:00     12:20
  │←─15 min─→│←──1 hour──→│←─20 min─→│
  ├──────────┼────────────┼──────────┤

  Total: 1 hour and 35 minutes
  → "From 10:45 to 12:20 is 1 hour and 35 minutes."
```

### Chunked breakdown (break_into_steps: true)

The timeline is segmented at hour boundaries:
1. 10:45 → 11:00 = 15 minutes (to the next hour)
2. 11:00 → 12:00 = 1 hour (full hour)
3. 12:00 → 12:20 = 20 minutes (remaining)

Each segment is visually labeled and color-coded. This makes the "borrowing across
the hour" visible and concrete.

### SVG/HTML rendering

1. Horizontal bar from start to end time
2. Hour boundaries marked with light vertical lines
3. Each segment between boundaries gets a distinct shade and duration label
4. Start and end times labeled above/below with both 12h and 24h formats
5. Total duration in a highlighted box below
6. Optional clock face diagrams at start and end (simple, with hour and minute hands)
7. For RTL locales, timeline flows right-to-left

## Time parsing

Accept flexible input:
- "10:45" → 10:45 (assume AM if before 1:00 without qualifier)
- "10:45 AM" → 10:45
- "2:30 PM" → 14:30
- "14:00" → 2:00 PM
- "noon" → 12:00 PM
- "midnight" → 12:00 AM

If the end time is earlier than the start time, assume it's the next day:
- "11:00 PM" to "2:00 AM" → 3 hours (crossing midnight)

## Plain-language summary

Always state the result in natural language:

> "From 10:45 in the morning to 12:20 in the afternoon is 1 hour and 35 minutes."

For the chunked breakdown:
> "First, 15 minutes to get to 11 o'clock. Then a full hour to noon. Then 20 more
> minutes to 12:20. Altogether, that's 1 hour and 35 minutes."

## Edge cases

- **Same time**: "These are the same time — no time has passed."
- **Exactly on the hour**: Skip the partial-hour chunks. "From 10:00 to 12:00 is
  exactly 2 hours."
- **Over 24 hours**: Warn: "This spans more than a full day. Did you mean the same
  day, or the next day?"
- **Overnight**: If crossing midnight, explicitly state: "This crosses midnight — it
  goes from [day 1 time] to [day 2 time]."
