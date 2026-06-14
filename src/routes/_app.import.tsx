import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  History,
  Library,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILDER_BLOCK_TYPES,
  normalizeDraft,
  pageTypeLabel,
  saveBuilderDraft,
  type BuilderBlock,
  type BuilderDraft,
} from "@/lib/builder-content";
import { createVersionLibraryRecord } from "@/lib/api/version-library.functions";
import { extractDocxText } from "@/lib/docx-text";
import {
  createVersionFromDraft,
  loadVersionLibrary,
  saveVersionLibrary,
} from "@/lib/version-library";
import {
  addImportHistoryRecord,
  clearImportHistory,
  detectImportFileType,
  loadImportHistory,
  markImportCreated,
  type ImportHistoryRecord,
} from "@/lib/import-history";
import { detectImportedKitText, getImportWarnings } from "@/lib/kit-importer";
import type { PageType } from "@/lib/kit-types";
import { createQCReport, type QCReportMvp } from "@/lib/qc-report";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [{ title: "Paste Content Importer | Kit Factory" }] }),
  component: ImportPage,
});

const SAMPLE_IMPORT = `Kit Title: Test Kit Erica
Subtitle: A simple workbook draft
Branch: Brand
Audience: Business owners
Tone: Clear and supportive
Tagline: Build the first clean version of your kit.

Lesson: Know What You Are Building
Body: This lesson helps you define the product you are creating and the result it should help someone reach.
Body: Keep the lesson focused so the finished workbook page stays clean and useful.

Workbook: First Build
Prompt: What are you building first?

Checklist: Launch Checklist
- Review the kit
- Export the PDF
- Save the version

Table: Build Tracker
Headers: Task, Owner, Status
Row: Outline kit, Erica, Done
Row: Run QC, Erica, Next`;

const ROUGH_SAMPLE_IMPORT = `Cover Title: Test Kit Erica
Subtitle: Rough cleanup test
Branch: Brand
Audience: Business owners
Tone: Clear and supportive
Tagline: Build the first clean version of your kit.

Lesson Title: Know What You Are Building
Lesson Body: This lesson helps you define the product you are creating and the result it should help someone reach.
Description: Keep the lesson focused so the finished workbook page stays clean and useful.

Workbook Title: First Build
Question: What are you building first?

Checklist Title: Launch Checklist
- Review the kit
- Export the PDF
- Save the version

Tracker Title: Build Tracker
Column Headers: Task, Owner, Status
Table Row: Outline kit, Erica, Done
Table Row: Run QC, Erica, Next`;

function ImportPage() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [importHistory, setImportHistory] = useState<ImportHistoryRecord[]>(() =>
    loadImportHistory(),
  );
  const [savingVersion, setSavingVersion] = useState(false);
  const [showImportQc, setShowImportQc] = useState(false);
  const detected = useMemo(() => detectImportedKitText(rawText), [rawText]);
  const [reviewDraft, setReviewDraft] = useState<BuilderDraft>(detected.draft);
  const warnings = useMemo(() => getImportWarnings(reviewDraft), [reviewDraft]);
  const importQcReport = useMemo(() => createQCReport(reviewDraft), [reviewDraft]);
  const importQcBlockers = importQcReport.issues.filter((issue) => issue.severity === "blocker");
  const importQcWarnings = importQcReport.issues.filter((issue) => issue.severity === "warning");
  const hasImportBlockers = importQcBlockers.length > 0;
  const hasContent = rawText.trim().length > 0;
  const cleanupWasApplied =
    hasContent && detected.cleanedText.trim() !== rawText.replace(/\r\n/g, "\n").trim();

  useEffect(() => {
    setReviewDraft(detected.draft);
    setShowImportQc(false);
  }, [detected.draft]);

  const updateDraft = (patch: Partial<BuilderDraft>) => {
    setReviewDraft((current) => normalizeDraft({ ...current, ...patch, source: "current" }));
  };

  const updateBlock = (blockId: string, patch: Partial<BuilderBlock>) => {
    setReviewDraft((current) =>
      normalizeDraft({
        ...current,
        source: "current",
        blocks: current.blocks.map((block) =>
          block.id === blockId ? { ...block, ...patch } : block,
        ),
      }),
    );
  };

  const deleteBlock = (blockId: string) => {
    setReviewDraft((current) =>
      normalizeDraft({
        ...current,
        blocks: current.blocks.filter((block) => block.id !== blockId),
        selectedBlockId: current.selectedBlockId === blockId ? null : current.selectedBlockId,
      }),
    );
  };

  const createDraft = () => {
    const saved = saveBuilderDraft(reviewDraft);
    if (saved.blocks.length === 0) {
      toast.message("Paste kit content before creating a builder draft");
      return;
    }
    if (hasImportBlockers) {
      setShowImportQc(true);
      toast.error("Fix import QC blockers before creating a Builder draft");
      return;
    }
    markCurrentImportCreated(saved);
    toast.success("Builder draft created");
    navigate({ to: "/builder", search: { draftReload: Date.now() } });
  };

  const createDraftAndVersion = async () => {
    if (savingVersion) return;

    const saved = saveBuilderDraft(reviewDraft);
    if (saved.blocks.length === 0) {
      toast.message("Paste kit content before creating a builder draft");
      return;
    }
    if (hasImportBlockers) {
      setShowImportQc(true);
      toast.error("Fix import QC blockers before saving a version");
      return;
    }

    setSavingVersion(true);
    const records = loadVersionLibrary();

    try {
      const result = await createVersionLibraryRecord({ data: { draft: saved } });
      if (result.ok) {
        saveVersionLibrary([result.data.record, ...records]);
        markCurrentImportCreated(saved);
        toast.success("Draft saved to Version Library");
        navigate({ to: "/version-library" });
        return;
      }
    } catch {
      // Fall back to local version storage below.
    } finally {
      setSavingVersion(false);
    }

    const version = createVersionFromDraft(records, saved);
    saveVersionLibrary([version, ...records]);
    markCurrentImportCreated(saved);
    toast.success("Draft saved to Version Library locally");
    navigate({ to: "/version-library" });
  };

  const markCurrentImportCreated = (draft: BuilderDraft) => {
    if (currentHistoryId) {
      setImportHistory(markImportCreated(currentHistoryId));
      return;
    }

    setImportHistory(
      addImportHistoryRecord({
        fileName: uploadedFileName || "Pasted content",
        fileType: uploadedFileName ? detectImportFileType(uploadedFileName) : "paste",
        rawText,
        draft,
        warningCount: warnings.length,
        createdBuilderDraft: true,
      }),
    );
  };

  const loadUploadedFile = async (file: File | undefined) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const isTextFile =
      extension === "txt" ||
      extension === "md" ||
      file.type === "text/plain" ||
      file.type === "text/markdown";
    const isDocx =
      extension === "docx" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    if (!isTextFile && !isDocx) {
      toast.error("Upload a .txt, .md, or .docx file");
      return;
    }

    try {
      const text = isDocx ? await extractDocxText(file) : await file.text();
      const imported = detectImportedKitText(text);
      const records = addImportHistoryRecord({
        fileName: file.name,
        fileType: detectImportFileType(file.name),
        rawText: text,
        draft: imported.draft,
        warningCount: imported.warnings.length,
      });
      setRawText(text);
      setUploadedFileName(file.name);
      setImportHistory(records);
      setCurrentHistoryId(records[0]?.id ?? null);
      toast.success("File loaded into importer");
    } catch {
      toast.error("Could not read that file");
    }
  };

  const loadHistoryRecord = (record: ImportHistoryRecord) => {
    setRawText(record.rawText);
    setUploadedFileName(record.fileType === "paste" ? "" : record.fileName);
    setReviewDraft(record.draft);
    setCurrentHistoryId(record.id);
    toast.success("Import loaded");
  };

  const clearHistory = () => {
    setImportHistory(clearImportHistory());
    setCurrentHistoryId(null);
    toast.message("Import history cleared");
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Level 10B Import Cleanup
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Paste Content Importer
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Upload a .txt, .md, or .docx file, or paste rough kit content, then review the detected
        blocks before sending the cleaned draft to Builder.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(420px,0.8fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Kit Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border p-3" style={{ borderColor: "#D8CEC2" }}>
                <Label
                  htmlFor="kit-file-upload"
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "#4F2D68" }}
                >
                  Upload .txt, .md, or .docx
                </Label>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    id="kit-file-upload"
                    type="file"
                    accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => loadUploadedFile(event.target.files?.[0])}
                  />
                  {uploadedFileName ? (
                    <div className="flex items-center text-xs" style={{ color: "#6b6470" }}>
                      <FileText className="mr-1 h-3.5 w-3.5" /> {uploadedFileName}
                    </div>
                  ) : null}
                </div>
              </div>
              <Textarea
                rows={24}
                value={rawText}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Paste kit title, modules, lessons, worksheets, prompts, checklists, and trackers here."
                className="font-mono text-xs leading-5"
              />
              {hasContent && detected.cleanupNotes.length > 0 ? (
                <div
                  className="rounded-md border p-3 text-sm"
                  style={{ borderColor: "#D8CEC2", background: "#FBF7F1", color: "#4b4450" }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "#4F2D68" }}
                  >
                    Import Cleanup
                  </div>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {detected.cleanupNotes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                  {cleanupWasApplied ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => setRawText(detected.cleanedText)}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Apply Cleaned Text
                    </Button>
                  ) : null}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={createDraft}
                  disabled={!hasContent || reviewDraft.blocks.length === 0 || hasImportBlockers}
                  style={{ background: "#4F2D68", color: "#fff" }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" /> Create Builder Draft
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={createDraftAndVersion}
                  disabled={
                    !hasContent ||
                    reviewDraft.blocks.length === 0 ||
                    savingVersion ||
                    hasImportBlockers
                  }
                >
                  <Library className="mr-2 h-4 w-4" /> Create Draft + Save Version
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowImportQc(true);
                    if (importQcBlockers.length > 0) {
                      toast.error("Import QC found blockers");
                    } else if (importQcWarnings.length > 0) {
                      toast.message("Import QC passed with warnings");
                    } else {
                      toast.success("Import QC passed");
                    }
                  }}
                  disabled={!hasContent || reviewDraft.blocks.length === 0}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Run Import QC
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRawText(SAMPLE_IMPORT);
                    setUploadedFileName("");
                    setCurrentHistoryId(null);
                  }}
                >
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Load Test Text
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRawText(ROUGH_SAMPLE_IMPORT);
                    setUploadedFileName("");
                    setCurrentHistoryId(null);
                  }}
                >
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Load Rough Test
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRawText("");
                    setUploadedFileName("");
                    setCurrentHistoryId(null);
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          <ImportHistoryCard
            records={importHistory}
            onLoad={loadHistoryRecord}
            onClear={clearHistory}
          />
        </div>

        <div className="space-y-6">
          <ImportQualityGate
            report={importQcReport}
            blockCount={reviewDraft.blocks.length}
            visible={showImportQc}
            onShow={() => setShowImportQc(true)}
          />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Kit Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Kit Name"
                value={reviewDraft.kitName}
                onChange={(kitName) => updateDraft({ kitName })}
              />
              <TextField
                label="Subtitle"
                value={reviewDraft.subtitle}
                onChange={(subtitle) => updateDraft({ subtitle })}
              />
              <TextField
                label="Branch"
                value={reviewDraft.branch}
                onChange={(branch) => updateDraft({ branch })}
              />
              <TextField
                label="Audience"
                value={reviewDraft.audience}
                onChange={(audience) => updateDraft({ audience })}
              />
              <TextField
                label="Tone"
                value={reviewDraft.tone}
                onChange={(tone) => updateDraft({ tone })}
              />
              <TextField
                label="Tagline"
                value={reviewDraft.tagline}
                onChange={(tagline) => updateDraft({ tagline })}
              />
            </CardContent>
          </Card>

          {warnings.length > 0 ? (
            <Alert>
              <AlertTitle>Review before sending to Builder</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {warnings.slice(0, 6).map((warning, index) => (
                    <li key={`${warning.blockId ?? "kit"}-${index}`}>{warning.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Detected Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewDraft.blocks.length === 0 ? (
                <div
                  className="rounded-md border px-4 py-6 text-sm"
                  style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
                >
                  Paste content to preview blocks before sending them to Builder.
                </div>
              ) : (
                reviewDraft.blocks.map((block, index) => (
                  <BlockReviewCard
                    key={block.id}
                    block={block}
                    index={index}
                    onChange={(patch) => updateBlock(block.id, patch)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ImportQualityGate({
  report,
  blockCount,
  visible,
  onShow,
}: {
  report: QCReportMvp;
  blockCount: number;
  visible: boolean;
  onShow: () => void;
}) {
  const blockers = report.issues.filter((issue) => issue.severity === "blocker");
  const warnings = report.issues.filter((issue) => issue.severity === "warning");
  const status = blockCount === 0 ? "Needs Review" : blockers.length > 0 ? "Needs Repair" : "Ready";
  const statusColor =
    status === "Ready" ? "#2E5B33" : status === "Needs Repair" ? "#7a1f1f" : "#8a5a00";

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center text-base">
            {status === "Ready" ? (
              <CheckCircle2 className="mr-2 h-4 w-4" style={{ color: statusColor }} />
            ) : (
              <AlertTriangle className="mr-2 h-4 w-4" style={{ color: statusColor }} />
            )}
            Import Readiness
          </CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onShow}
            disabled={blockCount === 0}
          >
            Run Import QC
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className="rounded-md border p-3 text-sm"
          style={{ borderColor: "#D8CEC2", background: "#fff" }}
        >
          <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
            Status
          </div>
          <div className="mt-1 text-lg font-semibold" style={{ color: statusColor }}>
            {status}
          </div>
          <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
            {blockers.length} blocker{blockers.length === 1 ? "" : "s"} · {warnings.length} warning
            {warnings.length === 1 ? "" : "s"} · {report.pageCount} printable page
            {report.pageCount === 1 ? "" : "s"}
          </div>
        </div>

        {blockers.length > 0 ? (
          <Alert>
            <AlertTitle>Fix blockers before Builder</AlertTitle>
            <AlertDescription>
              Builder draft creation is paused until these confirmed import issues are fixed.
            </AlertDescription>
          </Alert>
        ) : warnings.length > 0 ? (
          <Alert>
            <AlertTitle>Warnings can move forward</AlertTitle>
            <AlertDescription>
              Review these notes, but they do not block creating a Builder draft.
            </AlertDescription>
          </Alert>
        ) : blockCount > 0 ? (
          <Alert>
            <AlertTitle>Ready for Builder</AlertTitle>
            <AlertDescription>No import QC issues found.</AlertDescription>
          </Alert>
        ) : null}

        {visible && report.issues.length > 0 ? (
          <div className="space-y-2">
            {report.issues.slice(0, 8).map((issue) => (
              <div
                key={issue.id}
                className="rounded-md border p-3 text-sm"
                style={{ borderColor: "#D8CEC2", background: "#fff" }}
              >
                <div
                  className="font-semibold"
                  style={{ color: issue.severity === "blocker" ? "#7a1f1f" : "#8a5a00" }}
                >
                  {issue.severity.toUpperCase()} · {issue.area}
                </div>
                <div className="mt-1" style={{ color: "#4F2D68" }}>
                  {issue.blockTitle}
                </div>
                <div className="mt-1" style={{ color: "#222026" }}>
                  {issue.message}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        {label}
      </Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ImportHistoryCard({
  records,
  onLoad,
  onClear,
}: {
  records: ImportHistoryRecord[];
  onLoad: (record: ImportHistoryRecord) => void;
  onClear: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center text-base">
            <History className="mr-2 h-4 w-4" /> Recent Imports
          </CardTitle>
          {records.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Clear History
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {records.length === 0 ? (
          <div
            className="rounded-md border px-4 py-5 text-sm"
            style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
          >
            Imported files will appear here after you upload a .txt, .md, or .docx file.
          </div>
        ) : (
          records.slice(0, 5).map((record) => (
            <div
              key={record.id}
              className="rounded-md border p-3"
              style={{ borderColor: "#D8CEC2", background: "#fff" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "#4F2D68" }}
                  >
                    {record.fileType} import
                  </div>
                  <div className="mt-1 font-semibold" style={{ color: "#222026" }}>
                    {record.kitName || record.fileName || "Untitled"}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                    {new Date(record.importedAt).toLocaleString()} · {record.blockCount} block
                    {record.blockCount === 1 ? "" : "s"} · {record.warningCount} warning
                    {record.warningCount === 1 ? "" : "s"} ·{" "}
                    {record.createdBuilderDraft ? "Draft created" : "Review only"}
                  </div>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => onLoad(record)}>
                  Load
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function BlockReviewCard({
  block,
  index,
  onChange,
  onDelete,
}: {
  block: BuilderBlock;
  index: number;
  onChange: (patch: Partial<BuilderBlock>) => void;
  onDelete: () => void;
}) {
  const tableHeaders = block.tableData.headers.join(", ");
  const tableRows = block.tableData.rows.map((row) => row.join(", ")).join("\n");

  return (
    <div className="rounded-md border p-4" style={{ borderColor: "#D8CEC2", background: "#fff" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
            #{index + 1} {pageTypeLabel(block.pageType)}
          </div>
          <div className="mt-1 text-sm" style={{ color: "#6b6470" }}>
            Adjust the detected type and fields before creating the Builder draft.
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
            Block Type
          </Label>
          <select
            value={block.pageType}
            onChange={(event) => onChange({ pageType: event.target.value as PageType })}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            style={{ borderColor: "#D8CEC2" }}
          >
            {BUILDER_BLOCK_TYPES.map((type) => (
              <option key={type.type} value={type.type}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Title" value={block.title} onChange={(title) => onChange({ title })} />
      </div>

      <div className="mt-3">
        <TextField
          label="Subtitle / Label"
          value={block.subtitle}
          onChange={(subtitle) => onChange({ subtitle })}
        />
      </div>

      {block.pageType === "table" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <TextAreaField
            label="Column Headers"
            value={tableHeaders}
            rows={3}
            onChange={(value) =>
              onChange({ tableData: { ...block.tableData, headers: normalizeCsvLine(value) } })
            }
          />
          <TextAreaField
            label="Rows"
            value={tableRows}
            rows={6}
            onChange={(value) =>
              onChange({ tableData: { ...block.tableData, rows: parseCsvRows(value) } })
            }
          />
        </div>
      ) : block.pageType === "workbook" || block.pageType === "notes" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
          <TextAreaField
            label={block.pageType === "notes" ? "Prompt" : "Workbook Prompt"}
            value={block.prompt}
            rows={5}
            onChange={(prompt) => onChange({ prompt })}
          />
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
              Writing Lines
            </Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={block.lines}
              onChange={(event) => onChange({ lines: Number(event.target.value) || "" })}
            />
          </div>
        </div>
      ) : (
        <TextAreaField
          label={block.pageType === "checklist" ? "Checklist Items" : "Body Text"}
          value={block.body}
          rows={5}
          onChange={(body) => onChange({ body })}
        />
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        {label}
      </Label>
      <Textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function normalizeCsvLine(value: string): string[] {
  const cells = value
    .split(value.includes("|") ? "|" : ",")
    .map((cell) => cell.trim())
    .filter(Boolean)
    .slice(0, 3);
  while (cells.length < 3) cells.push("");
  return cells;
}

function parseCsvRows(value: string): string[][] {
  const rows = value
    .split(/\r?\n/)
    .map((row) => normalizeCsvLine(row))
    .filter((row) => row.some((cell) => cell.trim()));

  return rows.length > 0 ? rows : [["", "", ""]];
}
