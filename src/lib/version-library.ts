import { BUILDER_STORAGE_KEY, normalizeDraft, type BuilderDraft } from "./builder-content";

export const VERSION_LIBRARY_STORAGE_KEY = "best_collective_version_library";

export type VersionStatus = "Draft" | "Template Test" | "In Review" | "Approved" | "Archived";
export type VersionQcStatus = "Not Reviewed" | "Needs Repair" | "Passed";

export type KitVersionRecord = {
  id: string;
  kitName: string;
  branch: string;
  version: string;
  status: VersionStatus;
  qcStatus: VersionQcStatus;
  saleReady: boolean;
  docHubReady: boolean;
  notes: string;
  createdAt: string;
  lastUpdated: string;
  draft: BuilderDraft;
};

export function loadVersionLibrary(): KitVersionRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(VERSION_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as KitVersionRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeVersionRecord).filter(Boolean) as KitVersionRecord[];
  } catch {
    return [];
  }
}

export function saveVersionLibrary(records: KitVersionRecord[]): KitVersionRecord[] {
  const normalized = records.map(normalizeVersionRecord).filter(Boolean) as KitVersionRecord[];
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(VERSION_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore quota or privacy-mode storage failures.
    }
  }
  return normalized;
}

export function createVersionFromDraft(
  records: KitVersionRecord[],
  draft: BuilderDraft,
): KitVersionRecord {
  const normalizedDraft = normalizeDraft({
    ...draft,
    source: draft.source === "sample" ? "sample" : "current",
  });
  const now = new Date().toISOString();
  const versionNumber = nextVersionNumber(records, normalizedDraft.kitName);

  return {
    id: createId("version"),
    kitName: normalizedDraft.kitName,
    branch: normalizedDraft.branch,
    version: `v${versionNumber}`,
    status: "Draft",
    qcStatus: "Not Reviewed",
    saleReady: false,
    docHubReady: false,
    notes: "",
    createdAt: now,
    lastUpdated: now,
    draft: {
      ...normalizedDraft,
      lastSaved: normalizedDraft.lastSaved ?? now,
    },
  };
}

export function duplicateVersionRecord(
  records: KitVersionRecord[],
  record: KitVersionRecord,
): KitVersionRecord {
  const now = new Date().toISOString();
  const draft = normalizeDraft({
    ...record.draft,
    source: "current",
    lastSaved: now,
  });

  return {
    ...record,
    id: createId("version"),
    version: `v${nextVersionNumber(records, record.kitName)}`,
    status: "Draft",
    qcStatus: "Not Reviewed",
    saleReady: false,
    docHubReady: false,
    notes: "",
    createdAt: now,
    lastUpdated: now,
    draft,
  };
}

export function updateVersionRecord(
  records: KitVersionRecord[],
  id: string,
  patch: Partial<
    Pick<KitVersionRecord, "status" | "qcStatus" | "saleReady" | "docHubReady" | "notes">
  >,
): KitVersionRecord[] {
  const now = new Date().toISOString();
  return records.map((record) =>
    record.id === id ? { ...record, ...patch, lastUpdated: now } : record,
  );
}

export function openVersionDraftInBuilder(record: KitVersionRecord): BuilderDraft {
  const draft = normalizeDraft({
    ...record.draft,
    source: "current",
    lastSaved: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota or privacy-mode storage failures.
    }
  }

  return draft;
}

export function displayKitName(kitName: string): string {
  return kitName.trim() ? kitName : "Untitled";
}

function normalizeVersionRecord(record: Partial<KitVersionRecord>): KitVersionRecord | null {
  if (!record || !record.draft) return null;
  const draft = normalizeDraft(record.draft);
  const now = new Date().toISOString();

  return {
    id: record.id ?? createId("version"),
    kitName: record.kitName ?? draft.kitName,
    branch: record.branch ?? draft.branch,
    version: record.version ?? "v1",
    status: record.status ?? "Draft",
    qcStatus: record.qcStatus ?? "Not Reviewed",
    saleReady: Boolean(record.saleReady),
    docHubReady: Boolean(record.docHubReady),
    notes: record.notes ?? "",
    createdAt: record.createdAt ?? now,
    lastUpdated: record.lastUpdated ?? record.createdAt ?? now,
    draft,
  };
}

function nextVersionNumber(records: KitVersionRecord[], kitName: string): number {
  const matching = records.filter((record) => record.kitName === kitName);
  const highest = matching.reduce((max, record) => {
    const match = record.version.match(/^v(\d+)$/i);
    const value = match ? Number.parseInt(match[1], 10) : 0;
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return highest + 1;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
