import { resolveBranchProfile } from "./branch-profile";
import type {
  Block,
  Kit,
  LayoutOverrides,
  LessonActivityType,
  PageType,
  TableData,
} from "./kit-types";
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
  bottomNote: string;
  activityType: LessonActivityType;
  activityTitle: string;
  activityItems: string;
  keywords: string;
  prompt: string;
  lines: number | "";
  tableData: TableData;
  layoutOverrides?: LayoutOverrides;
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
    | "lesson-activity"
    | "table"
    | "workbook"
    | "checklist"
    | "notes"
    | "back-cover"
    | "start-here"
    | "module-intro"
    | "quote"
    | "reflection"
    | "action-plan"
    | "resource"
    | "case-study"
    | "prompt-page"
    | "multi-prompt"
    | "progress-check"
    | "closing";
  message: string;
};

export type PageCountWarning = {
  level: "large" | "review";
  title: "Large workbook" | "Review before export";
  message: string;
};

const BUILDER_PAYLOAD_PREFIX = "best_collective_builder_print:";
const LESSON_CHAR_LIMIT = 2600;
const LESSON_PARAGRAPH_LIMIT = 11;
const TABLE_ROWS_PER_PAGE = 8;
const WORKBOOK_PROMPT_LIMIT = 280;
const CHECKLIST_ITEMS_PER_PAGE = 12;
const NOTES_PROMPT_LIMIT = 280;
const LARGE_WORKBOOK_PAGE_COUNT = 21;
const REVIEW_WORKBOOK_PAGE_COUNT = 41;
const LARGE_WORKBOOK_MESSAGE =
  "This is becoming a large workbook. Review spacing, page flow, and export quality before selling.";
const REVIEW_WORKBOOK_MESSAGE =
  "This workbook is over 40 pages. Please review page flow, file size, print quality, and whether it should be split into multiple products before export.";

export const BUILDER_BLOCK_TYPES: Array<{ type: PageType; label: string }> = [
  { type: "cover", label: "Cover" },
  { type: "divider", label: "Section Divider" },
  { type: "lesson", label: "Lesson Page" },
  { type: "lesson-activity", label: "Lesson Activity Page" },
  { type: "table", label: "Table / Tracker Page" },
  { type: "workbook", label: "Workbook Page" },
  { type: "checklist", label: "Checklist Page" },
  { type: "notes", label: "Notes Page" },
  { type: "back-cover", label: "Back Cover" },
  { type: "start-here", label: "Start Here Page" },
  { type: "module-intro", label: "Module Intro Page" },
  { type: "quote", label: "Quote / Opening Thought Page" },
  { type: "reflection", label: "Reflection Page" },
  { type: "action-plan", label: "Action Plan Page" },
  { type: "resource", label: "Resource Page" },
  { type: "case-study", label: "Case Study / Example Page" },
  { type: "prompt-page", label: "Prompt Page" },
  { type: "multi-prompt", label: "Multi-Prompt Page" },
  { type: "progress-check", label: "Progress Check Page" },
  { type: "closing", label: "Closing / Next Steps Page" },
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
    bottomNote: "",
    activityType: "checklist",
    activityTitle: "",
    activityItems: "",
    keywords: "",
    prompt: "",
    lines:
      pageType === "prompt-page"
        ? 4
        : pageType === "workbook" || pageType === "reflection"
          ? 12
          : "",
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
      bottomNote: block.bottomNote ?? "",
      activityType: block.activityType ?? "checklist",
      activityTitle: block.activityTitle ?? "",
      activityItems: block.activityItems ?? "",
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
    const repairedBlock = applyKnownBrandKitPdfRepairs(block);
    if (isBusinessSetupTrackerBlock(repairedBlock)) {
      const repairedTrackerPages = buildBusinessSetupTrackerRepairPages(repairedBlock);
      if (repairedTrackerPages.length > 0) return repairedTrackerPages;
    }
    if (repairedBlock.pageType === "lesson") return buildLessonPages(repairedBlock);
    if (repairedBlock.pageType === "lesson-activity")
      return buildLessonActivityPages(repairedBlock);
    if (repairedBlock.pageType === "table") return buildTablePages(repairedBlock);
    if (repairedBlock.pageType === "checklist") return buildChecklistPages(repairedBlock);
    return [toRenderableBlock(repairedBlock)];
  });
}

export function getBuilderWarnings(draft: BuilderDraft): BuilderWarning[] {
  const warnings: BuilderWarning[] = [];
  const normalized = normalizeDraft(draft);
  const pageCountWarning = getPageCountWarning(buildPagesFromKitDraft(normalized).length);

  if (normalized.blocks.length === 0) {
    warnings.push({
      scope: "kit",
      message: "No blocks have been added yet.",
    });
  }

  if (pageCountWarning) {
    warnings.push({
      scope: "kit",
      message: pageCountWarning.message,
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

    if (block.pageType === "lesson-activity") {
      const paragraphs = splitParagraphs(block.body);
      if (block.body.length > LESSON_CHAR_LIMIT || paragraphs.length > LESSON_PARAGRAPH_LIMIT) {
        warnings.push({
          blockId: block.id,
          scope: "lesson-activity",
          message: `${block.title || "Lesson activity page"} has overflow risk and may need to become separate lesson/activity pages.`,
        });
      }
      if (
        (block.activityType === "checklist" || block.activityType === "action-steps") &&
        parseChecklistItems(block.activityItems).length === 0
      ) {
        warnings.push({
          blockId: block.id,
          scope: "lesson-activity",
          message: `${block.title || "Lesson activity page"} has no activity items.`,
        });
      }
      if (
        block.activityType === "writing-prompt" &&
        !block.prompt.trim() &&
        !block.activityItems.trim()
      ) {
        warnings.push({
          blockId: block.id,
          scope: "lesson-activity",
          message: `${block.title || "Lesson activity page"} is missing a writing prompt.`,
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

    if (
      block.pageType === "notes" ||
      block.pageType === "reflection" ||
      block.pageType === "prompt-page" ||
      block.pageType === "multi-prompt"
    ) {
      const promptText = block.pageType === "multi-prompt" ? block.body : block.prompt;
      if (promptText.length > NOTES_PROMPT_LIMIT * 2) {
        warnings.push({
          blockId: block.id,
          scope: block.pageType,
          message: `${block.title || pageTypeLabel(block.pageType)} has long prompt text that may reduce writing space.`,
        });
      }
      if (block.pageType !== "multi-prompt" && block.lines === "") {
        warnings.push({
          blockId: block.id,
          scope: block.pageType,
          message: `${block.title || pageTypeLabel(block.pageType)} is missing a writing line count.`,
        });
      }
      if (
        block.pageType !== "multi-prompt" &&
        typeof block.lines === "number" &&
        (block.lines < 4 || block.lines > 20)
      ) {
        warnings.push({
          blockId: block.id,
          scope: block.pageType,
          message: `${block.title || pageTypeLabel(block.pageType)} writing lines should stay between 4 and 20.`,
        });
      }
    }
  }

  return warnings;
}

export function getPageCountWarning(pageCount: number): PageCountWarning | null {
  if (pageCount >= REVIEW_WORKBOOK_PAGE_COUNT) {
    return {
      level: "review",
      title: "Review before export",
      message: REVIEW_WORKBOOK_MESSAGE,
    };
  }

  if (pageCount >= LARGE_WORKBOOK_PAGE_COUNT) {
    return {
      level: "large",
      title: "Large workbook",
      message: LARGE_WORKBOOK_MESSAGE,
    };
  }

  return null;
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

function applyKnownBrandKitPdfRepairs(block: BuilderBlock): BuilderBlock {
  let next: BuilderBlock = {
    ...block,
    title: repairKnownBrandKitText(block.title),
    subtitle: repairKnownBrandKitText(block.subtitle),
    body: repairKnownBrandKitText(block.body),
    prompt: repairKnownBrandKitText(block.prompt),
    bottomNote: repairKnownBrandKitText(block.bottomNote),
    activityTitle: repairKnownBrandKitText(block.activityTitle),
    activityItems: repairKnownBrandKitText(block.activityItems),
    tableData: repairKnownBrandKitTable(block.title, block.tableData),
  };

  if (/how\s+to\s+use\s+this\s+workbook/i.test(next.title) && /lesson pages explain/i.test(next.body)) {
    next = {
      ...next,
      title: next.title.replace(/workbook/gi, "Lesson Guide"),
    };
  }

  if (isMistakesToAvoidBlock(next)) {
    next = {
      ...next,
      body: next.body
        .replace(/(^|\n)\s*WHAT TO DO INSTEAD\s*(?=\n|$)/i, "$1COMMON EARLY MISTAKES")
        .replace(/(^|\n)\s*Common Early Mistakes\s*(?=\n|$)/i, "$1"),
    };
  }

  return next;
}

function repairKnownBrandKitText(value: string): string {
  return value
    .replace(
      /The full tracker table is in your Workbook \+ Action Planner\./gi,
      "The full business setup tracker table is in your Workbook + Action Planner.",
    )
    .replace(
      /Complete the Write It Out page before moving on\./gi,
      "Complete the matching page in your Workbook + Action Planner before moving on.",
    )
    .replace(/Trademark Search or TESS/gi, "the USPTO Trademark Search tool")
    .replace(
      /through a registrar like Namecheap,\s*GoDaddy,\s*or Google Domains/gi,
      "through a current domain registrar",
    )
    .replace(
      /This workbook is not here to scare you\./gi,
      "This lesson guide is not here to scare you.",
    )
    .replace(/This workbook can be used by/gi, "This kit can be used by")
    .replace(/opened this workbook/gi, "opened this kit")
    .replace(/\bWHAT TO DO INSTEAD\b/gi, "COMMON EARLY MISTAKES");
}

function repairKnownBrandKitTable(title: string, tableData: TableData): TableData {
  if (!/where\s+to\s+check\s+your\s+name/i.test(title)) return tableData;
  if (tableData.headers.length < 3) return tableData;

  return {
    headers: tableData.headers.map((header, index) =>
      index === 2 && header.trim() === "" ? "What to Record" : header,
    ),
    rows: tableData.rows.map((row) =>
      row.map((cell, index) =>
        index === 2 && cell.trim() === "" ? "What you find / next step" : cell,
      ),
    ),
  };
}

function isMistakesToAvoidBlock(block: BuilderBlock): boolean {
  return /mistakes\s+to\s+avoid/i.test(block.title) && /what\s+to\s+do\s+instead/i.test(block.body);
}

function isBusinessSetupTrackerBlock(block: BuilderBlock): boolean {
  return /business\s+setup\s+tracker\s+and\s+priority\s*map/i.test(block.title);
}

function buildBusinessSetupTrackerRepairPages(block: BuilderBlock): Block[] {
  const trackerRows = parseTrackerRows(block.body);
  if (trackerRows.length === 0) return [];

  const trackerPages = balancedTrackerChunks(trackerRows).map((rowsForPage, index) =>
    toRenderableBlock({
      ...block,
      id: index === 0 ? block.id : `${block.id}-continued-${index + 1}`,
      pageType: "table",
      title: index === 0 ? block.title : continuedTitle(block.title),
      subtitle: "",
      body: "",
      order: block.order + index / 100,
      tableData: {
        headers: ["Setup Area", "Status", "Next Step", "Deadline", "Notes"],
        rows: rowsForPage,
      },
    }),
  );

  const worksheetPrompts = parseTrackerWorksheetPrompts(block.body);
  if (worksheetPrompts.length > 0) {
    trackerPages.push(
      toRenderableBlock({
        ...block,
        id: `${block.id}-worksheet`,
        pageType: "multi-prompt",
        title: block.title,
        subtitle: "Priority Map",
        body: worksheetPrompts
          .map((prompt) => `Prompt: ${prompt}\nWriting Lines: 3`)
          .join("\n\n"),
        prompt: "",
        tableData: {
          headers: ["", "", ""],
          rows: [["", "", ""]],
        },
        order: block.order + trackerPages.length / 100,
      }),
    );
  }

  return trackerPages;
}

function parseTrackerRows(body: string): string[][] {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const [rawArea, ...rest] = line.split(":");
      const setupArea = rawArea?.trim();
      if (/^(prompt|writing\s+lines?)$/i.test(setupArea)) return null;
      if (/^excel\s+calculator$/i.test(setupArea)) return null;
      const nextStep = trackerStepForArea(setupArea, rest.join(":").trim());
      if (!setupArea || !nextStep) return null;
      return [titleCaseTrackerArea(setupArea), "", nextStep, "", ""];
    })
    .filter((row): row is string[] => Boolean(row));
}

function parseTrackerWorksheetPrompts(body: string): string[] {
  return body
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^prompt\s*:\s*(.+)$/i);
      return match?.[1]?.trim() ?? "";
    })
    .filter(Boolean);
}

function trackerStepForArea(setupArea: string, fallback: string): string {
  const normalized = setupArea.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const knownSteps: Record<string, string> = {
    "business clarity": "Write your one-line business description.",
    "name check": "Search state, trademark, domain, and social handles.",
    structure: "Compare structures and list questions for a professional.",
    "official filing or dba": "Check filing portal and local DBA rules.",
    ein: "Apply through IRS.gov if needed and save confirmation.",
    "bank account": "Ask what documents are required and open business checking.",
    "business address": "Choose an address type and check what becomes public.",
    "licenses and permits": "Check state, city, county, and industry requirements.",
    "state and local tax registration": "Check state registration and sales tax requirements.",
    "contact details": "Choose your business email and public contact method.",
    "domain and business email": "Choose direction, save login, and calendar renewal.",
    "organization system": "Create folders for filings, taxes, banking, receipts, and logins.",
    "startup costs": "List must-pay, soon, and wait-until-later costs.",
    "tax habits": "Choose a tax savings percentage and schedule tax support.",
    recordkeeping: "Store EIN, filing, banking, receipts, contracts, and tax records.",
    "contracts and policies": "List agreements, policies, and terms you need.",
    "insurance review": "List your risk areas and ask about coverage.",
    "privacy and data practices": "List what customer information you collect and protect.",
    "business credit and funding": "Check what is needed before using credit or funding.",
    "business credit later":
      "Wait until the foundation is clean, then learn what business credit would help you do.",
    "hiring or contractor support": "List tasks to outsource and what support should include.",
    "hiring awareness":
      "Review employee, contractor, and compliance rules before paying anyone.",
    "boi or ownership reporting": "Confirm whether BOI reporting applies before filing.",
    "boi and current rules":
      "Check FinCEN.gov for current BOI rules before relying on old videos or blog posts.",
    "boi and current rules check":
      "Check FinCEN.gov for current BOI rules before relying on old videos or blog posts.",
    "mistakes to avoid": "Review risky shortcuts and choose what to verify first.",
    "excel calculator": "Open the calculator and enter your real setup costs.",
  };
  return knownSteps[normalized] ?? cleanTrackerStep(fallback);
}

function cleanTrackerStep(value: string): string {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const withoutTrailingDots = cleaned.replace(/\.+$/, "");
  if (!withoutTrailingDots) return "";
  return /[.!?]$/.test(withoutTrailingDots) ? withoutTrailingDots : `${withoutTrailingDots}.`;
}

function titleCaseTrackerArea(value: string): string {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const knownLabels: Record<string, string> = {
    "boi and current rules": "BOI and Current Rules",
    "boi and current rules check": "BOI and Current Rules",
    "boi or ownership reporting": "BOI and Ownership Reporting",
  };
  if (knownLabels[normalized]) return knownLabels[normalized];

  return value
    .split(/\s+/)
    .map((word) => {
      if (/^boi$/i.test(word)) return "BOI";
      if (/^(and|or|for|to|of)$/i.test(word)) return word.toLowerCase();
      return word ? `${word[0].toUpperCase()}${word.slice(1)}` : word;
    })
    .join(" ");
}

function balancedTrackerChunks(rows: string[][]): string[][][] {
  return chunk(rows, 2);
}

function buildLessonActivityPages(block: BuilderBlock): Block[] {
  const chunks = chunkLessonBody(block.body);
  if (chunks.length <= 1) return [toRenderableBlock(block)];

  return chunks.map((body, index) => ({
    ...toRenderableBlock(block),
    id: index === 0 ? block.id : `${block.id}-continued-${index + 1}`,
    title: index === 0 ? block.title : continuedTitle(block.title),
    body,
    activityTitle: index === 0 ? block.activityTitle : "",
    activityItems: index === 0 ? block.activityItems : "",
    prompt: index === 0 ? block.prompt : "",
    order: block.order + index / 100,
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
    bottomNote: renderBlock.bottomNote,
    activityType: renderBlock.activityType,
    activityTitle: renderBlock.activityTitle,
    activityItems: renderBlock.activityItems,
    footerLabel: renderBlock.pageType === "cover" ? renderBlock.subtitle : undefined,
    keywords: renderBlock.pageType === "cover" && keywords.length > 0 ? keywords : undefined,
    prompt: renderBlock.prompt,
    lines: typeof renderBlock.lines === "number" ? Math.max(0, Math.min(renderBlock.lines, 20)) : 0,
    tableData: {
      headers: renderBlock.tableData.headers.slice(),
      rows: renderBlock.tableData.rows.map((row) => row.slice()),
    },
    layoutOverrides: renderBlock.layoutOverrides,
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
    activityType: normalizeActivityType(block.activityType),
    tableData: {
      headers: normalizeHeaders(block.tableData?.headers),
      rows: normalizeRows(block.tableData?.rows),
    },
    layoutOverrides: normalizeLayoutOverrides(block.layoutOverrides),
    lines:
      block.lines === "" ? "" : Number.isFinite(Number(block.lines)) ? Number(block.lines) : "",
  };
}

function normalizeActivityType(value?: string): LessonActivityType {
  if (value === "action-steps" || value === "writing-prompt" || value === "checklist") {
    return value;
  }
  return "checklist";
}

function normalizeLayoutOverrides(overrides?: LayoutOverrides): LayoutOverrides | undefined {
  if (!overrides || typeof overrides !== "object") return undefined;

  const normalized: LayoutOverrides = {};
  if (Number.isFinite(Number(overrides.titleOffset))) {
    normalized.titleOffset = Math.max(-6, Math.min(6, Number(overrides.titleOffset)));
  }
  if (Number.isFinite(Number(overrides.bodyOffset))) {
    normalized.bodyOffset = Math.max(-6, Math.min(6, Number(overrides.bodyOffset)));
  }
  if (Number.isFinite(Number(overrides.titleOffsetX))) {
    normalized.titleOffsetX = Math.max(-6, Math.min(6, Number(overrides.titleOffsetX)));
  }
  if (Number.isFinite(Number(overrides.bodyOffsetX))) {
    normalized.bodyOffsetX = Math.max(-6, Math.min(6, Number(overrides.bodyOffsetX)));
  }
  if (
    overrides.titleAlign === "left" ||
    overrides.titleAlign === "center" ||
    overrides.titleAlign === "default"
  ) {
    normalized.titleAlign = overrides.titleAlign;
  }
  if (
    overrides.bodyAlign === "left" ||
    overrides.bodyAlign === "center" ||
    overrides.bodyAlign === "default"
  ) {
    normalized.bodyAlign = overrides.bodyAlign;
  }
  if (
    overrides.titleSize === "smaller" ||
    overrides.titleSize === "larger" ||
    overrides.titleSize === "default"
  ) {
    normalized.titleSize = overrides.titleSize;
  }
  if (
    overrides.bodySize === "smaller" ||
    overrides.bodySize === "larger" ||
    overrides.bodySize === "default"
  ) {
    normalized.bodySize = overrides.bodySize;
  }
  if (
    overrides.spacing === "compact" ||
    overrides.spacing === "normal" ||
    overrides.spacing === "spacious" ||
    overrides.spacing === "default"
  ) {
    normalized.spacing = overrides.spacing;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeHeaders(headers?: string[]): string[] {
  const next = (headers ?? []).slice(0, 5);
  while (next.length < 3) next.push("");
  return next;
}

function normalizeRows(rows?: string[][]): string[][] {
  const next = rows && rows.length > 0 ? rows : [["", "", ""]];
  const columnCount = Math.max(3, ...next.map((row) => row.length));
  return next.map((row) => normalizeRow(row, columnCount));
}

function normalizeRow(row: string[], columnCount: number): string[] {
  const next = row.slice(0, columnCount);
  while (next.length < columnCount) next.push("");
  return next;
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
