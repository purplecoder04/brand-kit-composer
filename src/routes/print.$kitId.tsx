import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useMemo } from "react";
import { Printer } from "lucide-react";
import { useKitStore } from "@/lib/kit-store";
import { SAMPLE_KIT } from "@/lib/sample-kit";
import { PageRenderer } from "@/components/PageRenderer";
import type { Block, PageType } from "@/lib/kit-types";

const searchSchema = z.object({
  filter: z.enum(["all", "lesson", "workbook"]).optional(),
});

export const Route = createFileRoute("/print/$kitId")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Print | Kit Factory" }] }),
  component: PrintRoute,
});

const LESSON_TYPES: PageType[] = ["cover", "divider", "lesson"];
const WORKBOOK_TYPES: PageType[] = ["cover", "divider", "workbook"];

function PrintRoute() {
  const { kitId } = Route.useParams();
  const { filter = "all" } = Route.useSearch();
  const { state } = useKitStore();

  // Fall back to the sample kit so the print URL works even after a hard refresh
  // (the in-memory store is reset; sample kit id is stable).
  const kit = useMemo(() => {
    return (
      state.kits.find((k) => k.id === kitId) ||
      (kitId === SAMPLE_KIT.id ? SAMPLE_KIT : state.kits[0])
    );
  }, [kitId, state.kits]);

  if (!kit) {
    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        Kit not found.
      </div>
    );
  }

  const blocks: Block[] = useMemo(() => {
    if (filter === "lesson")
      return kit.blocks.filter((b) => LESSON_TYPES.includes(b.pageType));
    if (filter === "workbook")
      return kit.blocks.filter((b) => WORKBOOK_TYPES.includes(b.pageType));
    return kit.blocks;
  }, [filter, kit.blocks]);

  const total = blocks.length;

  return (
    <div
      className="print-stack"
      style={{
        background: "#EFE9DD",
        minHeight: "100vh",
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (typeof window !== "undefined") window.print();
        }}
        className="print-only-hide"
        style={{
          position: "fixed",
          top: "1rem",
          right: "1rem",
          background: "#4F2D68",
          color: "#ffffff",
          border: "none",
          borderRadius: "999px",
          padding: "0.6rem 1rem",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
          cursor: "pointer",
          zIndex: 50,
          fontFamily: "var(--font-body, Inter, sans-serif)",
        }}
      >
        <Printer style={{ width: 14, height: 14 }} /> Print / Save as PDF
      </button>

      <div
        className="print-stack-inner"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.5in",
          padding: "0.5in 0",
        }}
      >
        {blocks.map((b, i) => (
          <PageRenderer
            key={b.id}
            block={b}
            branchProfile={kit.branchProfile}
            pageNumber={i + 1}
            totalPages={total}
          />
        ))}
      </div>
    </div>
  );
}