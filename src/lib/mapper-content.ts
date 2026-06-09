import type { Block } from "./kit-types";
import { SAMPLE_KIT } from "./sample-kit";

export type MapperTableRow = [string, string, string];

export type MapperContent = {
  // Kit Info
  kitName: string;
  kitSubtitle: string;
  branch: string;
  audience: string;
  tone: string;
  kitTagline: string;

  // Cover
  coverTitle: string;
  coverSubtitle: string;
  coverKeywords: string; // raw input, parsed by parseKeywords

  // Section Divider
  sectionLabel: string;
  sectionTitle: string;

  // Lesson
  lessonLabel: string;
  lessonTitle: string;
  lessonBody: string;

  // Table
  tableTitle: string;
  tableSubtitle: string;
  tableHeaders: [string, string, string];
  tableRows: MapperTableRow[];

  // Workbook
  workbookLabel: string;
  workbookTitle: string;
  workbookPrompt: string;
  workbookLines: number;
};

export const RESERVED_MAPPER_KIT_ID = "mapper-preview";

export const MAPPER_CONTENT_STORAGE_KEY = "best-collective:mapper-content:v1";

export function saveMapperContentToStorage(content: MapperContent): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      MAPPER_CONTENT_STORAGE_KEY,
      JSON.stringify(content),
    );
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function loadMapperContentFromStorage(): MapperContent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MAPPER_CONTENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MapperContent>;
    return { ...EMPTY_MAPPER_CONTENT, ...parsed } as MapperContent;
  } catch {
    return null;
  }
}

export function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,•·|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function blockOfType(type: Block["pageType"]): Block | undefined {
  return SAMPLE_KIT.blocks.find((b) => b.pageType === type);
}

export const SAMPLE_MAPPER_CONTENT: MapperContent = (() => {
  const cover = blockOfType("cover");
  const divider = blockOfType("divider");
  const lesson = blockOfType("lesson");
  const table = blockOfType("table");
  const workbook = blockOfType("workbook");
  return {
    kitName: SAMPLE_KIT.name,
    kitSubtitle: "A Best Collective Brand Kit",
    branch: SAMPLE_KIT.branch,
    audience: SAMPLE_KIT.audience,
    tone: SAMPLE_KIT.tone,
    kitTagline: SAMPLE_KIT.description,

    coverTitle: cover?.title ?? "",
    coverSubtitle: "Best Collective",
    coverKeywords: "Structure, Legitimacy, Foundation",

    sectionLabel: divider?.title ?? "Section One",
    sectionTitle: divider?.subtitle ?? "Foundations",

    lessonLabel: lesson?.subtitle ?? "Lesson One",
    lessonTitle: lesson?.title ?? "",
    lessonBody: lesson?.body ?? "",

    tableTitle: table?.title ?? "",
    tableSubtitle: table?.subtitle ?? "",
    tableHeaders: (table?.tableData?.headers ?? ["Column A", "Column B", "Column C"]) as [
      string,
      string,
      string,
    ],
    tableRows: (table?.tableData?.rows ?? []).map(
      (r) => [r[0] ?? "", r[1] ?? "", r[2] ?? ""] as MapperTableRow,
    ),

    workbookLabel: workbook?.subtitle ?? "Workbook",
    workbookTitle: workbook?.title ?? "",
    workbookPrompt: workbook?.prompt ?? "",
    workbookLines: workbook?.lines ?? 12,
  };
})();

export const EMPTY_MAPPER_CONTENT: MapperContent = {
  kitName: "",
  kitSubtitle: "",
  branch: "Brand",
  audience: "",
  tone: "",
  kitTagline: "",
  coverTitle: "",
  coverSubtitle: "",
  coverKeywords: "",
  sectionLabel: "",
  sectionTitle: "",
  lessonLabel: "",
  lessonTitle: "",
  lessonBody: "",
  tableTitle: "",
  tableSubtitle: "",
  tableHeaders: ["", "", ""],
  tableRows: [["", "", ""]],
  workbookLabel: "",
  workbookTitle: "",
  workbookPrompt: "",
  workbookLines: 12,
};

export function buildBlocksFromMapper(content: MapperContent): Block[] {
  const keywords = parseKeywords(content.coverKeywords);
  return [
    {
      id: `${RESERVED_MAPPER_KIT_ID}-cover`,
      pageType: "cover",
      order: 1,
      title: content.coverTitle || content.kitName || "Untitled Kit",
      subtitle: content.coverSubtitle,
      body: content.kitTagline,
      keywords: keywords.length > 0 ? keywords : undefined,
    },
    {
      id: `${RESERVED_MAPPER_KIT_ID}-divider`,
      pageType: "divider",
      order: 2,
      title: content.sectionLabel || "Section One",
      subtitle: content.sectionTitle || "",
    },
    {
      id: `${RESERVED_MAPPER_KIT_ID}-lesson`,
      pageType: "lesson",
      order: 3,
      title: content.lessonTitle || "",
      subtitle: content.lessonLabel,
      body: content.lessonBody,
    },
    {
      id: `${RESERVED_MAPPER_KIT_ID}-table`,
      pageType: "table",
      order: 4,
      title: content.tableTitle || "",
      subtitle: content.tableSubtitle,
      tableData: {
        headers: content.tableHeaders.slice(),
        rows: content.tableRows.map((r) => [r[0], r[1], r[2]]),
      },
    },
    {
      id: `${RESERVED_MAPPER_KIT_ID}-workbook`,
      pageType: "workbook",
      order: 5,
      title: content.workbookTitle || "",
      subtitle: content.workbookLabel,
      prompt: content.workbookPrompt,
      lines: Math.max(4, Math.min(content.workbookLines || 12, 20)),
    },
  ];
}

export type OverflowWarning = {
  scope: "cover" | "section" | "lesson" | "table" | "workbook";
  message: string;
};

export function getOverflowWarnings(content: MapperContent): OverflowWarning[] {
  const warnings: OverflowWarning[] = [];

  if (content.coverTitle.length > 32) {
    warnings.push({ scope: "cover", message: "Cover title may not fit on one line." });
  }
  const kws = parseKeywords(content.coverKeywords);
  if (kws.length > 4) {
    warnings.push({ scope: "cover", message: "Too many cover keywords; recommended 2–4." });
  }

  if (content.sectionTitle.length > 40) {
    warnings.push({ scope: "section", message: "Section title may wrap awkwardly." });
  }

  if (content.lessonBody.length > 1400) {
    warnings.push({ scope: "lesson", message: "Lesson body may overflow the page." });
  }
  const paragraphs = content.lessonBody.split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length > 6) {
    warnings.push({ scope: "lesson", message: "Lesson has many paragraphs; consider splitting." });
  }

  if (content.tableRows.length > 12) {
    warnings.push({ scope: "table", message: "Table has too many rows for one page." });
  }
  const longCell = content.tableRows.some((r) => r.some((c) => c.length > 90));
  if (longCell) {
    warnings.push({ scope: "table", message: "A table cell is too long and may wrap or clip." });
  }

  if (content.workbookLines < 4 || content.workbookLines > 20) {
    warnings.push({
      scope: "workbook",
      message: "Writing lines should be between 4 and 20.",
    });
  }
  if (content.workbookPrompt.length > 280 && content.workbookLines > 12) {
    warnings.push({
      scope: "workbook",
      message: "Long prompt with many lines may reduce writing space.",
    });
  }

  return warnings;
}