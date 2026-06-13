import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Archive,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileCheck2,
  RotateCcw,
  StickyNote,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  duplicateVersionLibraryRecord,
  listVersionLibraryRecords,
  updateVersionLibraryRecord,
} from "@/lib/api/version-library.functions";
import {
  displayKitName,
  duplicateVersionRecord,
  loadVersionLibrary,
  openVersionDraftInBuilder,
  saveVersionLibrary,
  updateVersionRecord,
  type KitVersionRecord,
  type VersionQcStatus,
  type VersionStatus,
} from "@/lib/version-library";

export const Route = createFileRoute("/_app/version-library")({
  head: () => ({ meta: [{ title: "Version Library | Kit Factory" }] }),
  component: VersionLibraryPage,
});

const STATUS_OPTIONS: VersionStatus[] = [
  "Draft",
  "Template Test",
  "In Review",
  "Approved",
  "Archived",
];
const QC_STATUS_OPTIONS: VersionQcStatus[] = ["Not Reviewed", "Needs Repair", "Passed"];
type StorageMode = "checking" | "supabase" | "local";

function VersionLibraryPage() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<KitVersionRecord[]>(() => loadVersionLibrary());
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [storageMode, setStorageMode] = useState<StorageMode>("checking");

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
        // Keep the existing local records below.
      }

      if (!cancelled) {
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
      needsQc: records.filter((record) => record.qcStatus !== "Passed").length,
      saleReady: records.filter((record) => record.saleReady).length,
      docHubReady: records.filter((record) => record.docHubReady).length,
    };
  }, [records]);

  const persistLocal = (next: KitVersionRecord[]) => {
    const saved = saveVersionLibrary(next);
    setRecords(saved);
    return saved;
  };

  const openInBuilder = (record: KitVersionRecord) => {
    openVersionDraftInBuilder(record);
    toast.success("Opened version in builder");
    navigate({ to: "/builder", search: { draftReload: Date.now() } });
  };

  const duplicateRecord = async (record: KitVersionRecord) => {
    if (storageMode === "supabase") {
      try {
        const result = await duplicateVersionLibraryRecord({ data: { id: record.id } });
        if (result.ok) {
          persistLocal([result.data.record, ...records]);
          toast.success("Version duplicated");
          return;
        }
      } catch {
        setStorageMode("local");
      }
    }

    const copy = duplicateVersionRecord(records, record);
    persistLocal([copy, ...records]);
    toast.success("Version duplicated");
  };

  const patchRecord = async (
    id: string,
    patch: Parameters<typeof updateVersionRecord>[2],
    message: string,
  ) => {
    if (storageMode === "supabase") {
      try {
        const result = await updateVersionLibraryRecord({ data: { id, patch } });
        if (result.ok) {
          persistLocal(records.map((record) => (record.id === id ? result.data.record : record)));
          toast.success(message);
          return;
        }
      } catch {
        setStorageMode("local");
      }
    }

    persistLocal(updateVersionRecord(records, id, patch));
    toast.success(message);
  };

  const startNotes = (record: KitVersionRecord) => {
    setEditingNotesId(record.id);
    setNotesDraft(record.notes);
  };

  const saveNotes = (id: string) => {
    void patchRecord(id, { notes: notesDraft }, "Notes saved");
    setEditingNotesId(null);
    setNotesDraft("");
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Local Version Tracking
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Version Library
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Track saved builder snapshots, QC status, sale readiness, and DocHub readiness.
        <span className="ml-2">
          Storage:{" "}
          {storageMode === "checking"
            ? "Checking private Supabase..."
            : storageMode === "supabase"
              ? "Private Supabase"
              : "Local fallback"}
        </span>
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total Versions" value={summary.total} />
        <SummaryCard title="Drafts" value={summary.drafts} />
        <SummaryCard title="Needs QC" value={summary.needsQc} />
        <SummaryCard title="Sale Ready" value={summary.saleReady} />
        <SummaryCard title="DocHub Ready" value={summary.docHubReady} />
      </div>

      <div
        className="mt-8 overflow-x-auto rounded-md border"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
      >
        <table className="min-w-[1200px] w-full text-sm">
          <thead>
            <tr className="text-left" style={{ color: "#6b6470", background: "#F4EFE6" }}>
              {[
                "Kit Name",
                "Branch",
                "Version",
                "Status",
                "QC Status",
                "Sale Ready",
                "DocHub Ready",
                "Last Updated",
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
                  No versions saved yet. Use Save to Version Library in the Multi-Page Builder.
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
                    {editingNotesId === record.id ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          rows={3}
                          value={notesDraft}
                          onChange={(event) => setNotesDraft(event.target.value)}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveNotes(record.id)}>
                            Save Notes
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingNotesId(null);
                              setNotesDraft("");
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : record.notes ? (
                      <div className="mt-1 max-w-[240px] text-xs" style={{ color: "#6b6470" }}>
                        {record.notes}
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 align-top">{record.branch}</td>
                  <td className="px-4 py-3 align-top">{record.version}</td>
                  <td className="px-4 py-3 align-top">
                    <SelectCell
                      value={record.status}
                      options={STATUS_OPTIONS}
                      onChange={(value) =>
                        void patchRecord(
                          record.id,
                          { status: value as VersionStatus },
                          "Status updated",
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SelectCell
                      value={record.qcStatus}
                      options={QC_STATUS_OPTIONS}
                      onChange={(value) =>
                        void patchRecord(
                          record.id,
                          { qcStatus: value as VersionQcStatus },
                          "QC status updated",
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SelectCell
                      value={record.saleReady ? "Yes" : "No"}
                      options={["No", "Yes"]}
                      onChange={(value) =>
                        void patchRecord(
                          record.id,
                          { saleReady: value === "Yes" },
                          "Sale readiness updated",
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <SelectCell
                      value={record.docHubReady ? "Yes" : "No"}
                      options={["No", "Yes"]}
                      onChange={(value) =>
                        void patchRecord(
                          record.id,
                          { docHubReady: value === "Yes" },
                          "DocHub readiness updated",
                        )
                      }
                    />
                  </td>
                  <td className="px-4 py-3 align-top">
                    {new Date(record.lastUpdated).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <ActionButton label="Open in Builder" onClick={() => openInBuilder(record)}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Run QC"
                        onClick={() => navigate({ to: "/qc", search: { versionId: record.id } })}
                      >
                        <ClipboardCheck className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Duplicate Version"
                        onClick={() => void duplicateRecord(record)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Archive Version"
                        onClick={() =>
                          void patchRecord(record.id, { status: "Archived" }, "Version archived")
                        }
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Mark QC Passed"
                        onClick={() =>
                          void patchRecord(
                            record.id,
                            { qcStatus: "Passed", status: "Approved" },
                            "QC marked passed",
                          )
                        }
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Mark Needs Repair"
                        onClick={() =>
                          void patchRecord(
                            record.id,
                            { qcStatus: "Needs Repair", status: "In Review" },
                            "Marked needs repair",
                          )
                        }
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Mark Sale Ready"
                        onClick={() =>
                          void patchRecord(record.id, { saleReady: true }, "Marked sale ready")
                        }
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton
                        label="Mark DocHub Ready"
                        onClick={() =>
                          void patchRecord(record.id, { docHubReady: true }, "Marked DocHub ready")
                        }
                      >
                        <FileCheck2 className="h-3.5 w-3.5" />
                      </ActionButton>
                      <ActionButton label="Add/Edit Notes" onClick={() => startNotes(record)}>
                        <StickyNote className="h-3.5 w-3.5" />
                      </ActionButton>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SelectCell({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border px-2 py-1 text-xs"
      style={{ borderColor: "#D8CEC2", background: "#fff", color: "#222026" }}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function SummaryCard({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs uppercase tracking-[0.18em]" style={{ color: "#6b6470" }}>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl" style={{ fontFamily: "var(--font-display)", color: "#4F2D68" }}>
          {value}
        </div>
      </CardContent>
    </Card>
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
