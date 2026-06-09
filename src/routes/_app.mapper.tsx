import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Eraser, Printer, RefreshCw, RotateCcw, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PagePreview } from "@/components/PagePreview";
import { PageRenderer } from "@/components/PageRenderer";
import { useKitStore } from "@/lib/kit-store";
import {
  EMPTY_MAPPER_CONTENT,
  SAMPLE_MAPPER_CONTENT,
  buildBlocksFromMapper,
  getOverflowWarnings,
  loadMapperDraft,
  saveMapperDraft,
  type MapperDraftSource,
  type MapperContent,
  type OverflowWarning,
} from "@/lib/mapper-content";
import { BRAND_PROFILE } from "@/lib/branch-profile";

export const Route = createFileRoute("/_app/mapper")({
  head: () => ({ meta: [{ title: "Kit Content Mapper | Kit Factory" }] }),
  component: MapperPage,
});

function MapperPage() {
  const { upsertMapperKit } = useKitStore();
  const initialDraft = useMemo(() => loadMapperDraft(), []);
  const [content, setContent] = useState<MapperContent>(
    () => initialDraft?.content ?? SAMPLE_MAPPER_CONTENT,
  );
  const [lastSaved, setLastSaved] = useState<string | null>(
    initialDraft?.lastSaved ?? null,
  );
  const [source, setSource] = useState<MapperDraftSource>(
    initialDraft?.source ?? "current",
  );
  const [dirty, setDirty] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const blocks = useMemo(() => buildBlocksFromMapper(content), [content, refreshKey]);
  const warnings = useMemo(() => getOverflowWarnings(content), [content]);
  const warningsByScope = useMemo(() => groupByScope(warnings), [warnings]);

  const patch = (p: Partial<MapperContent>) => {
    setContent((c) => ({ ...c, ...p }));
    setDirty(true);
    if (source === "sample") setSource("current");
  };

  const persist = (next: MapperContent, nextSource: MapperDraftSource = "current") => {
    const draft = saveMapperDraft(next, nextSource);
    upsertMapperKit(next);
    setLastSaved(draft.lastSaved);
    setSource(nextSource);
    setDirty(false);
  };

  const onSaveDraft = () => {
    persist(content, source === "sample" ? "sample" : "current");
    toast.success("Draft saved");
  };

  const onGenerate = () => {
    persist(content, source);
    setRefreshKey((k) => k + 1);
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success("Preview generated");
  };

  const onPrint = () => {
    if (typeof window === "undefined") return;
    const printSource = source === "sample" && dirty ? "current" : source;
    persist(content, printSource);
    window.requestAnimationFrame(() => window.print());
  };

  const onReset = () => {
    setContent(SAMPLE_MAPPER_CONTENT);
    persist(SAMPLE_MAPPER_CONTENT, "sample");
    toast.message("Reset to sample content");
  };
  const onClear = () => {
    setContent(EMPTY_MAPPER_CONTENT);
    setDirty(true);
    setSource("current");
  };

  return (
    <>
    <div className="screen-only p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Phase 2 · Content Mapping System
      </div>
      <h1
        className="mt-1 text-4xl"
        style={{ fontFamily: "var(--font-display)", color: "#222026" }}
      >
        Kit Content Mapper
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Edit content on the left; it flows into the locked Brand Template V1 pages on the right.
        Page count is fixed at 5. Print uses the existing PDF-safe pipeline.
      </p>

      <div className="sticky top-0 z-20 -mx-8 mt-6 mb-4 flex flex-wrap items-center gap-2 border-y px-8 py-3"
        style={{ background: "#FAF6F0", borderColor: "#D8CEC2" }}
      >
        <Button onClick={onGenerate} style={{ background: "#4F2D68", color: "#fff" }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Generate Preview
        </Button>
        <Button onClick={onSaveDraft} variant="outline">
          <Save className="mr-2 h-4 w-4" /> Save Draft
        </Button>
        <Button onClick={onPrint} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
        </Button>
        <Button onClick={onReset} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset to Sample Content
        </Button>
        <Button onClick={onClear} variant="outline">
          <Eraser className="mr-2 h-4 w-4" /> Clear All
        </Button>
        {warnings.length > 0 ? (
          <span className="ml-auto inline-flex items-center gap-2 text-xs" style={{ color: "#7a4a00" }}>
            <AlertTriangle className="h-4 w-4" /> {warnings.length} warning{warnings.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div
        className="mb-6 grid grid-cols-1 gap-2 rounded-md border px-4 py-3 text-xs sm:grid-cols-3"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#4F2D68" }}
      >
        <div>
          <span className="uppercase tracking-wider opacity-70">Current Kit Name: </span>
          <span style={{ color: "#222026" }}>{content.kitName || "—"}</span>
        </div>
        <div>
          <span className="uppercase tracking-wider opacity-70">Last Saved: </span>
          <span style={{ color: "#222026" }}>
            {lastSaved ? new Date(lastSaved).toLocaleString() : "Not saved yet"}
            {dirty && lastSaved ? " (unsaved changes)" : ""}
          </span>
        </div>
        <div>
          <span className="uppercase tracking-wider opacity-70">Preview Source: </span>
          <span style={{ color: "#222026" }}>
            {source === "sample" ? "Sample Content" : "Current Kit"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* FORM */}
        <div className="space-y-6">
          <SectionCard title="Kit Info">
            <Field label="Kit Name">
              <Input value={content.kitName} onChange={(e) => patch({ kitName: e.target.value })} />
            </Field>
            <Field label="Subtitle">
              <Input value={content.kitSubtitle} onChange={(e) => patch({ kitSubtitle: e.target.value })} />
            </Field>
            <Field label="Branch">
              <Input value={content.branch} disabled readOnly />
            </Field>
            <Field label="Audience">
              <Input value={content.audience} onChange={(e) => patch({ audience: e.target.value })} />
            </Field>
            <Field label="Tone">
              <Input value={content.tone} onChange={(e) => patch({ tone: e.target.value })} />
            </Field>
            <Field label="Kit Tagline">
              <Textarea
                rows={2}
                value={content.kitTagline}
                onChange={(e) => patch({ kitTagline: e.target.value })}
              />
            </Field>
          </SectionCard>

          <SectionCard title="Cover Content" warnings={warningsByScope.cover}>
            <Field label="Cover Title">
              <Input value={content.coverTitle} onChange={(e) => patch({ coverTitle: e.target.value })} />
            </Field>
            <Field label="Cover Subtitle">
              <Input
                value={content.coverSubtitle}
                onChange={(e) => patch({ coverSubtitle: e.target.value })}
              />
            </Field>
            <Field
              label="Cover Keywords"
              hint='Comma- or • separated. Example: Structure, Legitimacy, Foundation. Leave blank to use the default pillars.'
            >
              <Input
                value={content.coverKeywords}
                onChange={(e) => patch({ coverKeywords: e.target.value })}
                placeholder="Structure, Legitimacy, Foundation"
              />
            </Field>
          </SectionCard>

          <SectionCard title="Section Content" warnings={warningsByScope.section}>
            <Field label="Section Label">
              <Input value={content.sectionLabel} onChange={(e) => patch({ sectionLabel: e.target.value })} />
            </Field>
            <Field label="Section Title">
              <Input value={content.sectionTitle} onChange={(e) => patch({ sectionTitle: e.target.value })} />
            </Field>
          </SectionCard>

          <SectionCard title="Lesson Content" warnings={warningsByScope.lesson}>
            <Field label="Lesson Label">
              <Input value={content.lessonLabel} onChange={(e) => patch({ lessonLabel: e.target.value })} />
            </Field>
            <Field label="Lesson Title">
              <Input value={content.lessonTitle} onChange={(e) => patch({ lessonTitle: e.target.value })} />
            </Field>
            <Field label="Lesson Body" hint="Separate paragraphs with a blank line.">
              <Textarea
                rows={10}
                value={content.lessonBody}
                onChange={(e) => patch({ lessonBody: e.target.value })}
              />
              <div className="mt-1 text-xs" style={{ color: "#6b6470" }}>
                {content.lessonBody.length} chars
              </div>
            </Field>
          </SectionCard>

          <SectionCard title="Table / Tracker Content" warnings={warningsByScope.table}>
            <Field label="Table Title">
              <Input value={content.tableTitle} onChange={(e) => patch({ tableTitle: e.target.value })} />
            </Field>
            <Field label="Table Subtitle">
              <Input value={content.tableSubtitle} onChange={(e) => patch({ tableSubtitle: e.target.value })} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              {(["Column 1 Header", "Column 2 Header", "Column 3 Header"] as const).map((lbl, i) => (
                <Field key={lbl} label={lbl}>
                  <Input
                    value={content.tableHeaders[i]}
                    onChange={(e) => {
                      const headers = [...content.tableHeaders] as [string, string, string];
                      headers[i] = e.target.value;
                      patch({ tableHeaders: headers });
                    }}
                  />
                </Field>
              ))}
            </div>

            <Label className="mt-3 block text-xs uppercase tracking-wide" style={{ color: "#4F2D68" }}>
              Row entries
            </Label>
            <div className="space-y-2">
              {content.tableRows.map((row, ri) => (
                <div key={ri} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                  {row.map((cell, ci) => (
                    <Input
                      key={ci}
                      value={cell}
                      onChange={(e) => {
                        const rows = content.tableRows.map((r) => [...r] as [string, string, string]);
                        rows[ri][ci] = e.target.value;
                        patch({ tableRows: rows });
                      }}
                      placeholder={`Row ${ri + 1} · Col ${ci + 1}`}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove row"
                    onClick={() => {
                      const rows = content.tableRows.filter((_, i) => i !== ri);
                      patch({ tableRows: rows.length ? rows : [["", "", ""]] });
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => patch({ tableRows: [...content.tableRows, ["", "", ""]] })}
              >
                <Plus className="mr-1 h-3 w-3" /> Add Row
              </Button>
            </div>
          </SectionCard>

          <SectionCard title="Workbook Content" warnings={warningsByScope.workbook}>
            <Field label="Workbook Label">
              <Input value={content.workbookLabel} onChange={(e) => patch({ workbookLabel: e.target.value })} />
            </Field>
            <Field label="Workbook Title">
              <Input value={content.workbookTitle} onChange={(e) => patch({ workbookTitle: e.target.value })} />
            </Field>
            <Field label="Workbook Prompt">
              <Textarea
                rows={4}
                value={content.workbookPrompt}
                onChange={(e) => patch({ workbookPrompt: e.target.value })}
              />
            </Field>
            <Field label="Number of Writing Lines (4–20)">
              <Input
                type="number"
                min={4}
                max={20}
                value={content.workbookLines}
                onChange={(e) =>
                  patch({ workbookLines: Number.parseInt(e.target.value || "0", 10) || 0 })
                }
              />
            </Field>
          </SectionCard>
        </div>

        {/* PREVIEW */}
        <div ref={previewRef} className="space-y-6">
          {warnings.length > 0 ? (
            <Alert style={{ borderColor: "#E0B040", background: "#FFF8E1" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#7a4a00" }} />
              <AlertTitle style={{ color: "#7a4a00" }}>Possible overflow</AlertTitle>
              <AlertDescription>
                <ul className="mt-1 list-disc pl-5 text-sm">
                  {warnings.map((w, i) => (
                    <li key={i}>
                      <span className="font-medium uppercase tracking-wider text-xs mr-2">{w.scope}</span>
                      {w.message}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          ) : null}

          {blocks.map((b, i) => (
            <div key={b.id}>
              <div
                className="mb-2 text-[10px] uppercase tracking-[0.28em]"
                style={{ color: "#4F2D68" }}
              >
                Page {i + 1} of {blocks.length} · {b.pageType}
              </div>
              <PagePreview scale={0.55}>
                <PageRenderer
                  block={b}
                  branchProfile={BRAND_PROFILE}
                  pageNumber={i + 1}
                  totalPages={blocks.length}
                />
              </PagePreview>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="print-stack" style={{ display: "none" }}>
      <div className="print-stack-inner">
        {blocks.map((b, i) => (
          <div
            key={b.id}
            className={i < blocks.length - 1 ? "print-page page-break" : "print-page"}
          >
            <PageRenderer
              block={b}
              branchProfile={BRAND_PROFILE}
              pageNumber={i + 1}
              totalPages={blocks.length}
            />
          </div>
        ))}
      </div>
    </div>
    </>
  );
}

function SectionCard({
  title,
  warnings,
  children,
}: {
  title: string;
  warnings?: OverflowWarning[];
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {warnings && warnings.length > 0 ? (
          <div
            className="rounded-md border px-3 py-2 text-xs"
            style={{ borderColor: "#E0B040", background: "#FFF8E1", color: "#7a4a00" }}
          >
            {warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3 w-3" />
                <span>{w.message}</span>
              </div>
            ))}
          </div>
        ) : null}
        {children}
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide" style={{ color: "#4F2D68" }}>
        {label}
      </Label>
      {children}
      {hint ? (
        <div className="text-xs" style={{ color: "#6b6470" }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function groupByScope(warnings: OverflowWarning[]) {
  const out: Record<OverflowWarning["scope"], OverflowWarning[]> = {
    cover: [],
    section: [],
    lesson: [],
    table: [],
    workbook: [],
  };
  for (const w of warnings) out[w.scope].push(w);
  return out;
}
