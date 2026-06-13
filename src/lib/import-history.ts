import type { BuilderDraft } from "./builder-content";

export const IMPORT_HISTORY_STORAGE_KEY = "best_collective_import_history";

export type ImportFileType = "txt" | "md" | "docx" | "paste" | "unknown";

export type ImportHistoryRecord = {
  id: string;
  fileName: string;
  fileType: ImportFileType;
  importedAt: string;
  kitName: string;
  blockCount: number;
  warningCount: number;
  createdBuilderDraft: boolean;
  rawText: string;
  draft: BuilderDraft;
};

export function loadImportHistory(): ImportHistoryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(IMPORT_HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHistoryRecord).filter(Boolean) as ImportHistoryRecord[];
  } catch {
    return [];
  }
}

export function saveImportHistory(records: ImportHistoryRecord[]): ImportHistoryRecord[] {
  const next = records.slice(0, 25);

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(IMPORT_HISTORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage failures so importing still works.
    }
  }

  return next;
}

export function addImportHistoryRecord(input: {
  fileName: string;
  fileType: ImportFileType;
  rawText: string;
  draft: BuilderDraft;
  warningCount: number;
  createdBuilderDraft?: boolean;
}): ImportHistoryRecord[] {
  const record: ImportHistoryRecord = {
    id: createId(),
    fileName: input.fileName,
    fileType: input.fileType,
    importedAt: new Date().toISOString(),
    kitName: input.draft.kitName,
    blockCount: input.draft.blocks.length,
    warningCount: input.warningCount,
    createdBuilderDraft: input.createdBuilderDraft ?? false,
    rawText: input.rawText,
    draft: input.draft,
  };

  return saveImportHistory([record, ...loadImportHistory()]);
}

export function markImportCreated(recordId: string): ImportHistoryRecord[] {
  return saveImportHistory(
    loadImportHistory().map((record) =>
      record.id === recordId ? { ...record, createdBuilderDraft: true } : record,
    ),
  );
}

export function clearImportHistory(): ImportHistoryRecord[] {
  return saveImportHistory([]);
}

export function detectImportFileType(fileName: string): ImportFileType {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "txt" || extension === "md" || extension === "docx") return extension;
  return "unknown";
}

function normalizeHistoryRecord(record: Partial<ImportHistoryRecord>): ImportHistoryRecord | null {
  if (!record || typeof record !== "object" || !record.draft) return null;

  return {
    id: record.id ?? createId(),
    fileName: record.fileName ?? "Pasted content",
    fileType: record.fileType ?? "unknown",
    importedAt: record.importedAt ?? new Date().toISOString(),
    kitName: record.kitName ?? record.draft.kitName ?? "",
    blockCount: Number(record.blockCount ?? record.draft.blocks?.length ?? 0),
    warningCount: Number(record.warningCount ?? 0),
    createdBuilderDraft: Boolean(record.createdBuilderDraft),
    rawText: record.rawText ?? "",
    draft: record.draft,
  };
}

function createId(): string {
  return `import-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
