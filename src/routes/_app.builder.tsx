import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Copy,
  Eraser,
  Library,
  Plus,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PagePreview } from "@/components/PagePreview";
import { PageRenderer } from "@/components/PageRenderer";
import { createVersionLibraryRecord } from "@/lib/api/version-library.functions";
import {
  BUILDER_BLOCK_TYPES,
  RESERVED_BUILDER_KIT_ID,
  buildBuilderKit,
  createBlankBuilderDraft,
  createBuilderBlock,
  createSampleBuilderDraft,
  duplicateBuilderBlock,
  getBuilderWarnings,
  loadBuilderDraft,
  normalizeDraft,
  pageTypeLabel,
  saveBuilderDraft,
  type BuilderBlock,
  type BuilderDraft,
  type BuilderDraftSource,
  type BuilderWarning,
} from "@/lib/builder-content";
import {
  createVersionFromDraft,
  loadVersionLibrary,
  saveVersionLibrary,
} from "@/lib/version-library";
import type { PageType } from "@/lib/kit-types";

const searchSchema = z.object({
  draftReload: z.coerce.number().optional(),
  kitId: z.string().optional(),
});

export const Route = createFileRoute("/_app/builder")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Multi-Page Kit Builder | Kit Factory" }] }),
  component: BuilderPage,
});

function BuilderPage() {
  const navigate = useNavigate();
  const { draftReload } = Route.useSearch();
  const initialDraft = useMemo(() => loadBuilderDraft(), []);
  const [draft, setDraft] = useState<BuilderDraft>(() => initialDraft ?? createBlankBuilderDraft());
  const [dirty, setDirty] = useState(false);
  const [savingVersion, setSavingVersion] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!draftReload) return;

    const reloadedDraft = loadBuilderDraft();
    if (!reloadedDraft) return;

    setDraft(reloadedDraft);
    setDirty(false);
  }, [draftReload]);

  const normalizedDraft = useMemo(() => normalizeDraft(draft), [draft]);
  const kit = useMemo(() => buildBuilderKit(normalizedDraft), [normalizedDraft]);
  const warnings = useMemo(() => getBuilderWarnings(normalizedDraft), [normalizedDraft]);
  const selectedBlock =
    normalizedDraft.blocks.find((block) => block.id === normalizedDraft.selectedBlockId) ??
    normalizedDraft.blocks[0] ??
    null;

  const commitDraft = (
    updater: BuilderDraft | ((current: BuilderDraft) => BuilderDraft),
    source: BuilderDraftSource = "current",
  ) => {
    setDraft((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;
      return normalizeDraft({ ...next, source });
    });
    setDirty(true);
  };

  const persist = (nextDraft = normalizedDraft) => {
    const saved = saveBuilderDraft(nextDraft);
    setDraft(saved);
    setDirty(false);
    return saved;
  };

  const updateDraftInfo = (patch: Partial<BuilderDraft>) => {
    commitDraft((current) => ({ ...current, ...patch }));
  };

  const updateBlock = (blockId: string, patch: Partial<BuilderBlock>) => {
    commitDraft((current) => ({
      ...current,
      selectedBlockId: blockId,
      blocks: current.blocks.map((block) =>
        block.id === blockId ? { ...block, ...patch } : block,
      ),
    }));
  };

  const addBlock = (pageType: PageType) => {
    commitDraft((current) => {
      const block = createBuilderBlock(pageType, current.blocks.length + 1);
      return {
        ...current,
        selectedBlockId: block.id,
        blocks: [...current.blocks, block],
      };
    });
  };

  const duplicateBlock = (blockId: string) => {
    commitDraft((current) => {
      const index = current.blocks.findIndex((block) => block.id === blockId);
      if (index < 0) return current;
      const copy = duplicateBuilderBlock(current.blocks[index], index + 2);
      const blocks = [
        ...current.blocks.slice(0, index + 1),
        copy,
        ...current.blocks.slice(index + 1),
      ].map((block, order) => ({ ...block, order: order + 1 }));
      return { ...current, selectedBlockId: copy.id, blocks };
    });
  };

  const deleteBlock = (blockId: string) => {
    commitDraft((current) => {
      const blocks = current.blocks
        .filter((block) => block.id !== blockId)
        .map((block, order) => ({ ...block, order: order + 1 }));
      return {
        ...current,
        selectedBlockId: blocks[0]?.id ?? null,
        blocks,
      };
    });
  };

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    commitDraft((current) => {
      const blocks = current.blocks.slice().sort((a, b) => a.order - b.order);
      const index = blocks.findIndex((block) => block.id === blockId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return current;
      const [block] = blocks.splice(index, 1);
      blocks.splice(nextIndex, 0, block);
      return {
        ...current,
        selectedBlockId: blockId,
        blocks: blocks.map((item, order) => ({ ...item, order: order + 1 })),
      };
    });
  };

  const saveDraft = () => {
    persist();
    toast.success("Level 3B draft saved");
  };

  const saveToVersionLibrary = async () => {
    if (savingVersion) return;
    setSavingVersion(true);
    const savedDraft = persist();
    const records = loadVersionLibrary();
    try {
      const result = await createVersionLibraryRecord({ data: { draft: savedDraft } });
      if (result.ok) {
        saveVersionLibrary([result.data.record, ...records]);
        toast.success("Saved to Version Library");
        return;
      }
    } catch {
      // Fall back to local version storage below.
    } finally {
      setSavingVersion(false);
    }

    const version = createVersionFromDraft(records, savedDraft);
    saveVersionLibrary([version, ...records]);
    toast.success("Saved to Version Library locally");
  };

  const generatePreview = () => {
    persist();
    previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    toast.success("Builder preview generated");
  };

  const printDraft = () => {
    persist();
    navigate({
      to: "/print-preview",
      search: { kitId: RESERVED_BUILDER_KIT_ID },
    });
  };

  const resetToSample = () => {
    const sample = saveBuilderDraft(createSampleBuilderDraft());
    setDraft(sample);
    setDirty(false);
    toast.message("Reset to sample content");
  };

  const clearAll = () => {
    const blank = saveBuilderDraft(createBlankBuilderDraft());
    setDraft(blank);
    setDirty(false);
    toast.message("Cleared Level 3B builder");
  };

  return (
    <div className="screen-only p-8">
      <div className="text-[10px] uppercase tracking-[0.28em]" style={{ color: "#4F2D68" }}>
        Level 3B · Local Multi-Page Kit Builder
      </div>
      <h1 className="mt-1 text-4xl" style={{ fontFamily: "var(--font-display)", color: "#222026" }}>
        Multi-Page Kit Builder
      </h1>
      <p className="mt-2 text-sm" style={{ color: "#6b6470" }}>
        Build multiple ordered content blocks using the locked Brand Template V1 pages.
      </p>

      <div
        className="sticky top-0 z-20 -mx-8 mt-6 mb-4 flex flex-wrap items-center gap-2 border-y px-8 py-3"
        style={{ background: "#FAF6F0", borderColor: "#D8CEC2" }}
      >
        <Button onClick={generatePreview} style={{ background: "#4F2D68", color: "#fff" }}>
          <RefreshCw className="mr-2 h-4 w-4" /> Generate Preview
        </Button>
        <Button onClick={saveDraft} variant="outline">
          <Save className="mr-2 h-4 w-4" /> Save Draft
        </Button>
        <Button onClick={saveToVersionLibrary} variant="outline" disabled={savingVersion}>
          <Library className="mr-2 h-4 w-4" /> Save to Version Library
        </Button>
        <Button onClick={printDraft} variant="outline">
          <Printer className="mr-2 h-4 w-4" /> Print / Save as PDF
        </Button>
        <Button onClick={resetToSample} variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset to Sample Content
        </Button>
        <Button onClick={clearAll} variant="outline">
          <Eraser className="mr-2 h-4 w-4" /> Clear All
        </Button>
        {warnings.length > 0 ? (
          <span
            className="ml-auto inline-flex items-center gap-2 text-xs"
            style={{ color: "#7a4a00" }}
          >
            <AlertTriangle className="h-4 w-4" /> {warnings.length} warning
            {warnings.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </div>

      <div
        className="mb-6 grid grid-cols-1 gap-2 rounded-md border px-4 py-3 text-xs lg:grid-cols-4"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#4F2D68" }}
      >
        <StatusItem label="Current Kit Name" value={normalizedDraft.kitName} />
        <StatusItem
          label="Last Saved"
          value={
            normalizedDraft.lastSaved
              ? `${new Date(normalizedDraft.lastSaved).toLocaleString()}${dirty ? " (unsaved changes)" : ""}`
              : "Not saved yet"
          }
        />
        <StatusItem
          label="Preview Source"
          value={
            normalizedDraft.source === "sample"
              ? "Sample Content"
              : normalizedDraft.source === "blank"
                ? "Blank / New Draft"
                : "Current Kit"
          }
        />
        <StatusItem label="Pages" value={`${kit.blocks.length}`} />
      </div>

      {warnings.length > 0 ? (
        <Alert className="mb-6" style={{ borderColor: "#E0B040", background: "#FFF8E1" }}>
          <AlertTriangle className="h-4 w-4" style={{ color: "#7a4a00" }} />
          <AlertTitle style={{ color: "#7a4a00" }}>Builder warnings</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc pl-5 text-sm">
              {warnings.map((warning, index) => (
                <li key={`${warning.blockId ?? "kit"}-${index}`}>
                  <span className="mr-2 text-xs font-medium uppercase tracking-wider">
                    {warning.scope}
                  </span>
                  {warning.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_minmax(420px,0.9fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <KitInfoCard draft={normalizedDraft} onChange={updateDraftInfo} />
          <BlockListCard
            blocks={normalizedDraft.blocks}
            selectedBlockId={selectedBlock?.id ?? null}
            warnings={warnings}
            onSelect={(id) => updateDraftInfo({ selectedBlockId: id })}
            onAdd={addBlock}
            onDuplicate={duplicateBlock}
            onDelete={deleteBlock}
            onMove={moveBlock}
          />
        </div>

        <CurrentBlockEditor
          block={selectedBlock}
          onAdd={addBlock}
          onChange={updateBlock}
          onDuplicate={duplicateBlock}
          onDelete={deleteBlock}
          onMove={moveBlock}
        />

        <div ref={previewRef} className="space-y-6">
          {kit.blocks.length === 0 ? (
            <div
              className="rounded-md border px-4 py-6 text-sm"
              style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
            >
              Add a block to begin the Level 3B preview.
            </div>
          ) : (
            kit.blocks.map((block, index) => (
              <div key={block.id}>
                <div
                  className="mb-2 text-[10px] uppercase tracking-[0.28em]"
                  style={{ color: "#4F2D68" }}
                >
                  Page {index + 1} of {kit.blocks.length} · {pageTypeLabel(block.pageType)}
                </div>
                <PagePreview scale={0.5}>
                  <PageRenderer
                    block={block}
                    branchProfile={kit.branchProfile}
                    pageNumber={index + 1}
                    totalPages={kit.blocks.length}
                  />
                </PagePreview>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatusItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="uppercase tracking-wider opacity-70">{label}: </span>
      <span style={{ color: "#222026" }}>{value || "—"}</span>
    </div>
  );
}

function KitInfoCard({
  draft,
  onChange,
}: {
  draft: BuilderDraft;
  onChange: (patch: Partial<BuilderDraft>) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Kit Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Kit Name">
          <Input
            value={draft.kitName}
            onChange={(event) => onChange({ kitName: event.target.value })}
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={draft.subtitle}
            onChange={(event) => onChange({ subtitle: event.target.value })}
          />
        </Field>
        <Field label="Branch">
          <Input
            value={draft.branch}
            onChange={(event) => onChange({ branch: event.target.value })}
          />
        </Field>
        <Field label="Audience">
          <Input
            value={draft.audience}
            onChange={(event) => onChange({ audience: event.target.value })}
          />
        </Field>
        <Field label="Tone">
          <Input value={draft.tone} onChange={(event) => onChange({ tone: event.target.value })} />
        </Field>
        <Field label="Tagline">
          <Textarea
            rows={2}
            value={draft.tagline}
            onChange={(event) => onChange({ tagline: event.target.value })}
          />
        </Field>
      </CardContent>
    </Card>
  );
}

function BlockListCard({
  blocks,
  selectedBlockId,
  warnings,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onMove,
}: {
  blocks: BuilderBlock[];
  selectedBlockId: string | null;
  warnings: BuilderWarning[];
  onSelect: (id: string) => void;
  onAdd: (type: PageType) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const warningsByBlock = new Map<string, number>();
  for (const warning of warnings) {
    if (!warning.blockId) continue;
    warningsByBlock.set(warning.blockId, (warningsByBlock.get(warning.blockId) ?? 0) + 1);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Blocks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {BUILDER_BLOCK_TYPES.map((item) => (
            <Button
              key={item.type}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAdd(item.type)}
            >
              <Plus className="mr-1 h-3 w-3" /> {item.label}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          {blocks.length === 0 ? (
            <div
              className="rounded-md border px-3 py-4 text-sm"
              style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
            >
              No blocks yet.
            </div>
          ) : (
            blocks.map((block, index) => {
              const selected = block.id === selectedBlockId;
              const warningCount = warningsByBlock.get(block.id) ?? 0;
              return (
                <div
                  key={block.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(block.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(block.id);
                    }
                  }}
                  className="w-full rounded-md border px-3 py-2 text-left text-sm"
                  style={{
                    borderColor: selected ? "#4F2D68" : "#D8CEC2",
                    background: selected ? "#F4EFE6" : "#fff",
                    color: "#222026",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] uppercase tracking-[0.18em]"
                      style={{ color: "#4F2D68" }}
                    >
                      #{index + 1}
                    </span>
                    <span className="font-medium">
                      {block.title || pageTypeLabel(block.pageType)}
                    </span>
                    {warningCount > 0 ? (
                      <span className="ml-auto text-[10px]" style={{ color: "#7a4a00" }}>
                        {warningCount} warning{warningCount === 1 ? "" : "s"}
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="mt-1 flex items-center gap-1 text-xs"
                    style={{ color: "#6b6470" }}
                  >
                    <span>{pageTypeLabel(block.pageType)}</span>
                    <span>·</span>
                    <IconButton
                      label="Move up"
                      onClick={(event) => {
                        event.stopPropagation();
                        onMove(block.id, -1);
                      }}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </IconButton>
                    <IconButton
                      label="Move down"
                      onClick={(event) => {
                        event.stopPropagation();
                        onMove(block.id, 1);
                      }}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </IconButton>
                    <IconButton
                      label="Duplicate"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDuplicate(block.id);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </IconButton>
                    <IconButton
                      label="Delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDelete(block.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </IconButton>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CurrentBlockEditor({
  block,
  onAdd,
  onChange,
  onDuplicate,
  onDelete,
  onMove,
}: {
  block: BuilderBlock | null;
  onAdd: (type: PageType) => void;
  onChange: (blockId: string, patch: Partial<BuilderBlock>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  if (!block) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Block</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm" style={{ color: "#6b6470" }}>
            Add a block to start building your kit.
          </div>
          <div className="flex flex-wrap gap-2">
            {BUILDER_BLOCK_TYPES.map((item) => (
              <Button
                key={item.type}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAdd(item.type)}
              >
                <Plus className="mr-1 h-3 w-3" /> {item.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Current Block</CardTitle>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move block up"
              onClick={() => onMove(block.id, -1)}
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Move block down"
              onClick={() => onMove(block.id, 1)}
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Duplicate block"
              onClick={() => onDuplicate(block.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Delete block"
              onClick={() => onDelete(block.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Page Type">
          <select
            value={block.pageType}
            onChange={(event) => onChange(block.id, { pageType: event.target.value as PageType })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "#D8CEC2", background: "#fff" }}
          >
            {BUILDER_BLOCK_TYPES.map((item) => (
              <option key={item.type} value={item.type}>
                {item.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Order Number">
          <Input value={String(block.order)} readOnly />
        </Field>
        <Field label="Block Title">
          <Input
            value={block.title}
            onChange={(event) => onChange(block.id, { title: event.target.value })}
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={block.subtitle}
            onChange={(event) => onChange(block.id, { subtitle: event.target.value })}
          />
        </Field>

        {block.pageType === "cover" ? (
          <>
            <Field label="Cover Keywords" hint="Comma-separated. Leave blank to print no keywords.">
              <Input
                value={block.keywords}
                onChange={(event) => onChange(block.id, { keywords: event.target.value })}
              />
            </Field>
            <Field label="Body Text">
              <Textarea
                rows={3}
                value={block.body}
                onChange={(event) => onChange(block.id, { body: event.target.value })}
              />
            </Field>
          </>
        ) : null}

        {block.pageType === "divider" || block.pageType === "lesson" ? (
          <Field label="Body Text">
            <Textarea
              rows={block.pageType === "lesson" ? 9 : 4}
              value={block.body}
              onChange={(event) => onChange(block.id, { body: event.target.value })}
            />
          </Field>
        ) : null}

        {block.pageType === "checklist" ? (
          <Field label="Checklist Items" hint="One item per line.">
            <Textarea
              rows={10}
              value={block.body}
              onChange={(event) => onChange(block.id, { body: event.target.value })}
            />
          </Field>
        ) : null}

        {block.pageType === "table" ? (
          <BuilderTableEditor
            block={block}
            onChange={(tableData) => onChange(block.id, { tableData })}
          />
        ) : null}

        {block.pageType === "workbook" ? (
          <>
            <Field label="Workbook Prompt">
              <Textarea
                rows={5}
                value={block.prompt}
                onChange={(event) => onChange(block.id, { prompt: event.target.value })}
              />
            </Field>
            <Field label="Writing Lines Count">
              <Input
                type="number"
                min={4}
                max={20}
                value={block.lines}
                onChange={(event) =>
                  onChange(block.id, {
                    lines:
                      event.target.value === "" ? "" : Number.parseInt(event.target.value, 10) || 0,
                  })
                }
              />
            </Field>
          </>
        ) : null}

        {block.pageType === "notes" ? (
          <>
            <Field label="Notes Prompt" hint="Optional. Leave blank for writing lines only.">
              <Textarea
                rows={5}
                value={block.prompt}
                onChange={(event) => onChange(block.id, { prompt: event.target.value })}
              />
            </Field>
            <Field label="Writing Lines Count">
              <Input
                type="number"
                min={4}
                max={20}
                value={block.lines}
                onChange={(event) =>
                  onChange(block.id, {
                    lines:
                      event.target.value === "" ? "" : Number.parseInt(event.target.value, 10) || 0,
                  })
                }
              />
            </Field>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BuilderTableEditor({
  block,
  onChange,
}: {
  block: BuilderBlock;
  onChange: (tableData: BuilderBlock["tableData"]) => void;
}) {
  const table = block.tableData;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {table.headers.map((header, index) => (
          <Field key={index} label={`Column ${index + 1} Header`}>
            <Input
              value={header}
              onChange={(event) => {
                const headers = table.headers.slice();
                headers[index] = event.target.value;
                onChange({ ...table, headers });
              }}
            />
          </Field>
        ))}
      </div>
      <div>
        <Label className="text-xs uppercase tracking-wide" style={{ color: "#4F2D68" }}>
          Row Entries
        </Label>
        <div className="mt-2 space-y-2">
          {table.rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              {row.map((cell, cellIndex) => (
                <Input
                  key={cellIndex}
                  value={cell}
                  onChange={(event) => {
                    const rows = table.rows.map((item) => item.slice());
                    rows[rowIndex][cellIndex] = event.target.value;
                    onChange({ ...table, rows });
                  }}
                  placeholder=""
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove row"
                onClick={() => {
                  const rows = table.rows.filter((_, index) => index !== rowIndex);
                  onChange({ ...table, rows: rows.length > 0 ? rows : [["", "", ""]] });
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          className="mt-2"
          variant="outline"
          size="sm"
          onClick={() => onChange({ ...table, rows: [...table.rows, ["", "", ""]] })}
        >
          <Plus className="mr-1 h-3 w-3" /> Add Row
        </Button>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: React.MouseEventHandler<HTMLSpanElement>;
  children: ReactNode;
}) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick(event as unknown as React.MouseEvent<HTMLSpanElement>);
        }
      }}
      className="inline-flex h-6 w-6 items-center justify-center rounded hover:bg-[#F4EFE6]"
      style={{ color: "#4F2D68" }}
    >
      {children}
    </span>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
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
