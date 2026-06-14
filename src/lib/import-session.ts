import type { BuilderDraft } from "./builder-content";

export const IMPORT_SESSION_STORAGE_KEY = "best_collective_active_import_session";

export type ImportSession = {
  rawText: string;
  uploadedFileName: string;
  currentHistoryId: string | null;
  reviewDraft: BuilderDraft;
  savedAt: string;
};

export function loadImportSession(): ImportSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(IMPORT_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ImportSession>;
    if (!parsed.reviewDraft) return null;

    return {
      rawText: parsed.rawText ?? "",
      uploadedFileName: parsed.uploadedFileName ?? "",
      currentHistoryId: parsed.currentHistoryId ?? null,
      reviewDraft: parsed.reviewDraft,
      savedAt: parsed.savedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveImportSession(session: ImportSession) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(IMPORT_SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Import work should continue even if browser storage is unavailable.
  }
}

export function clearImportSession() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(IMPORT_SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage failures.
  }
}
