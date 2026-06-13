# Best Collective Kit Factory V1 - Internal Production Tool Scope Lock

Approved on: 2026-06-12

This app is locked as an internal production tool for building, saving, versioning, QC-tracking, and exporting Best Collective kit PDFs.

Product scope:
- Internal kit-building and production system only.
- The app is not a customer-facing website.
- The app is not a buyer dashboard, marketplace, checkout, customer portal, or delivery system.
- Website, sales pages, checkout, and customer delivery belong outside the Kit Factory app.

Locked rules:
- Do not redesign the locked Brand Template V1.
- Do not change /mapper unless fixing a confirmed Level 2 bug.
- Do not change /builder unless fixing a confirmed Level 3 bug.
- Do not change print CSS, fonts, page sizing, or approved PDF styling unless fixing a confirmed export bug.
- Do not add customer login, customer dashboard, marketplace, checkout, or buyer-facing delivery features.
- Do not add AI generation yet.
- Do not add new branch design support yet.
- Blank fields stay blank.
- Sample content only appears when Reset to Sample Content is clicked.

Next approved direction:
- Level 5 Supabase is for private internal save/load only.
- Level 5 should persist Version Library records and full builder drafts beyond localStorage.
- Level 5 should not add customer accounts, public access, buyer delivery, checkout, or marketplace behavior.

---

# Best Collective Kit Factory V1 - Level 5A Private Supabase Save/Load

Approved on: 2026-06-13

This version is locked as the approved Level 5A private Supabase save/load checkpoint.

Approved behavior:
- Supabase is connected as the private internal Version Library database.
- The `kit_versions` table exists.
- Row Level Security is enabled on `public.kit_versions`.
- Save to Version Library creates database version records.
- Version Library loads saved records from Supabase.
- Saved versions survive refresh, browser close, and reopen.
- Versions can reopen in /builder with full builder draft content.
- Saving the same kit again creates a new version record instead of overwriting.
- Versions can duplicate.
- Versions can archive without deleting.
- QC status can be updated and persists.
- Sale-ready status can be updated and persists.
- DocHub-ready status can be updated and persists.
- Notes can be added/edited and persist.
- Print/PDF still uses the existing locked builder pipeline.
- localStorage fallback remains available for testing or missing Supabase env values.
- /mapper remains untouched.
- /builder remains stable.
- Brand Template V1 remains locked.

Do not change Level 5A unless fixing a confirmed bug.
Do not add customer login, customer dashboard, marketplace, checkout, or buyer-facing delivery features.
Do not add AI generation yet.
Do not add branch design support yet.

---

# Best Collective Kit Factory V1 - Level 6 QC Report MVP

Approved on: 2026-06-13

This version is locked as the approved Level 6 internal QC Report MVP checkpoint.

Approved behavior:
- /qc runs QC against saved Version Library records.
- Version Library includes a Run QC action for saved versions.
- QC runs automatically when a saved version is selected.
- Clean/simple versions can pass QC.
- Broken versions correctly return Needs Repair.
- QC flags missing titles, missing workbook prompts, table issues, checklist issues, sample/placeholder wording, overflow risks, and DocHub readiness concerns.
- QC shows verdict, top blockers, all issues, and a repair prompt.
- Save QC Results writes QC status, sale-ready status, DocHub-ready status, and QC notes back to Version Library/Supabase.
- Print/PDF pipeline remains unchanged.
- /mapper remains untouched.
- /builder remains stable.
- Brand Template V1 remains locked.

Do not change Level 6 unless fixing a confirmed bug.
Do not add fillable PDF/DocHub field mapping until the next approved level.
Do not add AI generation yet.
Do not add customer-facing features.

---

# Best Collective Kit Factory V1 - Level 7 Production Dashboard

Approved on: 2026-06-13

This version is locked as the approved Level 7 Production Dashboard checkpoint.

Approved behavior:
- /dashboard is the internal production command center.
- Dashboard reads saved Version Library records from Supabase first, with local fallback.
- Dashboard shows total versions, drafts, needs repair, QC passed, sale-ready, DocHub-ready, and archived counts.
- Dashboard filters versions by all, drafts, needs repair, QC passed, sale-ready, DocHub-ready, and archived.
- Dashboard shows recent versions.
- Dashboard quick actions work for Open, Run QC, Archive, Repair, and Sale Ready.
- Dashboard status changes persist through the Version Library/Supabase path.
- /mapper remains untouched.
- /builder remains stable.
- /qc remains stable.
- Brand Template V1 remains locked.
- Print/PDF pipeline remains unchanged.

Do not change Level 7 unless fixing a confirmed bug.
Do not add customer-facing features.
Do not add AI generation yet.
Do not add branch design support yet.

---

# Best Collective Kit Factory V1 - Level 2 Content Mapper

Approved on: 2026-06-09

This version is locked as the approved Level 2 Content Mapper checkpoint.

Approved behavior:
- User content saves.
- Preview uses user content.
- Print/PDF uses user content.
- Blank fields stay blank.
- Sample content only appears when Reset to Sample Content is clicked.
- Table rows map correctly.
- Workbook title, prompt, and writing lines map correctly.
- PDF exports as clean 8.5 x 11 pages.
- Brand Template V1 styling stays locked.

Do not redesign the locked Brand Template V1.
Do not change the save, preview, or print flow unless fixing bugs.

---

# Best Collective Kit Factory V1 - Level 3A Multi-Page Builder

Approved on: 2026-06-09

This version is locked as the approved Level 3A Multi-Page Builder checkpoint.

Approved behavior:
- /builder exists as Multi-Page Kit Builder.
- /mapper remains locked as Level 2.
- Multiple blocks can be added.
- Blocks can be edited, duplicated, deleted, moved up, and moved down.
- Draft saves to localStorage key best_collective_level_3_kit.
- Preview and print use buildPagesFromKitDraft(draft).
- PDF prints all blocks in order.
- Page numbers update automatically.
- Blank fields stay blank.
- Sample content only loads when Reset to Sample Content is clicked.
- Brand Template V1 styling remains locked.
- No Supabase yet.
- No AI generation yet.
- No new branch support yet.

Do not change Level 3A unless fixing a confirmed bug.

---

# Best Collective Kit Factory V1 - Level 3B Checklist + Notes Blocks

Approved on: 2026-06-09

This version is locked as the approved Level 3B Checklist + Notes Blocks checkpoint.

Approved behavior:
- Checklist block works.
- Notes block works.
- Notes uses approved Workbook-style layout.
- Lesson block mapping works correctly.
- Multiple blocks print in order.
- Page numbers update automatically.
- No sample content appears unless Reset to Sample Content is clicked.
- Blank fields stay blank.
- Brand Template V1 styling remains locked.
- /mapper remains untouched.
- /builder remains stable.

Do not change Level 3B unless fixing a confirmed bug.

---

# Best Collective Kit Factory V1 - Level 4 Version Library

Approved on: 2026-06-09

This version is locked as the approved Level 4 Version Library checkpoint.

Approved behavior:
- Save to Version Library creates a new version record every time.
- Versions auto-increment by kit name.
- Full builder drafts are stored with each version.
- Versions can reopen in /builder.
- Versions can duplicate.
- Versions can archive without deleting.
- QC status can be updated.
- Sale-ready status can be updated.
- DocHub-ready status can be updated.
- Notes can be added/edited.
- /mapper remains untouched.
- /builder remains stable.
- Brand Template V1 remains locked.
- Print/PDF pipeline still works.

Do not change Level 4 unless fixing a confirmed bug.

---

# Best Collective Kit Factory V1 - Level 8A Paste Content Importer

Approved on: 2026-06-13

This version is locked as the approved Level 8A Paste Content Importer checkpoint.

Approved behavior:
- /import exists as the Paste Content Importer.
- Pasted kit content imports into the Builder.
- Imported drafts reload correctly in /builder.
- Lesson title and body map correctly.
- Workbook prompt maps correctly.
- Checklist items map correctly.
- Table headers and rows map correctly.
- Imported drafts keep blank fields blank.
- No sample content appears unless Reset to Sample Content is clicked.
- QC can catch real missing fields after import.
- Print/PDF pipeline still uses locked Brand Template V1.
- /mapper remains untouched.
- /builder remains stable.
- /version-library remains stable.
- /qc remains stable.
- /dashboard remains stable.
- Brand Template V1 styling remains locked.

Do not change Level 8A unless fixing a confirmed bug.
Do not add AI generation yet.
Do not add customer-facing features.
Do not add branch design support yet.

---

# Best Collective Kit Factory V1 - Level 8B Import Review

Approved on: 2026-06-13

This version is locked as the approved Level 8B Import Review checkpoint.

Approved behavior:
- Rough pasted kit content imports into the review screen.
- Importer detects modules, lessons, worksheets, checklists, trackers, and tables.
- Importer understands numbered headings, bullets, numbered items, and pipe table rows.
- Import review screen lets kit info be edited before creating a Builder draft.
- Import review screen lets block type, title, subtitle, body, prompt, writing lines, table headers, and table rows be edited before Builder.
- Detected blocks can be deleted before import.
- Reviewed content opens correctly in /builder.
- Print/PDF pipeline still uses locked Brand Template V1.
- QC still works on imported Builder drafts.
- /mapper remains untouched.
- /builder remains stable.
- /version-library remains stable.
- /qc remains stable.
- /dashboard remains stable.
- Brand Template V1 styling remains locked.

Do not change Level 8B unless fixing a confirmed bug.
Do not add AI generation yet.
Do not add customer-facing features.
Do not add branch design support yet.

---

# Best Collective Kit Factory V1 - Level 9A Text File Importer

Approved on: 2026-06-13

This version is locked as the approved Level 9A Text File Importer checkpoint.

Approved behavior:
- /import accepts .txt uploads.
- /import accepts .md uploads.
- Uploaded file text fills the importer text area.
- Uploaded .txt content flows through the approved Level 8B review screen.
- Uploaded .md content flows through the approved Level 8B review screen.
- Markdown headings parse into kit name, section/divider, or lesson blocks when appropriate.
- Review screen still allows kit info and detected blocks to be edited before Builder.
- Reviewed uploaded content opens correctly in /builder.
- Print/PDF pipeline still uses locked Brand Template V1.
- QC still works on uploaded/imported Builder drafts.
- /mapper remains untouched.
- /builder remains stable.
- /version-library remains stable.
- /qc remains stable.
- /dashboard remains stable.
- Brand Template V1 styling remains locked.

Do not change Level 9A unless fixing a confirmed bug.
Do not add Word document upload yet.
Do not add AI generation yet.
Do not add customer-facing features.
Do not add branch design support yet.
