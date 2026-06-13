import {
  buildPagesFromKitDraft,
  getBuilderWarnings,
  normalizeDraft,
  pageTypeLabel,
  type BuilderBlock,
  type BuilderDraft,
} from "./builder-content";
import type { VersionQcStatus } from "./version-library";

export type QCIssueSeverity = "blocker" | "warning" | "info";
export type QCVerdict = "Sale Ready" | "Needs Repair" | "Not Ready for DocHub" | "Style Ready";

export type QCIssue = {
  id: string;
  severity: QCIssueSeverity;
  area: string;
  blockTitle: string;
  message: string;
};

export type QCReportMvp = {
  verdict: QCVerdict;
  qcStatus: VersionQcStatus;
  saleReady: boolean;
  docHubReady: boolean;
  topBlockers: QCIssue[];
  issues: QCIssue[];
  repairPrompt: string;
  generatedAt: string;
  pageCount: number;
};

const SAMPLE_TEXT_MARKERS = [
  "Get Your Business Straight",
  "Set Your Priorities",
  "Before your business can look polished online",
  "Structure / Legitimacy / Foundation",
  "A Best Collective Brand Kit",
];

const PLACEHOLDER_MARKERS = ["lorem ipsum", "placeholder", "todo", "write your", "sample"];

export function createQCReport(draft: BuilderDraft): QCReportMvp {
  const normalized = normalizeDraft(draft);
  const issues: QCIssue[] = [];
  const pages = buildPagesFromKitDraft(normalized);

  if (normalized.blocks.length === 0) {
    issues.push(issue("blocker", "Kit Structure", "Kit", "No blocks have been added."));
  }

  if (containsSampleText(joinDraftText(normalized))) {
    issues.push(
      issue(
        "blocker",
        "Content Cleanliness",
        normalized.kitName || "Kit",
        "Sample or placeholder wording may still be present.",
      ),
    );
  }

  for (const warning of getBuilderWarnings(normalized)) {
    issues.push(
      issue(
        warning.scope === "kit" ? "blocker" : "warning",
        "Layout Safety",
        blockTitle(normalized.blocks.find((block) => block.id === warning.blockId)),
        warning.message,
      ),
    );
  }

  for (const block of normalized.blocks) {
    addBlockChecks(block, issues);
  }

  if (pages.length === 0) {
    issues.push(
      issue(
        "blocker",
        "PDF Readiness",
        normalized.kitName || "Kit",
        "No printable pages were generated.",
      ),
    );
  }

  const blockers = issues.filter((item) => item.severity === "blocker");
  const warnings = issues.filter((item) => item.severity === "warning");
  const verdict: QCVerdict =
    blockers.length > 0
      ? "Needs Repair"
      : warnings.some((item) => item.area === "DocHub Readiness")
        ? "Not Ready for DocHub"
        : warnings.length > 0
          ? "Style Ready"
          : "Sale Ready";

  return {
    verdict,
    qcStatus: blockers.length > 0 ? "Needs Repair" : "Passed",
    saleReady: blockers.length === 0 && verdict !== "Not Ready for DocHub",
    docHubReady:
      blockers.length === 0 && !warnings.some((item) => item.area === "DocHub Readiness"),
    topBlockers: blockers.slice(0, 5),
    issues,
    repairPrompt: buildRepairPrompt(normalized, issues, verdict),
    generatedAt: new Date().toISOString(),
    pageCount: pages.length,
  };
}

function addBlockChecks(block: BuilderBlock, issues: QCIssue[]) {
  const title = blockTitle(block);

  if (!block.title.trim()) {
    issues.push(
      issue(
        "blocker",
        "Content Cleanliness",
        title,
        `${pageTypeLabel(block.pageType)} is missing a title.`,
      ),
    );
  }

  if (containsSampleText(joinBlockText(block))) {
    issues.push(
      issue(
        "blocker",
        "Content Cleanliness",
        title,
        "This block may contain sample or placeholder wording.",
      ),
    );
  }

  if (block.pageType === "table") {
    const hasHeader = block.tableData.headers.some((header) => header.trim());
    const rowsWithContent = block.tableData.rows.filter((row) => row.some((cell) => cell.trim()));
    if (!hasHeader) {
      issues.push(issue("blocker", "Tables/Trackers", title, "Table headers are blank."));
    }
    if (rowsWithContent.length === 0) {
      issues.push(issue("blocker", "Tables/Trackers", title, "Table has no filled rows."));
    }
  }

  if (block.pageType === "workbook") {
    if (!block.prompt.trim()) {
      issues.push(issue("blocker", "Workbook Usability", title, "Workbook prompt is blank."));
    }
    if (block.lines === "" || Number(block.lines) < 4) {
      issues.push(
        issue("blocker", "Workbook Usability", title, "Workbook needs at least 4 writing lines."),
      );
    }
  }

  if (block.pageType === "notes" && (block.lines === "" || Number(block.lines) < 4)) {
    issues.push(
      issue("warning", "Workbook Usability", title, "Notes page needs usable writing space."),
    );
  }

  if (block.pageType === "checklist") {
    const items = block.body
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length === 0) {
      issues.push(issue("blocker", "Tables/Checklists", title, "Checklist has no items."));
    }
  }

  if ((block.pageType === "workbook" || block.pageType === "notes") && !block.prompt.trim()) {
    issues.push(
      issue(
        "warning",
        "DocHub Readiness",
        title,
        "Blank writing pages can print, but fillable mapping may need a prompt or field label later.",
      ),
    );
  }
}

function buildRepairPrompt(draft: BuilderDraft, issues: QCIssue[], verdict: QCVerdict): string {
  if (issues.length === 0) {
    return [
      `QC passed for "${draft.kitName || "Untitled"}".`,
      "Do not redesign Brand Template V1.",
      "Keep the current print/PDF pipeline unchanged.",
    ].join("\n");
  }

  const issueLines = issues
    .slice(0, 12)
    .map((item) => `- [${item.severity.toUpperCase()}] ${item.blockTitle}: ${item.message}`)
    .join("\n");

  return [
    `Fix only the confirmed QC issues for "${draft.kitName || "Untitled"}".`,
    `Current verdict: ${verdict}.`,
    "Do not redesign Brand Template V1.",
    "Do not change print CSS, fonts, page size, /mapper, or unrelated builder behavior.",
    "Keep blank fields blank and do not add sample content.",
    "Issues:",
    issueLines,
  ].join("\n");
}

function containsSampleText(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    SAMPLE_TEXT_MARKERS.some((marker) => lower.includes(marker.toLowerCase())) ||
    PLACEHOLDER_MARKERS.some((marker) => lower.includes(marker))
  );
}

function joinDraftText(draft: BuilderDraft): string {
  return [
    draft.kitName,
    draft.subtitle,
    draft.branch,
    draft.audience,
    draft.tone,
    draft.tagline,
    ...draft.blocks.map(joinBlockText),
  ].join("\n");
}

function joinBlockText(block: BuilderBlock): string {
  return [
    block.title,
    block.subtitle,
    block.body,
    block.keywords,
    block.prompt,
    ...block.tableData.headers,
    ...block.tableData.rows.flat(),
  ].join("\n");
}

function blockTitle(block?: BuilderBlock): string {
  if (!block) return "Kit";
  return block.title.trim() || pageTypeLabel(block.pageType);
}

function issue(
  severity: QCIssueSeverity,
  area: string,
  blockTitleValue: string,
  message: string,
): QCIssue {
  return {
    id: `${severity}-${area}-${blockTitleValue}-${message}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-"),
    severity,
    area,
    blockTitle: blockTitleValue,
    message,
  };
}
