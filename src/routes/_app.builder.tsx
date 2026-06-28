import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpenText,
  Copy,
  Eraser,
  FileText,
  Library,
  MousePointer2,
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
import { ActionBar, ActionGroup, PageHeader, StatusStrip } from "@/components/ProductionUI";
import { WorkflowContext } from "@/components/WorkflowContext";
import { BRANCH_TEMPLATE_PROFILES, type BranchProfile } from "@/lib/branch-profile";
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
import { saveLessonGuideSource } from "@/lib/lesson-guide";
import { saveHowToKitSource } from "@/lib/how-to-kit";
import { saveFillableFieldSource } from "@/lib/fillable-fields";
import { hasLayoutOverrides, patchLayoutOverrides } from "@/lib/layout-polish";
import type { Block, LayoutOverrides, PageType } from "@/lib/kit-types";

const searchSchema = z.object({
  draftReload: z.coerce.number().optional(),
  kitId: z.string().optional(),
});

const BODY_EDITOR_PAGE_TYPES: PageType[] = [
  "divider",
  "lesson",
  "start-here",
  "module-intro",
  "quote",
  "action-plan",
  "resource",
  "case-study",
  "multi-prompt",
  "progress-check",
  "closing",
];

const BOTTOM_NOTE_PAGE_TYPES: PageType[] = [
  "lesson",
  "lesson-activity",
  "workbook",
  "notes",
  "reflection",
  "prompt-page",
  "action-plan",
  "progress-check",
  "closing",
];

const PROMPT_EDITOR_PAGE_TYPES: PageType[] = [
  "quote",
  "reflection",
  "case-study",
  "prompt-page",
  "closing",
];

export const Route = createFileRoute("/_app/builder")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Builder | Kit Factory" }] }),
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
  const selectedPreviewIndex = selectedBlock
    ? kit.blocks.findIndex((block) => block.id === selectedBlock.id)
    : -1;
  const selectedPreviewBlock =
    selectedPreviewIndex >= 0 ? kit.blocks[selectedPreviewIndex] : (kit.blocks[0] ?? null);

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
    toast.success("Draft saved");
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

  const generateLessonGuide = () => {
    const savedDraft = persist();
    saveLessonGuideSource(savedDraft, "Current Builder Draft");
    toast.success("Lesson Guide generated");
    navigate({ to: "/lesson-guide" });
  };

  const generateHowToKit = () => {
    const savedDraft = persist();
    saveHowToKitSource(savedDraft, "Current Builder Draft");
    toast.success("How-To PDF generated");
    navigate({ to: "/how-to-kit" });
  };

  const openFillableFields = () => {
    const savedDraft = persist();
    saveFillableFieldSource(savedDraft, "Current Builder Draft");
    toast.success("Fillable field map opened");
    navigate({ to: "/fillable-fields" });
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
    toast.message("Builder cleared");
  };

  return (
    <div className="screen-only p-8">
      <PageHeader
        eyebrow="Production builder"
        title="Builder"
        description="Build the workbook pages here. Use page types to control structure, then export the final PDF from this draft."
      />
      <WorkflowContext currentStep={2} />

      <ActionBar>
        <ActionGroup label="Draft">
          <Button onClick={saveDraft} style={{ background: "#4F2D68", color: "#fff" }}>
            <Save className="mr-2 h-4 w-4" /> Save Draft
          </Button>
          <Button onClick={generatePreview} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" /> Preview
          </Button>
        </ActionGroup>
        <ActionGroup label="Library">
          <Button onClick={saveToVersionLibrary} variant="outline" disabled={savingVersion}>
            <Library className="mr-2 h-4 w-4" /> Save Version
          </Button>
        </ActionGroup>
        <ActionGroup label="Export">
          <Button onClick={printDraft} variant="outline">
            <Printer className="mr-2 h-4 w-4" /> Print PDF
          </Button>
          <Button onClick={generateLessonGuide} variant="outline">
            <BookOpenText className="mr-2 h-4 w-4" /> Lesson Guide
          </Button>
          <Button onClick={generateHowToKit} variant="outline">
            <FileText className="mr-2 h-4 w-4" /> How-To
          </Button>
          <Button onClick={openFillableFields} variant="outline">
            <MousePointer2 className="mr-2 h-4 w-4" /> Fillable
          </Button>
        </ActionGroup>
        <ActionGroup label="Tools">
          <Button onClick={resetToSample} variant="outline">
            <RotateCcw className="mr-2 h-4 w-4" /> Sample
          </Button>
          <Button onClick={clearAll} variant="outline">
            <Eraser className="mr-2 h-4 w-4" /> Clear
          </Button>
        </ActionGroup>
        {warnings.length > 0 ? (
          <span
            className="ml-auto inline-flex items-center gap-2 text-xs"
            style={{ color: "#7a4a00" }}
          >
            <AlertTriangle className="h-4 w-4" /> {warnings.length} warning
            {warnings.length === 1 ? "" : "s"}
          </span>
        ) : null}
      </ActionBar>

      <StatusStrip>
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
      </StatusStrip>

      <div
        className="mb-6 rounded-md border px-4 py-3 text-sm"
        style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#4b4450" }}
      >
        <strong>Builder flow:</strong> edit page blocks, save the draft, preview/export the PDF,
        then open Fillable Fields only after the final PDF looks right.
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
          previewBlock={selectedPreviewBlock}
          branchProfile={kit.branchProfile}
          pageNumber={selectedPreviewIndex >= 0 ? selectedPreviewIndex + 1 : 1}
          totalPages={kit.blocks.length}
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
              Add a block to begin the workbook preview.
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
      <span style={{ color: "#222026" }}>{value || "--"}</span>
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
          <select
            value={draft.branch}
            onChange={(event) => onChange({ branch: event.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "#D8CEC2", background: "#fff" }}
          >
            <option value="">Select branch</option>
            {BRANCH_TEMPLATE_PROFILES.filter((profile) => profile.status === "Active").map(
              (profile) => (
                <option key={profile.name} value={profile.name}>
                  {profile.displayName === profile.name
                    ? profile.name
                    : `${profile.name} / ${profile.displayName}`}
                </option>
              ),
            )}
          </select>
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
                    {hasLayoutOverrides(block) ? <PolishedBadge /> : null}
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
  previewBlock,
  branchProfile,
  pageNumber,
  totalPages,
  onAdd,
  onChange,
  onDuplicate,
  onDelete,
  onMove,
}: {
  block: BuilderBlock | null;
  previewBlock: Block | null;
  branchProfile: BranchProfile;
  pageNumber: number;
  totalPages: number;
  onAdd: (type: PageType) => void;
  onChange: (blockId: string, patch: Partial<BuilderBlock>) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}) {
  const [showPolish, setShowPolish] = useState(() => Boolean(block && hasLayoutOverrides(block)));

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
          {hasLayoutOverrides(block) ? <PolishedBadge /> : null}
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
        <Field
          label="Change Page Type"
          hint="Lesson Activity keeps a short lesson plus checklist or action steps together. Multi-Prompt keeps several questions on one page."
        >
          <div className="mb-2 flex flex-wrap gap-1.5">
            {(
              [
                ["lesson", "Lesson"],
                ["lesson-activity", "Lesson Activity"],
                ["multi-prompt", "Multi-Prompt"],
                ["table", "Tracker"],
                ["resource", "Resource"],
              ] as [PageType, string][]
            ).map(([type, label]) => (
              <button
                key={type}
                type="button"
                onClick={() => onChange(block.id, { pageType: type })}
                className="rounded border px-2 py-1 text-xs transition-colors"
                style={{
                  borderColor: block.pageType === type ? "#4F2D68" : "#D8CEC2",
                  background: block.pageType === type ? "#4F2D68" : "#fff",
                  color: block.pageType === type ? "#fff" : "#4b4450",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <select
            value={block.pageType}
            onChange={(event) => onChange(block.id, { pageType: event.target.value as PageType })}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "#D8CEC2", background: "#fff" }}
          >
            <optgroup label="Content">
              {(["cover", "lesson", "lesson-activity", "start-here", "module-intro", "closing"] as PageType[]).map((type) => (
                <option key={type} value={type}>{pageTypeLabel(type)}</option>
              ))}
            </optgroup>
            <optgroup label="Fillable">
              {(["workbook", "notes", "prompt-page", "multi-prompt", "reflection", "checklist", "lesson-activity"] as PageType[]).map((type) => (
                <option key={type} value={type}>{pageTypeLabel(type)}</option>
              ))}
            </optgroup>
            <optgroup label="Reference">
              {(["table", "resource", "case-study", "action-plan", "progress-check", "quote"] as PageType[]).map((type) => (
                <option key={type} value={type}>{pageTypeLabel(type)}</option>
              ))}
            </optgroup>
            <optgroup label="Structure">
              {(["divider", "back-cover"] as PageType[]).map((type) => (
                <option key={type} value={type}>{pageTypeLabel(type)}</option>
              ))}
            </optgroup>
          </select>
        </Field>
        <Field label="Order Number">
          <Input value={String(block.order)} readOnly />
        </Field>
        <Field label={block.pageType === "back-cover" ? "Closing Title" : "Block Title"}>
          <Input
            value={block.title}
            onChange={(event) => onChange(block.id, { title: event.target.value })}
          />
        </Field>
        <Field
          label={block.pageType === "back-cover" ? "Optional Copyright/Footer Line" : "Subtitle"}
        >
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

        {BODY_EDITOR_PAGE_TYPES.includes(block.pageType) ? (
          <Field label={bodyFieldLabel(block.pageType)} hint={bodyFieldHint(block.pageType)}>
            <Textarea
              rows={bodyFieldRows(block.pageType)}
              value={block.body}
              onChange={(event) => onChange(block.id, { body: event.target.value })}
            />
          </Field>
        ) : null}

        {block.pageType === "lesson-activity" ? (
          <LessonActivityEditor block={block} onChange={(patch) => onChange(block.id, patch)} />
        ) : null}

        {PROMPT_EDITOR_PAGE_TYPES.includes(block.pageType) ? (
          <Field label={promptFieldLabel(block.pageType)} hint={promptFieldHint(block.pageType)}>
            <Textarea
              rows={block.pageType === "quote" ? 2 : 4}
              value={block.prompt}
              onChange={(event) => onChange(block.id, { prompt: event.target.value })}
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

        {block.pageType === "reflection" || block.pageType === "prompt-page" ? (
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
        ) : null}

        {block.pageType === "back-cover" ? (
          <>
            <Field label="Short Closing Message">
              <Textarea
                rows={5}
                value={block.body}
                onChange={(event) => onChange(block.id, { body: event.target.value })}
              />
            </Field>
            <Field label="Website or Call-to-Action Placeholder">
              <Input
                value={block.prompt}
                onChange={(event) => onChange(block.id, { prompt: event.target.value })}
              />
            </Field>
          </>
        ) : null}

        {BOTTOM_NOTE_PAGE_TYPES.includes(block.pageType) ? (
          <Field
            label="Bottom Note"
            hint="Optional encouragement or reminder near the bottom of the page."
          >
            <Textarea
              rows={2}
              value={block.bottomNote}
              onChange={(event) => onChange(block.id, { bottomNote: event.target.value })}
            />
          </Field>
        ) : null}

        <div
          className="rounded-md border"
          style={{ borderColor: "#D8CEC2" }}
        >
          <button
            type="button"
            className="flex w-full items-center justify-between px-3 py-2 text-left"
            onClick={() => setShowPolish((v) => !v)}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
                Page Polish
              </span>
              {hasLayoutOverrides(block) ? <PolishedBadge /> : null}
            </div>
            <span className="text-xs" style={{ color: "#6b6470" }}>
              {showPolish ? "Hide" : "Show"}
            </span>
          </button>
          {showPolish ? (
            <div className="border-t px-3 pb-3 pt-3" style={{ borderColor: "#D8CEC2" }}>
              <PagePolishPanel
                block={block}
                previewBlock={previewBlock}
                branchProfile={branchProfile}
                pageNumber={pageNumber}
                totalPages={totalPages}
                onChange={(patch) => onChange(block.id, patch)}
              />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function PagePolishPanel({
  block,
  previewBlock,
  branchProfile,
  pageNumber,
  totalPages,
  onChange,
}: {
  block: BuilderBlock;
  previewBlock: Block | null;
  branchProfile: BranchProfile;
  pageNumber: number;
  totalPages: number;
  onChange: (patch: Partial<BuilderBlock>) => void;
}) {
  const overrides = block.layoutOverrides;
  const contentField = getPolishContentField(block.pageType);

  const updatePolish = (patch: NonNullable<BuilderBlock["layoutOverrides"]>) => {
    onChange({ layoutOverrides: patchLayoutOverrides(overrides, patch) });
  };

  const nudge = (
    key: "titleOffset" | "bodyOffset" | "titleOffsetX" | "bodyOffsetX",
    direction: -1 | 1,
  ) => {
    const current = overrides?.[key] ?? 0;
    updatePolish({ [key]: Math.max(-6, Math.min(6, current + direction)) });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_250px]">
      <div className="space-y-3">
          <Field label="Polish Title Text">
            <Input
              value={block.title}
              onChange={(event) => onChange({ title: event.target.value })}
            />
          </Field>

          {contentField ? (
            <Field label={contentField.label}>
              <Textarea
                rows={contentField.rows}
                value={block[contentField.key]}
                onChange={(event) => onChange({ [contentField.key]: event.target.value })}
              />
            </Field>
          ) : null}

          <div className="grid grid-cols-2 gap-2">
            <PolishNudgeControls
              label="Title Position"
              xValue={overrides?.titleOffsetX ?? 0}
              yValue={overrides?.titleOffset ?? 0}
              onUp={() => nudge("titleOffset", -1)}
              onDown={() => nudge("titleOffset", 1)}
              onLeft={() => nudge("titleOffsetX", -1)}
              onRight={() => nudge("titleOffsetX", 1)}
            />
            <PolishNudgeControls
              label="Body / Prompt Position"
              xValue={overrides?.bodyOffsetX ?? 0}
              yValue={overrides?.bodyOffset ?? 0}
              onUp={() => nudge("bodyOffset", -1)}
              onDown={() => nudge("bodyOffset", 1)}
              onLeft={() => nudge("bodyOffsetX", -1)}
              onRight={() => nudge("bodyOffsetX", 1)}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <PolishSelect
              label="Title Align"
              value={overrides?.titleAlign ?? "default"}
              options={[
                ["default", "Default"],
                ["left", "Left"],
                ["center", "Center"],
              ]}
              onChange={(value) =>
                updatePolish({ titleAlign: value as LayoutOverrides["titleAlign"] })
              }
            />
            <PolishSelect
              label="Body Align"
              value={overrides?.bodyAlign ?? "default"}
              options={[
                ["default", "Default"],
                ["left", "Left"],
                ["center", "Center"],
              ]}
              onChange={(value) =>
                updatePolish({ bodyAlign: value as LayoutOverrides["bodyAlign"] })
              }
            />
            <PolishSelect
              label="Title Size"
              value={overrides?.titleSize ?? "default"}
              options={[
                ["default", "Default"],
                ["smaller", "Smaller"],
                ["larger", "Larger"],
              ]}
              onChange={(value) =>
                updatePolish({ titleSize: value as LayoutOverrides["titleSize"] })
              }
            />
            <PolishSelect
              label="Body Size"
              value={overrides?.bodySize ?? "default"}
              options={[
                ["default", "Default"],
                ["smaller", "Smaller"],
                ["larger", "Larger"],
              ]}
              onChange={(value) => updatePolish({ bodySize: value as LayoutOverrides["bodySize"] })}
            />
          </div>

          <PolishSelect
            label="Spacing"
            value={overrides?.spacing ?? "default"}
            options={[
              ["default", "Default"],
              ["compact", "Compact"],
              ["normal", "Normal"],
              ["spacious", "Spacious"],
            ]}
            onChange={(value) => updatePolish({ spacing: value as LayoutOverrides["spacing"] })}
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange({ layoutOverrides: undefined })}
          >
            <RotateCcw className="mr-2 h-3 w-3" /> Reset Page Polish
          </Button>
        </div>

        <SelectedPagePreview
          block={previewBlock}
          branchProfile={branchProfile}
          pageNumber={pageNumber}
          totalPages={totalPages}
        />
      </div>
  );
}

function SelectedPagePreview({
  block,
  branchProfile,
  pageNumber,
  totalPages,
}: {
  block: Block | null;
  branchProfile: BranchProfile;
  pageNumber: number;
  totalPages: number;
}) {
  return (
    <div className="lg:sticky lg:top-24">
      <div className="mb-2 text-[10px] uppercase tracking-[0.18em]" style={{ color: "#4F2D68" }}>
        Selected Page Preview
      </div>
      {block ? (
        <div
          className="overflow-hidden rounded-md border bg-white p-2"
          style={{ borderColor: "#D8CEC2" }}
        >
          <PagePreview scale={0.25}>
            <PageRenderer
              block={block}
              branchProfile={branchProfile}
              pageNumber={pageNumber}
              totalPages={totalPages}
            />
          </PagePreview>
        </div>
      ) : (
        <div
          className="rounded-md border bg-white px-3 py-4 text-xs"
          style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
        >
          Select a page to preview polish changes.
        </div>
      )}
    </div>
  );
}

function PolishNudgeControls({
  label,
  xValue,
  yValue,
  onUp,
  onDown,
  onLeft,
  onRight,
}: {
  label: string;
  xValue: number;
  yValue: number;
  onUp: () => void;
  onDown: () => void;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <div className="rounded-md border bg-white p-2" style={{ borderColor: "#D8CEC2" }}>
      <div className="mb-1 text-xs uppercase tracking-wide" style={{ color: "#4F2D68" }}>
        {label}
      </div>
      <div className="grid grid-cols-3 gap-1">
        <span />
        <Button type="button" variant="outline" size="sm" onClick={onUp}>
          <ArrowUp className="h-3 w-3" />
        </Button>
        <span />
        <Button type="button" variant="outline" size="sm" onClick={onLeft}>
          <ArrowLeft className="h-3 w-3" />
        </Button>
        <div className="flex items-center justify-center text-[10px]" style={{ color: "#6b6470" }}>
          X {xValue} / Y {yValue}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onRight}>
          <ArrowRight className="h-3 w-3" />
        </Button>
        <span />
        <Button type="button" variant="outline" size="sm" onClick={onDown}>
          <ArrowDown className="h-3 w-3" />
        </Button>
        <span />
      </div>
    </div>
  );
}

function PolishSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border px-3 py-2 text-sm"
        style={{ borderColor: "#D8CEC2", background: "#fff" }}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </Field>
  );
}

function PolishedBadge() {
  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]"
      style={{ borderColor: "#C6A85B", color: "#4F2D68", background: "#FFF8E1" }}
    >
      Polished
    </span>
  );
}

function getPolishContentField(
  pageType: PageType,
): { key: "body" | "prompt"; label: string; rows: number } | null {
  if (
    pageType === "cover" ||
    pageType === "divider" ||
    pageType === "lesson" ||
    pageType === "lesson-activity" ||
    pageType === "checklist" ||
    pageType === "multi-prompt" ||
    pageType === "back-cover" ||
    BODY_EDITOR_PAGE_TYPES.includes(pageType)
  ) {
    return {
      key: "body",
      label: "Polish Body Text",
      rows: pageType === "lesson" || pageType === "lesson-activity" ? 6 : 4,
    };
  }

  if (
    pageType === "workbook" ||
    pageType === "notes" ||
    pageType === "reflection" ||
    pageType === "prompt-page"
  ) {
    return { key: "prompt", label: "Polish Prompt Text", rows: 4 };
  }

  return null;
}

function bodyFieldLabel(pageType: PageType): string {
  switch (pageType) {
    case "quote":
      return "Opening Thought / Quote";
    case "action-plan":
      return "Action Steps";
    case "progress-check":
      return "Progress Check Items";
    case "resource":
      return "Resources / References";
    case "case-study":
      return "Example / Scenario";
    case "multi-prompt":
      return "Prompt Sections";
    case "closing":
      return "Closing Message";
    case "module-intro":
      return "Module Introduction";
    case "start-here":
      return "Start Here Instructions";
    default:
      return "Body Text";
  }
}

function bodyFieldHint(pageType: PageType): string | undefined {
  if (pageType === "action-plan" || pageType === "progress-check") return "One item per line.";
  if (pageType === "resource") return "Add links, tools, terms, reminders, or references.";
  if (pageType === "multi-prompt")
    return "Use repeated sections: Prompt: ... then Writing Lines: 4. Each section becomes its own prompt area on the same page.";
  if (pageType === "quote") return "Use the main quote or opening thought here.";
  return undefined;
}

function bodyFieldRows(pageType: PageType): number {
  if (pageType === "lesson") return 9;
  if (pageType === "quote") return 4;
  if (pageType === "action-plan" || pageType === "progress-check") return 8;
  if (pageType === "multi-prompt") return 10;
  return 5;
}

function promptFieldLabel(pageType: PageType): string {
  switch (pageType) {
    case "quote":
      return "Attribution / Source";
    case "reflection":
      return "Reflection Prompt";
    case "case-study":
      return "Takeaway / Focus";
    case "prompt-page":
      return "Main Writing Prompt";
    case "closing":
      return "Final Call to Action";
    default:
      return "Prompt";
  }
}

function promptFieldHint(pageType: PageType): string | undefined {
  if (pageType === "quote") return "Optional. Example: Best Collective";
  if (pageType === "prompt-page") return "This is the main prompt above the writing lines.";
  if (pageType === "reflection") return "This appears above the writing lines.";
  return undefined;
}

function LessonActivityEditor({
  block,
  onChange,
}: {
  block: BuilderBlock;
  onChange: (patch: Partial<BuilderBlock>) => void;
}) {
  return (
    <div className="space-y-3 rounded-md border p-3" style={{ borderColor: "#D8CEC2" }}>
      <Field label="Lesson Body" hint="Teaching text for the top part of this page.">
        <Textarea
          rows={7}
          value={block.body}
          onChange={(event) => onChange({ body: event.target.value })}
        />
      </Field>
      <Field label="Activity Type">
        <select
          value={block.activityType}
          onChange={(event) =>
            onChange({
              activityType: event.target.value as BuilderBlock["activityType"],
            })
          }
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "#D8CEC2", background: "#fff" }}
        >
          <option value="checklist">Checklist</option>
          <option value="action-steps">Action Steps</option>
          <option value="writing-prompt">Writing Prompt</option>
        </select>
      </Field>
      <Field label="Activity Title" hint="Example: Remember This, Action Steps, Try This.">
        <Input
          value={block.activityTitle}
          onChange={(event) => onChange({ activityTitle: event.target.value })}
        />
      </Field>
      {block.activityType === "writing-prompt" ? (
        <>
          <Field label="Activity Prompt">
            <Textarea
              rows={3}
              value={block.prompt}
              onChange={(event) => onChange({ prompt: event.target.value })}
            />
          </Field>
          <Field label="Writing Lines Count">
            <Input
              type="number"
              min={4}
              max={8}
              value={block.lines}
              onChange={(event) =>
                onChange({
                  lines:
                    event.target.value === "" ? "" : Number.parseInt(event.target.value, 10) || 0,
                })
              }
            />
          </Field>
        </>
      ) : (
        <Field
          label={block.activityType === "action-steps" ? "Action Steps" : "Checklist Items"}
          hint="One item per line. These stay on this lesson page."
        >
          <Textarea
            rows={6}
            value={block.activityItems}
            onChange={(event) => onChange({ activityItems: event.target.value })}
          />
        </Field>
      )}
    </div>
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
