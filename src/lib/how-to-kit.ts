import { buildPagesFromKitDraft, normalizeDraft, type BuilderDraft } from "./builder-content";
import { resolveBranchProfile, type BranchProfile } from "./branch-profile";
import type { Block, PageType } from "./kit-types";

export const HOW_TO_KIT_STORAGE_KEY = "best_collective_how_to_kit_source";
export const HOW_TO_KIT_LIBRARY_STORAGE_KEY = "best_collective_how_to_kit_library";

export type HowToKitSource = {
  id: string;
  sourceKitId?: string;
  sourceVersionId?: string;
  sourceLabel: string;
  generatedAt: string;
  draft: BuilderDraft;
};

export type HowToKitLibraryRecord = {
  id: string;
  type: "how-to-kit";
  status: "generated";
  sourceKitId?: string;
  sourceVersionId?: string;
  kitName: string;
  branch: string;
  generatedAt: string;
  guideTitle: string;
  source: HowToKitSource;
};

export type HowToInsideItem = {
  key: string;
  label: string;
  count: number;
  description: string;
};

export type HowToKitGuide = {
  kitName: string;
  subtitle: string;
  branch: string;
  audience: string;
  tone: string;
  tagline: string;
  generatedAt: string;
  pageCount: number;
  lessonCount: number;
  activityPageCount: number;
  branchProfile: BranchProfile;
  inside: HowToInsideItem[];
};

type SaveHowToKitSourceOptions = {
  sourceLabel?: string;
  sourceKitId?: string;
  sourceVersionId?: string;
};

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

const INSIDE_SECTIONS: Array<{
  key: string;
  label: string;
  types: PageType[];
  description: string;
}> = [
  {
    key: "lessons",
    label: "Lessons",
    types: ["lesson", "module-intro", "start-here"],
    description: "Read these pages first to understand the idea, framework, or direction.",
  },
  {
    key: "workbook-pages",
    label: "Workbook pages",
    types: ["workbook", "notes", "prompt-page"],
    description: "Use these pages to write answers, make decisions, and capture your plan.",
  },
  {
    key: "checklists",
    label: "Checklists",
    types: ["checklist"],
    description: "Use these to confirm what is complete and what still needs attention.",
  },
  {
    key: "trackers",
    label: "Trackers / tables",
    types: ["table"],
    description: "Use these to organize progress, compare details, or track next steps.",
  },
  {
    key: "reflections",
    label: "Reflection pages",
    types: ["reflection"],
    description: "Move slowly here. These pages are meant for honest thinking and review.",
  },
  {
    key: "action-plans",
    label: "Action plan pages",
    types: ["action-plan", "progress-check", "closing"],
    description: "Use these to choose next steps and decide what happens after the kit.",
  },
];

export function saveHowToKitSource(
  draft: BuilderDraft,
  sourceLabelOrOptions: string | SaveHowToKitSourceOptions = "Current Builder Draft",
): HowToKitSource {
  const options =
    typeof sourceLabelOrOptions === "string"
      ? { sourceLabel: sourceLabelOrOptions }
      : sourceLabelOrOptions;
  const normalizedDraft = normalizeDraft(draft);
  const source: HowToKitSource = {
    id: createId("how-to-kit"),
    sourceKitId: options.sourceKitId ?? normalizedDraft.id,
    sourceVersionId: options.sourceVersionId,
    sourceLabel: options.sourceLabel ?? "Current Builder Draft",
    generatedAt: new Date().toISOString(),
    draft: normalizedDraft,
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(HOW_TO_KIT_STORAGE_KEY, JSON.stringify(source));
    } catch {
      // Ignore local browser storage failures.
    }
  }

  return source;
}

export function loadHowToKitSource(): HowToKitSource | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(HOW_TO_KIT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<HowToKitSource>;
    if (!parsed.draft) return null;

    return normalizeHowToKitSource({
      id: parsed.id ?? createId("how-to-kit"),
      sourceKitId: parsed.sourceKitId,
      sourceVersionId: parsed.sourceVersionId,
      sourceLabel: parsed.sourceLabel ?? "Current Builder Draft",
      generatedAt: parsed.generatedAt ?? new Date().toISOString(),
      draft: parsed.draft,
    });
  } catch {
    return null;
  }
}

export function loadHowToKitLibrary(): HowToKitLibraryRecord[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HOW_TO_KIT_LIBRARY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<HowToKitLibraryRecord>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeHowToKitRecord).filter(Boolean) as HowToKitLibraryRecord[];
  } catch {
    return [];
  }
}

export function saveHowToKitLibrary(records: HowToKitLibraryRecord[]): HowToKitLibraryRecord[] {
  const normalized = records
    .map(normalizeHowToKitRecord)
    .filter(Boolean) as HowToKitLibraryRecord[];

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(HOW_TO_KIT_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore local browser storage failures.
    }
  }

  return normalized;
}

export function saveHowToKitRecord(source: HowToKitSource): HowToKitLibraryRecord {
  const normalizedSource = normalizeHowToKitSource(source);
  const guide = buildHowToKitGuide(normalizedSource);
  const record: HowToKitLibraryRecord = {
    id: normalizedSource.id,
    type: "how-to-kit",
    status: "generated",
    sourceKitId: normalizedSource.sourceKitId,
    sourceVersionId: normalizedSource.sourceVersionId,
    kitName: guide.kitName,
    branch: guide.branch,
    generatedAt: guide.generatedAt,
    guideTitle: `${guide.kitName || "Untitled Kit"} How-To PDF`,
    source: normalizedSource,
  };
  const existing = loadHowToKitLibrary();
  return saveHowToKitLibrary([record, ...existing.filter((item) => item.id !== record.id)])[0];
}

export function openHowToKitRecord(record: HowToKitLibraryRecord): HowToKitSource {
  const source = normalizeHowToKitSource(record.source);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(HOW_TO_KIT_STORAGE_KEY, JSON.stringify(source));
    } catch {
      // Ignore local browser storage failures.
    }
  }
  return source;
}

export function findHowToKitForVersion(
  records: HowToKitLibraryRecord[],
  version: { id: string; kitName: string; branch: string },
): HowToKitLibraryRecord | null {
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

export function buildHowToKitGuide(source: HowToKitSource): HowToKitGuide {
  const draft = normalizeDraft(source.draft);
  const pages = buildPagesFromKitDraft(draft);
  const branchProfile = resolveBranchProfile(draft.branch);
  const lessonCount = countByTypes(pages, ["lesson"]);
  const activityPageCount = countByTypes(pages, ACTIVITY_TYPES);

  return {
    kitName: draft.kitName,
    subtitle: draft.subtitle,
    branch: draft.branch,
    audience: draft.audience,
    tone: draft.tone,
    tagline: draft.tagline,
    generatedAt: source.generatedAt,
    pageCount: pages.length,
    lessonCount,
    activityPageCount,
    branchProfile,
    inside: INSIDE_SECTIONS.map((section) => ({
      key: section.key,
      label: section.label,
      count: countByTypes(pages, section.types),
      description: section.description,
    })).filter((section) => section.count > 0),
  };
}

function normalizeHowToKitRecord(
  record: Partial<HowToKitLibraryRecord>,
): HowToKitLibraryRecord | null {
  if (!record || !record.source) return null;
  const source = normalizeHowToKitSource(record.source);
  const guide = buildHowToKitGuide(source);

  return {
    id: record.id ?? source.id,
    type: "how-to-kit",
    status: "generated",
    sourceKitId: record.sourceKitId ?? source.sourceKitId,
    sourceVersionId: record.sourceVersionId ?? source.sourceVersionId,
    kitName: record.kitName ?? guide.kitName,
    branch: record.branch ?? guide.branch,
    generatedAt: record.generatedAt ?? guide.generatedAt,
    guideTitle: record.guideTitle ?? `${guide.kitName || "Untitled Kit"} How-To PDF`,
    source,
  };
}

function normalizeHowToKitSource(source: HowToKitSource): HowToKitSource {
  return {
    id: source.id ?? createId("how-to-kit"),
    sourceKitId: source.sourceKitId,
    sourceVersionId: source.sourceVersionId,
    sourceLabel: source.sourceLabel ?? "Current Builder Draft",
    generatedAt: source.generatedAt ?? new Date().toISOString(),
    draft: normalizeDraft(source.draft),
  };
}

function countByTypes(blocks: Block[], pageTypes: PageType[]): number {
  return blocks.filter((block) => pageTypes.includes(block.pageType)).length;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
