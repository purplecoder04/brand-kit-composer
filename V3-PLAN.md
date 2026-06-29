# Best Collective Kit Factory V3 Plan

## V3 Focus

V3 is focused on making the internal production workflow stronger, smoother, and more reliable without adding customer-facing features.

Do not add:
- customer login
- checkout
- marketplace
- ZIP packaging
- AI writing
- redesigns of the workbook templates
- a new PDF system

## Fillable Calibration MVP

### Goal

Make Auto Fill easier to trust by letting the app save small placement adjustments per page type. Auto Fill should still create the fields, but the placement should be tunable without hand-moving every individual field.

### Scope

- Keep current Auto Fill as the base.
- Add Adjust Auto Field Placement controls per page type.
- Add nudge controls for:
  - checklist boxes
  - writing lines
  - table fields
- Controls should include:
  - left
  - right
  - up
  - down
  - spacing
  - width
- Save calibration settings per page type.
- Auto Fill reads saved calibration settings on the next run.

### Guardrails

- No new PDF system.
- No drag per individual field.
- No ZIP packaging.
- No AI.
- No redesign.
- No customer-facing features.

### Expected Workflow

1. Open Fillable Fields.
2. Load or upload the final workbook PDF.
3. Run Auto Fill.
4. Open Adjust Auto Field Placement.
5. Nudge a whole field group until it lines up with the real PDF.
6. Save calibration.
7. Re-run Auto Fill later and have it use the saved placement settings.

### Acceptance Criteria

- Checklist calibration adjusts all checklist auto boxes for that page type.
- Writing-line calibration adjusts all auto writing fields for that page type.
- Table calibration adjusts all auto table fields for that page type.
- Saved calibration survives refresh.
- Auto Fill uses saved calibration on the next run.
- Manual fields still work.
- Save Field Map still works.
- Export Fillable PDF still uses the uploaded final PDF.
