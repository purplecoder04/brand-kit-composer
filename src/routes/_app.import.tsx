import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ClipboardPaste, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { pageTypeLabel, saveBuilderDraft } from "@/lib/builder-content";
import { parseImportedKitText } from "@/lib/kit-importer";

export const Route = createFileRoute("/_app/import")({
  head: () => ({ meta: [{ title: "Paste Content Importer | Kit Factory" }] }),
  component: ImportPage,
});

const SAMPLE_IMPORT = `Kit Title: Test Kit Erica
Subtitle: A simple workbook draft
Branch: Brand
Audience: Business owners
Tone: Clear and supportive
Tagline: Build the first clean version of your kit.

Section: Getting Started

Lesson: Know What You Are Building
Body: This lesson helps you define the product you are creating and the result it should help someone reach.

Workbook Prompt: What are you building first?

Checklist: Launch Checklist
- Review the kit
- Export the PDF
- Save the version

Table: Build Tracker
Headers: Task, Owner, Status
Row: Outline kit, Erica, Done
Row: Run QC, Erica, Next`;

function ImportPage() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const draft = useMemo(() => parseImportedKitText(rawText), [rawText]);
  const hasContent = rawText.trim().length > 0;

  const createDraft = () => {
    const saved = saveBuilderDraft(draft);
    if (saved.blocks.length === 0) {
      toast.message("Paste kit content before creating a builder draft");
      return;
    }
    toast.success("Builder draft created");
    navigate({ to: "/builder" });
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Level 8A Paste Content Importer
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Paste Content Importer
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Paste plain kit content and turn it into a Builder draft using the locked Brand Template V1
        block types.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(420px,0.9fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paste Kit Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              rows={24}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste kit title, lessons, workbook prompts, checklist items, and tables here."
              className="font-mono text-xs leading-5"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={createDraft}
                disabled={!hasContent}
                style={{ background: "#4F2D68", color: "#fff" }}
              >
                <ArrowRight className="mr-2 h-4 w-4" /> Create Builder Draft
              </Button>
              <Button type="button" variant="outline" onClick={() => setRawText(SAMPLE_IMPORT)}>
                <ClipboardPaste className="mr-2 h-4 w-4" /> Load Test Text
              </Button>
              <Button type="button" variant="outline" onClick={() => setRawText("")}>
                <RefreshCw className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parsed Kit Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              <Info label="Kit Name" value={draft.kitName} />
              <Info label="Subtitle" value={draft.subtitle} />
              <Info label="Branch" value={draft.branch} />
              <Info label="Audience" value={draft.audience} />
              <Info label="Tone" value={draft.tone} />
              <Info label="Tagline" value={draft.tagline} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Parsed Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {draft.blocks.length === 0 ? (
                <div
                  className="rounded-md border px-4 py-6 text-sm"
                  style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
                >
                  Paste content to preview blocks before sending them to Builder.
                </div>
              ) : (
                draft.blocks.map((block, index) => (
                  <div
                    key={block.id}
                    className="rounded-md border p-3"
                    style={{ borderColor: "#D8CEC2", background: "#fff" }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div
                          className="text-[10px] uppercase tracking-[0.18em]"
                          style={{ color: "#4F2D68" }}
                        >
                          #{index + 1} {pageTypeLabel(block.pageType)}
                        </div>
                        <div className="mt-1 font-semibold" style={{ color: "#222026" }}>
                          {block.title || "Untitled"}
                        </div>
                      </div>
                      <div className="text-xs" style={{ color: "#6b6470" }}>
                        {block.pageType === "table"
                          ? `${block.tableData.rows.length} row${block.tableData.rows.length === 1 ? "" : "s"}`
                          : block.pageType === "checklist"
                            ? `${block.body.split(/\r?\n/).filter(Boolean).length} item${
                                block.body.split(/\r?\n/).filter(Boolean).length === 1 ? "" : "s"
                              }`
                            : ""}
                      </div>
                    </div>
                    {block.body ? (
                      <p className="mt-2 line-clamp-3 text-sm" style={{ color: "#6b6470" }}>
                        {block.body}
                      </p>
                    ) : null}
                    {block.prompt ? (
                      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
                        Prompt: {block.prompt}
                      </p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        {label}
      </div>
      <div className="mt-1" style={{ color: value ? "#222026" : "#9a929d" }}>
        {value || "Blank"}
      </div>
    </div>
  );
}
