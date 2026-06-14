import { resolveBranchProfile } from "./branch-profile";
import type { Block, Kit, PageType, TableData } from "./kit-types";
import { SAMPLE_KIT } from "./sample-kit";

export const RESERVED_BUILDER_KIT_ID = "builder-preview";
export const BUILDER_STORAGE_KEY = "best_collective_level_3_kit";

export type BuilderDraftSource = "current" | "sample" | "blank";

export type BuilderBlock = {
  id: string;
  pageType: PageType;
  order: number;
  title: string;
  subtitle: string;
  body: string;
  keywords: string;
  prompt: string;
  lines: number | "";
  tableData: TableData;
};

export type BuilderDraft = {
  id: string;
  kitName: string;
  subtitle: string;
  branch: string;
  audience: string;
  tone: string;
  tagline: string;
  source: BuilderDraftSource;
  lastSaved: string | null;
  selectedBlockId: string | null;
  blocks: BuilderBlock[];
};

export type BuilderWarning = {
  blockId?: string;
  scope:
    | "kit"
    | "cover"
    | "divider"
    | "lesson"
    | "table"
    | "workbook"
    | "checklist"
    | "notes"
    | "back-cover";
  message: string;
};

const BUILDER_PAYLOAD_PREFIX = "best_collective_builder_print:";
const LESSON_CHAR_LIMIT = 1400;
const LESSON_PARAGRAPH_LIMIT = 6;
const TABLE_ROWS_PER_PAGE = 8;
const WORKBOOK_PROMPT_LIMIT = 280;
const CHECKLIST_ITEMS_PER_PAGE = 12;
const NOTES_PROMPT_LIMIT = 280;

export const BUILDER_BLOCK_TYPES: Array<{ type: PageType; label: string }> = [
  { type: "cover", label: "Cover" },
  { type: "divider", label: "Section Divider" },
  { type: "lesson", label: "Lesson Page" },
  { type: "table", label: "Table / Tracker Page" },
  { type: "workbook", label: "Workbook Page" },
  { type: "checklist", label: "Checklist Page" },
  { type: "notes", label: "Notes Page" },
  { type: "back-cover", label: "Back Cover" },
];

export function createBlankBuilderDraft(): BuilderDraft {
  return {
    id: RESERVED_BUILDER_KIT_ID,
    kitName: "",
    subtitle: "",
    branch: "",
    audience: "",
    tone: "",
    tagline: "",
    source: "blank",
    lastSaved: null,
    selectedBlockId: null,
    blocks: [],
  };
}

export function createBuilderBlock(pageType: PageType, order = 1): BuilderBlock {
  return {
    id: createId("block"),
    pageType,
    order,
    title: "",
    subtitle: "",
    body: "",
    keywords: "",
    prompt: "",
    lines: pageType === "workbook" ? 12 : "",
    tableData: {
      headers: ["", "", ""],
      rows: [["", "", ""]],
    },
  };
}

export function createSampleBuilderDraft(): BuilderDraft {
  const blocks = SAMPLE_KIT.blocks.map(
    (block, index): BuilderBlock => ({
      id: createId("sample"),
      pageType: block.pageType,
      order: index + 1,
      title: block.title,
      subtitle: block.subtitle ?? "",
      body: block.body ?? "",
      keywords: block.keywords?.join(", ") ?? "",
      prompt: block.prompt ?? "",
      lines: block.lines ?? "",
      tableData: {
        headers: block.tableData?.headers?.slice() ?? ["", "", ""],
        rows: block.tableData?.rows?.map((row) => row.slice()) ?? [["", "", ""]],
      },
    }),
  );

  return {
    id: RESERVED_BUILDER_KIT_ID,
    kitName: SAMPLE_KIT.name,
    subtitle: "A Best Collective Brand Kit",
    branch: SAMPLE_KIT.branch,
    audience: SAMPLE_KIT.audience,
    tone: SAMPLE_KIT.tone,
    tagline: SAMPLE_KIT.description,
    source: "sample",
    lastSaved: null,
    selectedBlockId: blocks[0]?.id ?? null,
    blocks,
  };
}

export function saveBuilderDraft(draft: BuilderDraft): BuilderDraft {
  const next = normalizeDraft({
    ...draft,
    lastSaved: new Date().toISOString(),
  });

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(BUILDER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota or privacy-mode storage failures.
    }
  }

  return next;
}

export function loadBuilderDraft(): BuilderDraft | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(BUILDER_STORAGE_KEY);
    if (!raw) return null;
    return parseBuilderDraft(raw);
  } catch {
    return null;
  }
}

export function encodeBuilderDraftForUrl(draft: BuilderDraft): string {
  return encodeURIComponent(JSON.stringify(normalizeDraft(draft)));
}

export function encodeBuilderDraftForWindowName(draft: BuilderDraft): string {
  return `${BUILDER_PAYLOAD_PREFIX}${encodeBuilderDraftForUrl(draft)}`;
}

export function loadBuilderDraftFromUrlHash(): BuilderDraft | null {
  if (typeof window === "undefined") return null;

  const raw =
    getBuilderPayloadFromParams(window.location.search) ??
    getBuilderPayloadFromParams(window.location.hash.replace(/^#/, ""));

  return raw ? parseBuilderDraft(raw) : null;
}

export function loadBuilderDraftFromWindowName(): BuilderDraft | null {
  if (typeof window === "undefined") return null;
  if (!window.name.startsWith(BUILDER_PAYLOAD_PREFIX)) return null;
  return parseBuilderDraft(window.name.slice(BUILDER_PAYLOAD_PREFIX.length));
}

export function buildBuilderKit(draft: BuilderDraft): Kit {
  const normalized = normalizeDraft(draft);

  return {
    id: RESERVED_BUILDER_KIT_ID,
    name: normalized.kitName,
    branch: normalized.branch,
    audience: normalized.audience,
    tone: normalized.tone,
    description: normalized.tagline,
    lessonGuide: "",
    workbook: "",
    tracker: "",
    branchProfile: resolveBranchProfile(normalized.branch),
    blocks: buildPagesFromKitDraft(normalized),
    version: "v1-level-3b",
    status: "Draft",
    qcStatus: "Needs Review",
    dochubStatus: "Not Ready",
    updatedAt: normalized.lastSaved ?? new Date().toISOString(),
  };
}

export function buildPagesFromKitDraft(draft: BuilderDraft): Block[] {
  return normalizeDraft(draft).blocks.flatMap((block) => {
    if (block.pageType === "lesson") return buildLessonPages(block);
    if (block.pageType === "table") return buildTablePages(block);
    if (block.pageType === "checklist") return buildChecklistPages(block);
    return [toRenderableBlock(block)];
  });
}

export function getBuilderWarnings(draft: BuilderDraft): BuilderWarning[] {
  const warnings: BuilderWarning[] = [];
  const normalized = normalizeDraft(draft);

  if (normalized.blocks.length === 0) {
    warnings.push({
      scope: "kit",
      message: "No blocks have been added yet.",
    });
  }

  for (const block of normalized.blocks) {
    const label = pageTypeLabel(block.pageType);
    const titleBlank = block.title.trim() === "";

    if (titleBlank) {
      warnings.push({
        blockId: block.id,
        scope: block.pageType,
        message: `${label} is missing a title.`,
      });
    }

    if (block.pageType === "lesson") {
      const paragraphs = splitParagraphs(block.body);
      if (block.body.length > LESSON_CHAR_LIMIT || paragraphs.length > LESSON_PARAGRAPH_LIMIT) {
        warnings.push({
          blockId: block.id,
          scope: "lesson",
          message: `${block.title || "Lesson page"} has overflow risk and will create continuation lesson pages.`,
        });
      }
    }

    if (block.pageType === "table") {
      const rows = block.tableData.rows;
      const hasAnyRowContent = rows.some((row) => row.some((cell) => cell.trim() !== ""));
      if (!hasAnyRowContent) {
        warnings.push({
          blockId: block.id,
          scope: "table",
          message: `${block.title || "Table page"} has no table row content.`,
        });
      }
      if (rows.length > TABLE_ROWS_PER_PAGE) {
        warnings.push({
          blockId: block.id,
          scope: "table",
          message: `${block.title || "Table page"} is too long and will create continued table pages with repeated headers.`,
        });
      }
      if (rows.some((row) => row.some((cell) => cell.length > 90))) {
        warnings.push({
          blockId: block.id,
          scope: "table",
          message: `${block.title || "Table page"} has a long cell that may wrap tightly.`,
        });
      }
    }

    if (block.pageType === "workbook") {
      if (block.prompt.trim() === "") {
        warnings.push({
          blockId: block.id,
          scope: "workbook",
          message: `${block.title || "Workbook page"} is missing a workbook prompt.`,
        });
      }
      if (block.prompt.length > WORKBOOK_PROMPT_LIMIT) {
        warnings.push({
          blockId: block.id,
          scope: "workbook",
          message: `${block.title || "Workbook page"} has a long prompt that may reduce writing space.`,
        });
      }
      if (block.lines === "") {
        warnings.push({
          blockId: block.id,
          scope: "workbook",
          message: `${block.title || "Workbook page"} is missing a writing line count.`,
        });
      }
      if (typeof block.lines === "number" && (block.lines < 4 || block.lines > 20)) {
        warnings.push({
          blockId: block.id,
          scope: "workbook",
          message: `${block.title || "Workbook page"} writing lines should stay between 4 and 20.`,
        });
      }
    }

    if (block.pageType === "checklist") {
      const items = parseChecklistItems(block.body);
      if (items.length === 0) {
        warnings.push({
          blockId: block.id,
          scope: "checklist",
          message: `${block.title || "Checklist page"} has no checklist items.`,
        });
      }
      if (items.length > CHECKLIST_ITEMS_PER_PAGE) {
        warnings.push({
          blockId: block.id,
          scope: "checklist",
          message: `${block.title || "Checklist page"} is too long and will create continuation checklist pages.`,
        });
      }
      if (items.some((item) => item.length > 90)) {
        warnings.push({
          blockId: block.id,
          scope: "checklist",
          message: `${block.title || "Checklist page"} has a long checklist item that may wrap tightly.`,
        });
      }
    }

    if (block.pageType === "notes") {
      if (block.prompt.length > NOTES_PROMPT_LIMIT) {
        warnings.push({
          blockId: block.id,
          scope: "notes",
          message: `${block.title || "Notes page"} has a long prompt that may reduce writing space.`,
        });
      }
      if (block.lines === "") {
        warnings.push({
          blockId: block.id,
          scope: "notes",
          message: `${block.title || "Notes page"} is missing a writing line count.`,
        });
      }
      if (typeof block.lines === "number" && (block.lines < 4 || block.lines > 20)) {
        warnings.push({
          blockId: block.id,
          scope: "notes",
          message: `${block.title || "Notes page"} writing lines should stay between 4 and 20.`,
        });
      }
    }
  }

  return warnings;
}

export function normalizeDraft(draft: BuilderDraft): BuilderDraft {
  const blocks = draft.blocks
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((block, index) => normalizeBlock({ ...block, order: index + 1 }));

  return {
    ...createBlankBuilderDraft(),
    ...draft,
    blocks,
    selectedBlockId:
      draft.selectedBlockId && blocks.some((block) => block.id === draft.selectedBlockId)
        ? draft.selectedBlockId
        : (blocks[0]?.id ?? null),
  };
}

export function duplicateBuilderBlock(block: BuilderBlock, order: number): BuilderBlock {
  return {
    ...cloneBlock(block),
    id: createId("block"),
    order,
    title: block.title,
  };
}

export function pageTypeLabel(pageType: PageType): string {
  return BUILDER_BLOCK_TYPES.find((item) => item.type === pageType)?.label ?? pageType;
}

function buildLessonPages(block: BuilderBlock): Block[] {
  const lessonBlock = normalizeLessonBlockForRender(block);
  const chunks = chunkLessonBody(lessonBlock.body);
  if (chunks.length === 0) return [toRenderableBlock(lessonBlock)];

  return chunks.map((body, index) => ({
    ...toRenderableBlock(lessonBlock),
    id: index === 0 ? lessonBlock.id : `${lessonBlock.id}-continued-${index + 1}`,
    title: index === 0 ? lessonBlock.title : continuedTitle(lessonBlock.title),
    body,
    order: lessonBlock.order + index / 100,
  }));
}

function buildTablePages(block: BuilderBlock): Block[] {
  const rows = block.tableData.rows.length > 0 ? block.tableData.rows : [["", "", ""]];
  const chunks = chunk(rows, TABLE_ROWS_PER_PAGE);

  return chunks.map((rowsForPage, index) => ({
    ...toRenderableBlock(block),
    id: index === 0 ? block.id : `${block.id}-continued-${index + 1}`,
    title: index === 0 ? block.title : continuedTitle(block.title),
    tableData: {
      headers: block.tableData.headers.slice(),
      rows: rowsForPage.map((row) => row.slice()),
    },
    order: block.order + index / 100,
  }));
}

function buildChecklistPages(block: BuilderBlock): Block[] {
  const items = parseChecklistItems(block.body);
  if (items.length === 0) return [toRenderableBlock(block)];

  return chunk(items, CHECKLIST_ITEMS_PER_PAGE).map((itemsForPage, index) => ({
    ...toRenderableBlock(block),
    id: index === 0 ? block.id : `${block.id}-continued-${index + 1}`,
    title: index === 0 ? block.title : continuedTitle(block.title),
    body: itemsForPage.join("\n"),
    order: block.order + index / 100,
  }));
}

function toRenderableBlock(block: BuilderBlock): Block {
  const renderBlock = block.pageType === "lesson" ? normalizeLessonBlockForRender(block) : block;
  const keywords = parseKeywords(block.keywords);
  return {
    id: renderBlock.id,
    pageType: renderBlock.pageType,
    order: renderBlock.order,
    title: renderBlock.title,
    subtitle: renderBlock.subtitle,
    body: renderBlock.body,
    footerLabel: renderBlock.pageType === "cover" ? renderBlock.subtitle : undefined,
    keywords: renderBlock.pageType === "cover" && keywords.length > 0 ? keywords : undefined,
    prompt: renderBlock.prompt,
    lines: typeof renderBlock.lines === "number" ? Math.max(0, Math.min(renderBlock.lines, 20)) : 0,
    tableData: {
      headers: renderBlock.tableData.headers.slice(),
      rows: renderBlock.tableData.rows.map((row) => row.slice()),
    },
  };
}

function normalizeLessonBlockForRender(block: BuilderBlock): BuilderBlock {
  const bodyFromSubtitle = extractBodyLabelValue(block.subtitle);
  if (!bodyFromSubtitle) return block;

  return {
    ...block,
    subtitle: "",
    body: bodyFromSubtitle,
  };
}

function extractBodyLabelValue(value: string): string | null {
  const match = value.match(/^\s*body\s*:\s*([\s\S]*)$/i);
  const body = match?.[1]?.trim();
  return body ? body : null;
}

function normalizeBlock(block: BuilderBlock): BuilderBlock {
  const blank = createBuilderBlock(block.pageType, block.order);
  return {
    ...blank,
    ...block,
    tableData: {
      headers: normalizeHeaders(block.tableData?.headers),
      rows: normalizeRows(block.tableData?.rows),
    },
    lines:
      block.lines === "" ? "" : Number.isFinite(Number(block.lines)) ? Number(block.lines) : "",
  };
}

function normalizeHeaders(headers?: string[]): string[] {
  const next = (headers ?? []).slice(0, 3);
  while (next.length < 3) next.push("");
  return next;
}

function normalizeRows(rows?: string[][]): string[][] {
  const next = rows && rows.length > 0 ? rows : [["", "", ""]];
  return next.map((row) => normalizeHeaders(row));
}

function parseBuilderDraft(raw: string): BuilderDraft | null {
  try {
    const json = raw.trim().startsWith("{") ? raw : decodeURIComponent(raw);
    const parsed = JSON.parse(json) as Partial<BuilderDraft>;
    return normalizeDraft({
      ...createBlankBuilderDraft(),
      ...parsed,
      blocks: Array.isArray(parsed.blocks) ? (parsed.blocks as BuilderBlock[]) : [],
    });
  } catch {
    return null;
  }
}

function getBuilderPayloadFromParams(params: string): string | null {
  if (!params) return null;
  return new URLSearchParams(params).get("builder");
}

function parseKeywords(raw: string): string[] {
  return raw
    .split(/[,•·|]/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseChecklistItems(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function chunkLessonBody(body: string): string[] {
  const paragraphs = splitParagraphs(body);
  if (paragraphs.length === 0) return [];

  const chunks: string[] = [];
  let current: string[] = [];
  let currentLength = 0;

  for (const paragraph of paragraphs) {
    if (
      current.length > 0 &&
      (current.length >= LESSON_PARAGRAPH_LIMIT ||
        currentLength + paragraph.length > LESSON_CHAR_LIMIT)
    ) {
      chunks.push(current.join("\n\n"));
      current = [];
      currentLength = 0;
    }

    if (paragraph.length > LESSON_CHAR_LIMIT) {
      const parts = chunkLongText(paragraph, LESSON_CHAR_LIMIT);
      for (const part of parts) {
        if (current.length > 0) {
          chunks.push(current.join("\n\n"));
          current = [];
          currentLength = 0;
        }
        chunks.push(part);
      }
      continue;
    }

    current.push(paragraph);
    currentLength += paragraph.length;
  }

  if (current.length > 0) chunks.push(current.join("\n\n"));
  return chunks;
}

function chunkLongText(text: string, maxLength: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      chunks.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks.length > 0 ? chunks : [[]];
}

function continuedTitle(title: string): string {
  return title.trim() ? `${title} continued` : "Continued";
}

function cloneBlock(block: BuilderBlock): BuilderBlock {
  return {
    ...block,
    tableData: {
      headers: block.tableData.headers.slice(),
      rows: block.tableData.rows.map((row) => row.slice()),
    },
  };
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
