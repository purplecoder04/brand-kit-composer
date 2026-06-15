import {
  buildPagesFromKitDraft,
  normalizeDraft,
  pageTypeLabel,
  type BuilderDraft,
} from "./builder-content";
import { resolveBranchProfile, type BranchProfile } from "./branch-profile";
import type { Block, PageType } from "./kit-types";

export const LESSON_GUIDE_STORAGE_KEY = "best_collective_lesson_guide_source";
export const LESSON_GUIDE_LIBRARY_STORAGE_KEY = "best_collective_lesson_guide_library";

export type LessonGuideSource = {
  id: string;
  sourceKitId?: string;
  sourceVersionId?: string;
  sourceLabel: string;
  generatedAt: string;
  draft: BuilderDraft;
};

export type LessonGuideLibraryRecord = {
  id: string;
  type: "lesson-guide";
  status: "generated";
  sourceKitId?: string;
  sourceVersionId?: string;
  kitName: string;
  branch: string;
  generatedAt: string;
  guideTitle: string;
  source: LessonGuideSource;
};

export type LessonGuideTeachingItem = {
  id: string;
  title: string;
  pageType: PageType;
  pageTypeLabel: string;
  summary: string;
  teachingNote: string;
  discussionQuestion: string;
  actionStep: string;
};

export type LessonGuideActivityItem = {
  id: string;
  title: string;
  pageType: PageType;
  pageTypeLabel: string;
  prompt: string;
  suggestedOutcome: string;
  facilitatorNotes: string;
};

export type LessonGuide = {
  kitName: string;
  subtitle: string;
  branch: string;
  audience: string;
  tone: string;
  tagline: string;
  generatedAt: string;
  totalWorkbookPages: number;
  totalLessonPages: number;
  totalWorkbookActionPages: number;
  branchProfile: BranchProfile;
  teachingFlow: LessonGuideTeachingItem[];
  activityMap: LessonGuideActivityItem[];
};

const TEACHING_FLOW_TYPES: PageType[] = [
  "start-here",
  "module-intro",
  "divider",
  "lesson",
  "quote",
  "case-study",
  "closing",
];

const ACTIVITY_TYPES: PageType[] = [
  "workbook",
  "notes",
  "reflection",
  "prompt-page",
  "action-plan",
  "checklist",
  "progress-check",
  "table",
];

type SaveLessonGuideSourceOptions = {
  sourceLabel?: string;
  sourceKitId?: string;
  sourceVersionId?: string;
};

export function saveLessonGuideSource(
  draft: BuilderDraft,
  sourceLabelOrOptions: string | SaveLessonGuideSourceOptions = "Current Builder Draft",
): LessonGuideSource {
  const options =
    typeof sourceLabelOrOptions === "string"
      ? { sourceLabel: sourceLabelOrOptions }
      : sourceLabelOrOptions;
  const normalizedDraft = normalizeDraft(draft);
  const source: LessonGuideSource = {
    id: createId("lesson-guide"),
    sourceKitId: options.sourceKitId ?? normalizedDraft.id,
    sourceVersionId: options.sourceVersionId,
    sourceLabel: options.sourceLabel ?? "Current Builder Draft",
    generatedAt: new Date().toISOString(),
    draft: normalizedDraft,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LESSON_GUIDE_STORAGE_KEY, JSON.stringify(source));
    } catch {
      // Ignore local browser storage failures.
    }
  }

  return source;
}

export function loadLessonGuideSource(): LessonGuideSource | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(LESSON_GUIDE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LessonGuideSource>;
    if (!parsed.draft) return null;

    return {
      id: parsed.id ?? createId("lesson-guide"),
      sourceKitId: parsed.sourceKitId,
      sourceVersionId: parsed.sourceVersionId,
      sourceLabel: parsed.sourceLabel ?? "Current Builder Draft",
      generatedAt: parsed.generatedAt ?? new Date().toISOString(),
      draft: normalizeDraft(parsed.draft),
    };
  } catch {
    return null;
  }
}

export function loadLessonGuideLibrary(): LessonGuideLibraryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LESSON_GUIDE_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<LessonGuideLibraryRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeLessonGuideRecord).filter(Boolean) as LessonGuideLibraryRecord[];
  } catch {
    return [];
  }
}

export function saveLessonGuideLibrary(
  records: LessonGuideLibraryRecord[],
): LessonGuideLibraryRecord[] {
  const normalized = records
    .map(normalizeLessonGuideRecord)
    .filter(Boolean) as LessonGuideLibraryRecord[];

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LESSON_GUIDE_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore local browser storage failures.
    }
  }

  return normalized;
}

export function saveLessonGuideRecord(source: LessonGuideSource): LessonGuideLibraryRecord {
  const normalizedSource = normalizeLessonGuideSource(source);
  const guide = buildLessonGuide(normalizedSource);
  const record: LessonGuideLibraryRecord = {
    id: normalizedSource.id,
    type: "lesson-guide",
    status: "generated",
    sourceKitId: normalizedSource.sourceKitId,
    sourceVersionId: normalizedSource.sourceVersionId,
    kitName: guide.kitName,
    branch: guide.branch,
    generatedAt: guide.generatedAt,
    guideTitle: `${guide.kitName || "Untitled Kit"} Lesson Guide`,
    source: normalizedSource,
  };
  const existing = loadLessonGuideLibrary();
  return saveLessonGuideLibrary([record, ...existing.filter((item) => item.id !== record.id)])[0];
}

export function openLessonGuideRecord(record: LessonGuideLibraryRecord): LessonGuideSource {
  const source = normalizeLessonGuideSource(record.source);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LESSON_GUIDE_STORAGE_KEY, JSON.stringify(source));
    } catch {
      // Ignore local browser storage failures.
    }
  }
  return source;
}

export function findLessonGuideForVersion(
  records: LessonGuideLibraryRecord[],
  version: { id: string; kitName: string; branch: string },
): LessonGuideLibraryRecord | null {
  return (
    records.find((record) => record.sourceVersionId === version.id) ??
    records.find(
      (record) =>
        !record.sourceVersionId &&
        record.kitName === version.kitName &&
        record.branch === version.branch,
    ) ??
    null
  );
}

export function buildLessonGuide(source: LessonGuideSource): LessonGuide {
  const draft = normalizeDraft(source.draft);
  const pages = buildPagesFromKitDraft(draft);
  const branchProfile = resolveBranchProfile(draft.branch);
  const lessonPages = pages.filter((block) => block.pageType === "lesson");
  const workbookActionPages = pages.filter((block) => ACTIVITY_TYPES.includes(block.pageType));

  return {
    kitName: draft.kitName,
    subtitle: draft.subtitle,
    branch: draft.branch,
    audience: draft.audience,
    tone: draft.tone,
    tagline: draft.tagline,
    generatedAt: source.generatedAt,
    totalWorkbookPages: pages.length,
    totalLessonPages: lessonPages.length,
    totalWorkbookActionPages: workbookActionPages.length,
    branchProfile,
    teachingFlow: pages
      .filter((block) => TEACHING_FLOW_TYPES.includes(block.pageType))
      .map(toTeachingItem),
    activityMap: workbookActionPages.map(toActivityItem),
  };
}

function toTeachingItem(block: Block): LessonGuideTeachingItem {
  const title = displayTitle(block);
  const summary = summarizeText(block.body || block.prompt || block.subtitle || "");

  return {
    id: block.id,
    title,
    pageType: block.pageType,
    pageTypeLabel: pageTypeLabel(block.pageType),
    summary,
    teachingNote: `Use this page to frame "${title}" before moving into the workbook activity.`,
    discussionQuestion: `What does "${title}" bring up for the person using this kit?`,
    actionStep: `Ask the user to name one clear next step connected to "${title}".`,
  };
}

function normalizeLessonGuideRecord(
  record: Partial<LessonGuideLibraryRecord>,
): LessonGuideLibraryRecord | null {
  if (!record || !record.source) return null;
  const source = normalizeLessonGuideSource(record.source);
  const guide = buildLessonGuide(source);

  return {
    id: record.id ?? source.id,
    type: "lesson-guide",
    status: "generated",
    sourceKitId: record.sourceKitId ?? source.sourceKitId,
    sourceVersionId: record.sourceVersionId ?? source.sourceVersionId,
    kitName: record.kitName ?? guide.kitName,
    branch: record.branch ?? guide.branch,
    generatedAt: record.generatedAt ?? guide.generatedAt,
    guideTitle: record.guideTitle ?? `${guide.kitName || "Untitled Kit"} Lesson Guide`,
    source,
  };
}

function normalizeLessonGuideSource(source: LessonGuideSource): LessonGuideSource {
  return {
    id: source.id ?? createId("lesson-guide"),
    sourceKitId: source.sourceKitId,
    sourceVersionId: source.sourceVersionId,
    sourceLabel: source.sourceLabel ?? "Current Builder Draft",
    generatedAt: source.generatedAt ?? new Date().toISOString(),
    draft: normalizeDraft(source.draft),
  };
}

function toActivityItem(block: Block): LessonGuideActivityItem {
  const title = displayTitle(block);
  const prompt = summarizeText(block.prompt || block.body || tableSummary(block) || "");

  return {
    id: block.id,
    title,
    pageType: block.pageType,
    pageTypeLabel: pageTypeLabel(block.pageType),
    prompt,
    suggestedOutcome: suggestedOutcomeFor(block.pageType, title),
    facilitatorNotes: facilitatorNotesFor(block.pageType, title),
  };
}

function displayTitle(block: Block): string {
  return block.title.trim() || pageTypeLabel(block.pageType);
}

function summarizeText(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "No summary text provided.";
  if (cleaned.length <= 220) return cleaned;
  return `${cleaned.slice(0, 217).trim()}...`;
}

function tableSummary(block: Block): string {
  const headers = block.tableData?.headers.filter((header) => header.trim()).join(", ") ?? "";
  return headers ? `Table fields: ${headers}` : "";
}

function suggestedOutcomeFor(pageType: PageType, title: string): string {
  if (pageType === "checklist") return `The user can confirm the key steps for "${title}".`;
  if (pageType === "table") return `The user can organize decisions or progress for "${title}".`;
  if (pageType === "action-plan") return `The user leaves with clear next actions for "${title}".`;
  if (pageType === "progress-check")
    return `The user can review progress and identify what still needs work.`;
  return `The user captures a useful answer or decision for "${title}".`;
}

function facilitatorNotesFor(pageType: PageType, title: string): string {
  if (pageType === "table")
    return "Review whether the table rows are filled with specific, usable details.";
  if (pageType === "checklist")
    return "Invite the user to mark what is complete and circle what needs support.";
  if (pageType === "reflection" || pageType === "prompt-page" || pageType === "notes") {
    return "Give quiet writing time before discussing the answer out loud.";
  }
  return `Use "${title}" as a checkpoint before moving to the next page.`;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
