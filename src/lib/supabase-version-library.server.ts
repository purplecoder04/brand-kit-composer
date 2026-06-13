import { createBlankBuilderDraft, normalizeDraft, type BuilderDraft } from "./builder-content";
import {
  createVersionFromDraft,
  type KitVersionRecord,
  type VersionQcStatus,
  type VersionStatus,
} from "./version-library";

type KitVersionRow = {
  id: string;
  kit_name: string | null;
  branch: string | null;
  version: string | null;
  status: VersionStatus | null;
  qc_status: VersionQcStatus | null;
  sale_ready: boolean | null;
  dochub_ready: boolean | null;
  notes: string | null;
  draft_json: BuilderDraft | null;
  created_at: string | null;
  updated_at: string | null;
};

type VersionPatch = Partial<
  Pick<KitVersionRecord, "status" | "qcStatus" | "saleReady" | "docHubReady" | "notes">
>;

type SupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

export class SupabaseVersionLibraryUnavailableError extends Error {
  constructor() {
    super("Supabase Version Library is not configured.");
    this.name = "SupabaseVersionLibraryUnavailableError";
  }
}

export async function listSupabaseVersions(): Promise<KitVersionRecord[]> {
  const rows = await supabaseRequest<KitVersionRow[]>(
    "kit_versions?select=*&order=updated_at.desc,created_at.desc",
  );
  return rows.map(rowToRecord);
}

export async function createSupabaseVersionFromDraft(
  draft: BuilderDraft,
): Promise<KitVersionRecord> {
  const normalizedDraft = normalizeDraft({
    ...draft,
    source: draft.source === "sample" ? "sample" : "current",
    lastSaved: draft.lastSaved ?? new Date().toISOString(),
  });
  const existing = await listSupabaseVersions();
  const record = {
    ...createVersionFromDraft(existing, normalizedDraft),
    id: crypto.randomUUID(),
  };
  return insertSupabaseVersion(record);
}

export async function duplicateSupabaseVersion(id: string): Promise<KitVersionRecord> {
  const source = await getSupabaseVersion(id);
  const existing = await listSupabaseVersions();
  const now = new Date().toISOString();
  const record: KitVersionRecord = {
    ...source,
    id: crypto.randomUUID(),
    version: `v${nextVersionNumber(existing, source.kitName)}`,
    status: "Draft",
    qcStatus: "Not Reviewed",
    saleReady: false,
    docHubReady: false,
    notes: "",
    createdAt: now,
    lastUpdated: now,
    draft: normalizeDraft({
      ...source.draft,
      source: "current",
      lastSaved: now,
    }),
  };

  return insertSupabaseVersion(record);
}

export async function updateSupabaseVersion(
  id: string,
  patch: VersionPatch,
): Promise<KitVersionRecord> {
  const payload: Partial<KitVersionRow> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.status !== undefined) payload.status = patch.status;
  if (patch.qcStatus !== undefined) payload.qc_status = patch.qcStatus;
  if (patch.saleReady !== undefined) payload.sale_ready = patch.saleReady;
  if (patch.docHubReady !== undefined) payload.dochub_ready = patch.docHubReady;
  if (patch.notes !== undefined) payload.notes = patch.notes;

  const rows = await supabaseRequest<KitVersionRow[]>(
    `kit_versions?id=eq.${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(payload),
    },
  );

  if (!rows[0]) throw new Error("Version record was not found.");
  return rowToRecord(rows[0]);
}

async function insertSupabaseVersion(record: KitVersionRecord): Promise<KitVersionRecord> {
  const rows = await supabaseRequest<KitVersionRow[]>("kit_versions", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(recordToRow(record)),
  });

  if (!rows[0]) throw new Error("Version record was not saved.");
  return rowToRecord(rows[0]);
}

async function getSupabaseVersion(id: string): Promise<KitVersionRecord> {
  const rows = await supabaseRequest<KitVersionRow[]>(
    `kit_versions?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
  );
  if (!rows[0]) throw new Error("Version record was not found.");
  return rowToRecord(rows[0]);
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const config = getSupabaseConfig();
  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("authorization", `Bearer ${config.serviceRoleKey}`);
  headers.set("content-type", "application/json");

  const response = await fetch(`${config.url}/rest/v1/${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Supabase request failed: ${response.status} ${body}`);
  }

  return (await response.json()) as T;
}

function getSupabaseConfig(): SupabaseConfig {
  const url = (process.env.KIT_SUPABASE_URL ?? process.env.SUPABASE_URL)?.replace(/\/+$/, "");
  const serviceRoleKey =
    process.env.KIT_SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new SupabaseVersionLibraryUnavailableError();
  }

  return { url, serviceRoleKey };
}

function rowToRecord(row: KitVersionRow): KitVersionRecord {
  const now = new Date().toISOString();
  const draft = normalizeDraft(row.draft_json ?? createBlankBuilderDraft());
  return {
    id: row.id,
    kitName: row.kit_name ?? "",
    branch: row.branch ?? draft.branch,
    version: row.version ?? "v1",
    status: row.status ?? "Draft",
    qcStatus: row.qc_status ?? "Not Reviewed",
    saleReady: Boolean(row.sale_ready),
    docHubReady: Boolean(row.dochub_ready),
    notes: row.notes ?? "",
    createdAt: row.created_at ?? now,
    lastUpdated: row.updated_at ?? row.created_at ?? now,
    draft,
  };
}

function recordToRow(record: KitVersionRecord): KitVersionRow {
  return {
    id: record.id,
    kit_name: record.kitName,
    branch: record.branch,
    version: record.version,
    status: record.status,
    qc_status: record.qcStatus,
    sale_ready: record.saleReady,
    dochub_ready: record.docHubReady,
    notes: record.notes,
    draft_json: record.draft,
    created_at: record.createdAt,
    updated_at: record.lastUpdated,
  };
}

function nextVersionNumber(records: KitVersionRecord[], kitName: string): number {
  const highest = records
    .filter((record) => record.kitName === kitName)
    .reduce((max, record) => {
      const match = record.version.match(/^v(\d+)$/i);
      const value = match ? Number.parseInt(match[1], 10) : 0;
      return Number.isFinite(value) ? Math.max(max, value) : max;
    }, 0);
  return highest + 1;
}
