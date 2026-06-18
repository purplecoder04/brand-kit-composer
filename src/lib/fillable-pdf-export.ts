import { toJpeg } from "html-to-image";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import type { Block } from "./kit-types";
import type { FillableField, FillableFieldMapRecord } from "./fillable-fields";

const LETTER_WIDTH_PT = 612;
const LETTER_HEIGHT_PT = 792;
const PAGE_CAPTURE_TIMEOUT_MS = 3500;

type PageCapture = {
  dataUrl: string;
  format: "jpg";
};

type ExportFillablePdfInput = {
  fieldMap: FillableFieldMapRecord;
  pages: Block[];
  pageElements: Array<HTMLElement | null | undefined>;
  basePdfBytes?: Uint8Array | null;
};

export async function exportFillablePdf({
  fieldMap,
  pages,
  pageElements,
  basePdfBytes,
}: ExportFillablePdfInput): Promise<Uint8Array> {
  if (pages.length === 0) throw new Error("No pages available to export.");

  if ("fonts" in document) {
    await document.fonts.ready;
  }

  const pdfDoc = await PDFDocument.create();
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const basePdf = basePdfBytes ? await PDFDocument.load(basePdfBytes) : null;
  const basePageCount = basePdf?.getPageCount() ?? 0;
  const copiedPages = basePdf ? await pdfDoc.copyPages(basePdf, basePdf.getPageIndices()) : [];
  const outputPageCount = basePdf ? basePageCount : pages.length;

  for (let index = 0; index < outputPageCount; index += 1) {
    const pageBlock = pages[index] ?? pages[pages.length - 1];
    const pdfPage = copiedPages[index] ?? pdfDoc.addPage([LETTER_WIDTH_PT, LETTER_HEIGHT_PT]);
    if (copiedPages[index]) {
      pdfDoc.addPage(pdfPage);
    } else {
      const pageElement = pageElements[index];
      const background = pageElement ? await capturePage(pageElement) : null;
      if (background) {
        const image = await pdfDoc.embedJpg(background.dataUrl);
        pdfPage.drawImage(image, {
          x: 0,
          y: 0,
          width: LETTER_WIDTH_PT,
          height: LETTER_HEIGHT_PT,
        });
      } else {
        drawFallbackPage(pdfPage, pageBlock, font);
      }
    }

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
      setTextFieldDefaultAppearance(textField, font);
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
      textField.defaultUpdateAppearances(font);
    }
  }

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

async function capturePage(pageElement: HTMLElement): Promise<PageCapture | null> {
  try {
    const dataUrl = await withTimeout(
      toJpeg(pageElement, {
        pixelRatio: 1,
        quality: 0.9,
        cacheBust: true,
        backgroundColor: "#ffffff",
        style: {
          margin: "0",
        },
      }),
      PAGE_CAPTURE_TIMEOUT_MS,
    );
    return { dataUrl, format: "jpg" };
  } catch (error) {
    console.warn("Fillable PDF page snapshot failed; using fallback page.", error);
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      reject(new Error(`Page snapshot timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

function drawFallbackPage(
  page: ReturnType<PDFDocument["addPage"]>,
  block: Block,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: LETTER_WIDTH_PT,
    height: LETTER_HEIGHT_PT,
    color: rgb(0.98, 0.96, 0.93),
  });
  page.drawText(block.title || block.pageType, {
    x: 54,
    y: LETTER_HEIGHT_PT - 90,
    size: 24,
    font,
    color: rgb(0.31, 0.18, 0.41),
  });
  page.drawText("Workbook page snapshot was not available. Fillable fields are still active.", {
    x: 54,
    y: LETTER_HEIGHT_PT - 122,
    size: 10,
    font,
    color: rgb(0.35, 0.32, 0.38),
  });
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

function setTextFieldDefaultAppearance(
  textField: ReturnType<ReturnType<PDFDocument["getForm"]>["createTextField"]>,
  font: Awaited<ReturnType<PDFDocument["embedFont"]>>,
) {
  const fontName = "name" in font && typeof font.name === "string" ? font.name : "Helvetica";
  const appearance = `0.13 0.13 0.15 rg\n/${fontName} 10 Tf`;
  const acroField = (
    textField as typeof textField & {
      acroField?: { setDefaultAppearance?: (appearance: string) => void };
    }
  ).acroField;
  acroField?.setDefaultAppearance?.(appearance);
}
