---
name: writing-scaffold
description: Generate structured writing frameworks with sentence starters, transitions, and organizers
---

# Writing Scaffold

Provide structured writing support that reduces the cognitive load of organizing and expressing ideas in written form — a common area of difficulty for dyslexic writers (dysgraphia co-occurrence).

## Why This Helps

Written expression challenges in dyslexia stem from multiple compounding factors:

- **Working memory overload**: Simultaneously managing spelling, grammar, punctuation, sentence structure, paragraph organization, and content generation
- **Sequencing difficulty**: Organizing ideas into a logical flow
- **Automaticity deficit**: Basic transcription (spelling, handwriting) isn't automatic, consuming attention that should go to composition
- **Avoidance patterns**: Reliance on simple, familiar words and short sentences to avoid spelling errors, leading to writing that undersells the student's knowledge

Scaffolds reduce load by **externalizing the organizational structure**, letting the writer focus on one thing at a time: first ideas, then organization, then language.

## Behavior

Given a writing task:

1. **Analyze the task**: Identify the writing type (persuasive, narrative, expository, descriptive, compare-contrast, etc.), expected length, and audience.

2. **Generate graphic organizer** (if `include_organizer` is true):
   - **Essay**: Outline with thesis → body point slots → conclusion
   - **Story**: Story mountain (exposition → rising action → climax → falling action → resolution)
   - **Compare-contrast**: Venn diagram or T-chart template
   - **Report**: Section headers with bullet-point slots
   - **Letter/Email**: Opening → purpose → details → closing template

3. **Provide sentence starters** (if `include_starters` is true): 2–3 options per section, matched to the writing type and reading level.

   **Persuasive essay example (middle-school level):**
   ```
   Introduction:
     • "Have you ever wondered why ___?"
     • "Many people believe ___, but ___."
     • "Imagine a world where ___."

   Body paragraph:
     • "One important reason is ___."
     • "For example, ___."
     • "This shows that ___."

   Conclusion:
     • "For all these reasons, ___."
     • "Next time you think about ___, remember ___."
   ```

4. **Provide transition bank** (if `include_transitions` is true): Organized by purpose, not alphabetically.

   ```
   Adding ideas:     also, in addition, furthermore, another reason
   Contrasting:      however, on the other hand, although, unlike
   Giving examples:  for example, such as, specifically, to illustrate
   Showing cause:    because, as a result, therefore, this leads to
   Concluding:       in conclusion, overall, to sum up, finally
   Time/sequence:    first, next, then, after that, finally, meanwhile
   ```

## Output Format

Present the scaffold as a **fillable template** — the writer sees the structure with blanks to fill, not a completed example. This prevents the scaffold from becoming something to copy rather than a thinking tool.

```
═══ YOUR ESSAY PLAN ═══

TOPIC: [recycling]

🎯 THESIS (your main argument):
   "I believe that ___ because ___, ___, and ___."

📝 BODY PARAGRAPH 1:
   Topic sentence: "One important reason is ___."
   Evidence: "For example, ___."
   Explain: "This shows that ___."

📝 BODY PARAGRAPH 2:
   Topic sentence: "Another reason is ___."
   Evidence: "___."
   Explain: "This matters because ___."

📝 BODY PARAGRAPH 3:
   Topic sentence: "Finally, ___."
   Evidence: "___."
   Explain: "___."

🏁 CONCLUSION:
   Restate thesis: "For all these reasons, ___."
   Final thought: "___."
```

## Difficulty Scaling

- **Elementary**: Simple 3-sentence paragraph scaffold (topic + detail + closing). Basic transition words (first, next, last).
- **Middle school**: 5-paragraph essay structure. Varied sentence starters.
- **High school**: More complex organizational patterns (argument with counterargument, research paper). Academic transitions.
- **Adult**: Professional formats (memo, proposal, report). Tone-appropriate starters.

## Edge Cases

- **Creative writing**: Offer looser scaffolds — story elements checklist rather than fill-in-the-blank templates.
- **Very short tasks**: For a single paragraph, provide just sentence starters — no full organizer.
- **Exam/timed writing**: Provide a quick-plan template (2-minute planning scaffold) rather than a full framework.
- **Multilingual writers**: Note cognate transitions where the user's first language shares academic vocabulary with the target language.
