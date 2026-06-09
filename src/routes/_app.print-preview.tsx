import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { useKitStore } from "@/lib/kit-store";
import { PageRenderer } from "@/components/PageRenderer";
import { PagePreview } from "@/components/PagePreview";

const searchSchema = z.object({
  kitId: z.string().optional(),
});

export const Route = createFileRoute("/_app/print-preview")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Print Preview | Kit Factory" }] }),
  component: PrintPreviewPage,
});

function PrintPreviewPage() {
  const { kitId } = Route.useSearch();
  const { state } = useKitStore();
  const kit = useMemo(
    () => (kitId ? state.kits.find((k) => k.id === kitId) : state.kits[0]) ?? state.kits[0],
    [kitId, state.kits],
  );

  if (!kit) return <div className="p-10">No kits yet.</div>;

  return (
    <div className="p-10">
      <div
        className="text-[10px] uppercase tracking-[0.28em]"
        style={{ color: "#4F2D68" }}
      >
        Print Preview
      </div>
      <h1
        className="mt-1 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "#222026" }}
      >
        {kit.name}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Open one of the chrome-free print routes below to use the browser's Save as PDF dialog.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <PrintLink kitId={kit.id} filter="all" label="Print / Save as PDF" primary />
        <PrintLink kitId={kit.id} filter="lesson" label="Export Lesson Guide" />
        <PrintLink kitId={kit.id} filter="workbook" label="Export Workbook" />
        <PrintLink kitId={kit.id} filter="all" label="Export Full Kit" />
      </div>

      <div className="mt-10 space-y-8">
        {kit.blocks.map((b, i) => (
          <PagePreview key={b.id} scale={0.6}>
            <PageRenderer
              block={b}
              branchProfile={kit.branchProfile}
              pageNumber={i + 1}
              totalPages={kit.blocks.length}
            />
          </PagePreview>
        ))}
      </div>
    </div>
  );
}

function PrintLink({
  kitId,
  filter,
  label,
  primary = false,
}: {
  kitId: string;
  filter: "all" | "lesson" | "workbook";
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      to="/print/$kitId"
      params={{ kitId }}
      search={{ filter }}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center rounded-md px-3 py-2 text-xs font-medium"
      style={
        primary
          ? { background: "#4F2D68", color: "#fff" }
          : { border: "1px solid #4F2D68", color: "#4F2D68" }
      }
    >
      {label}
    </Link>
  );
}