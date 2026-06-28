import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Block } from "./kit-types";
import type { FillableField, FillableFieldMapRecord } from "./fillable-fields";

const LETTER_WIDTH_PT = 612;
const LETTER_HEIGHT_PT = 792;

type ExportFillablePdfInput = {
  fieldMap: FillableFieldMapRecord;
  pages: Block[];
  basePdfBytes?: Uint8Array | null;
};

export async function exportFillablePdf({
  fieldMap,
  pages,
  basePdfBytes,
}: ExportFillablePdfInput): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error("No pages available to export.");
  if (!basePdfBytes) throw new Error("Upload the final workbook PDF before exporting.");

  const pdfDoc = await PDFDocument.create();
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const basePdf = await PDFDocument.load(basePdfBytes);
  const basePageCount = basePdf.getPageCount();
  if (basePageCount !== pages.length) {
    throw new Error(
      `Uploaded PDF has ${basePageCount} pages, but this field map has ${pages.length} pages.`,
    );
  }
  const copiedPages = await pdfDoc.copyPages(basePdf, basePdf.getPageIndices());

  for (let index = 0; index < basePageCount; index += 1) {
    const pageBlock = pages[index] ?? pages[pages.length - 1];
    const pdfPage = copiedPages[index];
    pdfDoc.addPage(pdfPage);

    const pageNumber = index + 1;
    const pageFields = fieldMap.fields.filter((field) => field.pageNumber === pageNumber);
    for (const [fieldIndex, field] of pageFields.entries()) {
      const name = uniquePdfFieldName(field, pageBlock, pageNumber, fieldIndex);
      const rect = fieldToPdfRect(field);

      if (field.type === "checkbox") {
        const checkbox = form.createCheckBox(name);
        checkbox.addToPage(pdfPage, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          borderWidth: 0.75,
          borderColor: rgb(0.68, 0.53, 0.18),
          backgroundColor: rgb(1, 1, 1),
        });
        continue;
      }

      const textField = form.createTextField(name);
      if (field.type === "multiline") {
        textField.enableMultiline();
      }
      textField.addToPage(pdfPage, {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        borderWidth: 0,
        backgroundColor: undefined,
        borderColor: undefined,
        textColor: rgb(0.13, 0.13, 0.15),
        font,
      });
    }
  }

  form.updateFieldAppearances(font);
  return pdfDoc.save({ updateFieldAppearances: false });
}

export async function readFillableBasePdfPageCount(bytes: Uint8Array): Promise<number> {
  const pdfDoc = await PDFDocument.load(bytes);
  return pdfDoc.getPageCount();
}

export function downloadBytes(bytes: Uint8Array, fileName: string, type = "application/pdf") {
  const copy = new Uint8Array(bytes);
  const blob = new Blob([copy.buffer.slice(copy.byteOffset, copy.byteOffset + copy.byteLength)], {
    type,
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function fillablePdfFileName(kitName: string): string {
  const safeName = (kitName.trim() || "Untitled Kit").replace(/[\\/:*?"<>|]+/g, "-");
  return `${safeName} - Fillable Workbook.pdf`;
}

function fieldToPdfRect(field: FillableField) {
  const width = (field.widthPercent / 100) * LETTER_WIDTH_PT;
  const height = (field.heightPercent / 100) * LETTER_HEIGHT_PT;
  const x = (field.xPercent / 100) * LETTER_WIDTH_PT;
  const y = LETTER_HEIGHT_PT - ((field.yPercent + field.heightPercent) / 100) * LETTER_HEIGHT_PT;
  return { x, y, width, height };
}

function uniquePdfFieldName(
  field: FillableField,
  page: Block,
  pageNumber: number,
  fieldIndex: number,
): string {
  const base = [page.title || page.pageType, field.name, `p${pageNumber}`, String(fieldIndex + 1)]
    .join(" ")
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 80);
  return base || `field_p${pageNumber}_${fieldIndex + 1}`;
}
