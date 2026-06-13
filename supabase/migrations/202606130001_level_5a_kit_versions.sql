create table if not exists public.kit_versions (
  id uuid primary key,
  kit_name text not null default '',
  branch text not null default '',
  version text not null,
  status text not null default 'Draft'
    check (status in ('Draft', 'Template Test', 'In Review', 'Approved', 'Archived')),
  qc_status text not null default 'Not Reviewed'
    check (qc_status in ('Not Reviewed', 'Needs Repair', 'Passed')),
  sale_ready boolean not null default false,
  dochub_ready boolean not null default false,
  notes text not null default '',
  draft_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists kit_versions_updated_at_idx
  on public.kit_versions (updated_at desc);

create index if not exists kit_versions_kit_name_idx
  on public.kit_versions (kit_name);

alter table public.kit_versions enable row level security;
