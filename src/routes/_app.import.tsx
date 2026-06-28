import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  History,
  Library,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ProductionUI";
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
import { clearImportSession, loadImportSession, saveImportSession } from "@/lib/import-session";
import { detectImportedKitText, getImportWarnings, type ImportWarning } from "@/lib/kit-importer";
import { WorkflowContext } from "@/components/WorkflowContext";
import type { PageType } from "@/lib/kit-types";
import { createQCReport, type QCReportMvp } from "@/lib/qc-report";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [{ title: "Import Content | Kit Factory" }] }),
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

type ImportQueueStatus = "Ready" | "Needs Repair" | "Needs Review" | "Error";

type ImportQueueItem = {
  id: string;
  fileName: string;
  fileType: string;
  rawText: string;
  draft: BuilderDraft;
  historyId: string | null;
  warningCount: number;
  blockerCount: number;
  status: ImportQueueStatus;
  importedAt: string;
  error?: string;
};

const IMPORT_QUEUE_STORAGE_KEY = "best_collective_import_batch_queue";

function ImportPage() {
  const navigate = useNavigate();
  const [savedSession] = useState(() => loadImportSession());
  const restoredSessionRef = useRef(Boolean(savedSession));
  const [rawText, setRawText] = useState(savedSession?.rawText ?? "");
  const [uploadedFileName, setUploadedFileName] = useState(savedSession?.uploadedFileName ?? "");
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(
    savedSession?.currentHistoryId ?? null,
  );
  const [importHistory, setImportHistory] = useState<ImportHistoryRecord[]>(() =>
    loadImportHistory(),
  );
  const [importQueue, setImportQueue] = useState<ImportQueueItem[]>(() => loadImportQueue());
  const [savingVersion, setSavingVersion] = useState(false);
  const [showImportQc, setShowImportQc] = useState(false);
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const detected = useMemo(() => detectImportedKitText(rawText), [rawText]);
  const [reviewDraft, setReviewDraft] = useState<BuilderDraft>(
    savedSession?.reviewDraft ?? detected.draft,
  );
  const warnings = useMemo(
    () => mergeImportWarnings(detected.parserWarnings, getImportWarnings(reviewDraft)),
    [detected.parserWarnings, reviewDraft],
  );
  const importQcReport = useMemo(() => createQCReport(reviewDraft), [reviewDraft]);
  const importQcBlockers = importQcReport.issues.filter((issue) => issue.severity === "blocker");
  const importQcWarnings = importQcReport.issues.filter((issue) => issue.severity === "warning");
  const hasImportBlockers = importQcBlockers.length > 0;
  const hasContent = rawText.trim().length > 0;
  const cleanupWasApplied =
    hasContent && detected.cleanedText.trim() !== rawText.replace(/\r\n/g, "\n").trim();

  useEffect(() => {
    if (restoredSessionRef.current && savedSession?.rawText === rawText) {
      restoredSessionRef.current = false;
      return;
    }
    restoredSessionRef.current = false;
    setReviewDraft(detected.draft);
    setShowImportQc(false);
    setStep("edit");
  }, [detected.draft, rawText, savedSession?.rawText]);

  useEffect(() => {
    if (!hasContent && reviewDraft.blocks.length === 0 && !uploadedFileName) {
      clearImportSession();
      return;
    }

    saveImportSession({
      rawText,
      uploadedFileName,
      currentHistoryId,
      reviewDraft,
      savedAt: new Date().toISOString(),
    });
  }, [currentHistoryId, hasContent, rawText, reviewDraft, uploadedFileName]);

  const setActiveImport = ({
    text,
    fileName = "",
    historyId = null,
    draft,
  }: {
    text: string;
    fileName?: string;
    historyId?: string | null;
    draft?: BuilderDraft;
  }) => {
    const nextDraft = draft ?? detectImportedKitText(text).draft;
    setRawText(text);
    setUploadedFileName(fileName);
    setCurrentHistoryId(historyId);
    setReviewDraft(nextDraft);
    setShowImportQc(false);
    setStep("edit");

    if (!text.trim() && nextDraft.blocks.length === 0 && !fileName) {
      clearImportSession();
      return;
    }

    saveImportSession({
      rawText: text,
      uploadedFileName: fileName,
      currentHistoryId: historyId,
      reviewDraft: nextDraft,
      savedAt: new Date().toISOString(),
    });
  };

  const clearActiveImport = () => {
    setRawText("");
    setUploadedFileName("");
    setCurrentHistoryId(null);
    setReviewDraft(detectImportedKitText("").draft);
    setShowImportQc(false);
    setStep("edit");
    clearImportSession();
  };

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
    if (reviewDraft.blocks.length === 0) {
      toast.message("Paste kit content before creating a builder draft");
      return;
    }
    if (hasImportBlockers) {
      setShowImportQc(true);
      toast.error("Fix import QC blockers before creating a Builder draft");
      return;
    }
    setStep("preview");
  };

  const confirmDraft = () => {
    const saved = saveBuilderDraft(reviewDraft);
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

  const loadUploadedFiles = async (fileList: FileList | null) => {
    const files = Array.from(fileList ?? []);
    if (files.length === 0) return;
    const items: ImportQueueItem[] = [];

    for (const file of files) {
      const item = await readQueuedImportFile(file);
      items.push(item);

      if (!item.error) {
        const records = addImportHistoryRecord({
          fileName: file.name,
          fileType: detectImportFileType(file.name),
          rawText: item.rawText,
          draft: item.draft,
          warningCount: item.warningCount,
        });
        const historyId = records[0]?.id ?? null;
        item.historyId = historyId;
        setImportHistory(records);
      }
    }

    updateImportQueue((current) => [...items, ...current].slice(0, 12));

    const firstReady = items.find((item) => !item.error);
    if (firstReady) {
      setActiveImport({
        text: firstReady.rawText,
        fileName: firstReady.fileName,
        historyId: firstReady.historyId,
        draft: firstReady.draft,
      });
    }

    const errorCount = items.filter((item) => item.error).length;
    if (files.length > 1) {
      toast.success(
        `Batch loaded ${items.length - errorCount} of ${items.length} file${
          items.length === 1 ? "" : "s"
        }`,
      );
    } else if (errorCount === 0) {
      toast.success("File loaded into importer");
    }
    if (errorCount > 0) toast.error(`${errorCount} file${errorCount === 1 ? "" : "s"} failed`);
  };

  const readQueuedImportFile = async (file: File): Promise<ImportQueueItem> => {
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
      return createImportQueueError(file.name, "Upload a .txt, .md, or .docx file");
    }

    try {
      const text = isDocx ? await extractDocxText(file) : await file.text();
      const imported = detectImportedKitText(text);
      const report = createQCReport(imported.draft);
      const blockerCount = report.issues.filter((issue) => issue.severity === "blocker").length;

      return {
        id: createQueueId(),
        fileName: file.name,
        fileType: detectImportFileType(file.name),
        rawText: text,
        draft: imported.draft,
        historyId: null,
        warningCount: imported.warnings.length,
        blockerCount,
        status:
          imported.draft.blocks.length === 0
            ? "Needs Review"
            : blockerCount > 0
              ? "Needs Repair"
              : "Ready",
        importedAt: new Date().toISOString(),
      };
    } catch {
      return createImportQueueError(file.name, "Could not read that file");
    }
  };

  const loadQueueItem = (item: ImportQueueItem) => {
    if (item.error) {
      toast.error(item.error);
      return;
    }

    setActiveImport({
      text: item.rawText,
      fileName: item.fileName,
      historyId: item.historyId,
      draft: item.draft,
    });
    toast.success("Queued import loaded");
  };

  const removeQueueItem = (itemId: string) => {
    updateImportQueue((current) => current.filter((item) => item.id !== itemId));
  };

  const clearImportQueue = () => {
    updateImportQueue(() => []);
    toast.message("Batch queue cleared");
  };

  const updateImportQueue = (updater: (current: ImportQueueItem[]) => ImportQueueItem[]) => {
    setImportQueue((current) => {
      const next = updater(current).slice(0, 12);
      saveImportQueue(next);
      return next;
    });
  };

  const loadHistoryRecord = (record: ImportHistoryRecord) => {
    setActiveImport({
      text: record.rawText,
      fileName: record.fileType === "paste" ? "" : record.fileName,
      historyId: record.id,
      draft: record.draft,
    });
    toast.success("Import loaded");
  };

  const clearHistory = () => {
    setImportHistory(clearImportHistory());
    setCurrentHistoryId(null);
    toast.message("Import history cleared");
  };

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Production import"
        title="Import Content"
        description="Use this screen for source content only: MD, TXT, or DOCX. Final styled PDFs belong in Fillable Fields after the workbook is exported."
      />
      <WorkflowContext currentStep={1} />

      {step === "preview" ? (
        <DetectionPreviewScreen
          draft={reviewDraft}
          warnings={warnings}
          qcReport={importQcReport}
          onBack={() => setStep("edit")}
          onConfirm={confirmDraft}
        />
      ) : null}

      <div className={step === "preview" ? "hidden" : "grid gap-6 xl:grid-cols-[minmax(420px,0.8fr)_minmax(0,1fr)]"}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Flow</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-3">
              <FlowNote
                title="1. Source file"
                body="Upload MD, TXT, or DOCX. Do not use PDF here unless you only need to read text."
              />
              <FlowNote
                title="2. Review pages"
                body="Check page types, branch, multi-prompt pages, line counts, and QC blockers."
              />
              <FlowNote
                title="3. Send to Builder"
                body="Builder becomes the place to edit, preview, save versions, and export PDF."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Import Kit Content</CardTitle>
                <Link
                  to="/import-guide"
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "#4F2D68" }}
                >
                  <BookOpen className="h-3 w-3" /> Format Guide
                </Link>
              </div>
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
                <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                  Use structured source files. Exported PDFs are uploaded later in Fillable Fields.
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Input
                    id="kit-file-upload"
                    type="file"
                    multiple
                    accept=".txt,.md,.docx,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={(event) => loadUploadedFiles(event.target.files)}
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
                placeholder="Paste kit title, branch, lessons, worksheets, multi-prompt pages, checklists, and trackers here. Use Multi-Prompt Page when several prompts should stay on one page."
                className="font-mono text-xs leading-5"
              />
              <div
                className="rounded-md border px-3 py-2 text-xs"
                style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
              >
                Multi-prompt tip: use <strong>Multi-Prompt Page:</strong> when several short
                questions should stay together. Separate <strong>Prompt Page:</strong> labels create
                separate pages.
              </div>
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
                      onClick={() => setActiveImport({ text: detected.cleanedText })}
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
                  <ArrowRight className="mr-2 h-4 w-4" /> Send to Builder
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
                  <Library className="mr-2 h-4 w-4" /> Save Version Snapshot
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
                  onClick={() => setActiveImport({ text: SAMPLE_IMPORT })}
                >
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Load Test Text
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveImport({ text: ROUGH_SAMPLE_IMPORT })}
                >
                  <ClipboardPaste className="mr-2 h-4 w-4" /> Load Rough Test
                </Button>
                <Button type="button" variant="outline" onClick={clearActiveImport}>
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

          <ImportQueueCard
            items={importQueue}
            activeFileName={uploadedFileName}
            onLoad={loadQueueItem}
            onRemove={removeQueueItem}
            onClear={clearImportQueue}
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

function DetectionPreviewScreen({
  draft,
  warnings,
  qcReport,
  onBack,
  onConfirm,
}: {
  draft: BuilderDraft;
  warnings: ImportWarning[];
  qcReport: QCReportMvp;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const blockers = qcReport.issues.filter((i) => i.severity === "blocker");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={onBack}>
          Back to Edit
        </Button>
        <Button
          type="button"
          onClick={onConfirm}
          disabled={blockers.length > 0}
          style={{ background: "#4F2D68", color: "#fff" }}
        >
          <ArrowRight className="mr-2 h-4 w-4" /> Confirm — Open Builder
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kit Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
                Kit Name
              </div>
              <div className="font-semibold" style={{ color: "#222026" }}>
                {draft.kitName || "(not detected)"}
              </div>
            </div>
            {draft.subtitle ? (
              <div>
                <div
                  className="text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "#4F2D68" }}
                >
                  Subtitle
                </div>
                <div style={{ color: "#222026" }}>{draft.subtitle}</div>
              </div>
            ) : null}
            <div
              className="grid grid-cols-3 gap-3 rounded-md border p-3"
              style={{ borderColor: "#D8CEC2", background: "#FBF7F1" }}
            >
              <PlanMetric label="Pages" value={String(draft.blocks.length)} />
              <PlanMetric label="Warnings" value={String(warnings.length)} />
              <PlanMetric label="QC Blockers" value={String(blockers.length)} />
            </div>
          </CardContent>
        </Card>

        {warnings.length > 0 ? (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Warnings to review</AlertTitle>
            <AlertDescription>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {warnings.slice(0, 6).map((w, i) => (
                  <li key={`${w.blockId ?? "kit"}-${i}`}>{w.message}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert>
            <CheckCircle2 className="h-4 w-4" style={{ color: "#2E5B33" }} />
            <AlertTitle>No warnings</AlertTitle>
            <AlertDescription>
              All detected pages passed the import check.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Detected Pages ({draft.blocks.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {draft.blocks.map((block, index) => (
              <div
                key={block.id}
                className="flex items-baseline gap-3 rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: "#D8CEC2", background: "#fff" }}
              >
                <span
                  className="shrink-0 text-[10px] uppercase tracking-[0.18em]"
                  style={{ color: "#4F2D68" }}
                >
                  #{index + 1} {pageTypeLabel(block.pageType)}
                </span>
                <span style={{ color: "#222026" }}>{block.title || "(no title)"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {blockers.length > 0 ? (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Fix QC blockers before opening Builder</AlertTitle>
          <AlertDescription>
            Go back to edit and resolve the blockers shown in Import Readiness.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}

function mergeImportWarnings(...groups: ImportWarning[][]): ImportWarning[] {
  const seen = new Set<string>();
  const merged: ImportWarning[] = [];

  for (const group of groups) {
    for (const warning of group) {
      const key = `${warning.blockId ?? "kit"}:${warning.message}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(warning);
    }
  }

  return merged;
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
  const continuationPages = Math.max(0, report.pageCount - blockCount);
  const pageCountWarning = warnings.find(
    (issue) =>
      issue.area === "Layout Safety" &&
      (issue.message.includes("large workbook") || issue.message.includes("over 40 pages")),
  );

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
          className="grid gap-2 rounded-md border p-3 text-sm sm:grid-cols-3"
          style={{ borderColor: "#D8CEC2", background: "#FBF7F1" }}
        >
          <PlanMetric label="Detected Blocks" value={String(blockCount)} />
          <PlanMetric label="Printable Pages" value={String(report.pageCount)} />
          <PlanMetric
            label="Extra Pages"
            value={continuationPages > 0 ? `+${continuationPages}` : "0"}
          />
          <div className="sm:col-span-3 text-xs" style={{ color: "#6b6470" }}>
            {continuationPages > 0
              ? "Extra pages come from continuation rules, like long lessons, long tables, or long checklists."
              : "Each page label is currently fitting as one printable page."}
          </div>
        </div>

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
            <AlertTitle>
              {pageCountWarning ? "Page count warning only" : "Warnings can move forward"}
            </AlertTitle>
            <AlertDescription>
              {pageCountWarning
                ? "This workbook can still be sent to Builder and exported. Review size, flow, and print quality before selling."
                : "Review these notes, but they do not block creating a Builder draft."}
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
            {report.issues.map((issue) => (
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

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold" style={{ color: "#222026" }}>
        {value}
      </div>
    </div>
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

function ImportQueueCard({
  items,
  activeFileName,
  onLoad,
  onRemove,
  onClear,
}: {
  items: ImportQueueItem[];
  activeFileName: string;
  onLoad: (item: ImportQueueItem) => void;
  onRemove: (itemId: string) => void;
  onClear: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center text-base">
            <FileText className="mr-2 h-4 w-4" /> Uploaded File Queue
          </CardTitle>
          {items.length > 0 ? (
            <Button type="button" variant="outline" size="sm" onClick={onClear}>
              Clear Queue
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div
            className="rounded-md border px-4 py-5 text-sm"
            style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
          >
            Upload multiple .txt, .md, or .docx files. This queue is for choosing which upload to
            review now.
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="rounded-md border p-3"
              style={{
                borderColor: item.fileName === activeFileName ? "#4F2D68" : "#D8CEC2",
                background: item.fileName === activeFileName ? "#FBF7F1" : "#fff",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "#4F2D68" }}
                  >
                    {item.fileType} file
                  </div>
                  <div className="mt-1 font-semibold" style={{ color: "#222026" }}>
                    {item.draft.kitName || item.fileName}
                  </div>
                  <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                    {item.fileName} · {item.draft.blocks.length} block
                    {item.draft.blocks.length === 1 ? "" : "s"} · {item.warningCount} cleanup
                    warning{item.warningCount === 1 ? "" : "s"}
                  </div>
                  <div
                    className="mt-2 text-xs font-semibold"
                    style={{ color: queueStatusColor(item.status) }}
                  >
                    {item.status}
                    {item.blockerCount > 0
                      ? ` · ${item.blockerCount} blocker${item.blockerCount === 1 ? "" : "s"}`
                      : ""}
                  </div>
                  {item.error ? (
                    <div className="mt-1 text-xs" style={{ color: "#7a1f1f" }}>
                      {item.error}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onLoad(item)}
                    disabled={Boolean(item.error)}
                  >
                    Review
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
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
            <History className="mr-2 h-4 w-4" /> Recent Import History
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

function FlowNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border p-3" style={{ borderColor: "#D8CEC2", background: "#fff" }}>
      <div className="font-semibold" style={{ color: "#222026" }}>
        {title}
      </div>
      <div className="mt-1 leading-5" style={{ color: "#6b6470" }}>
        {body}
      </div>
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

function createImportQueueError(fileName: string, error: string): ImportQueueItem {
  return {
    id: createQueueId(),
    fileName,
    fileType: detectImportFileType(fileName),
    rawText: "",
    draft: detectImportedKitText("").draft,
    historyId: null,
    warningCount: 0,
    blockerCount: 0,
    status: "Error",
    importedAt: new Date().toISOString(),
    error,
  };
}

function createQueueId(): string {
  return `queue-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function queueStatusColor(status: ImportQueueStatus): string {
  if (status === "Ready") return "#2E5B33";
  if (status === "Needs Repair" || status === "Error") return "#7a1f1f";
  return "#8a5a00";
}

function loadImportQueue(): ImportQueueItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(IMPORT_QUEUE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeImportQueueItem).filter(Boolean).slice(0, 12) as ImportQueueItem[];
  } catch {
    return [];
  }
}

function saveImportQueue(items: ImportQueueItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(IMPORT_QUEUE_STORAGE_KEY, JSON.stringify(items.slice(0, 12)));
  } catch {
    // Queue persistence is a convenience; importing should keep working without it.
  }
}

function normalizeImportQueueItem(item: Partial<ImportQueueItem>): ImportQueueItem | null {
  if (!item || typeof item !== "object" || !item.fileName || !item.draft) return null;
  const status = isImportQueueStatus(item.status) ? item.status : "Needs Review";

  return {
    id: item.id ?? createQueueId(),
    fileName: item.fileName,
    fileType: item.fileType ?? detectImportFileType(item.fileName),
    rawText: item.rawText ?? "",
    draft: item.draft,
    historyId: item.historyId ?? null,
    warningCount: Number(item.warningCount ?? 0),
    blockerCount: Number(item.blockerCount ?? 0),
    status,
    importedAt: item.importedAt ?? new Date().toISOString(),
    error: item.error,
  };
}

function isImportQueueStatus(value: unknown): value is ImportQueueStatus {
  return (
    value === "Ready" || value === "Needs Repair" || value === "Needs Review" || value === "Error"
  );
}
