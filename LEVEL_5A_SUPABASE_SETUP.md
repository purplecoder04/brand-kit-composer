# Level 5A Supabase Setup

Best Collective Kit Factory uses Supabase only as a private internal save/load database.

Do not add customer login, customer dashboards, marketplace, checkout, or buyer-facing delivery features for Level 5A.

## Required Environment Values

Set these as local/private environment values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Never commit real Supabase keys. Use `.env.example` only as a placeholder reference.

## Database Table

Run the migration in:

`supabase/migrations/202606130001_level_5a_kit_versions.sql`

It creates the first Level 5A table:

- `kit_versions`

This table stores Version Library metadata and the full Level 3 builder draft in `draft_json`.

## Level 5A Pass Test

1. Open `/builder`.
2. Save a kit named `Test Kit Erica` to Version Library.
3. Open `/version-library`.
4. Refresh the browser and confirm the version remains.
5. Open the version in Builder and confirm all blocks are preserved.
6. Save the same kit again and confirm a new version is created.
7. Duplicate, archive, update QC, update sale-ready, update DocHub-ready, and edit notes.
8. Print/Save as PDF and confirm the existing locked Brand Template V1 output still works.
