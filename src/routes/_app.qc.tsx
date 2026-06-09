import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { toast } from "sonner";
import { useKitStore } from "@/lib/kit-store";
import type { QCCheck, QCCheckValue, QCReport, QCVerdict } from "@/lib/kit-types";

const searchSchema = z.object({
  kitId: z.string().optional(),
});

export const Route = createFileRoute("/_app/qc")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "QC Report | Kit Factory" }] }),
  component: QCPage,
});

const CHECK_DEFS: { key: string; label: string }[] = [
  { key: "duplicate-text", label: "No duplicate text" },
  { key: "hidden-old-layers", label: "No hidden old layers" },
  { key: "crowded-pages", label: "No crowded pages" },
  { key: "tiny-fonts", label: "No tiny fonts" },
  { key: "missing-titles", label: "All page titles present" },
  { key: "broken-tables", label: "Tables render correctly" },
  { key: "workbook-space", label: "Workbook pages have writing space" },
  { key: "branch-colors", label: "Branch colors are consistent" },
  { key: "correct-footer", label: "Correct footer on every page" },
  { key: "no-sample-wording", label: "No sample / internal wording" },
  { key: "no-test-wording", label: "No version / test wording buyer-facing" },
  { key: "overflow-warning", label: "No content overflow warning present" },
  { key: "page-count", label: "Page count matches expected output" },
  { key: "print-route-checked", label: "Chrome-free print route checked" },
  { key: "buyer-facing-clean", label: "Buyer-facing sample/test wording removed" },
];

function blankReport(kitId: string): QCReport {
  return {
    kitId,
    checks: CHECK_DEFS.map((d) => ({ ...d, value: null, notes: "" })),
    readyForSale: null,
    readyForDochub: null,
    verdict: null,
    updatedAt: new Date().toISOString(),
  };
}

function QCPage() {
  const { kitId } = Route.useSearch();
  const { state, saveQCReport, updateKit } = useKitStore();

  const kit = useMemo(
    () => (kitId ? state.kits.find((k) => k.id === kitId) : state.kits[0]) ?? state.kits[0],
    [kitId, state.kits],
  );

  const existing = kit ? state.qcReports[kit.id] : undefined;
  const [report, setReport] = useState<QCReport>(
    existing ?? (kit ? blankReport(kit.id) : blankReport("none")),
  );

  useEffect(() => {
    if (!kit) return;
    setReport(state.qcReports[kit.id] ?? blankReport(kit.id));
  }, [kit, state.qcReports]);

  if (!kit) return <div className="p-10">No kits.</div>;

  const setCheck = (key: string, patch: Partial<QCCheck>) => {
    setReport((r) => ({
      ...r,
      checks: r.checks.map((c) => (c.key === key ? { ...c, ...patch } : c)),
    }));
  };

  const onSave = () => {
    const finalReport: QCReport = { ...report, updatedAt: new Date().toISOString() };
    saveQCReport(finalReport);
    const passed = finalReport.checks.every((c) => c.value === "pass" || c.value === "na");
    updateKit(kit.id, {
      qcStatus: passed ? "Passed" : "Failed",
      dochubStatus: finalReport.readyForDochub ? "Ready" : "Not Ready",
      status:
        finalReport.verdict === "SALE READY"
          ? "Sale Ready"
          : finalReport.verdict === "NEEDS REPAIR"
            ? "QC Needed"
            : kit.status,
    });
    toast.success("QC report saved");
  };

  return (
    <div className="p-10 max-w-4xl">
      <div
        className="text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "#4F2D68" }}
      >
        Quality Control
      </div>
      <h1
        className="mt-1 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "#222026" }}
      >
        QC Report
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Reviewing: <strong>{kit.name}</strong> ({kit.version})
      </p>

      <div className="mt-8 space-y-3">
        {report.checks.map((c) => (
          <CheckRow
            key={c.key}
            check={c}
            onValue={(v) => setCheck(c.key, { value: v })}
            onNotes={(n) => setCheck(c.key, { notes: n })}
          />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <YesNo
          label="Ready for sale"
          value={report.readyForSale}
          onChange={(v) => setReport({ ...report, readyForSale: v })}
        />
        <YesNo
          label="Ready for DocHub"
          value={report.readyForDochub}
          onChange={(v) => setReport({ ...report, readyForDochub: v })}
        />
      </div>

      <div className="mt-8">
        <div
          className="mb-2 text-[10px] uppercase tracking-[0.18em]"
          style={{ color: "#4F2D68" }}
        >
          Final verdict
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "STYLE-READY",
              "NEEDS REPAIR",
              "NOT READY FOR DOCHUB",
              "SALE READY",
            ] as QCVerdict[]
          ).map((v) => (
            <button
              key={v as string}
              onClick={() => setReport({ ...report, verdict: v })}
              className="rounded-md border px-3 py-2 text-xs font-semibold tracking-wider"
              style={
                report.verdict === v
                  ? { background: "#4F2D68", color: "#fff", borderColor: "#4F2D68" }
                  : { borderColor: "#D8CEC2", color: "#4F2D68", background: "#fff" }
              }
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSave}
        className="mt-8 rounded-md px-5 py-2.5 text-sm font-medium text-white"
        style={{ background: "#4F2D68" }}
      >
        Save QC Report
      </button>
    </div>
  );
}

function CheckRow({
  check,
  onValue,
  onNotes,
}: {
  check: QCCheck;
  onValue: (v: QCCheckValue) => void;
  onNotes: (n: string) => void;
}) {
  const opts: { v: QCCheckValue; label: string; tone: string }[] = [
    { v: "pass", label: "Pass", tone: "#2E5B33" },
    { v: "fail", label: "Fail", tone: "#7a1f1f" },
    { v: "na", label: "N/A", tone: "#6b6470" },
  ];
  return (
    <div
      className="rounded-md border p-3 bg-white"
      style={{ borderColor: "#D8CEC2" }}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 text-sm" style={{ color: "#222026" }}>
          {check.label}
        </div>
        <div className="flex gap-1">
          {opts.map((o) => (
            <button
              key={o.label}
              onClick={() => onValue(o.v)}
              className="rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider border"
              style={
                check.value === o.v
                  ? { background: o.tone, color: "#fff", borderColor: o.tone }
                  : { borderColor: "#D8CEC2", color: o.tone, background: "#fff" }
              }
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
      <input
        value={check.notes}
        onChange={(e) => onNotes(e.target.value)}
        placeholder="Notes (optional)"
        className="mt-2 w-full rounded border px-2 py-1.5 text-xs"
        style={{ borderColor: "#E7DFD2" }}
      />
    </div>
  );
}

function YesNo({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="rounded-md border p-3 bg-white"
      style={{ borderColor: "#D8CEC2" }}
    >
      <div className="text-sm mb-2" style={{ color: "#222026" }}>
        {label}
      </div>
      <div className="flex gap-2">
        {[
          { v: true, label: "Yes" },
          { v: false, label: "No" },
        ].map((o) => (
          <button
            key={o.label}
            onClick={() => onChange(o.v)}
            className="rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wider border"
            style={
              value === o.v
                ? { background: "#4F2D68", color: "#fff", borderColor: "#4F2D68" }
                : { borderColor: "#D8CEC2", color: "#4F2D68", background: "#fff" }
            }
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}