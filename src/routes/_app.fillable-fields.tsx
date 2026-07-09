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
  useEffect,
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
import { resolveBranchProfile } from "@/lib/branch-profile";
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

const FILLABLE_CALIBRATION_STORAGE_KEY = "best_collective_fillable_auto_calibration";

type FillableCalibration = {
  xOffset: number;
  yOffset: number;
  spacingOffset: number;
  widthOffset: number;
};

type FillableCalibrationMap = Record<string, FillableCalibration>;

const DEFAULT_CALIBRATION: FillableCalibration = {
  xOffset: 0,
  yOffset: 0,
  spacingOffset: 0,
  widthOffset: 0,
};

function FillableFieldsPage() {
  const navigate = useNavigate();
  const basePdfInputRef = useRef<HTMLInputElement | null>(null);
  const [source, setSource] = useState<FillableFieldSource | null>(null);
  const [records, setRecords] = useState<FillableFieldMapRecord[]>([]);
  const [fieldMap, setFieldMap] = useState<FillableFieldMapRecord | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [basePdfBytes, setBasePdfBytes] = useState<Uint8Array | null>(null);
  const [basePdfName, setBasePdfName] = useState("");
  const [basePdfPageCount, setBasePdfPageCount] = useState<number | null>(null);
  const [basePdfUrl, setBasePdfUrl] = useState("");
  const draft = source?.draft ?? null;
  const kit = useMemo(() => (draft ? buildBuilderKit(draft) : null), [draft]);
  const pages = useMemo(
    () =>
      draft
        ? buildPagesFromKitDraft(draft)
        : fieldMap
          ? createPdfOnlyPages(fieldMap.pageCount, basePdfName || fieldMap.kitName)
          : [],
    [basePdfName, draft, fieldMap],
  );
  const branchProfile = kit?.branchProfile ?? resolveBranchProfile(fieldMap?.branch);
  const isPdfOnlyMode = !draft && Boolean(fieldMap);
  const [selectedPageNumber, setSelectedPageNumber] = useState(1);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    fieldMap?.fields[0]?.id ?? null,
  );
  const [placementType, setPlacementType] = useState<FillableFieldType | null>(null);
  const [replacePageFields, setReplacePageFields] = useState(false);
  const [autoMessage, setAutoMessage] = useState("");
  const [calibrations, setCalibrations] = useState<FillableCalibrationMap>({});
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

  useEffect(() => {
    const loadedSource = loadFillableFieldSource();
    const loadedRecords = loadFillableFieldMaps();
    const loadedExisting = loadedSource
      ? findExistingFieldMap(loadedRecords, loadedSource)
      : null;

    setRecords(loadedRecords);
    setSource(loadedSource);
    setFieldMap(loadedSource ? createFieldMapForSource(loadedSource, loadedExisting) : null);
    setCalibrations(loadFillableCalibration());
  }, []);

  useEffect(() => {
    if (!basePdfBytes) {
      setBasePdfUrl("");
      return;
    }

    const copy = new Uint8Array(basePdfBytes);
    const blob = new Blob([copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength)], {
      type: "application/pdf",
    });
    const nextUrl = URL.createObjectURL(blob);
    setBasePdfUrl(nextUrl);

    return () => {
      URL.revokeObjectURL(nextUrl);
    };
  }, [basePdfBytes]);

  const saveMap = (nextMap = fieldMap) => {
    if (!nextMap) return;
    if (!source && !nextMap.draft) {
      const saved = { ...nextMap, updatedAt: new Date().toISOString() };
      const nextRecords = saveFillableFieldMaps([
        saved,
        ...records.filter((record) => record.id !== saved.id),
      ]);
      setRecords(nextRecords);
      setFieldMap(nextRecords.find((record) => record.id === saved.id) ?? saved);
      toast.success("Field map saved");
      return;
    }

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

  const loadLatestBuilderDraftIntoFieldMap = (options?: { requirePdfPageMatch?: boolean }) => {
    const latestDraft = loadBuilderDraft();
    if (!latestDraft) {
      toast.error("No Builder draft found to reload.");
      return;
    }

    const nextSource = saveFillableFieldSource(latestDraft, "Current Builder Draft");
    const freshMap = createFieldMapForSource(nextSource, fieldMap);

    if (
      options?.requirePdfPageMatch &&
      basePdfPageCount !== null &&
      basePdfPageCount !== freshMap.pageCount
    ) {
      toast.error(
        `The uploaded PDF has ${basePdfPageCount} pages, but the latest Builder draft has ${freshMap.pageCount}. Upload the matching PDF or open the matching Builder version first.`,
      );
      return;
    }

    setSource(nextSource);
    setFieldMap(freshMap);
    setSelectedPageNumber((current) => Math.min(current, freshMap.pageCount || 1));
    setSelectedFieldId(null);
    setAutoMessage("Builder page data loaded. Auto Fields are available on compatible pages.");

    if (basePdfPageCount !== null && basePdfPageCount !== freshMap.pageCount) {
      toast.message(
        `Builder draft loaded, but the uploaded PDF has ${basePdfPageCount} pages and the draft has ${freshMap.pageCount}. Upload the matching final PDF before export.`,
      );
      return;
    }

    toast.success(`Loaded Builder page data for ${freshMap.pageCount} pages`);
  };

  const reloadLatestBuilderDraft = () => {
    loadLatestBuilderDraftIntoFieldMap();
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
      if (!fieldMap) {
        const pdfOnlyMap = createPdfOnlyFieldMap(file.name, pageCount);
        setFieldMap(pdfOnlyMap);
        setSelectedPageNumber(1);
        setSelectedFieldId(null);
        setPlacementType(null);
      }
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
    const blank = source
      ? createFieldMapForSource(source, { ...fieldMap, fields: [] })
      : { ...fieldMap, fields: [], updatedAt: new Date().toISOString() };
    const nextRecords = deleteFillableFieldMap(records, fieldMap.id);
    setRecords(nextRecords);
    setFieldMap(blank);
    setSelectedFieldId(null);
    toast.message("Field map cleared");
  };

  const applyAutoFieldsToPage = (pageNumber: number, replaceExisting: boolean) => {
    const page = pages[pageNumber - 1];
    if (!page || !fieldMap) return 0;

    const autoFields = buildAutoFieldsForPage(page, pageNumber, calibrations);
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
        .map((page, index) =>
          buildAutoFieldsForPage(page, index + 1, calibrations).length > 0 ? index + 1 : 0,
        )
        .filter(Boolean),
    );
    const firstCompatiblePageNumber = Array.from(compatiblePageNumbers).sort((a, b) => a - b)[0];
    let nextFields = replacePageFields
      ? fieldMap.fields.filter((field) => !compatiblePageNumbers.has(field.pageNumber))
      : fieldMap.fields.filter((field) => {
          const page = pages[field.pageNumber - 1];
          if (!page) return !isLegacyAutoWritingArea(field);
          return !shouldClearAutoFieldsForPage(field, page, field.pageNumber);
        });
    for (const [index, page] of pages.entries()) {
      const pageNumber = index + 1;
      const autoFields = buildAutoFieldsForPage(page, pageNumber, calibrations);
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
    const nextSelectedPageNumber = compatiblePageNumbers.has(selectedPageNumber)
      ? selectedPageNumber
      : firstCompatiblePageNumber;
    if (nextSelectedPageNumber) {
      setSelectedPageNumber(nextSelectedPageNumber);
      setSelectedFieldId(
        nextFields.find((field) => field.pageNumber === nextSelectedPageNumber)?.id ?? null,
      );
    } else {
      setSelectedFieldId(null);
    }
    setAutoMessage(
      addedCount > 0
        ? `${addedCount} auto field${addedCount === 1 ? "" : "s"} added across compatible pages. Showing the first page with fields.`
        : "No missing auto fields to add across compatible pages.",
    );
  };

  const selectedAutoPattern = selectedPage ? getAutoPatternLabel(selectedPage) : null;
  const selectedCalibrationKey = selectedPage ? calibrationKeyForPage(selectedPage) : null;
  const selectedCalibration = selectedCalibrationKey
    ? calibrations[selectedCalibrationKey] ?? DEFAULT_CALIBRATION
    : DEFAULT_CALIBRATION;

  const updateCalibration = (
    key: string,
    patch: Partial<FillableCalibration>,
    options?: { toast?: boolean },
  ) => {
    setCalibrations((current) => {
      const nextCalibration = normalizeCalibration({
        ...(current[key] ?? DEFAULT_CALIBRATION),
        ...patch,
      });
      const next = { ...current, [key]: nextCalibration };
      saveFillableCalibration(next);
      return next;
    });

    if (options?.toast) {
      toast.success("Calibration saved. Re-run Auto Fill to apply it.");
    }
  };

  const nudgeCalibration = (key: string, patch: Partial<FillableCalibration>) => {
    const current = calibrations[key] ?? DEFAULT_CALIBRATION;
    updateCalibration(key, {
      xOffset: current.xOffset + (patch.xOffset ?? 0),
      yOffset: current.yOffset + (patch.yOffset ?? 0),
      spacingOffset: current.spacingOffset + (patch.spacingOffset ?? 0),
      widthOffset: current.widthOffset + (patch.widthOffset ?? 0),
    });
  };

  const resetCalibration = (key: string) => {
    setCalibrations((current) => {
      const next = { ...current };
      delete next[key];
      saveFillableCalibration(next);
      return next;
    });
    toast.success("Calibration reset. Re-run Auto Fill to use the default placement.");
  };

  if (!fieldMap) {
    return (
      <div className="p-8">
        <PageHeader
          eyebrow="Production fillable fields"
          title="Fillable Fields"
          description="Upload a final workbook PDF directly, or open a kit from Builder or Version Library for auto-field help."
        />
        <div className="max-w-2xl">
          <EmptyState
            title="No kit loaded"
            description="Upload the finished styled PDF to map fields manually, or open Builder/Version Library if you want the app to know page types for auto-fields."
            actions={
              <div className="flex flex-wrap gap-2">
                <Input
                  ref={basePdfInputRef}
                  className="hidden"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleBasePdfUpload}
                />
                <Button onClick={() => basePdfInputRef.current?.click()}>
                  Upload Final Workbook PDF
                </Button>
                <Button variant="outline" onClick={reloadLatestBuilderDraft}>
                  Load Latest Builder Draft
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: "/builder" })}>
                  Open Builder
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: "/version-library" })}>
                  Open Version Library
                </Button>
              </div>
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
              {isPdfOnlyMode ? (
                <div
                  className="rounded-md border px-3 py-2 text-xs"
                  style={{ borderColor: "#D8CEC2", background: "#FAF6F0", color: "#6b6470" }}
                >
                  PDF-only mode supports manual field placement. Open from Builder if you want
                  auto-fields.
                </div>
              ) : null}
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
            {selectedPage ? (
              basePdfBytes ? (
                <UploadedPdfPagePreview
                  pdfBytes={basePdfBytes}
                  pageNumber={selectedPageNumber}
                  totalPages={pages.length}
                  fileName={basePdfName || fieldMap.kitName}
                />
              ) : (
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
                  {isPdfOnlyMode ? (
                    <PdfOnlyPagePlaceholder
                      pageNumber={selectedPageNumber}
                      totalPages={pages.length}
                      fileName={basePdfName || fieldMap.kitName}
                    />
                  ) : (
                    <PageRenderer
                      block={selectedPage}
                      branchProfile={branchProfile}
                      pageNumber={selectedPageNumber}
                      totalPages={pages.length}
                    />
                  )}
                </div>
              )
            ) : null}
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
                {isPdfOnlyMode
                  ? "Auto-fields need Builder page data. In PDF-only mode, place fields manually."
                  : "Quickly place visual fields on compatible workbook pages. Writing pages get one slim field per visible line."}
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
                disabled={isPdfOnlyMode || !selectedAutoPattern}
              >
                <Plus className="mr-2 h-4 w-4" />
                {isPdfOnlyMode ? "Manual placement only" : (selectedAutoPattern ?? "No auto pattern for this page")}
              </Button>
              {isPdfOnlyMode ? (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => loadLatestBuilderDraftIntoFieldMap({ requirePdfPageMatch: true })}
                  >
                    <Plus className="mr-2 h-4 w-4" /> Use Latest Builder Draft for Auto Fields
                  </Button>
                  <div className="text-xs" style={{ color: "#6b6470" }}>
                    If this PDF came from Builder, load the matching Builder draft to unlock auto-fields. Otherwise,
                    choose a field type above the page and place fields manually.
                  </div>
                </div>
              ) : !selectedAutoPattern ? (
                <div className="text-xs" style={{ color: "#6b6470" }}>
                  Auto Fill skips this page type. Pick a workbook, prompt, checklist, or table page, or run
                  auto-fields for all compatible pages.
                </div>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={applyAutoFieldsToAllPages}
                disabled={isPdfOnlyMode}
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

          {selectedCalibrationKey && selectedAutoPattern && !isPdfOnlyMode ? (
            <CalibrationControls
              label={calibrationLabelForPage(selectedPage)}
              calibration={selectedCalibration}
              onNudge={(patch) => nudgeCalibration(selectedCalibrationKey, patch)}
              onSet={(patch) => updateCalibration(selectedCalibrationKey, patch)}
              onReset={() => resetCalibration(selectedCalibrationKey)}
              onApply={() => {
                applyAutoFieldsToPage(selectedPageNumber, false);
                toast.success("Auto fields rebuilt with saved calibration.");
              }}
            />
          ) : null}

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

function createPdfOnlyFieldMap(fileName: string, pageCount: number): FillableFieldMapRecord {
  const now = new Date().toISOString();
  const kitName = fileName.replace(/\.pdf$/i, "").trim();
  return {
    id: `pdf-field-map-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kitName,
    branch: "",
    sourceLabel: `PDF upload: ${fileName}`,
    pageCount,
    fields: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createPdfOnlyPages(pageCount: number, fileName: string): Block[] {
  return Array.from({ length: Math.max(0, pageCount) }, (_, index) => ({
    id: `pdf-only-page-${index + 1}`,
    pageType: "workbook",
    order: index + 1,
    title: `PDF Page ${index + 1}`,
    subtitle: fileName,
    body: "",
    prompt: "",
    lines: 0,
  }));
}

function PdfOnlyPagePlaceholder({
  pageNumber,
  totalPages,
  fileName,
}: {
  pageNumber: number;
  totalPages: number;
  fileName: string;
}) {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center bg-white p-10 text-center"
      style={{ color: "#4b4450" }}
    >
      <div
        className="mb-4 rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em]"
        style={{ background: "#FAF6F0", color: "#4F2D68" }}
      >
        Uploaded PDF
      </div>
      <div className="max-w-md text-3xl font-semibold" style={{ color: "#4F2D68" }}>
        Page {pageNumber} of {totalPages}
      </div>
      <div className="mt-4 max-w-md text-sm">
        {fileName || "Final workbook PDF"} is the visual source. Place fields on this page, then
        export the fillable PDF.
      </div>
      <div className="mt-8 h-px w-64" style={{ background: "#D8CEC2" }} />
      <div className="mt-4 text-xs" style={{ color: "#8b7d88" }}>
        Preview image rendering comes later. Export uses the uploaded PDF itself.
      </div>
    </div>
  );
}

function findExistingFieldMap(
  records: FillableFieldMapRecord[],
  source: FillableFieldSource,
): FillableFieldMapRecord | null {
  if (source.sourceVersionId) {
    return records.find((record) => record.sourceVersionId === source.sourceVersionId) ?? null;
  }

  return records.find((record) => record.sourceKitId === source.sourceKitId) ?? null;
}

function UploadedPdfPagePreview({
  pdfBytes,
  pageNumber,
  totalPages,
  fileName,
}: {
  pdfBytes: Uint8Array;
  pageNumber: number;
  totalPages: number;
  fileName: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [renderState, setRenderState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let renderTask: { promise: Promise<unknown>; cancel: () => void } | null = null;
    let loadedDocument: { destroy: () => Promise<void> } | null = null;

    const renderPage = async () => {
      const canvas = canvasRef.current;
      const parent = canvas?.parentElement;
      if (!canvas || !parent || pdfBytes.length === 0) return;

      setRenderState("loading");

      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.mjs",
          import.meta.url,
        ).toString();

        const data = new Uint8Array(pdfBytes.length);
        data.set(pdfBytes);
        const loadingTask = pdfjs.getDocument({ data });
        const pdfDocument = await loadingTask.promise;
        loadedDocument = pdfDocument;

        if (cancelled) return;

        const safePageNumber = Math.min(Math.max(pageNumber, 1), pdfDocument.numPages);
        const page = await pdfDocument.getPage(safePageNumber);
        const baseViewport = page.getViewport({ scale: 1 });
        const parentWidth = parent.clientWidth || 680;
        const parentHeight = parent.clientHeight || Math.round((parentWidth * 11) / 8.5);
        const scale = Math.min(parentWidth / baseViewport.width, parentHeight / baseViewport.height);
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale: scale * outputScale });
        const cssViewport = page.getViewport({ scale });
        const canvasContext = canvas.getContext("2d");

        if (!canvasContext) {
          throw new Error("Canvas context unavailable");
        }

        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.style.width = `${cssViewport.width}px`;
        canvas.style.height = `${cssViewport.height}px`;
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        renderTask = page.render({ canvasContext, viewport });
        await renderTask.promise;

        if (!cancelled) {
          setRenderState("ready");
        }
      } catch (error) {
        if (!cancelled && !(error instanceof Error && error.name === "RenderingCancelledException")) {
          console.error("Could not render uploaded PDF page", error);
          setRenderState("error");
        }
      }
    };

    void renderPage();

    return () => {
      cancelled = true;
      renderTask?.cancel();
      void loadedDocument?.destroy();
    };
  }, [pageNumber, pdfBytes]);

  return (
    <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-white">
      <canvas
        ref={canvasRef}
        aria-label={`${fileName} page ${pageNumber} of ${totalPages}`}
        className="block max-h-full max-w-full"
        style={{ pointerEvents: "none" }}
      />
      {renderState !== "ready" ? (
        <div
          className="absolute inset-0 flex items-center justify-center px-8 text-center text-sm"
          style={{ background: "rgba(255,255,255,0.82)", color: "#4F2D68" }}
        >
          {renderState === "loading"
            ? "Rendering uploaded PDF page..."
            : "Could not render this PDF page preview. Export still uses the uploaded PDF."}
        </div>
      ) : null}
      <div className="sr-only">
        {fileName} page {pageNumber} of {totalPages}
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

function CalibrationControls({
  label,
  calibration,
  onNudge,
  onSet,
  onReset,
  onApply,
}: {
  label: string;
  calibration: FillableCalibration;
  onNudge: (patch: Partial<FillableCalibration>) => void;
  onSet: (patch: Partial<FillableCalibration>) => void;
  onReset: () => void;
  onApply: () => void;
}) {
  const [step, setStep] = useState<0.25 | 0.5 | 1>(0.5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Adjust Auto Field Placement</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-md border px-3 py-2 text-xs" style={{ borderColor: "#D8CEC2" }}>
          <div className="font-medium" style={{ color: "#222026" }}>
            {label}
          </div>
          <div className="mt-1" style={{ color: "#6b6470" }}>
            These settings affect the next Auto Fill run for this page type.
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs" style={{ color: "#6b6470" }}>
            Nudge:
          </span>
          {([0.25, 0.5, 1] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStep(value)}
              className="rounded px-2 py-0.5 text-xs"
              style={{
                background: step === value ? "#4F2D68" : "#FAF6F0",
                color: step === value ? "#fff" : "#4b4450",
                border: `1px solid ${step === value ? "#4F2D68" : "#D8CEC2"}`,
              }}
            >
              {value === 0.25 ? "Fine" : value === 0.5 ? "Normal" : "Coarse"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ xOffset: -step })}
          >
            Left
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ xOffset: step })}
          >
            Right
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ yOffset: -step })}
          >
            Up
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ yOffset: step })}
          >
            Down
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ spacingOffset: -step })}
          >
            Tighten
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ spacingOffset: step })}
          >
            Space
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ widthOffset: -step })}
          >
            Narrow
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onNudge({ widthOffset: step })}
          >
            Wide
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label="X offset">
            <Input
              type="number"
              step="0.25"
              value={calibration.xOffset}
              onChange={(event) => onSet({ xOffset: Number(event.target.value) })}
            />
          </Field>
          <Field label="Y offset">
            <Input
              type="number"
              step="0.25"
              value={calibration.yOffset}
              onChange={(event) => onSet({ yOffset: Number(event.target.value) })}
            />
          </Field>
          <Field label="Spacing">
            <Input
              type="number"
              step="0.25"
              value={calibration.spacingOffset}
              onChange={(event) => onSet({ spacingOffset: Number(event.target.value) })}
            />
          </Field>
          <Field label="Width">
            <Input
              type="number"
              step="0.25"
              value={calibration.widthOffset}
              onChange={(event) => onSet({ widthOffset: Number(event.target.value) })}
            />
          </Field>
        </div>

        <Button type="button" className="w-full" onClick={onApply}>
          Rebuild This Page With Calibration
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={onReset}>
          Reset Calibration
        </Button>
      </CardContent>
    </Card>
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

function loadFillableCalibration(): FillableCalibrationMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(FILLABLE_CALIBRATION_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, Partial<FillableCalibration>>;
    if (!parsed || typeof parsed !== "object") return {};
    return Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, normalizeCalibration(value)]),
    );
  } catch {
    return {};
  }
}

function saveFillableCalibration(calibrations: FillableCalibrationMap) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(FILLABLE_CALIBRATION_STORAGE_KEY, JSON.stringify(calibrations));
  } catch {
    // Ignore browser storage failures.
  }
}

function normalizeCalibration(value: Partial<FillableCalibration>): FillableCalibration {
  return {
    xOffset: clampCalibrationNumber(value.xOffset),
    yOffset: clampCalibrationNumber(value.yOffset),
    spacingOffset: clampCalibrationNumber(value.spacingOffset),
    widthOffset: clampCalibrationNumber(value.widthOffset),
  };
}

function clampCalibrationNumber(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(-25, Math.min(25, numeric));
}

function isDefaultCalibration(value: FillableCalibration): boolean {
  return (
    value.xOffset === 0 &&
    value.yOffset === 0 &&
    value.spacingOffset === 0 &&
    value.widthOffset === 0
  );
}

function calibrationKeyForPage(page: Block): string | null {
  if (
    page.pageType === "workbook" ||
    page.pageType === "notes" ||
    page.pageType === "reflection" ||
    page.pageType === "prompt-page" ||
    page.pageType === "multi-prompt"
  ) {
    return `${page.pageType}:writing`;
  }

  if (page.pageType === "lesson-activity") {
    if (page.activityType === "checklist") return "lesson-activity:checklist";
    if (page.activityType === "writing-prompt") return "lesson-activity:writing";
    return null;
  }

  if (page.pageType === "checklist") return "checklist:checkboxes";
  if (page.pageType === "table") return "table:cells";
  return null;
}

function calibrationLabelForPage(page: Block | null): string {
  if (!page) return "Auto fields";
  if (page.pageType === "checklist") return "Checklist boxes";
  if (page.pageType === "table") return "Table cells";
  if (page.pageType === "multi-prompt") return "Multi-prompt writing lines";
  if (page.pageType === "prompt-page") return "Prompt writing lines";
  if (page.pageType === "lesson-activity" && page.activityType === "checklist") {
    return "Lesson activity checklist";
  }
  if (page.pageType === "lesson-activity") return "Lesson activity writing lines";
  if (page.pageType === "notes") return "Notes answer area";
  if (page.pageType === "reflection") return "Reflection answer area";
  return "Workbook writing lines";
}

function buildAutoFieldsForPage(
  page: Block,
  pageNumber: number,
  calibrations: FillableCalibrationMap = {},
): FillableField[] {
  let fields: FillableField[] = [];

  if (page.pageType === "workbook") {
    fields = buildWritingLineFields(page, pageNumber, page.prompt ? 30.6 : 22.8);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "notes") {
    fields = buildWritingAreaField(page, pageNumber, page.prompt ? 30.6 : 22.8);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "prompt-page") {
    fields = buildWritingLineFields(page, pageNumber, page.prompt ? 36.2 : 28.6);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "multi-prompt") {
    fields = buildMultiPromptFields(page, pageNumber);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "lesson-activity") {
    fields = buildLessonActivityFields(page, pageNumber);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "reflection") {
    fields = buildWritingAreaField(page, pageNumber, page.prompt ? 36.2 : 28.6);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "checklist") {
    fields = buildChecklistFields(page, pageNumber);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  if (page.pageType === "table") {
    fields = buildTableFields(page, pageNumber);
    return applyCalibrationToAutoFields(fields, page, calibrations);
  }

  return [];
}

function applyCalibrationToAutoFields(
  fields: FillableField[],
  page: Block,
  calibrations: FillableCalibrationMap,
): FillableField[] {
  const key = calibrationKeyForPage(page);
  if (!key) return fields;
  const calibration = calibrations[key] ?? DEFAULT_CALIBRATION;
  if (isDefaultCalibration(calibration)) return fields;

  return fields.map((field, index) => {
    const orderIndex = autoFieldSpacingIndex(field, index);
    return clampField({
      ...field,
      xPercent: field.xPercent + calibration.xOffset,
      yPercent: field.yPercent + calibration.yOffset + orderIndex * calibration.spacingOffset,
      widthPercent: field.widthPercent + calibration.widthOffset,
    });
  });
}

function autoFieldSpacingIndex(field: FillableField, fallbackIndex: number): number {
  const tableMatch = field.name.match(/\bR(\d+)\b/i);
  if (tableMatch) return Math.max(0, Number(tableMatch[1]) - 1);

  const lineMatch = field.name.match(/\bLine\s+(\d+)\b/i);
  if (lineMatch) return Math.max(0, Number(lineMatch[1]) - 1);

  const trailingNumber = field.name.match(/(\d+)$/);
  if (trailingNumber) return Math.max(0, Number(trailingNumber[1]) - 1);

  return fallbackIndex;
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

// Calibrated against MultiPromptTemplate: workbook writing-lines baseline at 22.8% (= 2.675in at
// 96dpi × 0.78125 scale / 880px container). MultiPrompt SparkleRule marginBottom is 0.02in less
// than workbook's, so flex container starts at 22.6%. paddingBottom 60px ends usable area at 79.9%.
const MP_FLEX_Y_START = 22.6;
const MP_FLEX_Y_END = 79.9;
const MP_GAP_Y = 1.53; // 0.18in gap between sections
const MP_WRITING_OFFSET_Y = 5.5; // section-top → first writing line
const MP_LINE_STEP_Y = 2.4; // 0.28in minHeight per writing line
const MP_X = 10.0; // 0.72in content left + 0.18in section padding = 0.90in
const MP_WIDTH = 73.0; // section content width 6.60in
const MP_LINE_HEIGHT = 2.0;
const MP_AUTO_FLEX_Y_END = 84.2;
const MP_AUTO_WRITING_OFFSET_Y = 6.6;
const MP_AUTO_LINE_STEP_Y = 2.58;
const MP_AUTO_LINE_HEIGHT = 1.65;

function buildMultiPromptFields(page: Block, pageNumber: number): FillableField[] {
  const items = parseMultiPrompts(page.body || page.prompt);
  if (items.length === 0) return [];

  const hasSubtitle = Boolean(page.subtitle?.trim());
  const flexStart = hasSubtitle ? MP_FLEX_Y_START + 2.4 : MP_FLEX_Y_START;
  const n = items.length;
  const sectionH = (MP_AUTO_FLEX_Y_END - flexStart - (n - 1) * MP_GAP_Y) / n;
  const fields: FillableField[] = [];

  for (const [i, item] of items.entries()) {
    const sectionTop = flexStart + i * (sectionH + MP_GAP_Y);
    const sectionBottom = sectionTop + sectionH;
    const firstY = sectionTop + MP_AUTO_WRITING_OFFSET_Y;
    const lineCount = Math.max(1, Math.min(item.lines, 8));
    for (let j = 0; j < lineCount; j += 1) {
      const yPercent = firstY + j * MP_AUTO_LINE_STEP_Y;
      if (yPercent + MP_AUTO_LINE_HEIGHT > sectionBottom + MP_GAP_Y * 0.5) break;
      fields.push(
        createAutoField({
          name: `Auto Prompt ${i + 1} Line ${j + 1}`,
          type: "multiline",
          page,
          pageNumber,
          xPercent: MP_X,
          yPercent,
          widthPercent: MP_WIDTH,
          heightPercent: MP_AUTO_LINE_HEIGHT,
        }),
      );
    }
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

// Calibrated against ChecklistTemplate: SparkleRule marginBottom 0.34in (+0.02in vs workbook)
// puts panel at 23.0%. Default spacing: panelPadding 0.16in 0.28in, itemPadding 0.06in, minHeight
// 0.42in. Checkbox (0.16in × 0.16in) is left-edge of the first grid column after border + padding.
const CL_FIRST_Y_NO_SUB = 25.1; // panel 23.0 + panelPad 1.36 + itemPad 0.51 + cbMargin 0.26
const CL_STEP_Y = 3.66; // 0.43in per row (minHeight 0.42in + 1px border)
const CL_X = 11.3; // panel left 0.72in + border 0.02in + paddingLeft 0.28in = 1.02in
const CL_W = 2.0; // 0.16in checkbox + small margin
const CL_H = 1.5; // 0.16in checkbox + small margin
const CL_AUTO_FIRST_Y_NO_SUB = 23.9;
const CL_AUTO_STEP_Y = 3.72;
const CL_AUTO_X = 10.3;
const CL_AUTO_W = 1.8;
const CL_AUTO_H = 1.8;

function buildChecklistFields(page: Block, pageNumber: number): FillableField[] {
  const items = (page.body ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (items.length === 0) return [];

  const hasSubtitle = Boolean(page.subtitle?.trim());
  const firstY = hasSubtitle ? CL_AUTO_FIRST_Y_NO_SUB + 2.4 : CL_AUTO_FIRST_Y_NO_SUB;

  return items.map((_, index) =>
    createAutoField({
      name: `Auto Checklist ${index + 1}`,
      type: "checkbox",
      page,
      pageNumber,
      xPercent: CL_AUTO_X,
      yPercent: firstY + index * CL_AUTO_STEP_Y,
      widthPercent: CL_AUTO_W,
      heightPercent: CL_AUTO_H,
    }),
  );
}

function buildTableFields(page: Block, pageNumber: number): FillableField[] {
  const rows = page.tableData?.rows ?? [];
  const headers = page.tableData?.headers ?? [];
  const columnCount = Math.max(headers.length, rows[0]?.length ?? 0);
  if (columnCount === 0) return [];

  const columnPercents = tableColumnPercents(headers, columnCount);
  const bodyTop = tableBodyTopPercent(headers);
  const rowHeight = tableRowHeightPercent(headers, rows.length);
  const skipFirstColumn = shouldSkipFirstTableColumn(headers, rows);

  return rows.flatMap((row, rowIndex) =>
    row.flatMap((cell, columnIndex) => {
      if (columnIndex >= columnPercents.length) return [];
      if (skipFirstColumn && columnIndex === 0) return [];
      if (cell.trim()) return [];

      const column = columnPercents[columnIndex];
      return [
        createAutoField({
          name: `Auto Table R${rowIndex + 1} C${columnIndex + 1}`,
          type: "text",
          page,
          pageNumber,
          xPercent: column.x + 1.1,
          yPercent: bodyTop + rowIndex * rowHeight + 1.1,
          widthPercent: Math.max(8, column.width - 2.2),
          heightPercent: Math.max(4.5, rowHeight - 2.2),
        }),
      ];
    }),
  );
}

function tableColumnPercents(
  headers: string[],
  columnCount: number,
): Array<{ x: number; width: number }> {
  const tableLeft = isSetupTrackerFieldTable(headers) ? 7.4 : 10.0;
  const tableWidth = isSetupTrackerFieldTable(headers) ? 85.2 : 79.8;
  const rawWidths = tableColumnRawWidths(headers, columnCount);
  const totalRaw = rawWidths.reduce((sum, width) => sum + width, 0) || columnCount;
  let x = tableLeft;

  return rawWidths.map((rawWidth) => {
    const width = (rawWidth / totalRaw) * tableWidth;
    const column = { x, width };
    x += width;
    return column;
  });
}

function tableColumnRawWidths(headers: string[], columnCount: number): number[] {
  if (isSetupTrackerFieldTable(headers)) return [16, 16, 28, 18, 22];
  if (columnCount === 5) return [22, 14, 32, 15, 17];
  if (columnCount === 4) return [25, 22, 33, 20];
  if (columnCount === 3) return [30, 40, 30];
  return Array.from({ length: columnCount }, () => 100 / columnCount);
}

function tableBodyTopPercent(headers: string[]): number {
  return isSetupTrackerFieldTable(headers) ? 27.2 : 30.0;
}

function tableRowHeightPercent(headers: string[], rowCount: number): number {
  if (isSetupTrackerFieldTable(headers)) return rowCount <= 1 ? 34 : 14.9;
  return 6.35;
}

function shouldSkipFirstTableColumn(headers: string[], rows: string[][]): boolean {
  const firstHeader = headers[0]?.toLowerCase().trim() ?? "";
  if (
    [
      "meal pattern",
      "setup area",
      "area",
      "item",
      "task",
      "step",
      "category",
      "resource",
    ].some((label) => firstHeader.includes(label))
  ) {
    return true;
  }

  const firstColumn = rows.map((row) => row[0]?.trim()).filter(Boolean);
  const filledFirstColumnCount = firstColumn.length;
  const otherFilledCount = rows.reduce(
    (count, row) => count + row.slice(1).filter((innerCell) => innerCell.trim()).length,
    0,
  );

  return filledFirstColumnCount > 0 && otherFilledCount <= filledFirstColumnCount;
}

function isSetupTrackerFieldTable(headers: string[]): boolean {
  const normalized = headers.map((header) => header.toLowerCase().trim());
  return (
    normalized.length === 5 &&
    normalized.includes("setup area") &&
    normalized.includes("next step")
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

  if (page.pageType === "checklist") {
    return field.name.startsWith("Auto Checklist ");
  }

  if (page.pageType === "table") {
    return field.name.startsWith("Auto Table ");
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
