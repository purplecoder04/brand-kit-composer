## Goal

Eliminate Type 3 font output in the exported PDF without changing the approved visual design, layout, page count, or page order.

## Root cause

The print route relies on Google-hosted `Cormorant Garamond` and `Inter`. When the browser's "Save as PDF" runs, those webfonts get embedded as Type 3 subsets. The fix is to force PDF-safe system fonts in print mode only — screen preview keeps the existing webfonts.

## Changes (print/PDF only, no design edits)

### 1. `src/styles.css` — add print-only font overrides

Append to the existing `@media print { ... }` block:

```css
@media print {
  /* PDF-safe font stacks — avoid Type 3 embedding from web fonts */
  html, body, .page-canvas, .page-canvas * {
    font-family: Arial, Helvetica, system-ui, sans-serif !important;
  }
  .page-canvas h1,
  .page-canvas h2,
  .page-canvas h3,
  .page-canvas [data-font-display],
  .page-canvas .font-display {
    font-family: Georgia, Cambria, "Times New Roman", serif !important;
  }
}
```

This single rule remaps every template (Cover, Divider, Lesson, Table, Workbook) at print time because every page renders inside `.page-canvas`. No template files need to change.

### 2. `src/routes/print.$kitId.tsx` — drop webfont dependency for the print route

- Remove the Google Fonts `<link>` from the print document head for this route only (add a route-level `head()` that omits the font links and instead injects a small inline `<style>` that re-declares the print font stacks above, so even on-screen preview of the print route uses system fonts and matches the PDF output 1:1).
- Keep the existing layout, the Print button, page break classes, and page sizing untouched.

### 3. `src/routes/__root.tsx` — scope Google Fonts to non-print routes

Leave the Google Fonts links in `__root.tsx` (so the builder/preview UI keeps the designed look on screen), but the print route's own `head()` will not add anything that re-pulls those fonts. The `@media print` overrides in styles.css guarantee that even if a webfont loads in the print route's browser tab, the PDF rasterizes with Georgia/Arial.

## Explicitly NOT changing

- No template redesign (Cover, Divider, Lesson, Table, Workbook all untouched).
- No layout, color, page count, page order, footer, or page numbering changes.
- No removal of decorative SVGs (they are inline SVG, not glyph fonts — safe).
- No conversion of text to images/outlines.
- No new features, no Supabase/auth/AI work.

## Verification

After applying:
1. Open `/print/sample-gybs` in the preview, trigger Save as PDF.
2. Confirm 5 pages, Letter size, page numbers correct, table intact, workbook lines intact, text selectable.
3. Inspect the PDF (e.g. `pdffonts file.pdf`) — expect only TrueType/Type1 entries (Georgia, Arial, or their substitutes), no Type 3.
