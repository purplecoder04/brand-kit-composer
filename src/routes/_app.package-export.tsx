import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  BookOpenText,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  FileText,
  PackageCheck,
  Printer,
  StickyNote,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ProductionUI";
import {
  buildBuilderKit,
  loadBuilderDraft,
  RESERVED_BUILDER_KIT_ID,
  saveBuilderDraft,
  type BuilderDraft,
} from "@/lib/builder-content";
import { listVersionLibraryRecords } from "@/lib/api/version-library.functions";
import {
  findHowToKitForVersion,
  loadHowToKitLibrary,
  openHowToKitRecord,
  saveHowToKitRecord,
  saveHowToKitSource,
  type HowToKitLibraryRecord,
} from "@/lib/how-to-kit";
import {
  findLessonGuideForVersion,
  loadLessonGuideLibrary,
  openLessonGuideRecord,
  saveLessonGuideRecord,
  saveLessonGuideSource,
  type LessonGuideLibraryRecord,
} from "@/lib/lesson-guide";
import {
  buildPackageManifest,
  countPrintablePages,
  getPackageExportForSource,
  isPackageReady,
  loadPackageExports,
  packageReadinessLabel,
  upsertPackageExport,
  type PackageAssetReadiness,
  type PackageExportStatus,
} from "@/lib/package-export";
import { createQCReport } from "@/lib/qc-report";
import {
  displayKitName,
  loadVersionLibrary,
  openVersionDraftInBuilder,
  saveVersionLibrary,
  type KitVersionRecord,
} from "@/lib/version-library";

const searchSchema = z.object({
  versionId: z.string().optional(),
});

export const Route = createFileRoute("/_app/package-export")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Package | Kit Factory" }] }),
  component: PackageExportPage,
});

type StorageMode = "checking" | "supabase" | "local";
type SourceMode = "builder" | "version";
type ReadinessState = "ready" | "review" | "missing" | "planned";

function PackageExportPage() {
  const navigate = useNavigate();
  const { versionId } = Route.useSearch();
  const [records, setRecords] = useState<KitVersionRecord[]>(() => loadVersionLibrary());
  const [storageMode, setStorageMode] = useState<StorageMode>("checking");
  const [builderDraft, setBuilderDraft] = useState<BuilderDraft | null>(() => loadBuilderDraft());
  const [sourceMode, setSourceMode] = useState<SourceMode>(versionId ? "version" : "builder");
  const [selectedVersionId, setSelectedVersionId] = useState(versionId ?? records[0]?.id ?? "");
  const [lessonGuides, setLessonGuides] = useState<LessonGuideLibraryRecord[]>(() =>
    loadLessonGuideLibrary(),
  );
  const [howToGuides, setHowToGuides] = useState<HowToKitLibraryRecord[]>(() =>
    loadHowToKitLibrary(),
  );
  const [packageRecords, setPackageRecords] = useState<PackageExportStatus[]>(() =>
    loadPackageExports(),
  );

  useEffect(() => {
    if (versionId) {
      setSourceMode("version");
      setSelectedVersionId(versionId);
    }
  }, [versionId]);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const result = await listVersionLibraryRecords();
        if (cancelled) return;
        if (result.ok) {
          const saved = saveVersionLibrary(result.data.records);
          setRecords(saved);
          setSelectedVersionId((current) => current || versionId || saved[0]?.id || "");
          setStorageMode("supabase");
          return;
        }
      } catch {
        // Keep local fallback below.
      }

      if (!cancelled) {
        const local = loadVersionLibrary();
        setRecords(local);
        setSelectedVersionId((current) => current || versionId || local[0]?.id || "");
        setStorageMode("local");
      }
    }

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, [versionId]);

  const selectedRecord = useMemo(
    () => records.find((record) => record.id === selectedVersionId) ?? records[0] ?? null,
    [records, selectedVersionId],
  );

  const activeDraft = sourceMode === "version" ? (selectedRecord?.draft ?? null) : builderDraft;
  const activeRecord = sourceMode === "version" ? selectedRecord : null;
  const kit = useMemo(() => (activeDraft ? buildBuilderKit(activeDraft) : null), [activeDraft]);
  const report = useMemo(() => (activeDraft ? createQCReport(activeDraft) : null), [activeDraft]);
  const pageCount = useMemo(
    () => (activeDraft ? countPrintablePages(activeDraft) : 0),
    [activeDraft],
  );
  const blockers = report?.issues.filter((issue) => issue.severity === "blocker") ?? [];
  const warnings = report?.issues.filter((issue) => issue.severity === "warning") ?? [];
  const lessonGuide = activeRecord ? findLessonGuideForVersion(lessonGuides, activeRecord) : null;
  const howToGuide = activeRecord ? findHowToKitForVersion(howToGuides, activeRecord) : null;
  const activePackage = useMemo(() => {
    if (!activeDraft) return null;
    const base = getPackageExportForSource(packageRecords, activeDraft, activeRecord);
    return {
      ...base,
      lessonGuideGenerated: base.lessonGuideGenerated || Boolean(lessonGuide),
      howToGenerated: base.howToGenerated || Boolean(howToGuide),
      qcStatus: activeRecord?.qcStatus ?? report?.qcStatus ?? base.qcStatus,
      saleReady: activeRecord?.saleReady ?? report?.saleReady ?? base.saleReady,
      docHubReady: activeRecord?.docHubReady ?? report?.docHubReady ?? base.docHubReady,
    };
  }, [activeDraft, activeRecord, howToGuide, lessonGuide, packageRecords, report]);
  const branchSelected = Boolean(activeDraft?.branch.trim());
  const hasPages = Boolean(kit && kit.blocks.length > 0);
  const qcPassed = (activeRecord?.qcStatus ?? report?.qcStatus) === "Passed";
  const readiness: PackageAssetReadiness = {
    workbookReady: Boolean(activePackage?.workbookExported && hasPages),
    lessonGuideGenerated: Boolean(activePackage?.lessonGuideGenerated || lessonGuide),
    howToGenerated: Boolean(activePackage?.howToGenerated || howToGuide),
    qcPassed,
    packageNotesGenerated: Boolean(activePackage?.manifest.trim()),
  };
  const canMarkPackageReady = isPackageReady(readiness);
  const packageLabel = activePackage ? packageReadinessLabel(activePackage) : "In Progress";

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

  const savePackagePatch = (patch: Partial<PackageExportStatus>) => {
    if (!activePackage || !activeDraft) return null;
    const next = {
      ...activePackage,
      kitName: activeDraft.kitName,
      branch: activeDraft.branch,
      version: activeRecord?.version ?? activePackage.version,
      qcStatus: activeRecord?.qcStatus ?? report?.qcStatus ?? activePackage.qcStatus,
      saleReady: activeRecord?.saleReady ?? report?.saleReady ?? activePackage.saleReady,
      docHubReady: activeRecord?.docHubReady ?? report?.docHubReady ?? activePackage.docHubReady,
      ...patch,
    };
    const saved = upsertPackageExport(packageRecords, next);
    setPackageRecords(saved);
    return saved.find((record) => record.id === next.id) ?? null;
  };

  const openWorkbookPrintPreview = () => {
    if (!activeDraft) return;
    saveBuilderDraft(activeDraft);
    toast.success("Workbook draft prepared for print preview");
    navigate({ to: "/print-preview", search: { kitId: RESERVED_BUILDER_KIT_ID } });
  };

  const runQc = () => {
    if (activeRecord) {
      navigate({ to: "/qc", search: { versionId: activeRecord.id } });
      return;
    }
    navigate({ to: "/qc" });
  };

  const generateLessonGuide = () => {
    if (!activeDraft) return;
    const source = saveLessonGuideSource(
      activeDraft,
      sourceMode === "version" && activeRecord
        ? {
            sourceLabel: `${displayKitName(activeRecord.kitName)} ${activeRecord.version}`,
            sourceKitId: activeRecord.draft.id,
            sourceVersionId: activeRecord.id,
          }
        : "Current Builder Draft",
    );
    const record = saveLessonGuideRecord(source);
    setLessonGuides(loadLessonGuideLibrary());
    savePackagePatch({ lessonGuideGenerated: true });
    toast.success("Lesson Guide generated and saved");
    openLessonGuideRecord(record);
    navigate({ to: "/lesson-guide" });
  };

  const openLessonGuide = () => {
    if (!lessonGuide) return;
    openLessonGuideRecord(lessonGuide);
    toast.success("Opened Lesson Guide");
    navigate({ to: "/lesson-guide" });
  };

  const generateHowToKit = () => {
    if (!activeDraft) return;
    const source = saveHowToKitSource(
      activeDraft,
      sourceMode === "version" && activeRecord
        ? {
            sourceLabel: `${displayKitName(activeRecord.kitName)} ${activeRecord.version}`,
            sourceKitId: activeRecord.draft.id,
            sourceVersionId: activeRecord.id,
          }
        : "Current Builder Draft",
    );
    const record = saveHowToKitRecord(source);
    setHowToGuides(loadHowToKitLibrary());
    savePackagePatch({ howToGenerated: true });
    toast.success("How-To PDF generated and saved");
    openHowToKitRecord(record);
    navigate({ to: "/how-to-kit" });
  };

  const openHowToKit = () => {
    if (!howToGuide) return;
    openHowToKitRecord(howToGuide);
    toast.success("Opened How-To PDF");
    navigate({ to: "/how-to-kit" });
  };

  const markWorkbookExported = () => {
    savePackagePatch({ workbookExported: true, packageReady: false });
    toast.success("Workbook PDF marked exported");
  };

  const generateManifest = () => {
    if (!activeDraft || !activePackage) return;
    const manifest = buildPackageManifest({
      draft: activeDraft,
      version: activeRecord?.version ?? activePackage.version,
      lessonGuideGenerated: readiness.lessonGuideGenerated,
      howToGenerated: readiness.howToGenerated,
      workbookExported: Boolean(activePackage.workbookExported),
    });
    savePackagePatch({ manifest, packageReady: false });
    toast.success("Package notes generated");
  };

  const markPackageReady = () => {
    if (!canMarkPackageReady) {
      toast.error("Complete Workbook, Lesson Guide, How-To, QC Passed, and Package Notes first");
      return;
    }
    savePackagePatch({ packageReady: true });
    toast.success("Package marked ready");
  };

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Production package"
        title="Package"
        description={
          <>
            Track workbook, guide, how-to, QC, and package readiness for a saved kit version.
            <span className="ml-2">
              Storage:{" "}
              {storageMode === "checking"
                ? "Checking private Supabase..."
                : storageMode === "supabase"
                  ? "Private Supabase for versions, local package status"
                  : "Local fallback"}
            </span>
          </>
        }
      />

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
                  Track a Version Library snapshot.
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
              <CardTitle className="text-base">Package Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                type="button"
                className="w-full"
                disabled={!hasPages}
                style={{ background: "#4F2D68", color: "#fff" }}
                onClick={openWorkbookPrintPreview}
              >
                <Printer className="mr-2 h-4 w-4" /> Open Workbook Print Preview
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={runQc}>
                <ClipboardCheck className="mr-2 h-4 w-4" /> Run QC
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
                disabled={!lessonGuide}
                onClick={openLessonGuide}
              >
                <BookOpenText className="mr-2 h-4 w-4" /> Open Lesson Guide
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
                disabled={!howToGuide}
                onClick={openHowToKit}
              >
                <FileText className="mr-2 h-4 w-4" /> Open How-To
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!activeDraft}
                onClick={generateManifest}
              >
                <StickyNote className="mr-2 h-4 w-4" /> Generate Package Notes
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={!hasPages}
                onClick={markWorkbookExported}
              >
                <FileCheck2 className="mr-2 h-4 w-4" /> Mark Workbook PDF Exported
              </Button>
              <Button
                type="button"
                className="w-full"
                disabled={!activeDraft}
                onClick={markPackageReady}
                style={{ background: canMarkPackageReady ? "#2E5B33" : "#D8CEC2", color: "#fff" }}
              >
                <PackageCheck className="mr-2 h-4 w-4" /> Mark Package Ready
              </Button>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard title="Kit" value={activeDraft?.kitName.trim() || "Untitled"} />
            <SummaryCard title="Branch" value={activeDraft?.branch.trim() || "Missing"} />
            <SummaryCard title="Version" value={activeRecord?.version ?? "Builder Draft"} />
            <SummaryCard title="Package" value={packageLabel} />
            <SummaryCard title="Pages" value={String(pageCount)} />
            <SummaryCard title="QC" value={activePackage?.qcStatus ?? "Not Reviewed"} />
            <SummaryCard title="Sale Ready" value={activePackage?.saleReady ? "Yes" : "No"} />
            <SummaryCard title="DocHub Ready" value={activePackage?.docHubReady ? "Yes" : "No"} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <PackageCheck className="mr-2 h-4 w-4" /> Package Asset Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-2">
              <ReadinessItem
                title="Workbook PDF"
                state={activePackage?.workbookExported ? "ready" : hasPages ? "review" : "missing"}
                detail={
                  activePackage?.workbookExported
                    ? "Marked exported."
                    : hasPages
                      ? "Ready to print/export in Chrome."
                      : "No printable pages found yet."
                }
              />
              <ReadinessItem
                title="Lesson Guide"
                state={readiness.lessonGuideGenerated ? "ready" : "missing"}
                detail={readiness.lessonGuideGenerated ? "Generated." : "Missing."}
              />
              <ReadinessItem
                title="How-To PDF"
                state={readiness.howToGenerated ? "ready" : "missing"}
                detail={readiness.howToGenerated ? "Generated." : "Missing."}
              />
              <ReadinessItem
                title="QC"
                state={
                  qcPassed
                    ? "ready"
                    : activePackage?.qcStatus === "Needs Repair"
                      ? "review"
                      : "missing"
                }
                detail={
                  activePackage?.qcStatus === "Passed"
                    ? "Passed."
                    : activePackage?.qcStatus === "Needs Repair"
                      ? `${blockers.length} blocker${blockers.length === 1 ? "" : "s"} and ${warnings.length} warning${warnings.length === 1 ? "" : "s"}.`
                      : "Not run or not saved yet."
                }
              />
              <ReadinessItem
                title="Package Notes"
                state={readiness.packageNotesGenerated ? "ready" : "missing"}
                detail={readiness.packageNotesGenerated ? "Manifest generated." : "Missing."}
              />
              <ReadinessItem
                title="ZIP Package"
                state="planned"
                detail="Planned for a later pass."
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Package Readiness Rules</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ChecklistRow
                label="Workbook PDF exported"
                detail="Use Chrome print/save as PDF, then mark the workbook exported."
                done={readiness.workbookReady}
              />
              <ChecklistRow
                label="Lesson Guide generated"
                detail="Saved as a library snapshot connected to this version when possible."
                done={readiness.lessonGuideGenerated}
              />
              <ChecklistRow
                label="How-To PDF generated"
                detail="Saved as a library snapshot connected to this version when possible."
                done={readiness.howToGenerated}
              />
              <ChecklistRow
                label="QC passed"
                detail="Run QC and save the result to Version Library."
                done={readiness.qcPassed}
              />
              <ChecklistRow
                label="Package notes generated"
                detail="Manifest lists included files, buyer file names, and production notes."
                done={readiness.packageNotesGenerated}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Package Manifest</CardTitle>
            </CardHeader>
            <CardContent>
              {activePackage?.manifest ? (
                <pre
                  className="whitespace-pre-wrap rounded-md border p-4 text-xs leading-6"
                  style={{ borderColor: "#D8CEC2", background: "#fff", color: "#222026" }}
                >
                  {activePackage.manifest}
                </pre>
              ) : (
                <div
                  className="rounded-md border px-4 py-5 text-sm"
                  style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
                >
                  Package notes have not been generated yet.
                </div>
              )}
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

function ChecklistRow({ label, detail, done }: { label: string; detail: string; done: boolean }) {
  return (
    <div
      className="flex gap-3 rounded-md border p-3"
      style={{ borderColor: "#E7DFD2", background: "#fff" }}
    >
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border"
        style={{
          borderColor: done ? "#2E5B33" : "#C6A85B",
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
