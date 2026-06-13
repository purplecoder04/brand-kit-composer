import {
  createBlankBuilderDraft,
  createBuilderBlock,
  normalizeDraft,
  type BuilderBlock,
  type BuilderDraft,
} from "./builder-content";
import type { PageType } from "./kit-types";

type ParsedSection = {
  type: PageType;
  title: string;
  subtitle: string;
  body: string;
  prompt: string;
  checklistItems: string[];
  tableHeaders: string[];
  tableRows: string[][];
};

const KIT_TITLE_RE = /^(kit\s*)?(title|kit name)\s*:\s*(.+)$/i;
const SUBTITLE_RE = /^subtitle\s*:\s*(.+)$/i;
const BRANCH_RE = /^branch\s*:\s*(.+)$/i;
const AUDIENCE_RE = /^audience\s*:\s*(.+)$/i;
const TONE_RE = /^tone\s*:\s*(.+)$/i;
const TAGLINE_RE = /^tagline\s*:\s*(.+)$/i;
const HEADING_RE =
  /^(cover|section|divider|lesson|workbook prompt|workbook|checklist|notes|table|tracker)\s*:\s*(.*)$/i;
const BODY_RE = /^(body|lesson body)\s*:\s*(.*)$/i;
const PROMPT_RE = /^(prompt|workbook prompt|notes prompt)\s*:\s*(.*)$/i;
const TABLE_HEADERS_RE = /^(headers|columns)\s*:\s*(.+)$/i;
const TABLE_ROW_RE = /^(row|table row)\s*:\s*(.+)$/i;

export function parseImportedKitText(raw: string): BuilderDraft {
  const draft = createBlankBuilderDraft();
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const kitTitle = line.match(KIT_TITLE_RE);
    if (kitTitle) {
      draft.kitName = kitTitle[3]?.trim() ?? "";
      continue;
    }

    const subtitle = line.match(SUBTITLE_RE);
    if (subtitle) {
      draft.subtitle = subtitle[1]?.trim() ?? "";
      continue;
    }

    const branch = line.match(BRANCH_RE);
    if (branch) {
      draft.branch = branch[1]?.trim() ?? "";
      continue;
    }

    const audience = line.match(AUDIENCE_RE);
    if (audience) {
      draft.audience = audience[1]?.trim() ?? "";
      continue;
    }

    const tone = line.match(TONE_RE);
    if (tone) {
      draft.tone = tone[1]?.trim() ?? "";
      continue;
    }

    const tagline = line.match(TAGLINE_RE);
    if (tagline) {
      draft.tagline = tagline[1]?.trim() ?? "";
      continue;
    }

    const heading = line.match(HEADING_RE);
    if (heading) {
      current = createSection(heading[1] ?? "", heading[2] ?? "");
      sections.push(current);
      continue;
    }

    if (!current) {
      current = createSection("lesson", "");
      sections.push(current);
    }

    const body = line.match(BODY_RE);
    if (body) {
      appendText(current, "body", body[2] ?? "");
      continue;
    }

    const prompt = line.match(PROMPT_RE);
    if (prompt) {
      appendText(current, "prompt", prompt[2] ?? "");
      continue;
    }

    const headers = line.match(TABLE_HEADERS_RE);
    if (headers) {
      current.type = "table";
      current.tableHeaders = splitCells(headers[2] ?? "");
      continue;
    }

    const row = line.match(TABLE_ROW_RE);
    if (row) {
      current.type = "table";
      current.tableRows.push(splitCells(row[2] ?? ""));
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (current.type !== "table")
        current.type = current.type === "lesson" ? "checklist" : current.type;
      current.checklistItems.push(line.replace(/^[-*]\s+/, "").trim());
      continue;
    }

    if (line.includes("|") && current.type === "table") {
      const cells = splitCells(line);
      if (current.tableHeaders.length === 0) current.tableHeaders = cells;
      else current.tableRows.push(cells);
      continue;
    }

    appendText(
      current,
      current.type === "workbook" || current.type === "notes" ? "prompt" : "body",
      line,
    );
  }

  const blocks = sections.map(toBlock);
  const hasCover = blocks.some((block) => block.pageType === "cover");
  if (!hasCover && draft.kitName.trim()) {
    blocks.unshift({
      ...createBuilderBlock("cover", 1),
      title: draft.kitName,
      subtitle: draft.subtitle,
      body: draft.tagline,
    });
  }

  const orderedBlocks = blocks.map((block, index) => ({ ...block, order: index + 1 }));
  return normalizeDraft({
    ...draft,
    source: orderedBlocks.length > 0 ? "current" : "blank",
    selectedBlockId: orderedBlocks[0]?.id ?? null,
    blocks: orderedBlocks,
  });
}

function createSection(rawType: string, rawTitle: string): ParsedSection {
  const type = normalizeSectionType(rawType);
  return {
    type,
    title: rawTitle.trim(),
    subtitle: "",
    body: "",
    prompt: "",
    checklistItems: [],
    tableHeaders: [],
    tableRows: [],
  };
}

function toBlock(section: ParsedSection, index: number): BuilderBlock {
  const block = createBuilderBlock(section.type, index + 1);
  const checklistBody = section.checklistItems.join("\n");
  const tableHeaders = normalizeCells(section.tableHeaders);
  const tableRows =
    section.tableRows.length > 0 ? section.tableRows.map(normalizeCells) : [["", "", ""]];

  return {
    ...block,
    title: section.title,
    subtitle: section.subtitle,
    body: section.type === "checklist" ? checklistBody : section.body,
    prompt:
      section.type === "workbook" || section.type === "notes" ? section.prompt || section.body : "",
    lines: section.type === "workbook" || section.type === "notes" ? 12 : block.lines,
    tableData: {
      headers: section.type === "table" ? tableHeaders : block.tableData.headers,
      rows: section.type === "table" ? tableRows : block.tableData.rows,
    },
  };
}

function normalizeSectionType(value: string): PageType {
  const lower = value.toLowerCase().trim();
  if (lower === "cover") return "cover";
  if (lower === "section" || lower === "divider") return "divider";
  if (lower === "workbook" || lower === "workbook prompt") return "workbook";
  if (lower === "checklist") return "checklist";
  if (lower === "notes") return "notes";
  if (lower === "table" || lower === "tracker") return "table";
  return "lesson";
}

function appendText(section: ParsedSection, field: "body" | "prompt", value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  section[field] = section[field] ? `${section[field]}\n\n${trimmed}` : trimmed;
}

function splitCells(value: string): string[] {
  const delimiter = value.includes("|") ? "|" : ",";
  return value
    .split(delimiter)
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function normalizeCells(cells: string[]): string[] {
  const next = cells.slice(0, 3);
  while (next.length < 3) next.push("");
  return next;
}
