import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  BookOpenText,
  CheckCircle2,
  ExternalLink,
  FileText,
  PackageCheck,
  Printer,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildBuilderKit, loadBuilderDraft, type BuilderDraft } from "@/lib/builder-content";
import { listVersionLibraryRecords } from "@/lib/api/version-library.functions";
import { createQCReport } from "@/lib/qc-report";
import {
  displayKitName,
  loadVersionLibrary,
  openVersionDraftInBuilder,
  saveVersionLibrary,
  type KitVersionRecord,
} from "@/lib/version-library";
import { saveLessonGuideSource } from "@/lib/lesson-guide";
import { saveHowToKitSource } from "@/lib/how-to-kit";

export const Route = createFileRoute("/_app/package-export")({
  head: () => ({ meta: [{ title: "Package Export | Kit Factory" }] }),
  component: PackageExportPage,
});

type StorageMode = "checking" | "supabase" | "local";
type SourceMode = "builder" | "version";
type ReadinessState = "ready" | "review" | "missing" | "planned";

function PackageExportPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<KitVersionRecord[]>(() => loadVersionLibrary());
  const [storageMode, setStorageMode] = useState<StorageMode>("checking");
  const [builderDraft, setBuilderDraft] = useState<BuilderDraft | null>(() => loadBuilderDraft());
  const [sourceMode, setSourceMode] = useState<SourceMode>("builder");
  const [selectedVersionId, setSelectedVersionId] = useState(records[0]?.id ?? "");

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const result = await listVersionLibraryRecords();
        if (cancelled) return;
        if (result.ok) {
          const saved = saveVersionLibrary(result.data.records);
          setRecords(saved);
          setSelectedVersionId((current) => current || saved[0]?.id || "");
          setStorageMode("supabase");
          return;
        }
      } catch {
        // Keep local fallback below.
      }

      if (!cancelled) {
        const local = loadVersionLibrary();
        setRecords(local);
        setSelectedVersionId((current) => current || local[0]?.id || "");
        setStorageMode("local");
      }
    }

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedVersionId) ?? records[0] ?? null,
    [records, selectedVersionId],
  );

  const activeDraft = sourceMode === "version" ? (selectedRecord?.draft ?? null) : builderDraft;
  const activeRecord = sourceMode === "version" ? selectedRecord : null;
  const kit = useMemo(() => (activeDraft ? buildBuilderKit(activeDraft) : null), [activeDraft]);
  const report = useMemo(() => (activeDraft ? createQCReport(activeDraft) : null), [activeDraft]);
  const blockers = report?.issues.filter((issue) => issue.severity === "blocker") ?? [];
  const warnings = report?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const hasSavedVersion =
    Boolean(activeRecord) ||
    (activeDraft
      ? records.some(
          (record) =>
            record.kitName === activeDraft.kitName &&
            record.draft.blocks.length === activeDraft.blocks.length,
        )
      : false);
  const branchSelected = Boolean(activeDraft?.branch.trim());
  const hasPages = Boolean(kit && kit.blocks.length > 0);

  const refreshBuilderDraft = () => {
    setBuilderDraft(loadBuilderDraft());
    setSourceMode("builder");
    toast.success("Current Builder draft loaded");
  };

  const openSelectedVersion = () => {
    if (!selectedRecord) return;
    openVersionDraftInBuilder(selectedRecord);
    setBuilderDraft(selectedRecord.draft);
    setSourceMode("builder");
    toast.success("Version loaded into Builder");
    navigate({ to: "/builder", search: { draftReload: Date.now() } });
  };

  const generateLessonGuide = () => {
    if (!activeDraft) return;
    saveLessonGuideSource(
      activeDraft,
      sourceMode === "version" && activeRecord
        ? {
            sourceLabel: `${displayKitName(activeRecord.kitName)} ${activeRecord.version}`,
            sourceKitId: activeRecord.draft.id,
            sourceVersionId: activeRecord.id,
          }
        : "Current Builder Draft",
    );
    toast.success("Lesson Guide generated");
    navigate({ to: "/lesson-guide" });
  };

  const generateHowToKit = () => {
    if (!activeDraft) return;
    saveHowToKitSource(
      activeDraft,
      sourceMode === "version" && activeRecord
        ? {
            sourceLabel: `${displayKitName(activeRecord.kitName)} ${activeRecord.version}`,
            sourceKitId: activeRecord.draft.id,
            sourceVersionId: activeRecord.id,
          }
        : "Current Builder Draft",
    );
    toast.success("How-To PDF generated");
    navigate({ to: "/how-to-kit" });
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Product Package Export MVP
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Package Export
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Review whether the current kit is ready to package. This MVP prepares the export checklist;
        ZIP packaging and extra guide PDFs come later.
        <span className="ml-2">
          Storage:{" "}
          {storageMode === "checking"
            ? "Checking private Supabase..."
            : storageMode === "supabase"
              ? "Private Supabase"
              : "Local fallback"}
        </span>
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Package Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setSourceMode("builder")}
                className="w-full rounded-md border px-4 py-3 text-left text-sm"
                style={sourceMode === "builder" ? selectedCardStyle : plainCardStyle}
              >
                <div className="font-semibold">Current Builder Draft</div>
                <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                  Use the kit currently saved in Builder.
                </div>
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("version")}
                className="w-full rounded-md border px-4 py-3 text-left text-sm"
                style={sourceMode === "version" ? selectedCardStyle : plainCardStyle}
              >
                <div className="font-semibold">Saved Version</div>
                <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                  Review a Version Library snapshot.
                </div>
              </button>

              {sourceMode === "version" ? (
                <div className="space-y-2">
                  <label
                    className="text-[10px] uppercase tracking-[0.18em]"
                    style={{ color: "#4F2D68" }}
                  >
                    Version
                  </label>
                  <select
                    value={selectedRecord?.id ?? ""}
                    onChange={(event) => setSelectedVersionId(event.target.value)}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    style={{ borderColor: "#D8CEC2", background: "#fff" }}
                  >
                    {records.length === 0 ? (
                      <option value="">No versions saved</option>
                    ) : (
                      records.map((record) => (
                        <option key={record.id} value={record.id}>
                          {displayKitName(record.kitName)} {record.version}
                        </option>
                      ))
                    )}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={openSelectedVersion}
                    disabled={!selectedRecord}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" /> Open Version in Builder
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={refreshBuilderDraft}
                >
                  <Archive className="mr-2 h-4 w-4" /> Refresh Builder Draft
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                type="button"
                className="w-full"
                disabled={!hasPages}
                style={{ background: "#4F2D68", color: "#fff" }}
                onClick={() => navigate({ to: "/print-preview" })}
              >
                <Printer className="mr-2 h-4 w-4" /> Open Print Preview
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: "/qc" })}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" /> Open QC Report
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!activeDraft}
                onClick={generateLessonGuide}
              >
                <BookOpenText className="mr-2 h-4 w-4" /> Generate Lesson Guide
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!activeDraft}
                onClick={generateHowToKit}
              >
                <FileText className="mr-2 h-4 w-4" /> Generate How-To PDF
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate({ to: "/version-library" })}
              >
                <FileText className="mr-2 h-4 w-4" /> Open Version Library
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard title="Kit" value={activeDraft?.kitName.trim() || "Untitled"} />
            <SummaryCard title="Branch" value={activeDraft?.branch.trim() || "Missing"} />
            <SummaryCard title="Pages" value={String(kit?.blocks.length ?? 0)} />
            <SummaryCard title="QC" value={report?.qcStatus ?? "Not Reviewed"} />
            <SummaryCard title="Source" value={sourceMode === "version" ? "Version" : "Builder"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <PackageCheck className="mr-2 h-4 w-4" /> Package Readiness
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <ReadinessItem
                title="Workbook PDF"
                state={
                  hasPages && blockers.length === 0 ? "ready" : hasPages ? "review" : "missing"
                }
                detail={
                  hasPages
                    ? `${kit?.blocks.length ?? 0} printable page${kit?.blocks.length === 1 ? "" : "s"} available.`
                    : "No printable pages found yet."
                }
              />
              <ReadinessItem
                title="QC Passed"
                state={blockers.length === 0 && hasPages ? "ready" : "review"}
                detail={
                  report
                    ? `${blockers.length} blocker${blockers.length === 1 ? "" : "s"} and ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`
                    : "Save or load a draft before checking QC."
                }
              />
              <ReadinessItem
                title="Version Saved"
                state={hasSavedVersion ? "ready" : "review"}
                detail={
                  hasSavedVersion
                    ? "A version snapshot exists for this kit."
                    : "Save to Version Library before final packaging."
                }
              />
              <ReadinessItem
                title="Branch Selected"
                state={branchSelected ? "ready" : "missing"}
                detail={
                  branchSelected
                    ? `${activeDraft?.branch} profile will be used.`
                    : "Choose Brand, Rise, Land, Rebuild, or Heal."
                }
              />
              <ReadinessItem
                title="Page Count Checked"
                state={hasPages ? "ready" : "missing"}
                detail={hasPages ? "Page count is available for review." : "No page count yet."}
              />
              <ReadinessItem
                title="ZIP Package"
                state="planned"
                detail="Not built in this MVP. This screen prepares the package checklist first."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Package Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ChecklistRow
                label="Export workbook PDF in Chrome"
                detail="Use Print Preview, Save as PDF, Letter size, background graphics on."
                done={hasPages}
              />
              <ChecklistRow
                label="Confirm QC status"
                detail="Save QC results to Version Library before final packaging."
                done={Boolean(report && blockers.length === 0)}
              />
              <ChecklistRow
                label="Confirm version snapshot"
                detail="Version Library keeps rollback history and production status."
                done={hasSavedVersion}
              />
              <ChecklistRow
                label="Confirm branch identity"
                detail="Branch color/profile should match the kit being produced."
                done={branchSelected}
              />
              <ChecklistRow
                label="Create extra guide files"
                detail="Lesson Guide and How-To PDF MVPs are available now."
                done={Boolean(activeDraft)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Package Files</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <PackageFile title="Workbook PDF" status={hasPages ? "Ready to export" : "Missing"} />
              <PackageFile
                title="Lesson Guide"
                status={activeDraft ? "Ready to generate" : "Missing"}
              />
              <PackageFile
                title="How To Use This Kit PDF"
                status={activeDraft ? "Ready to generate" : "Missing"}
              />
              <PackageFile title="Package Notes" status="Checklist only" />
              <PackageFile title="ZIP Bundle" status="Not built yet" />
            </CardContent>
          </Card>

          {!activeDraft ? (
            <Card>
              <CardContent
                className="flex items-start gap-3 p-5 text-sm"
                style={{ color: "#7a4a00" }}
              >
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  No Builder draft or Version Library record is selected yet. Build a kit, save a
                  version, or load a saved version to review package readiness.
                  <div className="mt-3">
                    <Link to="/builder" className="font-semibold underline">
                      Go to Builder
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
          {title}
        </div>
        <div className="mt-2 truncate text-xl font-semibold" style={{ color: "#222026" }}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function ReadinessItem({
  title,
  state,
  detail,
}: {
  title: string;
  state: ReadinessState;
  detail: string;
}) {
  return (
    <div className="rounded-md border p-4" style={{ borderColor: "#D8CEC2", background: "#fff" }}>
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold" style={{ color: "#222026" }}>
          {title}
        </div>
        <StatusPill state={state} />
      </div>
      <div className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        {detail}
      </div>
    </div>
  );
}

function StatusPill({ state }: { state: ReadinessState }) {
  const label =
    state === "ready"
      ? "Ready"
      : state === "review"
        ? "Review"
        : state === "planned"
          ? "Planned"
          : "Missing";
  const style =
    state === "ready"
      ? { background: "#E8F4EA", color: "#2E5B33" }
      : state === "planned"
        ? { background: "#F4EFE6", color: "#6b6470" }
        : state === "review"
          ? { background: "#FFF8E1", color: "#7a4a00" }
          : { background: "#FFF1F0", color: "#7a1f1f" };

  return (
    <span
      className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
      style={style}
    >
      {label}
    </span>
  );
}

function ChecklistRow({
  label,
  detail,
  done,
  planned = false,
}: {
  label: string;
  detail: string;
  done: boolean;
  planned?: boolean;
}) {
  return (
    <div
      className="flex gap-3 rounded-md border p-3"
      style={{ borderColor: "#E7DFD2", background: "#fff" }}
    >
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: done ? "#2E5B33" : planned ? "#D8CEC2" : "#C6A85B",
          background: done ? "#2E5B33" : "#fff",
          color: "#fff",
        }}
      >
        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
      </div>
      <div>
        <div className="font-semibold" style={{ color: "#222026" }}>
          {label}
        </div>
        <div className="mt-1 text-sm" style={{ color: "#6b6470" }}>
          {detail}
        </div>
      </div>
    </div>
  );
}

function PackageFile({ title, status }: { title: string; status: string }) {
  return (
    <div className="rounded-md border p-3" style={{ borderColor: "#E7DFD2", background: "#fff" }}>
      <div className="flex items-center gap-2 font-semibold" style={{ color: "#222026" }}>
        <FileText className="h-4 w-4" style={{ color: "#4F2D68" }} />
        {title}
      </div>
      <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
        {status}
      </div>
    </div>
  );
}

const selectedCardStyle = {
  borderColor: "#4F2D68",
  background: "#FBF7F1",
  color: "#222026",
};

const plainCardStyle = {
  borderColor: "#D8CEC2",
  background: "#fff",
  color: "#222026",
};
