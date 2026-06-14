import {
  createBlankBuilderDraft,
  createBuilderBlock,
  normalizeDraft,
  type BuilderBlock,
  type BuilderDraft,
} from "./builder-content";
import type { PageType } from "./kit-types";

export type ImportWarning = {
  blockId?: string;
  message: string;
};

export type ImportedKitReview = {
  draft: BuilderDraft;
  warnings: ImportWarning[];
};

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
  /^(cover|section|divider|module|lesson|step|worksheet|workbook prompt|workbook|reflection|checklist|notes|table|tracker)\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*[:.-]\s*(.*)$/i;
const BARE_HEADING_RE =
  /^(cover|section|divider|module|lesson|step|worksheet|workbook|reflection|checklist|notes|table|tracker)\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)?$/i;
const PAGE_LABEL_HEADING_RE =
  /^(cover page|section divider|lesson page|table\s*\/\s*tracker page|table page|tracker page|workbook page|checklist page|notes page)\s*(?::|[-.])?\s*(.*)$/i;
const NUMBERED_HEADING_RE =
  /^(?:\d+[).]\s*)?(lesson|step|module|worksheet|reflection|tracker)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*[:.-]\s*(.+)$/i;
const BODY_RE = /^(body|lesson body|description)\s*:\s*(.*)$/i;
const PROMPT_RE =
  /^(prompt|workbook prompt|notes prompt|question|reflection question)\s*:\s*(.*)$/i;
const TABLE_HEADERS_RE = /^(headers|columns)\s*:\s*(.+)$/i;
const TABLE_ROW_RE = /^(row|table row)\s*:\s*(.+)$/i;
const CHECKLIST_ITEM_RE = /^[-*]\s+(.+)$/;
const NUMBERED_ITEM_RE = /^\d+[).]\s+(.+)$/;
const QUESTION_RE = /^(what|why|how|when|where|who|which)\b.+\?$/i;
const MARKDOWN_HEADING_RE = /^(#{1,6})\s+(.+)$/;

export function parseImportedKitText(raw: string): BuilderDraft {
  return detectImportedKitText(raw).draft;
}

export function detectImportedKitText(raw: string): ImportedKitReview {
  const draft = createBlankBuilderDraft();
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const markdownHeading = line.match(MARKDOWN_HEADING_RE);
    if (markdownHeading) {
      const level = markdownHeading[1]?.length ?? 1;
      const headingText = markdownHeading[2]?.trim() ?? "";
      const typedHeading = matchTypedHeading(headingText);

      if (typedHeading) {
        current = createSection(typedHeading.type, typedHeading.title);
        sections.push(current);
        continue;
      }

      if (level === 1 && !draft.kitName.trim()) {
        draft.kitName = headingText;
        continue;
      }

      current = createSection(level <= 2 ? "divider" : "lesson", headingText);
      sections.push(current);
      continue;
    }

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

    const typedHeading = matchTypedHeading(line);
    if (typedHeading) {
      current = createSection(typedHeading.type, typedHeading.title);
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
      current.type = current.type === "notes" ? "notes" : "workbook";
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

    if (shouldPromoteLineToTitle(current, line)) {
      current.title = line;
      continue;
    }

    if ((current.type === "table" || line.includes("|")) && looksLikeTableLine(line)) {
      current.type = "table";
      const cells = splitCells(line);
      if (current.tableHeaders.length === 0) current.tableHeaders = cells;
      else current.tableRows.push(cells);
      continue;
    }

    const checklistItem = line.match(CHECKLIST_ITEM_RE) ?? line.match(NUMBERED_ITEM_RE);
    if (checklistItem) {
      if (current.type === "checklist") {
        current.checklistItems.push(checklistItem[1]?.trim() ?? "");
        continue;
      }
      appendText(
        current,
        current.type === "workbook" || current.type === "notes" ? "prompt" : "body",
        line,
      );
      continue;
    }

    if (current.type === "checklist") {
      current.checklistItems.push(line);
      continue;
    }

    if ((current.type === "workbook" || current.type === "notes") && QUESTION_RE.test(line)) {
      appendText(current, "prompt", line);
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
  const normalizedDraft = normalizeDraft({
    ...draft,
    source: orderedBlocks.length > 0 ? "current" : "blank",
    selectedBlockId: orderedBlocks[0]?.id ?? null,
    blocks: orderedBlocks,
  });

  return {
    draft: normalizedDraft,
    warnings: getImportWarnings(normalizedDraft),
  };
}

export function getImportWarnings(draft: BuilderDraft): ImportWarning[] {
  const warnings: ImportWarning[] = [];

  if (!draft.kitName.trim()) {
    warnings.push({ message: "Kit name was not detected." });
  }

  for (const block of draft.blocks) {
    if (!block.title.trim()) {
      warnings.push({
        blockId: block.id,
        message: `${pageTypeName(block.pageType)} block has no title.`,
      });
    }
    if (block.pageType === "lesson" && !block.body.trim()) {
      warnings.push({
        blockId: block.id,
        message: `${block.title || "Lesson"} has no lesson body.`,
      });
    }
    if ((block.pageType === "workbook" || block.pageType === "notes") && !block.prompt.trim()) {
      warnings.push({
        blockId: block.id,
        message: `${block.title || pageTypeName(block.pageType)} has no prompt.`,
      });
    }
    if (block.pageType === "checklist" && !block.body.trim()) {
      warnings.push({
        blockId: block.id,
        message: `${block.title || "Checklist"} has no checklist items.`,
      });
    }
    if (block.pageType === "table") {
      const hasHeaders = block.tableData.headers.some((header) => header.trim());
      const hasRows = block.tableData.rows.some((row) => row.some((cell) => cell.trim()));
      if (!hasHeaders) {
        warnings.push({
          blockId: block.id,
          message: `${block.title || "Table"} has no column headers.`,
        });
      }
      if (!hasRows) {
        warnings.push({
          blockId: block.id,
          message: `${block.title || "Table"} has no row entries.`,
        });
      }
    }
  }

  return warnings;
}

function matchTypedHeading(line: string): { type: string; title: string } | null {
  const pageLabel = line.match(PAGE_LABEL_HEADING_RE);
  if (pageLabel) {
    return { type: pageLabel[1] ?? "lesson", title: pageLabel[2]?.trim() ?? "" };
  }

  const heading = line.match(HEADING_RE);
  if (heading) {
    return { type: heading[1] ?? "lesson", title: heading[2]?.trim() ?? "" };
  }

  const numbered = line.match(NUMBERED_HEADING_RE);
  if (numbered) {
    return { type: numbered[1] ?? "lesson", title: numbered[2]?.trim() ?? "" };
  }

  const bare = line.match(BARE_HEADING_RE);
  if (bare) {
    return { type: bare[1] ?? "lesson", title: "" };
  }

  return null;
}

function createSection(rawType: string, rawTitle: string): ParsedSection {
  const type = normalizeSectionType(rawType);
  const lowerType = rawType.toLowerCase().trim();
  const title =
    lowerType === "workbook prompt"
      ? "Workbook"
      : lowerType === "reflection"
        ? "Reflection"
        : rawTitle.trim() || titleFromBareHeading(lowerType);
  const prompt =
    lowerType === "workbook prompt" || lowerType === "reflection" ? rawTitle.trim() : "";

  return {
    type,
    title,
    subtitle: "",
    body: "",
    prompt,
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
  const lower = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (lower === "cover" || lower === "cover page") return "cover";
  if (
    lower === "section" ||
    lower === "divider" ||
    lower === "module" ||
    lower === "section divider"
  )
    return "divider";
  if (
    lower === "workbook" ||
    lower === "workbook page" ||
    lower === "workbook prompt" ||
    lower === "worksheet" ||
    lower === "reflection"
  )
    return "workbook";
  if (lower === "checklist" || lower === "checklist page") return "checklist";
  if (lower === "notes" || lower === "notes page") return "notes";
  if (
    lower === "table" ||
    lower === "tracker" ||
    lower === "table page" ||
    lower === "tracker page" ||
    lower === "table / tracker page"
  )
    return "table";
  return "lesson";
}

function titleFromBareHeading(lowerType: string): string {
  if (lowerType.endsWith(" page") || lowerType === "table / tracker page") return "";
  if (lowerType === "checklist") return "Checklist";
  if (lowerType === "notes") return "Notes";
  if (lowerType === "tracker") return "Tracker";
  if (lowerType === "table") return "Table";
  if (lowerType === "workbook" || lowerType === "worksheet") return "Workbook";
  return "";
}

function appendText(section: ParsedSection, field: "body" | "prompt", value: string) {
  const trimmed = value.trim();
  if (!trimmed) return;
  section[field] = section[field] ? `${section[field]}\n\n${trimmed}` : trimmed;
}

function looksLikeTableLine(line: string): boolean {
  return splitCells(line).length >= 2;
}

function shouldPromoteLineToTitle(section: ParsedSection, line: string): boolean {
  if (section.title.trim()) return false;
  if (line.match(BODY_RE) || line.match(PROMPT_RE)) return false;
  if (line.match(TABLE_HEADERS_RE) || line.match(TABLE_ROW_RE)) return false;
  if (line.match(CHECKLIST_ITEM_RE) || line.match(NUMBERED_ITEM_RE)) return false;
  if (matchTypedHeading(line)) return false;
  if (looksLikeTableLine(line)) return false;
  if (section.body.trim() || section.prompt.trim()) return false;
  if (section.checklistItems.length > 0) return false;
  if (section.tableHeaders.length > 0 || section.tableRows.length > 0) return false;
  return true;
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

function pageTypeName(pageType: PageType): string {
  switch (pageType) {
    case "cover":
      return "Cover";
    case "divider":
      return "Section Divider";
    case "lesson":
      return "Lesson";
    case "table":
      return "Table";
    case "workbook":
      return "Workbook";
    case "checklist":
      return "Checklist";
    case "notes":
      return "Notes";
  }
}
