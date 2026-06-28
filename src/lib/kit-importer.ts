import {
  createBlankBuilderDraft,
  createBuilderBlock,
  normalizeDraft,
  type BuilderBlock,
  type BuilderDraft,
} from "./builder-content";
import type { LessonActivityType, PageType } from "./kit-types";

export type ImportWarning = {
  blockId?: string;
  message: string;
};

export type ImportedKitReview = {
  draft: BuilderDraft;
  warnings: ImportWarning[];
  cleanedText: string;
  cleanupNotes: string[];
};

type ParsedSection = {
  type: PageType;
  title: string;
  subtitle: string;
  body: string;
  bottomNote: string;
  activityType: LessonActivityType;
  activityTitle: string;
  activityItems: string[];
  prompt: string;
  lines: number | "";
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
  /^(cover|section|divider|module intro|module|lesson activity|lesson activity page|lesson|step|worksheet|workbook prompt|workbook|reflection|checklist|notes|table|tracker|back cover|start here|quote|opening thought|action plan|resource|case study|example|prompt page|multi prompt|multi prompts|multi-prompt|multiple prompt|multiple prompts|prompt group|prompt set|progress check|closing|next steps)\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*[:.-]\s*(.*)$/i;
const BARE_HEADING_RE =
  /^(cover|section|divider|module intro|module|lesson activity|lesson activity page|lesson|step|worksheet|workbook|reflection|checklist|notes|table|tracker|back cover|start here|quote|opening thought|action plan|resource|case study|example|prompt page|multi prompt|multi prompts|multi-prompt|multiple prompt|multiple prompts|prompt group|prompt set|progress check|closing|next steps)\s*(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)?$/i;
const PAGE_LABEL_HEADING_RE =
  /^(cover page|section divider|lesson activity page|lesson page|table\s*\/\s*tracker page|table page|tracker page|workbook page|checklist page|notes page|back cover page|start here page|module intro page|quote\s*\/\s*opening thought page|quote page|opening thought page|reflection page|action plan page|resource page|case study\s*\/\s*example page|case study page|example page|prompt page|multi prompt page|multi prompts page|multi-prompt page|multiple prompt page|multiple prompts page|prompt group page|prompt set page|progress check page|closing\s*\/\s*next steps page|closing page|next steps page)\s*(?::|[-.])?\s*(.*)$/i;
const NUMBERED_HEADING_RE =
  /^(?:\d+[).]\s*)?(lesson|step|module|worksheet|reflection|tracker)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)?\s*[:.-]\s*(.+)$/i;
const BODY_RE = /^(body|lesson body|description)\s*:\s*(.*)$/i;
const BOTTOM_NOTE_RE = /^(bottom note|motivation|motivational note|encouragement)\s*:\s*(.*)$/i;
const ACTIVITY_TYPE_RE = /^(activity type|activity)\s*:\s*(.+)$/i;
const ACTIVITY_TITLE_RE = /^(activity title|checklist title|action title|prompt title)\s*:\s*(.+)$/i;
const ACTIVITY_ITEMS_RE = /^(checklist|checklist items|action steps|activity items)\s*:\s*(.*)$/i;
const PROMPT_RE =
  /^(prompt\s*\d*|workbook prompt|notes prompt|question|reflection question)\s*:\s*(.*)$/i;
const WRITING_LINES_RE =
  /^(writing\s*lines?|writing\s*line\s*count|line\s*count|lines)\s*:\s*(\d{1,2})\s*$/i;
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
  const cleanup = cleanupImportedKitText(raw);
  const draft = createBlankBuilderDraft();
  const sections: ParsedSection[] = [];
  let current: ParsedSection | null = null;

  const lines = cleanup.cleanedText.replace(/\r\n/g, "\n").split("\n");
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const markdownHeading = line.match(MARKDOWN_HEADING_RE);
    if (markdownHeading) {
      const level = markdownHeading[1]?.length ?? 1;
      const headingText = markdownHeading[2]?.trim() ?? "";
      const typedHeading = matchTypedHeading(headingText);

      if (typedHeading) {
        if (shouldAppendHeadingToCurrentMultiPrompt(current, typedHeading.type)) {
          appendText(current, "body", `Prompt: ${typedHeading.title}`);
          continue;
        }

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

    if (current?.type === "lesson-activity") {
      const activityItems = line.match(ACTIVITY_ITEMS_RE);
      if (activityItems) {
        if ((activityItems[1] ?? "").toLowerCase().includes("action")) {
          current.activityType = "action-steps";
        } else if ((activityItems[1] ?? "").toLowerCase().includes("checklist")) {
          current.activityType = "checklist";
        }
        const itemText = activityItems[2]?.trim() ?? "";
        if (itemText) current.activityItems.push(itemText);
        continue;
      }
    }

    const typedHeading = matchTypedHeading(line);
    if (typedHeading) {
      if (shouldAppendHeadingToCurrentMultiPrompt(current, typedHeading.type)) {
        appendText(current, "body", `Prompt: ${typedHeading.title}`);
        continue;
      }

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

    const bottomNote = line.match(BOTTOM_NOTE_RE);
    if (bottomNote) {
      current.bottomNote = [current.bottomNote, bottomNote[2]?.trim() ?? ""]
        .filter(Boolean)
        .join(" ");
      continue;
    }

    const activityType = line.match(ACTIVITY_TYPE_RE);
    if (activityType && current.type === "lesson-activity") {
      current.activityType = normalizeLessonActivityType(activityType[2] ?? "");
      continue;
    }

    const activityTitle = line.match(ACTIVITY_TITLE_RE);
    if (activityTitle && current.type === "lesson-activity") {
      current.activityTitle = activityTitle[2]?.trim() ?? "";
      continue;
    }

    const prompt = line.match(PROMPT_RE);
    if (prompt) {
      if (current.type === "lesson-activity") {
        current.activityType = "writing-prompt";
        appendText(current, "prompt", prompt[2] ?? "");
        continue;
      }
      if (shouldTreatPromptAsMultiPrompt(current, prompt[1] ?? "")) {
        ensureMultiPromptSection(current);
        appendText(current, "body", `Prompt: ${prompt[2] ?? ""}`);
        continue;
      }
      if (
        current.type !== "workbook" &&
        current.type !== "notes" &&
        current.type !== "reflection" &&
        current.type !== "prompt-page"
      ) {
        current.type = "workbook";
      }
      appendText(current, "prompt", prompt[2] ?? "");
      continue;
    }

    const writingLines = line.match(WRITING_LINES_RE);
    if (writingLines) {
      if (current.type === "multi-prompt") {
        appendText(current, "body", `Writing Lines: ${writingLines[2]}`);
        continue;
      }
      current.lines = Number(writingLines[2]);
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
      if (current.type === "lesson-activity") {
        current.activityItems.push(checklistItem[1]?.trim() ?? "");
        continue;
      }
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

  const blocks = mergePromptPageSections(sections).map(toBlock);
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
    cleanedText: cleanup.cleanedText,
    cleanupNotes: cleanup.notes,
  };
}

export function cleanupImportedKitText(raw: string): { cleanedText: string; notes: string[] } {
  const notes = new Set<string>();
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const cleanedLines = lines.map((line) => cleanupImportedLine(line, notes));

  return {
    cleanedText: cleanedLines.join("\n").trim(),
    notes: Array.from(notes),
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

function cleanupImportedLine(line: string, notes: Set<string>): string {
  const indentation = line.match(/^\s*/)?.[0] ?? "";
  const trimmed = line.trim();

  if (!trimmed) return "";

  const bullet = trimmed.match(/^[•‣◦▪▫☐☑✓✔]\s*(.+)$/);
  if (bullet) {
    notes.add("Converted Word-style bullets and checkboxes into checklist items.");
    return `${indentation}- ${bullet[1]?.trim() ?? ""}`;
  }

  const normalized = normalizeLabelLine(trimmed, notes);
  if (normalized !== trimmed) return `${indentation}${normalized}`;

  return line;
}

function normalizeLabelLine(line: string, notes: Set<string>): string {
  const label = line.match(/^([A-Za-z][A-Za-z\s/]+?)\s*:\s*(.*)$/);
  if (!label) return line;

  const rawLabel = label[1]?.trim() ?? "";
  const value = label[2]?.trim() ?? "";
  const normalizedLabel = rawLabel.toLowerCase().replace(/\s+/g, " ");
  const nextLabel = STRICT_LABEL_ALIASES[normalizedLabel];

  if (!nextLabel) return line;
  notes.add("Standardized rough labels into the strict import format.");
  return `${nextLabel}: ${value}`.trimEnd();
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
    bottomNote: "",
    activityType: "checklist",
    activityTitle: "",
    activityItems: [],
    prompt,
    lines: "",
    checklistItems: [],
    tableHeaders: [],
    tableRows: [],
  };
}

function toBlock(section: ParsedSection, index: number): BuilderBlock {
  const block = createBuilderBlock(section.type, index + 1);
  const checklistBody = section.checklistItems.join("\n");
  const activityItems = section.activityItems.join("\n");
  const tableHeaders = normalizeCells(section.tableHeaders);
  const tableRows =
    section.tableRows.length > 0 ? section.tableRows.map(normalizeCells) : [["", "", ""]];
  const supportsWritingLines =
    section.type === "workbook" ||
    section.type === "notes" ||
    section.type === "reflection" ||
    section.type === "prompt-page" ||
    section.type === "lesson-activity";
  const importedLines =
    section.lines === ""
      ? section.type === "workbook" || section.type === "notes"
        ? 12
        : block.lines
      : section.lines;

  return {
    ...block,
    title: section.title,
    subtitle: section.subtitle,
    bottomNote: section.bottomNote,
    activityType: section.activityType,
    activityTitle: section.activityTitle,
    activityItems,
    body: section.type === "checklist" ? checklistBody : section.body,
    prompt: supportsWritingLines ? section.prompt || section.body : "",
    lines: supportsWritingLines ? importedLines : block.lines,
    tableData: {
      headers: section.type === "table" ? tableHeaders : block.tableData.headers,
      rows: section.type === "table" ? tableRows : block.tableData.rows,
    },
  };
}

function normalizeSectionType(value: string): PageType {
  const lower = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (lower === "cover" || lower === "cover page") return "cover";
  if (lower === "lesson activity" || lower === "lesson activity page") return "lesson-activity";
  if (
    lower === "section" ||
    lower === "divider" ||
    lower === "module" ||
    lower === "module intro" ||
    lower === "module intro page" ||
    lower === "section divider"
  )
    return lower.includes("module intro") ? "module-intro" : "divider";
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
  if (lower === "back cover" || lower === "back cover page") return "back-cover";
  if (lower === "start here" || lower === "start here page") return "start-here";
  if (
    lower === "quote" ||
    lower === "quote page" ||
    lower === "opening thought" ||
    lower === "opening thought page" ||
    lower === "quote / opening thought page"
  )
    return "quote";
  if (lower === "reflection page") return "reflection";
  if (lower === "action plan" || lower === "action plan page") return "action-plan";
  if (lower === "resource" || lower === "resource page") return "resource";
  if (
    lower === "case study" ||
    lower === "case study page" ||
    lower === "example" ||
    lower === "example page" ||
    lower === "case study / example page"
  )
    return "case-study";
  if (lower === "prompt page") return "prompt-page";
  if (
    lower === "multi prompt" ||
    lower === "multi prompts" ||
    lower === "multi prompt page" ||
    lower === "multi prompts page" ||
    lower === "multi-prompt" ||
    lower === "multi-prompt page" ||
    lower === "multiple prompt" ||
    lower === "multiple prompts" ||
    lower === "multiple prompt page" ||
    lower === "multiple prompts page" ||
    lower === "prompt group" ||
    lower === "prompt group page" ||
    lower === "prompt set" ||
    lower === "prompt set page"
  )
    return "multi-prompt";
  if (lower === "progress check" || lower === "progress check page") return "progress-check";
  if (
    lower === "closing" ||
    lower === "closing page" ||
    lower === "next steps" ||
    lower === "next steps page" ||
    lower === "closing / next steps page"
  )
    return "closing";
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

function normalizeLessonActivityType(value: string): LessonActivityType {
  const lower = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (lower.includes("action")) return "action-steps";
  if (lower.includes("prompt") || lower.includes("writing")) return "writing-prompt";
  return "checklist";
}

function titleFromBareHeading(lowerType: string): string {
  if (lowerType.endsWith(" page") || lowerType === "table / tracker page") return "";
  if (lowerType === "lesson activity" || lowerType === "lesson activity page")
    return "Lesson Activity";
  if (lowerType === "checklist") return "Checklist";
  if (lowerType === "notes") return "Notes";
  if (lowerType === "back cover") return "Back Cover";
  if (lowerType === "start here") return "Start Here";
  if (lowerType === "module intro") return "Module Intro";
  if (lowerType === "quote" || lowerType === "opening thought") return "Opening Thought";
  if (lowerType === "action plan") return "Action Plan";
  if (lowerType === "resource") return "Resources";
  if (lowerType === "case study" || lowerType === "example") return "Case Study";
  if (lowerType === "prompt page") return "Prompt";
  if (lowerType === "progress check") return "Progress Check";
  if (lowerType === "closing" || lowerType === "next steps") return "Next Steps";
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

function shouldTreatPromptAsMultiPrompt(section: ParsedSection, label: string): boolean {
  if (section.type === "multi-prompt") return true;
  if (/^prompt\s*\d+$/i.test(label.trim())) return true;
  return section.type === "prompt-page" && Boolean(section.prompt.trim() || section.lines !== "");
}

function shouldAppendHeadingToCurrentMultiPrompt(
  section: ParsedSection | null,
  nextType: PageType,
): section is ParsedSection {
  return Boolean(section && section.type === "multi-prompt" && nextType === "prompt-page");
}

function ensureMultiPromptSection(section: ParsedSection) {
  if (section.type === "multi-prompt") return;

  const existingPrompt = section.prompt.trim();
  const existingLines = section.lines;
  section.type = "multi-prompt";
  section.prompt = "";
  section.lines = "";

  if (!existingPrompt) return;

  appendText(section, "body", `Prompt: ${existingPrompt}`);
  if (existingLines !== "") appendText(section, "body", `Writing Lines: ${existingLines}`);
}

function mergePromptPageSections(sections: ParsedSection[]): ParsedSection[] {
  const merged: ParsedSection[] = [];

  for (const section of sections) {
    const previous = merged[merged.length - 1];
    if (shouldMergePromptPages(previous, section)) {
      ensureMultiPromptSection(previous);
      appendPromptSectionToMultiPrompt(previous, section);
      continue;
    }

    merged.push(section);
  }

  return merged;
}

function shouldMergePromptPages(
  previous: ParsedSection | undefined,
  current: ParsedSection,
): previous is ParsedSection {
  if (!previous) return false;
  if (current.type !== "prompt-page") return false;
  if (previous.type !== "prompt-page" && previous.type !== "multi-prompt") return false;
  const previousTitle = previous.title.trim().toLowerCase();
  const currentTitle = current.title.trim().toLowerCase();
  return Boolean(previousTitle && previousTitle === currentTitle);
}

function appendPromptSectionToMultiPrompt(target: ParsedSection, source: ParsedSection) {
  const promptText = source.prompt.trim() || source.body.trim() || source.title.trim();
  if (promptText) appendText(target, "body", `Prompt: ${promptText}`);
  if (source.lines !== "") appendText(target, "body", `Writing Lines: ${source.lines}`);
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

const STRICT_LABEL_ALIASES: Record<string, string> = {
  "kit title": "Kit Name",
  "kit name": "Kit Name",
  title: "Kit Name",
  "cover title": "Kit Name",
  description: "Body",
  "lesson title": "Lesson",
  "lesson activity title": "Lesson Activity Page",
  "lesson activity page": "Lesson Activity Page",
  "lesson page": "Lesson",
  "lesson body": "Body",
  "bottom note": "Bottom Note",
  "motivational note": "Bottom Note",
  "activity type": "Activity Type",
  "activity title": "Activity Title",
  "action steps": "Action Steps",
  "activity items": "Activity Items",
  "body text": "Body",
  "workbook title": "Workbook",
  "workbook page": "Workbook",
  "workbook prompt": "Prompt",
  question: "Prompt",
  "notes title": "Notes",
  "notes page": "Notes",
  "notes prompt": "Prompt",
  "checklist title": "Checklist",
  "checklist page": "Checklist",
  "checklist items": "Checklist",
  "back cover title": "Back Cover",
  "back cover page": "Back Cover",
  "tracker title": "Table",
  "tracker page": "Table",
  "table title": "Table",
  "table page": "Table",
  "table / tracker page": "Table",
  columns: "Headers",
  "column headers": "Headers",
  headers: "Headers",
  "table headers": "Headers",
  row: "Row",
  rows: "Row",
  "table row": "Row",
};

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
    case "lesson-activity":
      return "Lesson Activity";
    case "table":
      return "Table";
    case "workbook":
      return "Workbook";
    case "checklist":
      return "Checklist";
    case "notes":
      return "Notes";
    case "back-cover":
      return "Back Cover";
    case "start-here":
      return "Start Here";
    case "module-intro":
      return "Module Intro";
    case "quote":
      return "Quote";
    case "reflection":
      return "Reflection";
    case "action-plan":
      return "Action Plan";
    case "resource":
      return "Resource";
    case "case-study":
      return "Case Study";
    case "prompt-page":
      return "Prompt";
    case "multi-prompt":
      return "Multi-Prompt";
    case "progress-check":
      return "Progress Check";
    case "closing":
      return "Closing";
  }
}
