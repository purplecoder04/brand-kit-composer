import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  Library,
  RotateCcw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  listVersionLibraryRecords,
  updateVersionLibraryRecord,
} from "@/lib/api/version-library.functions";
import {
  displayKitName,
  loadVersionLibrary,
  openVersionDraftInBuilder,
  saveVersionLibrary,
  updateVersionRecord,
  type KitVersionRecord,
} from "@/lib/version-library";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Production Dashboard | Kit Factory" }] }),
  component: DashboardPage,
});

type StorageMode = "checking" | "supabase" | "local";
type DashboardFilter =
  | "all"
  | "draft"
  | "needs-repair"
  | "qc-passed"
  | "sale-ready"
  | "dochub-ready"
  | "archived";

const FILTERS: Array<{ id: DashboardFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "draft", label: "Drafts" },
  { id: "needs-repair", label: "Needs Repair" },
  { id: "qc-passed", label: "QC Passed" },
  { id: "sale-ready", label: "Sale Ready" },
  { id: "dochub-ready", label: "DocHub Ready" },
  { id: "archived", label: "Archived" },
];

function DashboardPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<KitVersionRecord[]>(() => loadVersionLibrary());
  const [storageMode, setStorageMode] = useState<StorageMode>("checking");
  const [filter, setFilter] = useState<DashboardFilter>("all");

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
          return;
        }
      } catch {
        // Keep local fallback below.
      }

      if (!cancelled) {
        setRecords(loadVersionLibrary());
        setStorageMode("local");
      }
    }

    void loadRecords();

    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(() => {
    return {
      total: records.length,
      drafts: records.filter((record) => record.status === "Draft").length,
      needsRepair: records.filter((record) => record.qcStatus === "Needs Repair").length,
      qcPassed: records.filter((record) => record.qcStatus === "Passed").length,
      saleReady: records.filter((record) => record.saleReady).length,
      docHubReady: records.filter((record) => record.docHubReady).length,
      archived: records.filter((record) => record.status === "Archived").length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (filter === "draft") return record.status === "Draft";
      if (filter === "needs-repair") return record.qcStatus === "Needs Repair";
      if (filter === "qc-passed") return record.qcStatus === "Passed";
      if (filter === "sale-ready") return record.saleReady;
      if (filter === "dochub-ready") return record.docHubReady;
      if (filter === "archived") return record.status === "Archived";
      return true;
    });
  }, [filter, records]);

  const recentRecords = records.slice(0, 5);

  const patchRecord = async (
    id: string,
    patch: Parameters<typeof updateVersionRecord>[2],
    message: string,
  ) => {
    if (storageMode === "supabase") {
      try {
        const result = await updateVersionLibraryRecord({ data: { id, patch } });
        if (result.ok) {
          const next = records.map((record) => (record.id === id ? result.data.record : record));
          setRecords(saveVersionLibrary(next));
          toast.success(message);
          return;
        }
      } catch {
        setStorageMode("local");
      }
    }

    const next = updateVersionRecord(records, id, patch);
    setRecords(saveVersionLibrary(next));
    toast.success(message);
  };

  const openInBuilder = (record: KitVersionRecord) => {
    openVersionDraftInBuilder(record);
    toast.success("Opened version in builder");
    navigate({ to: "/builder" });
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Level 7 Production Command Center
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Production Dashboard
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Track what needs repair, what passed QC, and what is ready for export.
        <span className="ml-2">
          Storage:{" "}
          {storageMode === "checking"
            ? "Checking private Supabase..."
            : storageMode === "supabase"
              ? "Private Supabase"
              : "Local fallback"}
        </span>
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        <SummaryCard title="Total Versions" value={summary.total} />
        <SummaryCard title="Drafts" value={summary.drafts} />
        <SummaryCard title="Needs Repair" value={summary.needsRepair} tone="#7a1f1f" />
        <SummaryCard title="QC Passed" value={summary.qcPassed} tone="#2E5B33" />
        <SummaryCard title="Sale Ready" value={summary.saleReady} tone="#2E5B33" />
        <SummaryCard title="DocHub Ready" value={summary.docHubReady} />
        <SummaryCard title="Archived" value={summary.archived} />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className="rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em]"
                style={
                  filter === item.id
                    ? { background: "#4F2D68", borderColor: "#4F2D68", color: "#fff" }
                    : { background: "#fff", borderColor: "#D8CEC2", color: "#4F2D68" }
                }
              >
                {item.label}
              </button>
            ))}
          </div>

          <VersionTable records={filteredRecords} onOpen={openInBuilder} onPatch={patchRecord} />
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle
                className="text-sm uppercase tracking-[0.18em]"
                style={{ color: "#4F2D68" }}
              >
                Next Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <NextAction
                label="Repair first"
                value={`${summary.needsRepair} version${summary.needsRepair === 1 ? "" : "s"}`}
                to="/dashboard"
                onClick={() => setFilter("needs-repair")}
              />
              <NextAction
                label="Run QC"
                value={`${records.filter((record) => record.qcStatus === "Not Reviewed").length} not reviewed`}
                to="/qc"
              />
              <NextAction
                label="Ready to export"
                value={`${summary.saleReady} sale-ready`}
                to="/dashboard"
                onClick={() => setFilter("sale-ready")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle
                className="text-sm uppercase tracking-[0.18em]"
                style={{ color: "#4F2D68" }}
              >
                Recent Versions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentRecords.length === 0 ? (
                <div className="text-sm" style={{ color: "#6b6470" }}>
                  No saved versions yet.
                </div>
              ) : (
                recentRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-md border p-3"
                    style={{ borderColor: "#D8CEC2" }}
                  >
                    <div className="font-semibold" style={{ color: "#222026" }}>
                      {displayKitName(record.kitName)} {record.version}
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                      {new Date(record.lastUpdated).toLocaleString()}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Pill
                        tone={
                          record.qcStatus === "Passed"
                            ? "good"
                            : record.qcStatus === "Needs Repair"
                              ? "bad"
                              : "warn"
                        }
                      >
                        {record.qcStatus}
                      </Pill>
                      {record.saleReady ? <Pill tone="good">Sale Ready</Pill> : null}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function VersionTable({
  records,
  onOpen,
  onPatch,
}: {
  records: KitVersionRecord[];
  onOpen: (record: KitVersionRecord) => void;
  onPatch: (
    id: string,
    patch: Parameters<typeof updateVersionRecord>[2],
    message: string,
  ) => Promise<void>;
}) {
  return (
    <div
      className="overflow-x-auto rounded-md border"
      style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
    >
      <table className="min-w-[1120px] w-full text-sm">
        <thead>
          <tr className="text-left" style={{ color: "#6b6470", background: "#F4EFE6" }}>
            {[
              "Kit",
              "Version",
              "Status",
              "QC",
              "Sale",
              "DocHub",
              "Next Step",
              "Updated",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.18em]"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td
                colSpan={9}
                className="px-4 py-8 text-center text-sm"
                style={{ color: "#6b6470" }}
              >
                No versions match this view.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} style={{ borderTop: "1px solid #E7DFD2" }}>
                <td className="px-4 py-3 align-top">
                  <div
                    className="font-semibold"
                    style={{ color: record.kitName ? "#222026" : "#9a929d" }}
                  >
                    {displayKitName(record.kitName)}
                  </div>
                  <div className="text-xs" style={{ color: "#6b6470" }}>
                    {record.branch || "No branch"}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">{record.version}</td>
                <td className="px-4 py-3 align-top">
                  <Pill>{record.status}</Pill>
                </td>
                <td className="px-4 py-3 align-top">
                  <Pill
                    tone={
                      record.qcStatus === "Passed"
                        ? "good"
                        : record.qcStatus === "Needs Repair"
                          ? "bad"
                          : "warn"
                    }
                  >
                    {record.qcStatus}
                  </Pill>
                </td>
                <td className="px-4 py-3 align-top">{record.saleReady ? "Yes" : "No"}</td>
                <td className="px-4 py-3 align-top">{record.docHubReady ? "Yes" : "No"}</td>
                <td className="px-4 py-3 align-top">{nextStepFor(record)}</td>
                <td className="px-4 py-3 align-top">
                  {new Date(record.lastUpdated).toLocaleString()}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-wrap gap-2">
                    <ActionButton label="Open" onClick={() => onOpen(record)}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </ActionButton>
                    <ActionLink label="Run QC" to="/qc" search={{ versionId: record.id }}>
                      <ClipboardCheck className="h-3.5 w-3.5" />
                    </ActionLink>
                    <ActionButton
                      label="Archive"
                      onClick={() =>
                        void onPatch(record.id, { status: "Archived" }, "Version archived")
                      }
                    >
                      <Archive className="h-3.5 w-3.5" />
                    </ActionButton>
                    <ActionButton
                      label="Repair"
                      onClick={() =>
                        void onPatch(
                          record.id,
                          { qcStatus: "Needs Repair", status: "In Review" },
                          "Marked needs repair",
                        )
                      }
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </ActionButton>
                    <ActionButton
                      label="Sale Ready"
                      onClick={() =>
                        void onPatch(record.id, { saleReady: true }, "Marked sale ready")
                      }
                    >
                      <FileCheck2 className="h-3.5 w-3.5" />
                    </ActionButton>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function SummaryCard({ title, value, tone }: { title: string; value: number; tone?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6b6470" }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className="text-3xl"
          style={{ fontFamily: "var(--font-display)", color: tone ?? "#4F2D68" }}
        >
          {value}
        </div>
      </CardContent>
    </Card>
  );
}

function NextAction({
  label,
  value,
  to,
  onClick,
}: {
  label: string;
  value: string;
  to: "/dashboard" | "/qc";
  onClick?: () => void;
}) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="block w-full rounded-md border p-3 text-left"
        style={{ borderColor: "#D8CEC2" }}
      >
        <NextActionContent label={label} value={value} />
      </button>
    );
  }

  return (
    <Link to={to} className="block rounded-md border p-3" style={{ borderColor: "#D8CEC2" }}>
      <NextActionContent label={label} value={value} />
    </Link>
  );
}

function NextActionContent({ label, value }: { label: string; value: string }) {
  return (
    <>
      <div className="text-xs uppercase tracking-[0.16em]" style={{ color: "#4F2D68" }}>
        {label}
      </div>
      <div className="mt-1 text-sm" style={{ color: "#222026" }}>
        {value}
      </div>
    </>
  );
}

function Pill({
  children,
  tone = "muted",
}: {
  children: React.ReactNode;
  tone?: "good" | "warn" | "bad" | "muted";
}) {
  const palette: Record<string, { bg: string; fg: string }> = {
    good: { bg: "#E5EFE3", fg: "#2E5B33" },
    warn: { bg: "#F3E6D5", fg: "#7a4e16" },
    bad: { bg: "#F4DDDB", fg: "#7a1f1f" },
    muted: { bg: "#EDE5D7", fg: "#4F2D68" },
  };
  const color = palette[tone];
  return (
    <span
      className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]"
      style={{ background: color.bg, color: color.fg }}
    >
      {children}
    </span>
  );
}

function ActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} title={label}>
      {children}
      <span className="ml-1">{label}</span>
    </Button>
  );
}

function ActionLink({
  label,
  to,
  search,
  children,
}: {
  label: string;
  to: "/qc";
  search: { versionId: string };
  children: React.ReactNode;
}) {
  return (
    <Button asChild type="button" variant="outline" size="sm" title={label}>
      <Link to={to} search={search}>
        {children}
        <span className="ml-1">{label}</span>
      </Link>
    </Button>
  );
}

function nextStepFor(record: KitVersionRecord): string {
  if (record.status === "Archived") return "Archived";
  if (record.qcStatus === "Not Reviewed") return "Run QC";
  if (record.qcStatus === "Needs Repair") return "Repair content";
  if (!record.saleReady) return "Mark sale ready";
  if (!record.docHubReady) return "DocHub prep";
  return "Ready";
}
