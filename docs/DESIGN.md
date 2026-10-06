# Report and terminal design direction

Driftline uses a restrained operational-report style rather than a “cyberpunk dashboard.” The primary focal element is the next safe action; status cards are secondary. A single-column reading path works at narrow terminal widths and in a printed report.

- Contrast: dark text on an off-white surface; status colors are paired with text labels and icons are not required for meaning.
- Grid: single-column at every width; generous spacing in HTML.
- Type: system UI font stack; heading 28px/1.15, body 16px/1.55, code/evidence 14px/1.45; body measures stay under 75 characters where possible.
- Severity: `Attention` uses dark amber, `Pass` dark teal, `Unknown` slate. Color is decorative, never the sole signal.
- RTL: `--lang ar` supplies experimental Arabic headings/control titles, `dir="rtl"`, logical CSS, and bidirectional isolation. Evidence/guidance remains English pending fluent review.

This applies the requested Designly composition, typographic hierarchy, accessible contrast, and RTL constraints without introducing a web dashboard or remote asset dependency.

Actual HTML uses a single column at every width. Browser checks at 1000px and 375px found no horizontal overflow. English/Arabic screenshots show explicitly synthetic examples. No image-generation claim is made.
