type ZipEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_SIGNATURE = 0x04034b50;
const DOCUMENT_XML_PATH = "word/document.xml";

export async function extractDocxText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const documentEntry = findZipEntries(bytes).find((entry) => entry.name === DOCUMENT_XML_PATH);

  if (!documentEntry) {
    throw new Error("Word document text was not found.");
  }

  const xmlBytes = await readZipEntry(bytes, documentEntry);
  const xml = new TextDecoder("utf-8").decode(xmlBytes);
  return wordXmlToText(xml);
}

function findZipEntries(bytes: Uint8Array): ZipEntry[] {
  const view = dataView(bytes);
  const eocdOffset = findEndOfCentralDirectory(view);
  const entryCount = view.getUint16(eocdOffset + 10, true);
  let offset = view.getUint32(eocdOffset + 16, true);
  const entries: ZipEntry[] = [];

  for (let index = 0; index < entryCount; index += 1) {
    if (view.getUint32(offset, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Word document archive could not be read.");
    }

    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const localHeaderOffset = view.getUint32(offset + 42, true);
    const fileName = decodeZipName(bytes, offset + 46, fileNameLength);

    entries.push({
      name: fileName,
      compressionMethod,
      compressedSize,
      localHeaderOffset,
    });

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(view: DataView): number {
  const minimumOffset = Math.max(0, view.byteLength - 0xffff - 22);
  for (let offset = view.byteLength - 22; offset >= minimumOffset; offset -= 1) {
    if (view.getUint32(offset, true) === EOCD_SIGNATURE) return offset;
  }

  throw new Error("File is not a readable .docx archive.");
}

async function readZipEntry(bytes: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  const view = dataView(bytes);
  const offset = entry.localHeaderOffset;

  if (view.getUint32(offset, true) !== LOCAL_FILE_SIGNATURE) {
    throw new Error("Word document archive is missing text data.");
  }

  const fileNameLength = view.getUint16(offset + 26, true);
  const extraLength = view.getUint16(offset + 28, true);
  const dataStart = offset + 30 + fileNameLength + extraLength;
  const compressed = bytes.slice(dataStart, dataStart + entry.compressedSize);

  if (entry.compressionMethod === 0) return compressed;
  if (entry.compressionMethod === 8) return inflateRaw(compressed);

  throw new Error("Word document uses an unsupported compression method.");
}

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("This browser cannot extract compressed Word documents.");
  }

  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);

  const stream = new Blob([copy.buffer])
    .stream()
    .pipeThrough(new DecompressionStream("deflate-raw"));
  const inflated = await new Response(stream).arrayBuffer();
  return new Uint8Array(inflated);
}

function wordXmlToText(xml: string): string {
  if (typeof DOMParser === "undefined") return wordXmlToTextFallback(xml);

  const documentXml = new DOMParser().parseFromString(xml, "application/xml");
  const body = Array.from(documentXml.getElementsByTagName("*")).find(
    (element) => element.localName === "body",
  );

  if (!body) return "";

  const lines = Array.from(body.children)
    .map((element) => {
      if (element.localName === "tbl") return tableToText(element);
      if (element.localName === "p") return elementText(element);
      return "";
    })
    .filter(Boolean);

  return lines.join("\n\n");
}

function wordXmlToTextFallback(xml: string): string {
  const body = xml.match(/<[^>]*:?body\b[^>]*>([\s\S]*?)<\/[^>]*:?body>/i)?.[1] ?? xml;
  const blockMatches = body.match(/<[^>]*:?(?:p|tbl)\b[\s\S]*?<\/[^>]*:?(?:p|tbl)>/gi) ?? [];
  const lines = blockMatches.map((block) => extractTextRuns(block)).filter(Boolean);

  return lines.join("\n\n");
}

function extractTextRuns(xml: string): string {
  return Array.from(xml.matchAll(/<[^>]*:?t\b[^>]*>([\s\S]*?)<\/[^>]*:?t>/gi))
    .map((match) => decodeXmlEntities(match[1] ?? ""))
    .join("")
    .trim();
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tableToText(table: Element): string {
  return Array.from(table.children)
    .filter((element) => element.localName === "tr")
    .map((row) =>
      Array.from(row.children)
        .filter((element) => element.localName === "tc")
        .map(elementText)
        .filter(Boolean)
        .join(", "),
    )
    .filter(Boolean)
    .join("\n");
}

function elementText(element: Element): string {
  return Array.from(element.getElementsByTagName("*"))
    .filter((child) => child.localName === "t")
    .map((child) => child.textContent ?? "")
    .join("")
    .trim();
}

function decodeZipName(bytes: Uint8Array, offset: number, length: number): string {
  return new TextDecoder("utf-8").decode(bytes.slice(offset, offset + length));
}

function dataView(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}
