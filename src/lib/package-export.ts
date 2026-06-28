import { buildPagesFromKitDraft, normalizeDraft, type BuilderDraft } from "./builder-content";
import type { KitVersionRecord, VersionQcStatus } from "./version-library";

export const PACKAGE_EXPORT_STORAGE_KEY = "best_collective_package_exports";

export type PackageExportStatus = {
  id: string;
  sourceVersionId?: string;
  sourceKitId?: string;
  kitName: string;
  branch: string;
  version: string;
  workbookExported: boolean;
  lessonGuideGenerated: boolean;
  howToGenerated: boolean;
  excelCalculatorIncluded: boolean;
  fillablePdfExported: boolean;
  qcStatus: VersionQcStatus;
  saleReady: boolean;
  docHubReady: boolean;
  packageReady: boolean;
  manifest: string;
  createdAt: string;
  updatedAt: string;
};

export type PackageAssetReadiness = {
  workbookReady: boolean;
  lessonGuideGenerated: boolean;
  howToGenerated: boolean;
  excelCalculatorRequired: boolean;
  excelCalculatorReady: boolean;
  fillableReady: boolean;
  qcPassed: boolean;
  packageNotesGenerated: boolean;
};

export function loadPackageExports(): PackageExportStatus[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(PACKAGE_EXPORT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<PackageExportStatus>[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePackageExport).filter(Boolean) as PackageExportStatus[];
  } catch {
    return [];
  }
}

export function savePackageExports(records: PackageExportStatus[]): PackageExportStatus[] {
  const normalized = records.map(normalizePackageExport).filter(Boolean) as PackageExportStatus[];

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(PACKAGE_EXPORT_STORAGE_KEY, JSON.stringify(normalized));
    } catch {
      // Ignore local browser storage failures.
    }
  }

  return normalized;
}

export function findPackageExportForVersion(
  records: PackageExportStatus[],
  versionId: string,
): PackageExportStatus | null {
  return records.find((record) => record.sourceVersionId === versionId) ?? null;
}

export function getPackageExportForSource(
  records: PackageExportStatus[],
  draft: BuilderDraft,
  version?: KitVersionRecord | null,
): PackageExportStatus {
  const normalizedDraft = normalizeDraft(draft);
  const now = new Date().toISOString();
  const existing = version
    ? findPackageExportForVersion(records, version.id)
    : records.find(
        (record) => !record.sourceVersionId && record.sourceKitId === normalizedDraft.id,
      );

  if (existing) {
    return normalizePackageExport({
      ...existing,
      sourceKitId: existing.sourceKitId ?? normalizedDraft.id,
      kitName: normalizedDraft.kitName,
      branch: normalizedDraft.branch,
      version: version?.version ?? existing.version,
      qcStatus: version?.qcStatus ?? existing.qcStatus,
      saleReady: version?.saleReady ?? existing.saleReady,
      docHubReady: version?.docHubReady ?? existing.docHubReady,
    }) as PackageExportStatus;
  }

  return {
    id: createId("package"),
    sourceVersionId: version?.id,
    sourceKitId: normalizedDraft.id,
    kitName: normalizedDraft.kitName,
    branch: normalizedDraft.branch,
    version: version?.version ?? "Builder Draft",
    workbookExported: false,
    lessonGuideGenerated: false,
    howToGenerated: false,
    excelCalculatorIncluded: false,
    fillablePdfExported: false,
    qcStatus: version?.qcStatus ?? "Not Reviewed",
    saleReady: version?.saleReady ?? false,
    docHubReady: version?.docHubReady ?? false,
    packageReady: false,
    manifest: "",
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertPackageExport(
  records: PackageExportStatus[],
  status: PackageExportStatus,
): PackageExportStatus[] {
  const next = normalizePackageExport({
    ...status,
    updatedAt: new Date().toISOString(),
  }) as PackageExportStatus;
  const remaining = records.filter((record) => record.id !== next.id);
  return savePackageExports([next, ...remaining]);
}

export function buildPackageManifest({
  draft,
  version,
  lessonGuideGenerated,
  howToGenerated,
  workbookExported,
  excelCalculatorIncluded,
  fillablePdfExported,
}: {
  draft: BuilderDraft;
  version: string;
  lessonGuideGenerated: boolean;
  howToGenerated: boolean;
  workbookExported: boolean;
  excelCalculatorIncluded: boolean;
  fillablePdfExported: boolean;
}): string {
  const normalizedDraft = normalizeDraft(draft);
  const productName = normalizedDraft.kitName.trim() || "Untitled Kit";
  const branch = normalizedDraft.branch.trim() || "Unassigned";
  const safeName = productName.replace(/[\\/:*?"<>|]/g, "").trim() || "Untitled Kit";
  const workbookFileName = `${safeName} - Workbook + Action Planner.pdf`;
  const fillableFileName = `${safeName} - Fillable Workbook.pdf`;
  const needsExcelCalculator = requiresExcelCalculator(normalizedDraft);
  const includedFiles = [
    workbookExported
      ? workbookFileName
      : `${workbookFileName} (export in Chrome before final package)`,
    fillablePdfExported ? fillableFileName : null,
    howToGenerated ? `${safeName} - How To Use This Kit.pdf` : null,
    lessonGuideGenerated ? `${safeName} - Lesson Guide.pdf` : null,
    needsExcelCalculator && excelCalculatorIncluded
      ? `${safeName} - Excel Calculator.xlsx`
      : null,
  ].filter(Boolean);

  return [
    `Package Manifest`,
    ``,
    `Product name: ${productName}`,
    `Branch: ${branch}`,
    `Version: ${version}`,
    `Generated: ${new Date().toLocaleString()}`,
    ``,
    `Included files:`,
    ...includedFiles.map((file) => `- ${file}`),
    ``,
    `Suggested buyer file names:`,
    `- ${workbookFileName}`,
    fillablePdfExported ? `- ${fillableFileName}` : null,
    howToGenerated ? `- ${safeName} - How To Use This Kit.pdf` : null,
    lessonGuideGenerated ? `- ${safeName} - Lesson Guide.pdf` : null,
    needsExcelCalculator ? `- ${safeName} - Excel Calculator.xlsx` : null,
    ``,
    needsExcelCalculator && !excelCalculatorIncluded
      ? `Excel calculator requirement: This kit references an Excel calculator, but it has not been marked included yet. Add the file before sale-ready approval or remove the calculator references.`
      : null,
    ``,
    `Usage notes:`,
    `- Deliver the workbook PDF as the primary customer file.`,
    `- Include the How-To PDF when buyers need simple usage instructions.`,
    `- Keep the Lesson Guide internal unless this product is being taught or facilitated.`,
    ``,
    `Internal production notes:`,
    `- Confirm the workbook PDF was exported from Chrome with background graphics enabled.`,
    `- Export contact sheets for final visual review before sale-ready approval.`,
    `- Confirm QC status is Passed before marking the package ready.`,
    needsExcelCalculator
      ? `- Confirm the Excel calculator file is included before marking the package ready.`
      : null,
    `- ZIP packaging and stored PDF files are not part of this MVP.`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");
}

export function isPackageReady(readiness: PackageAssetReadiness): boolean {
  return (
    readiness.workbookReady &&
    readiness.lessonGuideGenerated &&
    readiness.howToGenerated &&
    (!readiness.excelCalculatorRequired || readiness.excelCalculatorReady) &&
    readiness.fillableReady &&
    readiness.qcPassed &&
    readiness.packageNotesGenerated
  );
}

export function packageReadinessLabel(status: PackageExportStatus | null): "Ready" | "In Progress" {
  return status?.packageReady ? "Ready" : "In Progress";
}

export function countPrintablePages(draft: BuilderDraft): number {
  return buildPagesFromKitDraft(draft).length;
}

function normalizePackageExport(record: Partial<PackageExportStatus>): PackageExportStatus | null {
  if (!record) return null;
  const now = new Date().toISOString();

  return {
    id: record.id ?? createId("package"),
    sourceVersionId: record.sourceVersionId,
    sourceKitId: record.sourceKitId,
    kitName: record.kitName ?? "",
    branch: record.branch ?? "",
    version: record.version ?? "Builder Draft",
    workbookExported: Boolean(record.workbookExported),
    lessonGuideGenerated: Boolean(record.lessonGuideGenerated),
    howToGenerated: Boolean(record.howToGenerated),
    excelCalculatorIncluded: Boolean(record.excelCalculatorIncluded),
    fillablePdfExported: Boolean(record.fillablePdfExported),
    qcStatus: record.qcStatus ?? "Not Reviewed",
    saleReady: Boolean(record.saleReady),
    docHubReady: Boolean(record.docHubReady),
    packageReady: Boolean(record.packageReady),
    manifest: record.manifest ?? "",
    createdAt: record.createdAt ?? now,
    updatedAt: record.updatedAt ?? record.createdAt ?? now,
  };
}

export function requiresExcelCalculator(draft: BuilderDraft): boolean {
  const normalizedDraft = normalizeDraft(draft);
  const text = [
    normalizedDraft.kitName,
    normalizedDraft.subtitle,
    normalizedDraft.tagline,
    ...normalizedDraft.blocks.flatMap((block) => [
      block.title,
      block.subtitle,
      block.body,
      block.bottomNote,
      block.prompt,
      block.activityTitle,
      block.activityItems,
      ...block.tableData.headers,
      ...block.tableData.rows.flat(),
    ]),
  ]
    .join("\n")
    .toLowerCase();

  return /\bexcel\b/.test(text) && /\b(calculator|spreadsheet|sheet|xlsx|xls)\b/.test(text);
}

export function hasCleanFilenames(draft: BuilderDraft | null): boolean {
  if (!draft) return false;
  const name = draft.kitName.trim();
  if (!name || /^untitled$/i.test(name)) return false;
  const safe = name.replace(/[\\/:*?"<>|]/g, "").trim();
  return safe === name && safe.length > 3;
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
