import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, ClipboardCopy, ExternalLink, FileCheck2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listVersionLibraryRecords,
  updateVersionLibraryRecord,
} from "@/lib/api/version-library.functions";
import { createQCReport, type QCIssue, type QCReportMvp } from "@/lib/qc-report";
import {
  displayKitName,
  loadVersionLibrary,
  openVersionDraftInBuilder,
  saveVersionLibrary,
  updateVersionRecord,
  type KitVersionRecord,
} from "@/lib/version-library";

const searchSchema = z.object({
  versionId: z.string().optional(),
  kitId: z.string().optional(),
});

export const Route = createFileRoute("/_app/qc")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "QC Report | Kit Factory" }] }),
  component: QCPage,
});

type StorageMode = "checking" | "supabase" | "local";

function QCPage() {
  const navigate = useNavigate();
  const { versionId, kitId } = Route.useSearch();
  const [records, setRecords] = useState<KitVersionRecord[]>(() => loadVersionLibrary());
  const [selectedId, setSelectedId] = useState(versionId ?? kitId ?? "");
  const [storageMode, setStorageMode] = useState<StorageMode>("checking");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecords() {
      try {
        const result = await listVersionLibraryRecords();
        if (cancelled) return;
        if (result.ok) {
          const saved = saveVersionLibrary(result.data.records);
          setRecords(saved);
          setStorageMode("supabase");
          if (!selectedId && saved[0]) setSelectedId(saved[0].id);
          return;
        }
      } catch {
        // Keep local fallback below.
      }

      if (!cancelled) {
        const local = loadVersionLibrary();
        setRecords(local);
        setStorageMode("local");
        if (!selectedId && local[0]) setSelectedId(local[0].id);
      }
    }

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const selectedRecord = useMemo(() => {
    return records.find((record) => record.id === selectedId) ?? records[0] ?? null;
  }, [records, selectedId]);

  const report = useMemo<QCReportMvp | null>(() => {
    return selectedRecord ? createQCReport(selectedRecord.draft) : null;
  }, [selectedRecord]);

  const saveQcResults = async () => {
    if (!selectedRecord || !report || saving) return;
    setSaving(true);

    const patch = {
      qcStatus: report.qcStatus,
      saleReady: report.saleReady,
      docHubReady: report.docHubReady,
      status: report.saleReady ? "Approved" : "In Review",
      notes: buildQcNotes(selectedRecord.notes, report),
    } as const;

    if (storageMode === "supabase") {
      try {
        const result = await updateVersionLibraryRecord({
          data: { id: selectedRecord.id, patch },
        });
        if (result.ok) {
          const next = records.map((record) =>
            record.id === selectedRecord.id ? result.data.record : record,
          );
          setRecords(saveVersionLibrary(next));
          toast.success("QC results saved to Version Library");
          setSaving(false);
          return;
        }
      } catch {
        setStorageMode("local");
      }
    }

    const next = updateVersionRecord(records, selectedRecord.id, patch);
    setRecords(saveVersionLibrary(next));
    toast.success("QC results saved locally");
    setSaving(false);
  };

  const openInBuilder = () => {
    if (!selectedRecord) return;
    openVersionDraftInBuilder(selectedRecord);
    toast.success("Opened version in builder");
    navigate({ to: "/builder" });
  };

  const copyRepairPrompt = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report.repairPrompt);
      toast.success("Repair prompt copied");
    } catch {
      toast.message("Repair prompt is ready to copy");
    }
  };

  if (records.length === 0) {
    return (
      <div className="p-8">
        <PageHeader storageMode={storageMode} />
        <div
          className="mt-8 rounded-md border px-4 py-8 text-sm"
          style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
        >
          No saved versions found yet. Save a kit to the Version Library before running QC.
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader storageMode={storageMode} />

      <div
        className="mt-6 flex flex-wrap items-end gap-3 rounded-md border px-4 py-3"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
      >
        <div className="min-w-[280px] flex-1">
          <div
            className="mb-1 text-[10px] uppercase tracking-[0.18em]"
            style={{ color: "#4F2D68" }}
          >
            Saved Version
          </div>
          <select
            value={selectedRecord?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "#D8CEC2", background: "#fff", color: "#222026" }}
          >
            {records.map((record) => (
              <option key={record.id} value={record.id}>
                {displayKitName(record.kitName)} {record.version}
              </option>
            ))}
          </select>
        </div>
        <Button type="button" variant="outline" onClick={openInBuilder}>
          <ExternalLink className="mr-2 h-4 w-4" /> Open in Builder
        </Button>
        <Button
          type="button"
          onClick={saveQcResults}
          disabled={saving || !report}
          style={{ background: "#4F2D68", color: "#fff" }}
        >
          <FileCheck2 className="mr-2 h-4 w-4" /> Save QC Results
        </Button>
      </div>

      {selectedRecord && report ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <SummaryCard
              title="Verdict"
              value={report.verdict}
              tone={verdictTone(report.verdict)}
            />
            <SummaryCard title="QC Status" value={report.qcStatus} />
            <SummaryCard title="Pages" value={String(report.pageCount)} />
            <SummaryCard title="Sale Ready" value={report.saleReady ? "Yes" : "No"} />
            <SummaryCard title="DocHub Ready" value={report.docHubReady ? "Yes" : "No"} />
          </div>

          <section className="mt-8">
            <SectionTitle title="Top Blockers" />
            {report.topBlockers.length === 0 ? (
              <EmptyState message="No blockers found." />
            ) : (
              <IssueList issues={report.topBlockers} />
            )}
          </section>

          <section className="mt-8">
            <SectionTitle title="All QC Issues" />
            {report.issues.length === 0 ? (
              <EmptyState message="No QC issues found. This version is ready for internal production use." />
            ) : (
              <IssueList issues={report.issues} />
            )}
          </section>

          <section className="mt-8">
            <div className="flex items-center justify-between gap-3">
              <SectionTitle title="Repair Prompt" />
              <Button type="button" variant="outline" onClick={copyRepairPrompt}>
                <ClipboardCopy className="mr-2 h-4 w-4" /> Copy Prompt
              </Button>
            </div>
            <pre
              className="mt-3 whitespace-pre-wrap rounded-md border p-4 text-xs leading-6"
              style={{ borderColor: "#D8CEC2", background: "#fff", color: "#222026" }}
            >
              {report.repairPrompt}
            </pre>
          </section>
        </>
      ) : null}
    </div>
  );
}

function PageHeader({ storageMode }: { storageMode: StorageMode }) {
  return (
    <>
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Level 6 Internal QC
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        QC Report
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Review saved versions for sale readiness, repair needs, and DocHub readiness.
        <span className="ml-2">
          Storage:{" "}
          {storageMode === "checking"
            ? "Checking private Supabase..."
            : storageMode === "supabase"
              ? "Private Supabase"
              : "Local fallback"}
        </span>
      </p>
    </>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: string; tone?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6b6470" }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="text-2xl"
          style={{ fontFamily: "var(--font-display)", color: tone ?? "#4F2D68" }}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h2 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
      {title}
    </h2>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      className="mt-3 rounded-md border px-4 py-4 text-sm"
      style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
    >
      <CheckCircle2 className="mr-2 inline h-4 w-4" />
      {message}
    </div>
  );
}

function IssueList({ issues }: { issues: QCIssue[] }) {
  return (
    <div className="mt-3 overflow-hidden rounded-md border" style={{ borderColor: "#D8CEC2" }}>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="grid gap-2 border-b px-4 py-3 text-sm last:border-b-0 md:grid-cols-[120px_160px_1fr]"
          style={{ borderColor: "#E7DFD2", background: "#fff" }}
        >
          <div
            className="flex items-center gap-2 font-semibold"
            style={{ color: severityTone(issue.severity) }}
          >
            <AlertTriangle className="h-4 w-4" />
            {issue.severity}
          </div>
          <div style={{ color: "#4F2D68" }}>{issue.area}</div>
          <div style={{ color: "#222026" }}>
            <span className="font-semibold">{issue.blockTitle}: </span>
            {issue.message}
          </div>
        </div>
      ))}
    </div>
  );
}

function buildQcNotes(existingNotes: string, report: QCReportMvp): string {
  const summary = [
    `QC ${report.verdict} on ${new Date(report.generatedAt).toLocaleString()}.`,
    `Issues: ${report.issues.length}. Pages: ${report.pageCount}.`,
  ].join(" ");
  return existingNotes.trim() ? `${existingNotes.trim()}\n\n${summary}` : summary;
}

function verdictTone(verdict: string): string {
  if (verdict === "Sale Ready") return "#2E5B33";
  if (verdict === "Needs Repair") return "#7a1f1f";
  if (verdict === "Not Ready for DocHub") return "#7a4a00";
  return "#4F2D68";
}

function severityTone(severity: QCIssue["severity"]): string {
  if (severity === "blocker") return "#7a1f1f";
  if (severity === "warning") return "#7a4a00";
  return "#6b6470";
}
