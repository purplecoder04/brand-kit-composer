import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ClipboardPaste, FileText, RefreshCw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BUILDER_BLOCK_TYPES,
  normalizeDraft,
  pageTypeLabel,
  saveBuilderDraft,
  type BuilderBlock,
  type BuilderDraft,
} from "@/lib/builder-content";
import { detectImportedKitText, getImportWarnings } from "@/lib/kit-importer";
import type { PageType } from "@/lib/kit-types";

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

Module 1: Getting Started

Lesson One - Know What You Are Building
This lesson helps you define the product you are creating and the result it should help someone reach.

Worksheet: First Build
What are you building first?

Checklist: Launch Checklist
- Review the kit
- Export the PDF
- Save the version

Tracker: Build Tracker
Headers: Task, Owner, Status
Row: Outline kit, Erica, Done
Row: Run QC, Erica, Next`;

function ImportPage() {
  const navigate = useNavigate();
  const [rawText, setRawText] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const detected = useMemo(() => detectImportedKitText(rawText), [rawText]);
  const [reviewDraft, setReviewDraft] = useState<BuilderDraft>(detected.draft);
  const warnings = useMemo(() => getImportWarnings(reviewDraft), [reviewDraft]);
  const hasContent = rawText.trim().length > 0;

  useEffect(() => {
    setReviewDraft(detected.draft);
  }, [detected.draft]);

  const updateDraft = (patch: Partial<BuilderDraft>) => {
    setReviewDraft((current) => normalizeDraft({ ...current, ...patch, source: "current" }));
  };

  const updateBlock = (blockId: string, patch: Partial<BuilderBlock>) => {
    setReviewDraft((current) =>
      normalizeDraft({
        ...current,
        source: "current",
        blocks: current.blocks.map((block) =>
          block.id === blockId ? { ...block, ...patch } : block,
        ),
      }),
    );
  };

  const deleteBlock = (blockId: string) => {
    setReviewDraft((current) =>
      normalizeDraft({
        ...current,
        blocks: current.blocks.filter((block) => block.id !== blockId),
        selectedBlockId: current.selectedBlockId === blockId ? null : current.selectedBlockId,
      }),
    );
  };

  const createDraft = () => {
    const saved = saveBuilderDraft(reviewDraft);
    if (saved.blocks.length === 0) {
      toast.message("Paste kit content before creating a builder draft");
      return;
    }
    toast.success("Builder draft created");
    navigate({ to: "/builder", search: { draftReload: Date.now() } });
  };

  const loadUploadedFile = async (file: File | undefined) => {
    if (!file) return;

    const extension = file.name.split(".").pop()?.toLowerCase();
    const isAllowedType =
      extension === "txt" ||
      extension === "md" ||
      file.type === "text/plain" ||
      file.type === "text/markdown";

    if (!isAllowedType) {
      toast.error("Upload a .txt or .md file for Level 9A");
      return;
    }

    try {
      const text = await file.text();
      setRawText(text);
      setUploadedFileName(file.name);
      toast.success("File loaded into importer");
    } catch {
      toast.error("Could not read that file");
    }
  };

  return (
    <div className="p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Level 9A Text File Import
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Paste Content Importer
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Upload a .txt or .md file, or paste rough kit content, then review the detected blocks
        before sending the cleaned draft to Builder.
      </p>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(420px,0.8fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Import Kit Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border p-3" style={{ borderColor: "#D8CEC2" }}>
              <Label
                htmlFor="kit-file-upload"
                className="text-[10px] uppercase tracking-[0.18em]"
                style={{ color: "#4F2D68" }}
              >
                Upload .txt or .md
              </Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Input
                  id="kit-file-upload"
                  type="file"
                  accept=".txt,.md,text/plain,text/markdown"
                  onChange={(event) => loadUploadedFile(event.target.files?.[0])}
                />
                {uploadedFileName ? (
                  <div className="flex items-center text-xs" style={{ color: "#6b6470" }}>
                    <FileText className="mr-1 h-3.5 w-3.5" /> {uploadedFileName}
                  </div>
                ) : null}
              </div>
            </div>
            <Textarea
              rows={24}
              value={rawText}
              onChange={(event) => setRawText(event.target.value)}
              placeholder="Paste kit title, modules, lessons, worksheets, prompts, checklists, and trackers here."
              className="font-mono text-xs leading-5"
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={createDraft}
                disabled={!hasContent || reviewDraft.blocks.length === 0}
                style={{ background: "#4F2D68", color: "#fff" }}
              >
                <ArrowRight className="mr-2 h-4 w-4" /> Create Builder Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRawText(SAMPLE_IMPORT);
                  setUploadedFileName("");
                }}
              >
                <ClipboardPaste className="mr-2 h-4 w-4" /> Load Test Text
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setRawText("");
                  setUploadedFileName("");
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Kit Info</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <TextField
                label="Kit Name"
                value={reviewDraft.kitName}
                onChange={(kitName) => updateDraft({ kitName })}
              />
              <TextField
                label="Subtitle"
                value={reviewDraft.subtitle}
                onChange={(subtitle) => updateDraft({ subtitle })}
              />
              <TextField
                label="Branch"
                value={reviewDraft.branch}
                onChange={(branch) => updateDraft({ branch })}
              />
              <TextField
                label="Audience"
                value={reviewDraft.audience}
                onChange={(audience) => updateDraft({ audience })}
              />
              <TextField
                label="Tone"
                value={reviewDraft.tone}
                onChange={(tone) => updateDraft({ tone })}
              />
              <TextField
                label="Tagline"
                value={reviewDraft.tagline}
                onChange={(tagline) => updateDraft({ tagline })}
              />
            </CardContent>
          </Card>

          {warnings.length > 0 ? (
            <Alert>
              <AlertTitle>Review before sending to Builder</AlertTitle>
              <AlertDescription>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {warnings.slice(0, 6).map((warning, index) => (
                    <li key={`${warning.blockId ?? "kit"}-${index}`}>{warning.message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Review Detected Blocks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reviewDraft.blocks.length === 0 ? (
                <div
                  className="rounded-md border px-4 py-6 text-sm"
                  style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
                >
                  Paste content to preview blocks before sending them to Builder.
                </div>
              ) : (
                reviewDraft.blocks.map((block, index) => (
                  <BlockReviewCard
                    key={block.id}
                    block={block}
                    index={index}
                    onChange={(patch) => updateBlock(block.id, patch)}
                    onDelete={() => deleteBlock(block.id)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        {label}
      </Label>
      <Input value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function BlockReviewCard({
  block,
  index,
  onChange,
  onDelete,
}: {
  block: BuilderBlock;
  index: number;
  onChange: (patch: Partial<BuilderBlock>) => void;
  onDelete: () => void;
}) {
  const tableHeaders = block.tableData.headers.join(", ");
  const tableRows = block.tableData.rows.map((row) => row.join(", ")).join("\n");

  return (
    <div className="rounded-md border p-4" style={{ borderColor: "#D8CEC2", background: "#fff" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
            #{index + 1} {pageTypeLabel(block.pageType)}
          </div>
          <div className="mt-1 text-sm" style={{ color: "#6b6470" }}>
            Adjust the detected type and fields before creating the Builder draft.
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[180px_minmax(0,1fr)]">
        <div className="space-y-1">
          <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
            Block Type
          </Label>
          <select
            value={block.pageType}
            onChange={(event) => onChange({ pageType: event.target.value as PageType })}
            className="h-10 w-full rounded-md border bg-white px-3 text-sm"
            style={{ borderColor: "#D8CEC2" }}
          >
            {BUILDER_BLOCK_TYPES.map((type) => (
              <option key={type.type} value={type.type}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Title" value={block.title} onChange={(title) => onChange({ title })} />
      </div>

      <div className="mt-3">
        <TextField
          label="Subtitle / Label"
          value={block.subtitle}
          onChange={(subtitle) => onChange({ subtitle })}
        />
      </div>

      {block.pageType === "table" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <TextAreaField
            label="Column Headers"
            value={tableHeaders}
            rows={3}
            onChange={(value) =>
              onChange({ tableData: { ...block.tableData, headers: normalizeCsvLine(value) } })
            }
          />
          <TextAreaField
            label="Rows"
            value={tableRows}
            rows={6}
            onChange={(value) =>
              onChange({ tableData: { ...block.tableData, rows: parseCsvRows(value) } })
            }
          />
        </div>
      ) : block.pageType === "workbook" || block.pageType === "notes" ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_140px]">
          <TextAreaField
            label={block.pageType === "notes" ? "Prompt" : "Workbook Prompt"}
            value={block.prompt}
            rows={5}
            onChange={(prompt) => onChange({ prompt })}
          />
          <div className="space-y-1">
            <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
              Writing Lines
            </Label>
            <Input
              type="number"
              min={0}
              max={20}
              value={block.lines}
              onChange={(event) => onChange({ lines: Number(event.target.value) || "" })}
            />
          </div>
        </div>
      ) : (
        <TextAreaField
          label={block.pageType === "checklist" ? "Checklist Items" : "Body Text"}
          value={block.body}
          rows={5}
          onChange={(body) => onChange({ body })}
        />
      )}
    </div>
  );
}

function TextAreaField({
  label,
  value,
  rows,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        {label}
      </Label>
      <Textarea rows={rows} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function normalizeCsvLine(value: string): string[] {
  const cells = value
    .split(value.includes("|") ? "|" : ",")
    .map((cell) => cell.trim())
    .filter(Boolean)
    .slice(0, 3);
  while (cells.length < 3) cells.push("");
  return cells;
}

function parseCsvRows(value: string): string[][] {
  const rows = value
    .split(/\r?\n/)
    .map((row) => normalizeCsvLine(row))
    .filter((row) => row.some((cell) => cell.trim()));

  return rows.length > 0 ? rows : [["", "", ""]];
}
