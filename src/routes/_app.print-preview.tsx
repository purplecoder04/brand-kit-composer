import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { useKitStore } from "@/lib/kit-store";
import { PageRenderer } from "@/components/PageRenderer";
import { PagePreview } from "@/components/PagePreview";
import { RESERVED_MAPPER_KIT_ID, buildMapperKit, loadMapperDraft } from "@/lib/mapper-content";
import {
  RESERVED_BUILDER_KIT_ID,
  buildBuilderKit,
  getPageCountWarning,
  loadBuilderDraft,
} from "@/lib/builder-content";

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
  const mapperDraft = useMemo(() => loadMapperDraft(), []);
  const builderDraft = useMemo(() => loadBuilderDraft(), []);
  const mapperKit = useMemo(
    () => (mapperDraft ? buildMapperKit(mapperDraft.content) : null),
    [mapperDraft],
  );
  const builderKit = useMemo(
    () => (builderDraft ? buildBuilderKit(builderDraft) : null),
    [builderDraft],
  );
  const kit = useMemo(() => {
    if (kitId === RESERVED_MAPPER_KIT_ID) {
      return mapperKit ?? state.kits.find((k) => k.id === kitId);
    }

    if (kitId === RESERVED_BUILDER_KIT_ID) {
      return builderKit ?? state.kits.find((k) => k.id === kitId);
    }

    if (kitId) return state.kits.find((k) => k.id === kitId) ?? state.kits[0];

    if (mapperDraft?.source === "current" && mapperKit) return mapperKit;
    if (builderDraft?.source === "current" && builderKit) return builderKit;

    return state.kits[0];
  }, [builderDraft?.source, builderKit, kitId, mapperDraft?.source, mapperKit, state.kits]);
  const pageCountWarning = kit ? getPageCountWarning(kit.blocks.length) : null;

  if (!kit) return <div className="p-10">No kits yet.</div>;

  return (
    <div className="p-10">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Print Preview
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        {kit.name}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Open one of the chrome-free print routes below to use the browser's Save as PDF dialog.
      </p>
      {pageCountWarning ? (
        <div
          className="mt-5 rounded-md border px-4 py-3 text-sm"
          style={{
            borderColor: pageCountWarning.level === "review" ? "#9f3a38" : "#C6A85B",
            background: pageCountWarning.level === "review" ? "#fff1f0" : "#fff8e1",
            color: pageCountWarning.level === "review" ? "#7a211f" : "#7a4a00",
          }}
        >
          <div className="font-semibold">{pageCountWarning.title}</div>
          <div className="mt-1">{pageCountWarning.message}</div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <PrintLink kitId={kit.id} filter="all" label="Print / Save as PDF" primary />
        <PrintLink kitId={kit.id} filter="lesson" label="Export Lesson Pages" />
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
  const href = `/print/${kitId}?filter=${filter}`;

  return (
    <a
      href={href}
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
    </a>
  );
}
