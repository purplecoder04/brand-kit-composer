import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useKitStore } from "@/lib/kit-store";
import { SAMPLE_KIT } from "@/lib/sample-kit";
import { PageRenderer } from "@/components/PageRenderer";
import type { Block, Kit, PageType } from "@/lib/kit-types";
import {
  EMPTY_MAPPER_CONTENT,
  RESERVED_MAPPER_KIT_ID,
  buildMapperKit,
  loadMapperContentFromStorage,
  loadMapperContentFromUrlHash,
  loadMapperContentFromWindowName,
  type MapperContent,
} from "@/lib/mapper-content";

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

function buildMapperKitFromContent(content: MapperContent | null): Kit | null {
  return content ? buildMapperKit(content) : null;
}

function PrintRoute() {
  const { kitId } = Route.useParams();
  const { filter = "all" } = Route.useSearch();
  const { state } = useKitStore();
  const [storedMapperKit, setStoredMapperKit] = useState<Kit | null>(null);
  const [mapperStorageChecked, setMapperStorageChecked] = useState(false);

  useEffect(() => {
    if (kitId !== RESERVED_MAPPER_KIT_ID) {
      setStoredMapperKit(null);
      setMapperStorageChecked(false);
      return;
    }

    setStoredMapperKit(
      buildMapperKitFromContent(
        loadMapperContentFromWindowName()
          ?? loadMapperContentFromUrlHash()
          ?? loadMapperContentFromStorage(),
      ),
    );
    setMapperStorageChecked(true);
  }, [kitId]);

  // Mapper preview: the new tab has a fresh in-memory store. Rebuild from
  // the URL hash/localStorage after hydration so mapped content prints instead of sample.
  const kit = useMemo(() => {
    if (kitId === RESERVED_MAPPER_KIT_ID) {
      if (storedMapperKit) return storedMapperKit;

      const found = state.kits.find((k) => k.id === kitId);
      if (found) return found;

      if (!mapperStorageChecked) return undefined;

      return buildMapperKitFromContent(EMPTY_MAPPER_CONTENT);
    }

    const found = state.kits.find((k) => k.id === kitId);
    if (found) return found;

    return kitId === SAMPLE_KIT.id ? SAMPLE_KIT : state.kits[0];
  }, [kitId, mapperStorageChecked, state.kits, storedMapperKit]);

  const blocks: Block[] = useMemo(() => {
    if (!kit) return [];
    if (filter === "lesson")
      return kit.blocks.filter((b) => LESSON_TYPES.includes(b.pageType));
    if (filter === "workbook")
      return kit.blocks.filter((b) => WORKBOOK_TYPES.includes(b.pageType));
    return kit.blocks;
  }, [filter, kit]);

  if (!kit) {
    const message =
      kitId === RESERVED_MAPPER_KIT_ID && !mapperStorageChecked
        ? "Loading print preview..."
        : "Kit not found.";

    return (
      <div style={{ padding: "2rem", fontFamily: "system-ui" }}>
        {message}
      </div>
    );
  }

  return (
    <PrintKitDocument kit={kit} blocks={blocks} />
  );
}

function filterBlocks(blocks: Block[], filter: "all" | "lesson" | "workbook") {
  if (filter === "lesson")
    return blocks.filter((b) => LESSON_TYPES.includes(b.pageType));
  if (filter === "workbook")
    return blocks.filter((b) => WORKBOOK_TYPES.includes(b.pageType));
  return blocks;
}

function PrintKitDocument({ kit, blocks }: { kit: Kit; blocks: Block[] }) {
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
          <div
            key={b.id}
            className={
              i < blocks.length - 1 ? "print-page page-break" : "print-page"
            }
          >
            <PageRenderer
              block={b}
              branchProfile={kit.branchProfile}
              pageNumber={i + 1}
              totalPages={total}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
