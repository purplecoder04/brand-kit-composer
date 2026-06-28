import { buildPagesFromKitDraft, normalizeDraft, type BuilderDraft } from "./builder-content";
import type { PageType } from "./kit-types";
import type { KitVersionRecord } from "./version-library";

export const FILLABLE_FIELD_MAP_STORAGE_KEY = "best_collective_fillable_field_maps";
export const FILLABLE_FIELD_SOURCE_STORAGE_KEY = "best_collective_fillable_field_source";

export type FillableFieldType = "text" | "multiline" | "checkbox";

export type FillableField = {
  id: string;
  name: string;
  type: FillableFieldType;
  pageNumber: number;
  blockId?: string;
  pageType: PageType;
  xPercent: number;
  yPercent: number;
  widthPercent: number;
  heightPercent: number;
};

export type FillableFieldInput = {
  name?: string;
  type: FillableFieldType;
  pageNumber: number;
  blockId?: string;
  pageType: PageType;
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
};

export type FillableFieldMapRecord = {
  id: string;
  sourceKitId?: string;
  sourceVersionId?: string;
  kitName: string;
  branch: string;
  sourceLabel: string;
  pageCount: number;
  fields: FillableField[];
  draft?: BuilderDraft;
  createdAt: string;
  updatedAt: string;
};

export type FillableFieldSource = {
  draft: BuilderDraft;
  sourceLabel: string;
  sourceKitId?: string;
  sourceVersionId?: string;
};

export function loadFillableFieldMaps(): FillableFieldMapRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(FILLABLE_FIELD_MAP_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<FillableFieldMapRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeFieldMapRecord)
      .filter((record): record is FillableFieldMapRecord => Boolean(record));
  } catch {
    return [];
  }
}

export function saveFillableFieldMaps(records: FillableFieldMapRecord[]): FillableFieldMapRecord[] {
  const normalized = records
    .map(normalizeFieldMapRecord)
    .filter((record): record is FillableFieldMapRecord => Boolean(record));

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FILLABLE_FIELD_MAP_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore browser storage failures.
    }
  }

  return normalized;
}

export function findFieldMapForVersion(
  records: FillableFieldMapRecord[],
  versionId: string,
): FillableFieldMapRecord | null {
  return records.find((record) => record.sourceVersionId === versionId) ?? null;
}

export function findFieldMapForDraft(
  records: FillableFieldMapRecord[],
  draft: BuilderDraft,
): FillableFieldMapRecord | null {
  const normalized = normalizeDraft(draft);
  return (
    records.find((record) => record.sourceKitId === normalized.id && !record.sourceVersionId) ??
    null
  );
}

export function upsertFillableFieldMap(
  records: FillableFieldMapRecord[],
  record: FillableFieldMapRecord,
): FillableFieldMapRecord[] {
  const next = normalizeFieldMapRecord({
    ...record,
    updatedAt: new Date().toISOString(),
  }) as FillableFieldMapRecord;
  return saveFillableFieldMaps([next, ...records.filter((item) => item.id !== next.id)]);
}

export function deleteFillableFieldMap(
  records: FillableFieldMapRecord[],
  recordId: string,
): FillableFieldMapRecord[] {
  return saveFillableFieldMaps(records.filter((record) => record.id !== recordId));
}

export function createFieldMapForSource(
  source: FillableFieldSource,
  existing?: FillableFieldMapRecord | null,
): FillableFieldMapRecord {
  const draft = normalizeDraft(source.draft);
  const pages = buildPagesFromKitDraft(draft);
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? createId("field-map"),
    sourceKitId: source.sourceKitId ?? draft.id,
    sourceVersionId: source.sourceVersionId,
    kitName: draft.kitName,
    branch: draft.branch,
    sourceLabel: source.sourceLabel,
    pageCount: pages.length,
    fields: pruneStaleAutoFields(existing?.fields ?? [], pages),
    draft,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

export function saveFillableFieldSource(
  draft: BuilderDraft,
  source: string | { sourceLabel: string; sourceKitId?: string; sourceVersionId?: string },
): FillableFieldSource {
  const normalizedDraft = normalizeDraft(draft);
  const payload: FillableFieldSource =
    typeof source === "string"
      ? {
          draft: normalizedDraft,
          sourceLabel: source,
          sourceKitId: normalizedDraft.id,
        }
      : {
          draft: normalizedDraft,
          sourceLabel: source.sourceLabel,
          sourceKitId: source.sourceKitId ?? normalizedDraft.id,
          sourceVersionId: source.sourceVersionId,
        };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(FILLABLE_FIELD_SOURCE_STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore browser storage failures.
    }
  }

  return payload;
}

export function saveFillableFieldSourceFromVersion(record: KitVersionRecord): FillableFieldSource {
  return saveFillableFieldSource(record.draft, {
    sourceLabel: `${record.kitName.trim() || "Untitled"} ${record.version}`,
    sourceKitId: record.draft.id,
    sourceVersionId: record.id,
  });
}

export function loadFillableFieldSource(): FillableFieldSource | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(FILLABLE_FIELD_SOURCE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FillableFieldSource>;
    if (!parsed.draft) return null;
    return {
      draft: normalizeDraft(parsed.draft),
      sourceLabel: parsed.sourceLabel ?? "Current Builder Draft",
      sourceKitId: parsed.sourceKitId ?? parsed.draft.id,
      sourceVersionId: parsed.sourceVersionId,
    };
  } catch {
    return null;
  }
}

export function clearFillableFieldSource() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(FILLABLE_FIELD_SOURCE_STORAGE_KEY);
  } catch {
    // Ignore browser storage failures.
  }
}

export function fieldCounts(fields: FillableField[]) {
  return {
    total: fields.length,
    text: fields.filter((field) => field.type === "text").length,
    multiline: fields.filter((field) => field.type === "multiline").length,
    checkbox: fields.filter((field) => field.type === "checkbox").length,
  };
}

export function createFillableField({
  name,
  type,
  pageNumber,
  blockId,
  pageType,
  xPercent = 12,
  yPercent = 24,
  widthPercent,
  heightPercent,
}: FillableFieldInput): FillableField {
  const isCheckbox = type === "checkbox";
  return clampField({
    id: createId("field"),
    name: name ?? `${fieldTypeLabel(type)} ${Date.now().toString().slice(-4)}`,
    type,
    pageNumber,
    blockId,
    pageType,
    xPercent: clampPercent(xPercent),
    yPercent: clampPercent(yPercent),
    widthPercent: widthPercent ?? (isCheckbox ? 4 : type === "multiline" ? 44 : 38),
    heightPercent: heightPercent ?? (isCheckbox ? 3 : type === "multiline" ? 12 : 4),
  });
}

export function fieldTypeLabel(type: FillableFieldType): string {
  if (type === "multiline") return "Multiline";
  if (type === "checkbox") return "Checkbox";
  return "Text";
}

export function clampField(field: FillableField): FillableField {
  const widthPercent = Math.max(2, Math.min(90, Number(field.widthPercent) || 2));
  const heightPercent = Math.max(2, Math.min(80, Number(field.heightPercent) || 2));
  return {
    ...field,
    xPercent: Math.max(0, Math.min(100 - widthPercent, Number(field.xPercent) || 0)),
    yPercent: Math.max(0, Math.min(100 - heightPercent, Number(field.yPercent) || 0)),
    widthPercent,
    heightPercent,
  };
}

function normalizeFieldMapRecord(
  record: Partial<FillableFieldMapRecord>,
): FillableFieldMapRecord | null {
  if (!record) return null;
  const now = new Date().toISOString();
  return {
    id: record.id ?? createId("field-map"),
    sourceKitId: record.sourceKitId,
    sourceVersionId: record.sourceVersionId,
    kitName: record.kitName ?? "",
    branch: record.branch ?? "",
    sourceLabel: record.sourceLabel ?? "Current Builder Draft",
    pageCount: Number.isFinite(Number(record.pageCount)) ? Number(record.pageCount) : 0,
    fields: Array.isArray(record.fields)
      ? record.fields.map(normalizeField).filter((field): field is FillableField => Boolean(field))
      : [],
    draft: record.draft ? normalizeDraft(record.draft) : undefined,
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? record.createdAt ?? now,
  };
}

function normalizeField(field: Partial<FillableField>): FillableField | null {
  if (!field || !field.type || !field.pageNumber || !field.pageType) return null;
  if (field.type !== "text" && field.type !== "multiline" && field.type !== "checkbox") return null;
  return clampField({
    id: field.id ?? createId("field"),
    name: field.name ?? fieldTypeLabel(field.type),
    type: field.type,
    pageNumber: Number(field.pageNumber),
    blockId: field.blockId,
    pageType: field.pageType,
    xPercent: Number(field.xPercent) || 0,
    yPercent: Number(field.yPercent) || 0,
    widthPercent: Number(field.widthPercent) || 20,
    heightPercent: Number(field.heightPercent) || 4,
  });
}

function pruneStaleAutoFields(
  fields: FillableField[],
  pages: BuilderDraft["blocks"],
): FillableField[] {
  return fields.filter((field) => {
    const page = pages[field.pageNumber - 1];
    if (!page) return false;
    if (!isAutoGeneratedField(field)) return true;
    if (!isAutoCompatiblePageType(page.pageType)) return false;
    if (field.blockId && field.blockId !== page.id) return false;
    return field.pageType === page.pageType;
  });
}

function isAutoGeneratedField(field: FillableField): boolean {
  return field.name.startsWith("Auto ");
}

function isAutoCompatiblePageType(pageType: PageType): boolean {
  return (
    pageType === "workbook" ||
    pageType === "lesson-activity" ||
    pageType === "prompt-page" ||
    pageType === "multi-prompt" ||
    pageType === "notes" ||
    pageType === "reflection" ||
    pageType === "checklist" ||
    pageType === "table"
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
