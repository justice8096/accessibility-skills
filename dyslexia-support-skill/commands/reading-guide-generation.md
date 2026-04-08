# Reading Guide Generation

Generate a structured reading guide that helps dyslexic readers navigate a document.

## Process

1. Analyze the document structure and identify natural break points
2. Chunk the content into manageable sections based on the specified chunk size
3. For each chunk, generate:
   - A brief preview of what the section covers
   - Vocabulary preview for difficult or unfamiliar words
   - Key points to watch for while reading
4. After each chunk, add a comprehension checkpoint with 1-2 questions
5. Provide a final summary connecting all sections

## Output Format

Return a structured guide with numbered sections, each containing:
- Section header and preview
- Vocabulary list (if enabled)
- The reading chunk reference
- Comprehension checkpoint (if enabled)
