import { createFileRoute } from "@tanstack/react-router";
import { PageRenderer } from "@/components/PageRenderer";
import { PagePreview } from "@/components/PagePreview";
import { SAMPLE_KIT } from "@/lib/sample-kit";
import type { Block, PageType } from "@/lib/kit-types";

export const Route = createFileRoute("/_app/templates")({
  head: () => ({ meta: [{ title: "Template Preview | Kit Factory" }] }),
  component: TemplatesPage,
});

const TEMPLATE_LABELS: Partial<Record<PageType, string>> = {
  cover: "Cover Page",
  divider: "Section Divider Page",
  lesson: "Lesson Page",
  table: "Table Page",
  workbook: "Workbook Page",
};

function TemplatesPage() {
  const blocksByType: Partial<Record<PageType, Block | undefined>> = {
    cover: SAMPLE_KIT.blocks.find((b) => b.pageType === "cover"),
    divider: SAMPLE_KIT.blocks.find((b) => b.pageType === "divider"),
    lesson: SAMPLE_KIT.blocks.find((b) => b.pageType === "lesson"),
    table: SAMPLE_KIT.blocks.find((b) => b.pageType === "table"),
    workbook: SAMPLE_KIT.blocks.find((b) => b.pageType === "workbook"),
  };

  const order: PageType[] = ["cover", "divider", "lesson", "table", "workbook"];

  return (
    <div className="p-10">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Locked templates
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Template Preview
      </h1>
      <p className="mt-2 text-sm max-w-2xl" style={{ color: "#6b6470" }}>
        Every page in every kit flows through these five locked 8.5 x 11 templates. Content changes;
        the design does not.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {order.map((t) => {
          const block = blocksByType[t];
          if (!block) return null;
          return (
            <div key={t}>
              <div
                className="mb-3 text-[10px] uppercase tracking-[0.22em]"
                style={{ color: "#4F2D68" }}
              >
                {TEMPLATE_LABELS[t]}
              </div>
              <PagePreview scale={0.55}>
                <PageRenderer
                  block={block}
                  branchProfile={SAMPLE_KIT.branchProfile}
                  pageNumber={1}
                  totalPages={1}
                />
              </PagePreview>
            </div>
          );
        })}
      </div>
    </div>
  );
}
