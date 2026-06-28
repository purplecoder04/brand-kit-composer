import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Copy,
  Download,
  Eraser,
  FileText,
  MousePointer2,
  Plus,
  Save,
  SquareCheck,
  Trash2,
} from "lucide-react";
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
  type MouseEvent,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageRenderer } from "@/components/PageRenderer";
import { EmptyState, PageHeader } from "@/components/ProductionUI";
import { WorkflowContext } from "@/components/WorkflowContext";
import {
  buildBuilderKit,
  buildPagesFromKitDraft,
  loadBuilderDraft,
  type BuilderDraft,
} from "@/lib/builder-content";
import {
  clearFillableFieldSource,
  clampField,
  createFieldMapForSource,
  createFillableField,
  deleteFillableFieldMap,
  fieldCounts,
  fieldTypeLabel,
  loadFillableFieldMaps,
  loadFillableFieldSource,
  saveFillableFieldSource,
  saveFillableFieldMaps,
  type FillableField,
  type FillableFieldInput,
  type FillableFieldMapRecord,
  type FillableFieldSource,
  type FillableFieldType,
} from "@/lib/fillable-fields";
import {
  downloadBytes,
  exportFillablePdf,
  fillablePdfFileName,
  readFillableBasePdfPageCount,
} from "@/lib/fillable-pdf-export";
import { parseMultiPrompts } from "@/lib/multi-prompt";
import type { Block } from "@/lib/kit-types";

export const Route = createFileRoute("/_app/fillable-fields")({
  head: () => ({ meta: [{ title: "Fillable Fields | Kit Factory" }] }),
  component: FillableFieldsPage,
});

const fieldTypes: Array<{ type: FillableFieldType; label: string }> = [
  { type: "text", label: "Text Field" },
  { type: "multiline", label: "Multiline Field" },
  { type: "checkbox", label: "Checkbox" },
];

function FillableFieldsPage() {
  const navigate = useNavigate();
  const basePdfInputRef = useRef<HTMLInputElement | null>(null);
  const [source, setSource] = useState<FillableFieldSource | null>(() => loadFillableFieldSource());
  const [records, setRecords] = useState<FillableFieldMapRecord[]>(() => loadFillableFieldMaps());
  const existing = useMemo(() => {
    if (!source) return null;
    if (source.sourceVersionId) {
      return records.find((record) => record.sourceVersionId === source.sourceVersionId) ?? null;
    }
    return records.find((record) => record.sourceKitId === source.sourceKitId) ?? null;
  }, [records, source]);
  const [fieldMap, setFieldMap] = useState<FillableFieldMapRecord | null>(() =>
    source ? createFieldMapForSource(source, existing) : null,
  );
  const draft = source?.draft ?? null;
  const kit = useMemo(() => (draft ? buildBuilderKit(draft) : null), [draft]);
  const pages = useMemo(() => (draft ? buildPagesFromKitDraft(draft) : []), [draft]);
  const [selectedPageNumber, setSelectedPageNumber] = useState(1);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    fieldMap?.fields[0]?.id ?? null,
  );
  const [placementType, setPlacementType] = useState<FillableFieldType | null>(null);
  const [replacePageFields, setReplacePageFields] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [basePdfBytes, setBasePdfBytes] = useState<Uint8Array | null>(null);
  const [basePdfName, setBasePdfName] = useState("");
  const [basePdfPageCount, setBasePdfPageCount] = useState<number | null>(null);
  const selectedPage = pages[selectedPageNumber - 1] ?? pages[0] ?? null;
  const pageFields =
    fieldMap?.fields.filter((field) => field.pageNumber === selectedPageNumber) ?? [];
  const selectedField = fieldMap?.fields.find((field) => field.id === selectedFieldId) ?? null;
  const counts = fieldCounts(fieldMap?.fields ?? []);
  const pageCountMismatch = basePdfPageCount !== null && basePdfPageCount !== pages.length;
  const canExportFillablePdf =
    Boolean(basePdfBytes) &&
    !pageCountMismatch &&
    !isExportingPdf &&
    (fieldMap?.fields.length ?? 0) > 0;

  const saveMap = (nextMap = fieldMap) => {
    if (!nextMap) return;
    const saved = createFieldMapForSource(
      {
        draft: source?.draft ?? nextMap.draft ?? nextMapToDraftFallback(nextMap),
        sourceLabel: nextMap.sourceLabel,
        sourceKitId: nextMap.sourceKitId,
        sourceVersionId: nextMap.sourceVersionId,
      },
      nextMap,
    );
    const nextRecords = saveFillableFieldMaps([
      saved,
      ...records.filter((record) => record.id !== saved.id),
    ]);
    setRecords(nextRecords);
    setFieldMap(saved);
    toast.success("Field map saved");
  };

  const reloadLatestBuilderDraft = () => {
    const latestDraft = loadBuilderDraft();
    if (!latestDraft) {
      toast.error("No Builder draft found to reload.");
      return;
    }

    const nextSource = saveFillableFieldSource(latestDraft, "Current Builder Draft");
    const freshMap = createFieldMapForSource(nextSource);
    setSource(nextSource);
    setFieldMap(freshMap);
    setSelectedPageNumber(1);
    setSelectedFieldId(null);
    deleteBasePdfDocument(false);
    toast.success(`Reloaded Builder draft with ${freshMap.pageCount} pages`);
  };

  const handleExportFillablePdf = async () => {
    if (!fieldMap) return;
    if (fieldMap.fields.length === 0) {
      toast.error("Add fields before exporting a fillable PDF.");
      return;
    }
    if (!basePdfBytes) {
      toast.error("Upload the final workbook PDF before exporting.");
      return;
    }
    if (pageCountMismatch) {
      toast.error("Uploaded PDF page count must match this field map before export.");
      return;
    }

    try {
      setIsExportingPdf(true);
      const bytes = await exportFillablePdf({
        fieldMap,
        pages,
        basePdfBytes,
      });
      downloadBytes(bytes, fillablePdfFileName(fieldMap.kitName));
      toast.success("Fillable PDF exported");
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : "Unknown export error";
      toast.error(`Could not export: ${message}`);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleBasePdfUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Upload a PDF workbook file.");
      return;
    }

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const pageCount = await readFillableBasePdfPageCount(bytes);
      setBasePdfBytes(bytes);
      setBasePdfName(file.name);
      setBasePdfPageCount(pageCount);
      toast.success("Base workbook PDF loaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not read that PDF file.");
    }
  };

  const deleteBasePdfDocument = (showToast = true) => {
    setBasePdfBytes(null);
    setBasePdfName("");
    setBasePdfPageCount(null);
    if (basePdfInputRef.current) {
      basePdfInputRef.current.value = "";
    }
    if (showToast) {
      toast.success("Base PDF document removed");
    }
  };

  const deleteCurrentDocument = () => {
    if (
      !window.confirm(
        "Remove this document from Fillable Fields? Saved field maps stay in the library.",
      )
    ) {
      return;
    }
    clearFillableFieldSource();
    setSource(null);
    setFieldMap(null);
    setSelectedFieldId(null);
    setSelectedPageNumber(1);
    deleteBasePdfDocument(false);
    toast.success("Document removed from Fillable Fields");
  };

  const updateFieldMap = (updater: (current: FillableFieldMapRecord) => FillableFieldMapRecord) => {
    setFieldMap((current) => (current ? updater(current) : current));
  };

  const updateField = (fieldId: string, patch: Partial<FillableField>) => {
    updateFieldMap((current) => ({
      ...current,
      fields: current.fields.map((field) =>
        field.id === fieldId ? clampField({ ...field, ...patch }) : field,
      ),
    }));
  };

  const addField = (
    type: FillableFieldType,
    xPercent = type === "checkbox" ? 12 : 14,
    yPercent = type === "checkbox" ? 34 : 32,
  ) => {
    if (!selectedPage || !fieldMap) return;
    const field = createFillableField({
      type,
      pageNumber: selectedPageNumber,
      blockId: selectedPage.id,
      pageType: selectedPage.pageType,
      xPercent,
      yPercent,
    });
    updateFieldMap((current) => ({ ...current, fields: [...current.fields, field] }));
    setSelectedFieldId(field.id);
  };

  const placeField = (event: MouseEvent<HTMLDivElement>) => {
    if (!selectedPage || !fieldMap) return;
    if ((event.target as HTMLElement).closest("[data-fillable-field]")) return;
    if (!placementType) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100;
    addField(placementType, xPercent, yPercent);
    setPlacementType(null);
  };

  const duplicateField = (field: FillableField) => {
    const copy = clampField({
      ...field,
      id: `field-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${field.name} Copy`,
      xPercent: field.xPercent + 2,
      yPercent: field.yPercent + 2,
    });
    updateFieldMap((current) => ({ ...current, fields: [...current.fields, copy] }));
    setSelectedFieldId(copy.id);
  };

  const deleteField = (fieldId: string) => {
    updateFieldMap((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.id !== fieldId),
    }));
    setSelectedFieldId(null);
  };

  const clearPageFields = () => {
    if (!window.confirm("Clear fields on this page?")) return;
    updateFieldMap((current) => ({
      ...current,
      fields: current.fields.filter((field) => field.pageNumber !== selectedPageNumber),
    }));
    setSelectedFieldId(null);
  };

  const clearEntireMap = () => {
    if (!fieldMap) return;
    if (!window.confirm("Clear the entire field map? This removes every field.")) return;
    const blank = source ? createFieldMapForSource(source, { ...fieldMap, fields: [] }) : null;
    const nextRecords = deleteFillableFieldMap(records, fieldMap.id);
    setRecords(nextRecords);
    setFieldMap(blank);
    setSelectedFieldId(null);
    toast.message("Field map cleared");
  };

  const applyAutoFieldsToPage = (pageNumber: number, replaceExisting: boolean) => {
    const page = pages[pageNumber - 1];
    if (!page || !fieldMap) return 0;

    const autoFields = buildAutoFieldsForPage(page, pageNumber);
    if (autoFields.length === 0) {
      if (pageNumber === selectedPageNumber) {
        setAutoMessage("No auto-field pattern for this page yet.");
      }
      return 0;
    }

    const keptFields = replaceExisting
      ? fieldMap.fields.filter((field) => field.pageNumber !== pageNumber)
      : fieldMap.fields.filter((field) => !shouldClearAutoFieldsForPage(field, page, pageNumber));
    const pageExisting = keptFields.filter((field) => field.pageNumber === pageNumber);
    const newFields = autoFields.filter(
      (field) =>
        replaceExisting ||
        !pageExisting.some((existingField) => isSameAutoField(existingField, field)),
    );
    const addedCount = newFields.length;
    setFieldMap({ ...fieldMap, fields: [...keptFields, ...newFields] });
    if (addedCount > 0) {
      setSelectedFieldId(newFields[0]?.id ?? null);
    }
    if (pageNumber === selectedPageNumber) {
      setAutoMessage(
        addedCount > 0
          ? `${addedCount} auto field${addedCount === 1 ? "" : "s"} added.`
          : "No missing auto fields to add on this page.",
      );
    }
    return addedCount;
  };

  const applyAutoFieldsToAllPages = () => {
    if (!fieldMap) return;
    let addedCount = 0;
    const compatiblePageNumbers = new Set(
      pages
        .map((page, index) => (buildAutoFieldsForPage(page, index + 1).length > 0 ? index + 1 : 0))
        .filter(Boolean),
    );
    let nextFields = replacePageFields
      ? fieldMap.fields.filter((field) => !compatiblePageNumbers.has(field.pageNumber))
      : fieldMap.fields.filter((field) => {
          const page = pages[field.pageNumber - 1];
          if (!page) return !isLegacyAutoWritingArea(field);
          return !shouldClearAutoFieldsForPage(field, page, field.pageNumber);
        });
    for (const [index, page] of pages.entries()) {
      const pageNumber = index + 1;
      const autoFields = buildAutoFieldsForPage(page, pageNumber);
      const pageExisting = nextFields.filter((field) => field.pageNumber === pageNumber);
      const newFields = autoFields.filter(
        (field) =>
          replacePageFields ||
          !pageExisting.some((existingField) => isSameAutoField(existingField, field)),
      );
      addedCount += newFields.length;
      nextFields = [...nextFields, ...newFields];
    }
    setFieldMap({ ...fieldMap, fields: nextFields });
    setSelectedFieldId(null);
    setAutoMessage(
      addedCount > 0
        ? `${addedCount} auto field${addedCount === 1 ? "" : "s"} added across compatible pages.`
        : "No missing auto fields to add across compatible pages.",
    );
  };

  const selectedAutoPattern = selectedPage ? getAutoPatternLabel(selectedPage) : null;

  if (!source || !draft || !kit || !fieldMap) {
    return (
      <div className="p-8">
        <PageHeader
          eyebrow="Production fillable fields"
          title="Fillable Fields"
          description="Create, save, and export fillable field maps for workbook-style PDFs."
        />
        <div className="max-w-2xl">
        <EmptyState
          title="No kit loaded"
            description="Open Fillable Fields from Builder or Version Library so the editor knows which kit and page list to use. Then upload the final workbook PDF here before exporting fillable fields."
            actions={
              <>
                <Button onClick={() => navigate({ to: "/builder" })}>Open Builder</Button>
                <Button variant="outline" onClick={() => navigate({ to: "/version-library" })}>
                  Open Version Library
                </Button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <PageHeader
        eyebrow="Production fillable fields"
        title="Fillable Fields"
        description="Map fields on the final styled workbook PDF. Export the workbook from Builder first, then upload that exact PDF here."
      />
      <WorkflowContext currentStep={4} />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Fillable Workflow</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-5">
          <WorkflowNote title="1. Export PDF" body="Use Builder or Print Preview in Chrome." />
          <WorkflowNote title="2. Upload PDF" body="Upload the final styled workbook PDF here." />
          <WorkflowNote title="3. Place Fields" body="Add or auto-place fields on the pages." />
          <WorkflowNote title="4. Save Map" body="Save the field map to the library." />
          <WorkflowNote title="5. Export" body="Download the fillable PDF." />
        </CardContent>
      </Card>

      <div
        className="rounded-md border px-4 py-3 text-sm"
        style={{ borderColor: "#C6A85B", background: "#FFF8E1", color: "#7a4a00" }}
      >
        If you edit or reflow the workbook after creating fields, review the field map again.
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Source</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <InfoRow label="Kit" value={fieldMap.kitName || "Untitled"} />
              <InfoRow label="Branch" value={fieldMap.branch || "Unassigned"} />
              <InfoRow label="Source" value={fieldMap.sourceLabel} />
              <InfoRow label="Pages" value={String(pages.length)} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 w-full"
                onClick={reloadLatestBuilderDraft}
              >
                Reload Latest Builder Draft
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={deleteCurrentDocument}
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete Document
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pages</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pages.map((page, index) => (
                <button
                  key={`${page.id}-${index}`}
                  type="button"
                  className="w-full rounded-md border px-3 py-2 text-left text-sm"
                  style={{
                    borderColor: selectedPageNumber === index + 1 ? "#4F2D68" : "#D8CEC2",
                    background: selectedPageNumber === index + 1 ? "#F4EFE6" : "#fff",
                  }}
                  onClick={() => {
                    setSelectedPageNumber(index + 1);
                    setSelectedFieldId(null);
                  }}
                >
                  <div
                    className="text-[10px] uppercase tracking-[0.16em]"
                    style={{ color: "#4F2D68" }}
                  >
                    Page {index + 1}
                  </div>
                  <div className="font-medium">{page.title || page.pageType}</div>
                  <div className="text-xs" style={{ color: "#6b6470" }}>
                    {page.pageType} ·{" "}
                    {fieldMap.fields.filter((field) => field.pageNumber === index + 1).length}{" "}
                    fields
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        <main>
          {!basePdfBytes ? (
            <div
              className="mb-4 flex items-start gap-3 rounded-md border-2 p-4"
              style={{ borderColor: "#C6A85B", background: "#FFF8E1" }}
            >
              <div className="shrink-0 text-lg">⚠</div>
              <div className="flex-1">
                <div className="mb-1 font-semibold text-sm" style={{ color: "#7a4a00" }}>
                  Upload your final workbook PDF before mapping fields
                </div>
                <div className="text-xs" style={{ color: "#7a4a00" }}>
                  Fields placed here are overlaid on the PDF you export from the Builder. Upload
                  that PDF in the Save / Export panel (right sidebar) to enable fillable export.
                </div>
                <button
                  type="button"
                  className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{ background: "#C6A85B", color: "#fff" }}
                  onClick={() => basePdfInputRef.current?.click()}
                >
                  Upload PDF now
                </button>
              </div>
            </div>
          ) : null}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm font-semibold" style={{ color: "#222026" }}>
              Page {selectedPageNumber}: {selectedPage?.title || selectedPage?.pageType}
            </div>
            <div className="flex gap-2">
              {fieldTypes.map((item) => (
                <Button
                  key={item.type}
                  type="button"
                  variant={placementType === item.type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPlacementType(item.type)}
                >
                  <Plus className="mr-1 h-3 w-3" /> Place {item.label}
                </Button>
              ))}
              {placementType ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPlacementType(null)}
                >
                  Cancel
                </Button>
              ) : null}
            </div>
          </div>

          <div
            className="mb-3 rounded-md border px-3 py-2 text-xs"
            style={{
              borderColor: placementType ? "#C6A85B" : "#D8CEC2",
              background: placementType ? "#FFF8E1" : "#FAF6F0",
              color: placementType ? "#7a4a00" : "#6b6470",
            }}
          >
            {placementType
              ? `Click the page once to place a ${fieldTypeLabel(placementType).toLowerCase()} field.`
              : "Choose a field type first. Normal page clicks will not add fields."}
          </div>

          <div
            className="relative mx-auto overflow-hidden rounded-md border bg-white"
            style={{
              width: "680px",
              maxWidth: "100%",
              aspectRatio: "8.5 / 11",
              borderColor: "#D8CEC2",
            }}
            onClick={placeField}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: "8.5in",
                height: "11in",
                transform: "scale(0.78125)",
                transformOrigin: "top left",
              }}
            >
              {selectedPage ? (
                <PageRenderer
                  block={selectedPage}
                  branchProfile={kit.branchProfile}
                  pageNumber={selectedPageNumber}
                  totalPages={pages.length}
                />
              ) : null}
            </div>
            <div style={{ position: "absolute", inset: 0 }}>
              {pageFields.map((field) => (
                <FieldOverlay
                  key={field.id}
                  field={field}
                  selected={field.id === selectedFieldId}
                  onSelect={() => setSelectedFieldId(field.id)}
                  onDelete={() => deleteField(field.id)}
                />
              ))}
            </div>
          </div>
        </main>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <Plus className="mr-2 h-4 w-4" /> Auto Fields
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm" style={{ color: "#6b6470" }}>
                Quickly place visual fields on compatible workbook pages. Writing pages get one slim
                field per visible line.
              </p>
              <label className="flex items-start gap-2 rounded-md border p-2 text-sm">
                <input
                  type="checkbox"
                  checked={replacePageFields}
                  onChange={(event) => setReplacePageFields(event.target.checked)}
                  className="mt-1"
                />
                <span>
                  <span className="font-medium">Replace fields first</span>
                  <span className="block text-xs" style={{ color: "#6b6470" }}>
                    Off keeps existing fields and only adds missing auto fields.
                  </span>
                </span>
              </label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => applyAutoFieldsToPage(selectedPageNumber, replacePageFields)}
                disabled={!selectedAutoPattern}
              >
                <Plus className="mr-2 h-4 w-4" />
                {selectedAutoPattern ?? "No auto pattern for this page"}
              </Button>
              {!selectedAutoPattern ? (
                <div className="text-xs" style={{ color: "#6b6470" }}>
                  No auto-field pattern for this page yet.
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={applyAutoFieldsToAllPages}
              >
                <Plus className="mr-2 h-4 w-4" /> Auto-fields for all compatible pages
              </Button>
              {autoMessage ? (
                <div
                  className="rounded-md border px-3 py-2 text-xs"
                  style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
                >
                  {autoMessage}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <SquareCheck className="mr-2 h-4 w-4" /> Field Count
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 text-sm">
              <InfoRow label="Total fields" value={String(counts.total)} />
              <InfoRow label="Text fields" value={String(counts.text)} />
              <InfoRow label="Multiline fields" value={String(counts.multiline)} />
              <InfoRow label="Checkboxes" value={String(counts.checkbox)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-base">
                <MousePointer2 className="mr-2 h-4 w-4" /> Selected Field
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedField ? (
                <SelectedFieldControls
                  field={selectedField}
                  onChange={(patch) => updateField(selectedField.id, patch)}
                  onDuplicate={() => duplicateField(selectedField)}
                  onDelete={() => deleteField(selectedField.id)}
                />
              ) : (
                <p className="text-sm" style={{ color: "#6b6470" }}>
                  Select a field to adjust it, or choose a field type above and click the page to
                  place a new field.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Field List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {pageFields.length === 0 ? (
                <p className="text-sm" style={{ color: "#6b6470" }}>
                  No fields on this page yet.
                </p>
              ) : (
                pageFields.map((field) => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                    style={{
                      borderColor: field.id === selectedFieldId ? "#4F2D68" : "#D8CEC2",
                      background: field.id === selectedFieldId ? "#F4EFE6" : "#fff",
                    }}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setSelectedFieldId(field.id)}
                    >
                      <div className="truncate font-medium">{field.name}</div>
                      <div className="text-xs" style={{ color: "#6b6470" }}>
                        {fieldTypeLabel(field.type)}
                      </div>
                    </button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${field.name}`}
                      onClick={() => deleteField(field.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Save / Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div
                className="rounded-md border p-3 text-sm"
                style={{ borderColor: "#D8CEC2", background: "#FAF6F0" }}
              >
                <Label className="text-xs uppercase tracking-wide" style={{ color: "#4F2D68" }}>
                  Final Workbook PDF required
                </Label>
                <Input
                  ref={basePdfInputRef}
                  className="mt-2"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleBasePdfUpload}
                />
                <div className="mt-2 text-xs" style={{ color: "#6b6470" }}>
                  {basePdfName
                    ? `${basePdfName} loaded${basePdfPageCount ? ` - ${basePdfPageCount} pages` : ""}. Export will place fields on this PDF.`
                    : "Upload the final workbook PDF you want buyers to receive. Fields will be placed on this PDF. Fillable export stays disabled until the matching PDF is uploaded."}
                </div>
                {pageCountMismatch ? (
                  <div className="mt-2 text-xs" style={{ color: "#8B1E24" }}>
                    Export is disabled because the uploaded PDF has {basePdfPageCount} pages and
                    this field map has {pages.length} pages. Upload the matching final PDF or remap
                    the fields.
                  </div>
                ) : null}
                {basePdfName ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={deleteBasePdfDocument}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Uploaded PDF
                  </Button>
                ) : null}
              </div>
              <Button
                type="button"
                className="w-full"
                onClick={() => saveMap()}
                style={{ background: "#4F2D68", color: "#fff" }}
              >
                <Save className="mr-2 h-4 w-4" /> Save Field Map
              </Button>
              <Button
                type="button"
                className="w-full"
                variant="outline"
                onClick={handleExportFillablePdf}
                disabled={!canExportFillablePdf}
              >
                <Download className="mr-2 h-4 w-4" />
                {isExportingPdf
                  ? "Exporting..."
                  : basePdfBytes
                    ? "Export Fillable PDF"
                    : "Upload PDF to Export"}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={clearPageFields}>
                <Eraser className="mr-2 h-4 w-4" /> Clear Fields on This Page
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={clearEntireMap}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Entire Field Map
              </Button>
              <div
                className="rounded-md border px-3 py-2 text-xs"
                style={{ borderColor: "#D8CEC2", color: "#6b6470" }}
              >
                <FileText className="mr-1 inline h-3 w-3" /> Path 2 workflow: export the finished
                workbook PDF first, upload it here, save the field map, then export the fillable
                PDF.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function FieldOverlay({
  field,
  selected,
  onSelect,
  onDelete,
}: {
  field: FillableField;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const style: CSSProperties = {
    position: "absolute",
    left: `${field.xPercent}%`,
    top: `${field.yPercent}%`,
    width: `${field.widthPercent}%`,
    height: `${field.heightPercent}%`,
    border: selected ? "2px solid #4F2D68" : "1.5px solid #C6A85B",
    background: field.type === "checkbox" ? "rgba(198,168,91,0.2)" : "rgba(255,255,255,0.5)",
    boxShadow: selected ? "0 0 0 2px rgba(79,45,104,0.18)" : "none",
    cursor: "pointer",
  };

  return (
    <div data-fillable-field style={style} onClick={(event) => event.stopPropagation()}>
      <button type="button" title={field.name} className="h-full w-full" onClick={onSelect}>
        <span className="sr-only">{field.name}</span>
      </button>
      {selected ? (
        <button
          type="button"
          aria-label={`Delete ${field.name}`}
          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border bg-white shadow-sm"
          style={{ borderColor: "#8B1E24", color: "#8B1E24" }}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}

function SelectedFieldControls({
  field,
  onChange,
  onDuplicate,
  onDelete,
}: {
  field: FillableField;
  onChange: (patch: Partial<FillableField>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const [nudgeStep, setNudgeStep] = useState<0.5 | 1 | 5>(1);
  const nudge = (patch: Partial<FillableField>) => onChange(patch);

  return (
    <div className="space-y-3">
      <Field label="Field Name">
        <Input value={field.name} onChange={(event) => onChange({ name: event.target.value })} />
      </Field>
      <Field label="Field Type">
        <select
          value={field.type}
          onChange={(event) => onChange({ type: event.target.value as FillableFieldType })}
          className="w-full rounded-md border px-3 py-2 text-sm"
          style={{ borderColor: "#D8CEC2", background: "#fff" }}
        >
          {fieldTypes.map((item) => (
            <option key={item.type} value={item.type}>
              {item.label}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="X %">
          <Input
            type="number"
            value={field.xPercent}
            onChange={(event) => onChange({ xPercent: Number(event.target.value) })}
          />
        </Field>
        <Field label="Y %">
          <Input
            type="number"
            value={field.yPercent}
            onChange={(event) => onChange({ yPercent: Number(event.target.value) })}
          />
        </Field>
        <Field label="Width %">
          <Input
            type="number"
            value={field.widthPercent}
            onChange={(event) => onChange({ widthPercent: Number(event.target.value) })}
          />
        </Field>
        <Field label="Height %">
          <Input
            type="number"
            value={field.heightPercent}
            onChange={(event) => onChange({ heightPercent: Number(event.target.value) })}
          />
        </Field>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-xs" style={{ color: "#6b6470" }}>
          Nudge step:
        </span>
        {([0.5, 1, 5] as const).map((step) => (
          <button
            key={step}
            type="button"
            onClick={() => setNudgeStep(step)}
            className="rounded px-2 py-0.5 text-xs"
            style={{
              background: nudgeStep === step ? "#4F2D68" : "#FAF6F0",
              color: nudgeStep === step ? "#fff" : "#4b4450",
              border: `1px solid ${nudgeStep === step ? "#4F2D68" : "#D8CEC2"}`,
            }}
          >
            {step === 0.5 ? "Fine" : step === 1 ? "Normal" : "Coarse"}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ xPercent: field.xPercent - nudgeStep })}
        >
          Left
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ xPercent: field.xPercent + nudgeStep })}
        >
          Right
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ yPercent: field.yPercent - nudgeStep })}
        >
          Up
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ yPercent: field.yPercent + nudgeStep })}
        >
          Down
        </Button>
      </div>
      <div className="grid grid-cols-4 gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ widthPercent: field.widthPercent - nudgeStep })}
        >
          Narrower
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ widthPercent: field.widthPercent + nudgeStep })}
        >
          Wider
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ heightPercent: field.heightPercent - nudgeStep })}
        >
          Shorter
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => nudge({ heightPercent: field.heightPercent + nudgeStep })}
        >
          Taller
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            nudge({
              widthPercent: 72,
              heightPercent: field.type === "checkbox" ? 4 : field.heightPercent,
            })
          }
        >
          Wide answer
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            nudge({
              widthPercent: field.type === "checkbox" ? 4 : field.type === "multiline" ? 44 : 38,
              heightPercent: field.type === "checkbox" ? 3 : field.type === "multiline" ? 12 : 4,
            })
          }
        >
          Default size
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onDuplicate}>
          <Copy className="mr-1 h-3 w-3" /> Duplicate
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={onDelete}>
          <Trash2 className="mr-1 h-3 w-3" /> Delete
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.16em]" style={{ color: "#4F2D68" }}>
        {label}
      </div>
      <div style={{ color: "#222026" }}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide" style={{ color: "#4F2D68" }}>
        {label}
      </Label>
      {children}
    </div>
  );
}

function WorkflowNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border p-3" style={{ borderColor: "#D8CEC2", background: "#fff" }}>
      <div className="font-semibold" style={{ color: "#222026" }}>
        {title}
      </div>
      <div className="mt-1 leading-5" style={{ color: "#6b6470" }}>
        {body}
      </div>
    </div>
  );
}

function buildAutoFieldsForPage(page: Block, pageNumber: number): FillableField[] {
  if (page.pageType === "workbook") {
    return buildWritingLineFields(page, pageNumber, page.prompt ? 30.6 : 22.8);
  }

  if (page.pageType === "notes") {
    return buildWritingAreaField(page, pageNumber, page.prompt ? 30.6 : 22.8);
  }

  if (page.pageType === "prompt-page") {
    return buildWritingLineFields(page, pageNumber, page.prompt ? 36.2 : 28.6);
  }

  if (page.pageType === "multi-prompt") {
    return buildMultiPromptFields(page, pageNumber);
  }

  if (page.pageType === "lesson-activity") {
    return buildLessonActivityFields(page, pageNumber);
  }

  if (page.pageType === "reflection") {
    return buildWritingAreaField(page, pageNumber, page.prompt ? 36.2 : 28.6);
  }

  if (page.pageType === "checklist") {
    return buildChecklistFields(page, pageNumber);
  }

  if (page.pageType === "table") {
    return buildTableFields(page, pageNumber);
  }

  return [];
}

function buildWritingLineFields(
  page: Block,
  pageNumber: number,
  yPercent: number,
): FillableField[] {
  const lineCount = getAutoWritingLineCount(page);
  if (lineCount === 0) return [];

  const lineStep = page.pageType === "prompt-page" ? 3.28 : 3.62;
  const lineHeight = page.pageType === "prompt-page" ? 3.05 : 3.35;

  return Array.from({ length: lineCount }).map((_, index) =>
    createAutoField({
      name: `Auto Writing Line ${index + 1}`,
      type: "multiline",
      page,
      pageNumber,
      xPercent: 8.8,
      yPercent: yPercent + index * lineStep,
      widthPercent: 74,
      heightPercent: lineHeight,
    }),
  );
}

function buildWritingAreaField(page: Block, pageNumber: number, yPercent: number): FillableField[] {
  const lineCount = getAutoWritingLineCount(page);
  if (lineCount === 0) return [];

  return [
    createAutoField({
      name: "Auto Writing Area",
      type: "multiline",
      page,
      pageNumber,
      xPercent: 8.8,
      yPercent,
      widthPercent: 74,
      heightPercent: Math.max(8, Math.min(56, lineCount * 3.65)),
    }),
  ];
}

function getAutoWritingLineCount(page: Block): number {
  const explicitLines = typeof page.lines === "number" ? page.lines : 0;
  const embeddedLines = extractEmbeddedWritingLineCount([page.prompt, page.body].join("\n"));
  return Math.max(0, Math.min(Math.max(explicitLines, embeddedLines), 20));
}

function extractEmbeddedWritingLineCount(value: string): number {
  const match = value.match(
    /(?:writing\s*lines?|writing\s*line\s*count|line\s*count|lines)\s*:\s*(\d{1,2})/i,
  );
  if (!match) return 0;
  return Number(match[1]) || 0;
}

function buildMultiPromptFields(page: Block, pageNumber: number): FillableField[] {
  const items = parseMultiPrompts(page.body || page.prompt);
  const fields: FillableField[] = [];
  let sectionTopPercent = 16.4;

  for (const [itemIndex, item] of items.entries()) {
    const lineCount = Math.max(1, Math.min(item.lines, 8));
    const firstLineY = sectionTopPercent + 6.5;
    for (let lineIndex = 0; lineIndex < lineCount; lineIndex += 1) {
      fields.push(
        createAutoField({
          name: `Auto Prompt ${itemIndex + 1} Line ${lineIndex + 1}`,
          type: "multiline",
          page,
          pageNumber,
          xPercent: 12.8,
          yPercent: firstLineY + lineIndex * 2.55,
          widthPercent: 75,
          heightPercent: 2.08,
        }),
      );
    }
    sectionTopPercent += 7.4 + lineCount * 2.55;
  }

  return fields;
}

function buildLessonActivityFields(page: Block, pageNumber: number): FillableField[] {
  if (page.activityType === "writing-prompt") {
    return buildWritingLineFields(page, pageNumber, page.prompt ? 61 : 58);
  }

  if (page.activityType === "checklist") {
    const items = (page.activityItems ?? "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
    return items.map((_, index) =>
      createAutoField({
        name: `Auto Activity Checklist ${index + 1}`,
        type: "checkbox",
        page,
        pageNumber,
        xPercent: 11.4,
        yPercent: 62.6 + index * 3.35,
        widthPercent: 2.4,
        heightPercent: 2.4,
      }),
    );
  }

  return [];
}

function buildChecklistFields(page: Block, pageNumber: number): FillableField[] {
  const items = (page.body ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) return [];

  return items.map((_, index) =>
    createAutoField({
      name: `Auto Checklist ${index + 1}`,
      type: "checkbox",
      page,
      pageNumber,
      xPercent: 21.1,
      yPercent: 30 + index * 5.45,
      widthPercent: 2.8,
      heightPercent: 2.8,
    }),
  );
}

function buildTableFields(page: Block, pageNumber: number): FillableField[] {
  const rows = page.tableData?.rows ?? [];
  const headers = page.tableData?.headers ?? [];
  const columnCount = Math.max(headers.length, rows[0]?.length ?? 0);
  if (columnCount === 0) return [];

  const tableWidth = 78;
  const columnWidth = tableWidth / columnCount;
  return rows.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) => {
      if (!cell.trim()) return [];
      return [
        createAutoField({
          name: `Auto Table R${rowIndex + 1} C${columnIndex + 1}`,
          type: "text",
          page,
          pageNumber,
          xPercent: 11 + columnIndex * columnWidth,
          yPercent: 37 + rowIndex * 6.4,
          widthPercent: Math.max(8, columnWidth - 1.2),
          heightPercent: 5,
        }),
      ];
    }),
  );
}

function createAutoField({
  page,
  pageNumber,
  ...field
}: Omit<FillableFieldInput, "blockId" | "pageType"> & {
  page: Block;
}): FillableField {
  return createFillableField({
    ...field,
    pageNumber,
    blockId: page.id,
    pageType: page.pageType,
  });
}

function isSameAutoField(existingField: FillableField, autoField: FillableField): boolean {
  return (
    existingField.pageNumber === autoField.pageNumber &&
    existingField.blockId === autoField.blockId &&
    existingField.pageType === autoField.pageType &&
    existingField.type === autoField.type &&
    existingField.name === autoField.name
  );
}

function shouldClearAutoFieldsForPage(field: FillableField, page: Block, pageNumber: number) {
  if (field.pageNumber !== pageNumber) return false;
  if (isAutoGeneratedField(field)) {
    if (!isAutoCompatiblePage(page)) return true;
    if (field.blockId && field.blockId !== page.id) return true;
    if (field.pageType !== page.pageType) return true;
  }
  if (field.blockId !== page.id) return false;
  if (page.pageType === "lesson-activity") {
    if (page.activityType === "checklist") return "Auto-fill Activity Checklist";
    if (page.activityType === "writing-prompt") return "Auto-fill Activity Writing Lines";
    return null;
  }

  if (
    page.pageType === "workbook" ||
    page.pageType === "prompt-page" ||
    page.pageType === "multi-prompt" ||
    page.pageType === "lesson-activity"
  ) {
    return (
      field.name === "Auto Writing Area" ||
      field.name.startsWith("Auto Writing Line ") ||
      field.name.startsWith("Auto Prompt ")
    );
  }
  return isLegacyAutoWritingArea(field, pageNumber);
}

function isAutoGeneratedField(field: FillableField): boolean {
  return field.name.startsWith("Auto ");
}

function isAutoCompatiblePage(page: Block): boolean {
  return getAutoPatternLabel(page) !== null;
}

function isLegacyAutoWritingArea(field: FillableField, pageNumber?: number): boolean {
  const isWritingPage =
    field.pageType === "workbook" ||
    field.pageType === "prompt-page" ||
    field.pageType === "multi-prompt" ||
    field.pageType === "lesson-activity" ||
    field.pageType === "notes" ||
    field.pageType === "reflection";
  if (!isWritingPage) return false;
  if (pageNumber && field.pageNumber !== pageNumber) return false;
  return field.name === "Auto Writing Area";
}

function getAutoPatternLabel(page: Block): string | null {
  if (
    page.pageType === "workbook" ||
    page.pageType === "notes" ||
    page.pageType === "reflection" ||
    page.pageType === "prompt-page" ||
    page.pageType === "multi-prompt" ||
    page.pageType === "lesson-activity"
  ) {
    return "Auto-fill Writing Lines";
  }

  if (page.pageType === "checklist") return "Auto-fill Checklist";
  if (page.pageType === "table") return "Auto-fill Table Cells";
  return null;
}

function nextMapToDraftFallback(record: FillableFieldMapRecord): BuilderDraft {
  return {
    id: record.sourceKitId ?? record.id,
    kitName: record.kitName,
    subtitle: "",
    branch: record.branch,
    audience: "",
    tone: "",
    tagline: "",
    source: "current",
    lastSaved: record.updatedAt,
    selectedBlockId: null,
    blocks: [],
  };
}
