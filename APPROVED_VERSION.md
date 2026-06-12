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
