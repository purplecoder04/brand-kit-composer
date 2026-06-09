## Goal

Build Phase 2: a **Kit Content Mapper** screen that lets the user paste/edit real kit content, see it rendered live inside the five locked Brand Template V1 pages, see overflow warnings, and print/save to PDF. Local state only. Templates, print CSS, and visual design are NOT touched.

## New route

`src/routes/_app.mapper.tsx` → `/mapper`, titled **Kit Content Mapper**. Add to the sidebar in `src/components/AppLayout.tsx` (icon: `Edit3` from lucide-react).

## Data flow (local state only)

- The mapper owns a single local React state object (`MapperContent`) initialized from the existing `SAMPLE_KIT`.
- Pure helper `buildBlocksFromMapper(content)` returns the fixed 5-block array in locked order: Cover → Divider → Lesson → Table → Workbook. No add/remove block UI — page count is permanently 5.
- The mapper writes that content into a reserved kit (`id: "mapper-preview"`) inside the existing `useKitStore` reducer on every change (debounced). This lets the existing `/print/$kitId` route render the mapped content with zero changes to the print pipeline.
- A one-time `useEffect` on mount inserts the `mapper-preview` kit into the store if absent. Branch profile is the existing `BRAND_PROFILE`.

## Form fields (left column, scrollable, grouped in shadcn `Card`s)

### Kit Info
- Kit Name, Subtitle, Branch (read-only "Brand"), Audience, Tone, Kit Tagline

### Cover Content
- **Cover Title** → `block.title`
- **Cover Subtitle** → `block.subtitle` (small line above title, e.g. "Best Collective")
- **Cover Keywords** → comma- or `•`-separated list rendered as the cover keyword line ("Structure • Legitimacy • Foundation"). Stored as `block.keywords?: string[]` — handled by a tiny non-template change in the mapper-to-block mapping only; the CoverTemplate already renders three pillar words and stays untouched. The mapper passes the parsed keywords through the existing pillar slot, falling back to "Structure • Legitimacy • Foundation" if empty. **Kit Tagline / description remain a separate field** (`block.body` on the cover) and are NOT overwritten by Cover Keywords.

### Section Content
- Section Label (eyebrow → `block.title`), Section Title (display → `block.subtitle`)

### Lesson Content
- Lesson Label (eyebrow → `block.subtitle`), Lesson Title (→ `block.title`), Lesson Body (multiline → `block.body`)

### Table / Tracker Content
- Table Title, Table Subtitle
- Column 1/2/3 Header inputs
- Repeatable Row entries with **+ Add Row** and **× Remove** per row. Real `<table>` preserved by TableTemplate (untouched).

### Workbook Content
- Workbook Label, Workbook Title, Workbook Prompt (textarea), Number of Writing Lines (number input, clamped 4–20 to match the existing template)

All inputs use existing shadcn primitives.

## Buttons (sticky toolbar above the form)

- **Generate Preview** — forces a sync + scrolls preview to top
- **Print / Save as PDF** — opens `/print/mapper-preview?filter=all` in a new tab
- **Reset to Sample Content** — repopulates form from `SAMPLE_KIT`
- **Clear All** — empties every text field; table → one empty row; workbook lines → 12; keywords cleared (cover then renders default pillars)

## Live preview (right column)

- Reuses existing `PagePreview` + `PageRenderer` — the same components used in `/print-preview` — so the rendered preview IS locked Brand Template V1.
- Renders the 5 blocks at `scale={0.55}` stacked vertically with "Page N of 5" caption.
- No template edits.

## Overflow warnings

Pure helper `getOverflowWarnings(content)` returning human-readable warnings, shown as a yellow `Alert` panel above the preview AND inline next to the relevant form section. Heuristics (no auto-shrink, no silent truncation):

- Lesson body > 1,400 characters → "Lesson body may overflow the page."
- Lesson body paragraph count > 6 → "Lesson has many paragraphs; consider splitting."
- Table rows > 12 → "Table has too many rows for one page."
- Any table cell > 90 chars → "A table cell is too long and may wrap or clip."
- Workbook prompt > 280 chars AND lines > 12 → "Long prompt with many lines may reduce writing space."
- Workbook lines outside 4–20 → "Writing lines should be between 4 and 20."
- Cover title > 32 chars → "Cover title may not fit on one line."
- Cover keywords list > 4 items → "Too many cover keywords; recommended 2–4."
- Section title > 40 chars → "Section title may wrap awkwardly."

## Print / PDF (unchanged pipeline)

- `/print/mapper-preview?filter=all` reuses the existing `PrintRoute`, which already enforces 5 pages, page-break CSS, and the print-only system font overrides from Phase 1.
- No changes to `styles.css`, `PageCanvas`, or any template.

## Files to add

- `src/routes/_app.mapper.tsx` — Kit Content Mapper screen (form + preview + warnings + buttons)
- `src/lib/mapper-content.ts` — `MapperContent` type, `SAMPLE_MAPPER_CONTENT`, `EMPTY_MAPPER_CONTENT`, `buildBlocksFromMapper(content)`, `getOverflowWarnings(content)`

## Files to edit (small, additive only)

- `src/components/AppLayout.tsx` — add nav entry `{ to: "/mapper", label: "Kit Content Mapper", icon: Edit3 }`
- `src/lib/kit-store.tsx` — add `upsertMapperKit(content)` helper that creates the reserved `mapper-preview` kit and updates its 5 blocks; no behavior change for existing kits
- `src/lib/kit-types.ts` — extend `Block` with optional `keywords?: string[]` (additive, ignored by every existing template; the mapper passes parsed keywords through as an alternative pillar list)
- `src/components/templates/CoverTemplate.tsx` — read `block.keywords` IF present and render those in the existing pillar slot, else render the existing default "Structure / Legitimacy / Foundation" pillars. **No layout, font, spacing, color, or decoration changes** — purely a content swap inside the slot that already exists. This is the minimum needed to honor your correction without redesigning the template; if you would rather keep CoverTemplate byte-identical and never read keywords, I will skip this edit and the keyword line will simply remain the hard-coded default.

## Files NOT touched

- SectionDividerTemplate, LessonTemplate, TableTemplate, WorkbookTemplate
- PageCanvas, `_decor.tsx`
- `styles.css` (print pipeline locked)
- `print.$kitId.tsx`
- `branch-profile.ts`, `sample-kit.ts`

## Success criteria

- `/mapper` reachable from sidebar
- Editing any field updates the live 5-page preview using locked V1 templates
- Cover Keywords drives the keyword/pillar line; Cover Subtitle and Kit Tagline remain independent
- Overflow warnings appear/disappear correctly
- Print / Save as PDF yields exactly 5 pages, print-safe fonts, correct page numbering, real table, spacious workbook lines, 8.5×11
- Reset and Clear behave as described
- No template/visual/print-styling changes beyond the single CoverTemplate content-slot swap noted above (or zero changes if you reject that edit)
